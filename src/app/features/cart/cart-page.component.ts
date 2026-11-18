import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CartService } from '../../core/services/cart.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { CartItem } from '../../core/models/cart.models';

@Component({
  selector: 'app-cart-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, DecimalPipe],
  templateUrl: './cart-page.component.html',
  styleUrl: './cart-page.component.css'
})
export class CartPageComponent {
  readonly cartService = inject(CartService);
  readonly authService = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  // Accordion Sections State
  isCouponOpen = signal<boolean>(true);
  isShippingOpen = signal<boolean>(false);
  isGiftCardOpen = signal<boolean>(false);
  showAvailableCoupons = signal<boolean>(false);

  // Coupon State
  couponCode = '';
  appliedCoupon = signal<{ code: string; percent: number; amount: number } | null>(null);

  // Available sample coupons
  availableCoupons = [
    { code: 'RANGNODI10', discount: '10% OFF', description: 'Special 10% discount on all items' },
    { code: 'WELCOME500', discount: '৳500 OFF', description: 'Flat ৳500 off on orders over ৳3,000' }
  ];

  // Shipping Calculation
  selectedDivision = 'Dhaka';
  shippingCost = computed(() => {
    return this.selectedDivision === 'Dhaka' ? 80 : 130;
  });

  // VAT (7.5% standard VAT or 5%)
  vatRate = 0.075;
  vatAmount = computed(() => {
    const discountedSubtotal = Math.max(0, this.cartService.subtotal() - this.discountAmount());
    return Math.round(discountedSubtotal * this.vatRate * 100) / 100;
  });

  discountAmount = computed(() => {
    if (!this.appliedCoupon()) return 0;
    const c = this.appliedCoupon()!;
    if (c.percent > 0) {
      return Math.round(this.cartService.subtotal() * (c.percent / 100) * 100) / 100;
    }
    return c.amount;
  });

  grandTotal = computed(() => {
    const subtotal = this.cartService.subtotal();
    const discount = this.discountAmount();
    const vat = this.vatAmount();
    return Math.max(0, Math.round((subtotal - discount + vat) * 100) / 100);
  });

  getItemImageUrl(item: CartItem): string {
    if (item.image_url && !item.image_url.endsWith('/photo')) {
      return item.image_url;
    }
    return `/api/v1/products/${item.product_id}/main-image`;
  }

  onImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    if (target) {
      target.src = '/icons/logo.jpeg';
    }
  }

  onQuantityChange(item: CartItem, event: Event): void {
    const input = event.target as HTMLInputElement;
    const val = parseInt(input.value, 10);
    if (isNaN(val) || val <= 0) {
      this.cartService.updateQuantity(item.id, 1);
      input.value = '1';
    } else {
      this.cartService.updateQuantity(item.id, val);
    }
  }

  removeItem(itemId: string): void {
    this.cartService.removeItem(itemId);
  }

  applyCoupon(): void {
    const code = this.couponCode.trim().toUpperCase();
    if (!code) {
      this.toast.error('Please enter a coupon code');
      return;
    }

    if (code === 'RANGNODI10') {
      const discount = Math.round(this.cartService.subtotal() * 0.1);
      this.appliedCoupon.set({ code: 'RANGNODI10', percent: 10, amount: discount });
      this.toast.success('Coupon "RANGNODI10" applied (10% OFF)!');
    } else if (code === 'WELCOME500') {
      this.appliedCoupon.set({ code: 'WELCOME500', percent: 0, amount: 500 });
      this.toast.success('Coupon "WELCOME500" applied (৳500 OFF)!');
    } else {
      this.toast.error(`Coupon "${code}" is invalid or expired.`);
    }
  }

  selectCoupon(code: string): void {
    this.couponCode = code;
    this.showAvailableCoupons.set(false);
    this.applyCoupon();
  }

  removeCoupon(): void {
    this.appliedCoupon.set(null);
    this.couponCode = '';
    this.toast.info('Coupon removed');
  }

  proceedToCheckout(): void {
    if (this.cartService.items().length === 0) {
      this.toast.error('Your cart is empty');
      return;
    }
    const user = this.authService.currentUser();
    if (!user || !user.user_id) {
      this.toast.warning('Please log in to continue to checkout');
      this.router.navigate(['/login'], { queryParams: { returnUrl: '/checkout' } });
      return;
    }
    this.router.navigate(['/checkout']);
  }
}
