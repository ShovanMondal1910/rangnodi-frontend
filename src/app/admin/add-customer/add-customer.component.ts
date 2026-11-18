import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CustomerService } from '../../core/services/customer.service';
import { ToastService } from '../../core/services/toast.service';
import { UserStatus } from '../../core/models/auth.models';

@Component({
  selector: 'app-add-customer',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './add-customer.component.html',
  styleUrls: ['./add-customer.component.css'],
})
export class AddCustomerComponent implements OnInit {
  private readonly customerService = inject(CustomerService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);

  // State
  generatedId = signal<string>('Loading...');
  isGeneratingId = signal<boolean>(false);
  isSubmitting = signal<boolean>(false);
  showPassword = signal<boolean>(false);

  // Binary Avatar Upload State
  avatarFile = signal<File | null>(null);
  avatarPreview = signal<string>('');

  // Form Fields
  fullname = '';
  email = '';
  phone = '';
  password = '';
  confirmPassword = '';
  status: UserStatus = 'active';

  ngOnInit(): void {
    this.fetchGeneratedId();
  }

  fetchGeneratedId(): void {
    this.isGeneratingId.set(true);
    this.customerService.generateCustomerId().subscribe({
      next: (res) => {
        this.generatedId.set(res.data.id);
        this.isGeneratingId.set(false);
      },
      error: () => {
        const fallback = Math.floor(1000000000 + Math.random() * 9000000000).toString();
        this.generatedId.set(fallback);
        this.isGeneratingId.set(false);
      }
    });
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
      };
      reader.readAsDataURL(file);
    }
  }

  removeAvatar(): void {
    this.avatarFile.set(null);
    this.avatarPreview.set('');
  }

  onSubmit(): void {
    if (!this.fullname.trim()) {
      this.toastService.error('Customer full name is required');
      return;
    }

    if (!this.email.trim() || !this.email.includes('@')) {
      this.toastService.error('Please enter a valid email address');
      return;
    }

    if (this.password && this.password.length < 6) {
      this.toastService.error('Password must be at least 6 characters');
      return;
    }

    if (this.password && this.password !== this.confirmPassword) {
      this.toastService.error('Passwords do not match');
      return;
    }

    this.isSubmitting.set(true);

    const payload = {
      fullname: this.fullname.trim(),
      email: this.email.trim().toLowerCase(),
      phone: this.phone.trim() || undefined,
      password: this.password.trim() || 'Customer@1234',
      status: this.status,
      avatar: this.avatarPreview() || undefined,
    };

    this.customerService.createCustomer(payload).subscribe({
      next: (res) => {
        this.isSubmitting.set(false);
        this.toastService.success(`Customer "${res.data.fullname}" created successfully with binary profile photo!`);
        this.router.navigate(['/admin/customers/edit'], {
          queryParams: { highlight: res.data.user_id }
        });
      },
      error: (err) => {
        this.isSubmitting.set(false);
        const msg = err.error?.message || 'Failed to create customer';
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
