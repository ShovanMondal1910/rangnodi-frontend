import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AdminService } from '../../core/services/admin.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-add-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './add-admin.component.html',
  styleUrls: ['./add-admin.component.css'],
})
export class AddAdminComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);

  // State
  generatedId = signal<string>('Loading...');
  isGeneratingId = signal<boolean>(false);
  isSubmitting = signal<boolean>(false);
  showPassword = signal<boolean>(false);

  // Form Fields
  fullname = '';
  email = '';
  phone = '';
  password = '';
  confirmPassword = '';
  status: 'active' | 'inactive' = 'active';
  avatarUrl = '';

  ngOnInit(): void {
    this.fetchGeneratedId();
  }

  fetchGeneratedId(): void {
    this.isGeneratingId.set(true);
    this.adminService.generateAdminId().subscribe({
      next: (res) => {
        this.generatedId.set(res.data.id);
        this.isGeneratingId.set(false);
      },
      error: () => {
        // Fallback local 10-digit generation if endpoint temporarily unreachable
        const fallback = Math.floor(1000000000 + Math.random() * 9000000000).toString();
        this.generatedId.set(fallback);
        this.isGeneratingId.set(false);
      }
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword.update(v => !v);
  }

  onSubmit(): void {
    if (!this.fullname.trim()) {
      this.toastService.error('Full name is required');
      return;
    }
    if (!this.email.trim() || !this.email.includes('@')) {
      this.toastService.error('A valid email address is required');
      return;
    }
    if (!this.password || this.password.length < 6) {
      this.toastService.error('Password must be at least 6 characters');
      return;
    }
    if (this.password !== this.confirmPassword) {
      this.toastService.error('Passwords do not match');
      return;
    }

    this.isSubmitting.set(true);
    this.adminService.createAdmin({
      fullname: this.fullname.trim(),
      email: this.email.trim().toLowerCase(),
      phone: this.phone ? this.phone.trim() : undefined,
      password: this.password,
      status: this.status,
      avatar: this.avatarUrl ? this.avatarUrl.trim() : undefined
    }).subscribe({
      next: (res) => {
        this.isSubmitting.set(false);
        this.toastService.success(`Admin "${res.data.fullname}" created successfully!`);
        this.router.navigate(['/admin/edit', res.data.user_id]);
      },
      error: (err: any) => {
        this.isSubmitting.set(false);
        const msg = err?.error?.message || 'Failed to create administrator account';
        this.toastService.error(msg);
      }
    });
  }

  resetForm(): void {
    this.fullname = '';
    this.email = '';
    this.phone = '';
    this.password = '';
    this.confirmPassword = '';
    this.status = 'active';
    this.avatarUrl = '';
    this.fetchGeneratedId();
  }
}
