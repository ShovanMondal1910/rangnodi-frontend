import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DecimalPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';
import { CustomerService } from '../../core/services/customer.service';
import { ToastService } from '../../core/services/toast.service';
import { CartService } from '../../core/services/cart.service';
import { User } from '../../core/models/auth.models';

export interface OrderItem {
  id: string;
  product_id: string;
  product_title: string;
  sku?: string;
  selected_size?: string;
  selected_color?: string;
  unit_price: number;
  quantity: number;
  total_price: number;
  image_url?: string;
}

export interface UserOrder {
  order_id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  customer_name: string;
  phone: string;
  email: string;
  delivery_address: string;
  subtotal: number;
  shipping_charge: number;
  discount_amount: number;
  vat_amount: number;
  rounding_off: number;
  total_amount: number;
  payment_method: string;
  payment_status: string;
  order_status: string;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, DecimalPipe, DatePipe],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css',
})
export class ProfileComponent implements OnInit {
  readonly authService = inject(AuthService);
  private readonly customerService = inject(CustomerService);
  private readonly toast = inject(ToastService);
  readonly cartService = inject(CartService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly http = inject(HttpClient);

  // Active Menu Tab
  activeTab = signal<string>('profile');

  // Form Fields matching screenshot
  fullname = '';
  phone = '';
  email = '';
  address = '';

  // Password fields for Change Password tab
  oldPassword = '';
  newPassword = '';
  confirmPassword = '';

  isSubmitting = signal<boolean>(false);
  isLoading = signal<boolean>(true);

  // Orders State
  orders = signal<UserOrder[]>([]);
  isLoadingOrders = signal<boolean>(false);

  ngOnInit(): void {
    const user = this.authService.currentUser();
    if (!user) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: '/profile' } });
      return;
    }

    this.populateUserData(user);
    this.fetchFreshUserData(user.user_id);

    // If navigated with ?tab=orders or default, fetch orders
    const tabParam = this.route.snapshot.queryParams['tab'];
    if (tabParam === 'orders') {
      this.activeTab.set('orders');
      this.fetchUserOrders(user.user_id);
    }
  }

  fetchUserOrders(userId?: string): void {
    const uid = userId || this.authService.currentUser()?.user_id;
    if (!uid) return;

    this.isLoadingOrders.set(true);
    this.http.get<{ success: boolean; data: UserOrder[] }>(`/api/v1/orders/my-orders?userId=${uid}`).subscribe({
      next: (res) => {
        this.isLoadingOrders.set(false);
        if (res.success && res.data) {
          this.orders.set(res.data);
        }
      },
      error: () => {
        this.isLoadingOrders.set(false);
      }
    });
  }

  onImageError(event: Event): void {
    (event.target as HTMLImageElement).src = '/icons/logo.jpeg';
  }

  private populateUserData(user: User): void {
    this.fullname = user.fullname || '';
    this.email = user.email || '';
    this.phone = user.phone || '';
    this.address = user.address || '';
  }

  private fetchFreshUserData(userId: string): void {
    this.isLoading.set(true);
    this.customerService.getCustomerById(userId).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res.success && res.data) {
          this.populateUserData(res.data);
          this.authService.updateCurrentUser(res.data);
        }
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  updateProfile(): void {
    const user = this.authService.currentUser();
    if (!user) return;

    if (!this.fullname.trim()) {
      this.toast.error('Full Name is required');
      return;
    }

    if (!this.phone.trim()) {
      this.toast.error('Phone number is required');
      return;
    }

    this.isSubmitting.set(true);

    this.customerService.updateCustomer(user.user_id, {
      fullname: this.fullname.trim(),
      phone: this.phone.trim(),
      address: this.address.trim(),
    }).subscribe({
      next: (res) => {
        this.isSubmitting.set(false);
        if (res.success && res.data) {
          this.authService.updateCurrentUser(res.data);
          this.populateUserData(res.data);
          this.toast.success('Personal information updated successfully!');
        }
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.toast.error(err.error?.message || 'Failed to update personal information');
      }
    });
  }

  updatePassword(): void {
    const user = this.authService.currentUser();
    if (!user) return;

    if (!this.newPassword || this.newPassword.length < 6) {
      this.toast.error('New password must be at least 6 characters');
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.toast.error('New passwords do not match');
      return;
    }

    this.isSubmitting.set(true);
    this.customerService.updateCustomer(user.user_id, {
      password: this.newPassword
    }).subscribe({
      next: (res) => {
        this.isSubmitting.set(false);
        if (res.success) {
          this.toast.success('Password changed successfully!');
          this.oldPassword = '';
          this.newPassword = '';
          this.confirmPassword = '';
          this.activeTab.set('profile');
        }
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.toast.error(err.error?.message || 'Failed to update password');
      }
    });
  }

  onTabClick(tab: string): void {
    if (tab === 'cart') {
      this.router.navigate(['/cart']);
      return;
    }
    if (tab === 'logout') {
      this.logout();
      return;
    }
    this.activeTab.set(tab);

    if (tab === 'orders') {
      this.fetchUserOrders();
    }
  }

  logout(): void {
    this.authService.logout();
    this.toast.info('You have been logged out.');
    this.router.navigate(['/login']);
  }
}
