import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AdminService } from '../../core/services/admin.service';
import { ToastService } from '../../core/services/toast.service';
import { User, UserStatus } from '../../core/models/auth.models';

@Component({
  selector: 'app-edit-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './edit-admin.component.html',
  styleUrls: ['./edit-admin.component.css'],
})
export class EditAdminComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  // Admin list & Search state
  admins = signal<User[]>([]);
  isLoadingList = signal<boolean>(false);
  searchQuery = '';
  selectedStatusFilter = 'all';

  // Selected Admin for editing
  selectedAdmin = signal<User | null>(null);
  isLoadingAdmin = signal<boolean>(false);
  isSubmitting = signal<boolean>(false);
  isDeleting = signal<boolean>(false);
  showPassword = signal<boolean>(false);
  avatarFile = signal<File | null>(null);
  avatarPreview = signal<string>('');
  isAvatarRemoved = signal<boolean>(false);

  // Edit Form Fields
  fullname = '';
  email = '';
  phone = '';
  newPassword = '';
  confirmPassword = '';
  status: UserStatus = 'active';
  avatarUrl = '';

  ngOnInit(): void {
    this.loadAdmins();

    // Check if route has an :id param
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.selectAdminById(id);
      }
    });
  }

  loadAdmins(): void {
    this.isLoadingList.set(true);
    this.adminService.getAllAdmins(this.searchQuery, this.selectedStatusFilter).subscribe({
      next: (res) => {
        this.admins.set(res.data);
        this.isLoadingList.set(false);
      },
      error: () => {
        this.isLoadingList.set(false);
        this.toastService.error('Failed to load administrator list');
      }
    });
  }

  onSearchChange(): void {
    this.loadAdmins();
  }

  onStatusFilterChange(status: string): void {
    this.selectedStatusFilter = status;
    this.loadAdmins();
  }

  selectAdmin(admin: User): void {
    this.selectedAdmin.set(admin);
    this.fullname = admin.fullname;
    this.email = admin.email;
    this.phone = admin.phone || '';
    this.status = admin.status;
    this.avatarUrl = admin.avatar || '';
    this.avatarPreview.set(admin.avatar || '');
    this.avatarFile.set(null);
    this.isAvatarRemoved.set(false);
    this.newPassword = '';
    this.confirmPassword = '';
    
    // Update URL without full reload
    this.router.navigate(['/admin/edit', admin.user_id]);
  }

  selectAdminById(id: string): void {
    this.isLoadingAdmin.set(true);
    this.adminService.getAdminById(id).subscribe({
      next: (res) => {
        this.isLoadingAdmin.set(false);
        this.selectAdmin(res.data);
      },
      error: () => {
        this.isLoadingAdmin.set(false);
        this.toastService.error(`Admin with ID '${id}' not found`);
        this.clearSelection();
      }
    });
  }

  clearSelection(): void {
    this.selectedAdmin.set(null);
    this.newPassword = '';
    this.confirmPassword = '';
    this.avatarPreview.set('');
    this.avatarFile.set(null);
    this.isAvatarRemoved.set(false);
    this.router.navigate(['/admin/edit']);
  }

  togglePasswordVisibility(): void {
    this.showPassword.update(v => !v);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      if (!file.type.startsWith('image/')) {
        this.toastService.error('Please choose a valid image file (PNG, JPG, WebP, etc.)');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        this.toastService.error('Image size must be less than 5MB');
        return;
      }

      this.avatarFile.set(file);
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        this.avatarPreview.set(result);
        this.isAvatarRemoved.set(false);
      };
      reader.readAsDataURL(file);
    }
  }

  removeAvatar(): void {
    this.avatarFile.set(null);
    this.avatarPreview.set('');
    this.avatarUrl = '';
    this.isAvatarRemoved.set(true);
  }

  onUpdateSubmit(): void {
    const admin = this.selectedAdmin();
    if (!admin) return;

    if (!this.fullname.trim()) {
      this.toastService.error('Full name is required');
      return;
    }
    if (!this.email.trim() || !this.email.includes('@')) {
      this.toastService.error('Valid email address is required');
      return;
    }

    if (this.newPassword) {
      if (this.newPassword.length < 6) {
        this.toastService.error('New password must be at least 6 characters');
        return;
      }
      if (this.newPassword !== this.confirmPassword) {
        this.toastService.error('New passwords do not match');
        return;
      }
    }

    this.isSubmitting.set(true);

    let avatarPayload: string | null | undefined = undefined;
    if (this.isAvatarRemoved()) {
      avatarPayload = null;
    } else if (this.avatarFile()) {
      avatarPayload = this.avatarPreview();
    }

    const payload: any = {
      fullname: this.fullname.trim(),
      email: this.email.trim().toLowerCase(),
      phone: this.phone ? this.phone.trim() : null,
      status: this.status,
      password: this.newPassword ? this.newPassword : undefined
    };

    if (avatarPayload !== undefined) {
      payload.avatar = avatarPayload;
    }

    this.adminService.updateAdmin(admin.user_id, payload).subscribe({
      next: (res) => {
        this.isSubmitting.set(false);
        this.selectedAdmin.set(res.data);
        this.newPassword = '';
        this.confirmPassword = '';
        this.toastService.success(`Admin "${res.data.fullname}" updated successfully!`);
        this.loadAdmins();
      },
      error: (err: any) => {
        this.isSubmitting.set(false);
        const msg = err?.error?.message || 'Failed to update administrator';
        this.toastService.error(msg);
      }
    });
  }

  onDeleteAdmin(): void {
    const admin = this.selectedAdmin();
    if (!admin) return;

    const confirmed = confirm(
      `Are you sure you want to permanently delete administrator "${admin.fullname}" (ID: ${admin.user_id})? This action cannot be undone.`
    );
    if (!confirmed) return;

    this.isDeleting.set(true);
    this.adminService.deleteAdmin(admin.user_id).subscribe({
      next: () => {
        this.isDeleting.set(false);
        this.toastService.success(`Admin "${admin.fullname}" deleted.`);
        this.clearSelection();
        this.loadAdmins();
      },
      error: (err: any) => {
        this.isDeleting.set(false);
        const msg = err?.error?.message || 'Failed to delete administrator';
        this.toastService.error(msg);
      }
    });
  }
}
