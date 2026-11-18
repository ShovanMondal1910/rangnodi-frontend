import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { CustomerService } from '../../core/services/customer.service';
import { ToastService } from '../../core/services/toast.service';
import { User, UserStatus } from '../../core/models/auth.models';

@Component({
  selector: 'app-edit-customer',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './edit-customer.component.html',
  styleUrls: ['./edit-customer.component.css'],
})
export class EditCustomerComponent implements OnInit {
  private readonly customerService = inject(CustomerService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  // Customer list & Search state
  customers = signal<User[]>([]);
  isLoadingList = signal<boolean>(false);
  searchQuery = '';
  selectedStatusFilter = 'all';

  // Selected Customer for editing
  selectedCustomer = signal<User | null>(null);
  isLoadingCustomer = signal<boolean>(false);
  isSubmitting = signal<boolean>(false);
  isDeleting = signal<boolean>(false);
  showPassword = signal<boolean>(false);

  // Binary Avatar State
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
    this.loadCustomers();

    // Check if route has an :id param
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.selectCustomerById(id);
      }
    });

    // Check queryParam for highlight
    this.route.queryParamMap.subscribe(q => {
      const hl = q.get('highlight');
      if (hl && !this.selectedCustomer()) {
        this.selectCustomerById(hl);
      }
    });
  }

  loadCustomers(): void {
    this.isLoadingList.set(true);
    this.customerService.getAllCustomers(this.searchQuery, this.selectedStatusFilter).subscribe({
      next: (res) => {
        this.customers.set(res.data);
        this.isLoadingList.set(false);
      },
      error: (err) => {
        console.error('Failed to load customers:', err);
        this.isLoadingList.set(false);
        this.toastService.error('Failed to load customer list from database');
      }
    });
  }

  onSearchChange(): void {
    this.loadCustomers();
  }

  onStatusFilterChange(status: string): void {
    this.selectedStatusFilter = status;
    this.loadCustomers();
  }

  selectCustomer(customer: User): void {
    this.selectedCustomer.set(customer);
    this.fullname = customer.fullname;
    this.email = customer.email;
    this.phone = customer.phone || '';
    this.status = customer.status;
    this.avatarUrl = customer.avatar || '';
    this.avatarPreview.set(customer.avatar || '');
    this.avatarFile.set(null);
    this.isAvatarRemoved.set(false);
    this.newPassword = '';
    this.confirmPassword = '';
  }

  selectCustomerById(id: string): void {
    this.isLoadingCustomer.set(true);
    this.customerService.getCustomerById(id).subscribe({
      next: (res) => {
        this.selectCustomer(res.data);
        this.isLoadingCustomer.set(false);
      },
      error: () => {
        this.isLoadingCustomer.set(false);
        this.toastService.error(`Customer ID '${id}' not found`);
      }
    });
  }

  clearSelection(): void {
    this.selectedCustomer.set(null);
    this.avatarPreview.set('');
    this.avatarFile.set(null);
    this.isAvatarRemoved.set(false);
    this.router.navigate(['/admin/customers/edit']);
  }

  togglePasswordVisibility(): void {
    this.showPassword.update(v => !v);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      if (!file.type.startsWith('image/')) {
        this.toastService.error('Please select a valid image file (PNG, JPG, WebP, etc.)');
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

  onSubmit(): void {
    const cust = this.selectedCustomer();
    if (!cust) return;

    if (!this.fullname.trim()) {
      this.toastService.error('Full name is required');
      return;
    }

    if (!this.email.trim() || !this.email.includes('@')) {
      this.toastService.error('Valid email is required');
      return;
    }

    if (this.newPassword) {
      if (this.newPassword.length < 6) {
        this.toastService.error('New password must be at least 6 characters');
        return;
      }
      if (this.newPassword !== this.confirmPassword) {
        this.toastService.error('Passwords do not match');
        return;
      }
    }

    this.isSubmitting.set(true);

    let avatarPayload: string | undefined = undefined;
    if (this.isAvatarRemoved()) {
      avatarPayload = '';
    } else if (this.avatarFile()) {
      avatarPayload = this.avatarPreview();
    }

    const payload: any = {
      fullname: this.fullname.trim(),
      email: this.email.trim().toLowerCase(),
      phone: this.phone.trim() || undefined,
      status: this.status,
      password: this.newPassword ? this.newPassword.trim() : undefined,
    };

    if (avatarPayload !== undefined) {
      payload.avatar = avatarPayload;
    }

    this.customerService.updateCustomer(cust.user_id, payload).subscribe({
      next: (res) => {
        this.isSubmitting.set(false);
        this.toastService.success(`Customer "${res.data.fullname}" updated successfully!`);
        this.selectCustomer(res.data);
        this.loadCustomers();
      },
      error: (err) => {
        this.isSubmitting.set(false);
        const msg = err.error?.message || 'Failed to update customer';
        this.toastService.error(msg);
      }
    });
  }

  deleteCustomer(): void {
    const cust = this.selectedCustomer();
    if (!cust) return;

    const confirmed = confirm(
      `Are you sure you want to permanently delete customer "${cust.fullname}" (${cust.user_id})?`
    );
    if (!confirmed) return;

    this.isDeleting.set(true);
    this.customerService.deleteCustomer(cust.user_id).subscribe({
      next: () => {
        this.isDeleting.set(false);
        this.toastService.success(`Customer "${cust.fullname}" has been removed`);
        this.clearSelection();
        this.loadCustomers();
      },
      error: (err) => {
        this.isDeleting.set(false);
        const msg = err.error?.message || 'Failed to delete customer';
        this.toastService.error(msg);
      }
    });
  }

  get initials(): string {
    if (!this.fullname.trim()) return 'CU';
    const parts = this.fullname.trim().split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
}
