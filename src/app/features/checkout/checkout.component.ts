import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CartService } from '../../core/services/cart.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { CartItem } from '../../core/models/cart.models';

export interface District {
  name: string;
  thanas: string[];
}

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, DecimalPipe],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.css'
})
export class CheckoutComponent implements OnInit {
  readonly cartService = inject(CartService);
  readonly authService = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);

  // Billing Fields
  billingFirstName = '';
  billingLastName = '';
  billingPhone = '';
  billingEmail = '';
  billingCountry = 'Bangladesh';
  billingState = '';
  billingCity = '';
  billingPostalCode = '';
  billingAddress = '';

  // Shipping Fields
  sameAsBilling = true;
  deliveryType = 'Home delivery';
  shippingFirstName = '';
  shippingLastName = '';
  shippingPhone = '';
  shippingEmail = '';
  shippingCountry = 'Bangladesh';
  shippingState = '';
  shippingCity = '';
  shippingPostalCode = '';
  shippingAddress = '';

  // Additional Info & Codes
  orderNote = '';
  couponCode = '';
  clubCardNo = '';
  giftCardNo = '';

  // Payment Options
  paymentMethod = 'cod';
  acceptTerms = true;

  // Validation Flags
  submitted = signal<boolean>(false);
  isSubmitting = signal<boolean>(false);
  orderSuccess = signal<{ orderId: string } | null>(null);

  // Coupons
  showAvailableCoupons = signal<boolean>(false);
  appliedCoupon = signal<{ code: string; percent: number; amount: number } | null>(null);

  availableCoupons = [
    { code: 'RANGNODI10', discount: '10% OFF', description: 'Special 10% discount on all items' },
    { code: 'WELCOME500', discount: '৳500 OFF', description: 'Flat ৳500 off on orders over ৳3,000' }
  ];

  // Bangladesh Districts & Areas
  districts: District[] = [
    { name: 'Dhaka', thanas: ['Dhanmondi', 'Gulshan', 'Banani', 'Mirpur', 'Uttara', 'Mohammadpur', 'Motijheel', 'Badda'] },
    { name: 'Chittagong', thanas: ['Panchlaish', 'Kotwali', 'Agrabad', 'Halishahar', 'Khulshi', 'Nasirabad'] },
    { name: 'Sylhet', thanas: ['Kotwali', 'Jalalabad', 'Osmani Nagar', 'Beanibazar'] },
    { name: 'Rajshahi', thanas: ['Boalia', 'Motihar', 'Rajpara', 'Shah Makhdum'] },
    { name: 'Khulna', thanas: ['Khalishpur', 'Daulatpur', 'Sonadanga', 'Kotwali'] },
    { name: 'Barisal', thanas: ['Kotwali', 'Kawnia', 'Airport'] },
    { name: 'Rangpur', thanas: ['Kotwali', 'Mahi Ganj', 'Haragach'] },
    { name: 'Gazipur', thanas: ['Joydebpur', 'Tongi', 'Kaliakair'] },
    { name: 'Narayanganj', thanas: ['Narayanganj Sadar', 'Siddhirganj', 'Fatullah'] }
  ];

  billingCities = computed(() => {
    const d = this.districts.find(item => item.name === this.billingState);
    return d ? d.thanas : [];
  });

  shippingCities = computed(() => {
    const d = this.districts.find(item => item.name === this.shippingState);
    return d ? d.thanas : [];
  });

  // Financial Calculations
  subtotal = computed(() => this.cartService.subtotal());

  shippingCharge = computed(() => {
    const state = this.billingState;
    if (!state) return 80;
    return state === 'Dhaka' ? 80 : 130;
  });

  discountAmount = computed(() => {
    if (!this.appliedCoupon()) return 0;
    const c = this.appliedCoupon()!;
    if (c.percent > 0) {
      return Math.round(this.subtotal() * (c.percent / 100) * 100) / 100;
    }
    return c.amount;
  });

  vatAmount = computed(() => {
    const discounted = Math.max(0, this.subtotal() - this.discountAmount());
    return Math.round(discounted * 0.075 * 100) / 100;
  });

  roundingOff = computed(() => {
    const rawTotal = this.subtotal() - this.discountAmount() + this.vatAmount() + this.shippingCharge();
    const rounded = Math.round(rawTotal);
    return Math.round((rounded - rawTotal) * 100) / 100;
  });

  totalAmount = computed(() => {
    const raw = this.subtotal() - this.discountAmount() + this.vatAmount() + this.shippingCharge();
    return Math.max(0, Math.round(raw));
  });

  ngOnInit(): void {
    const user = this.authService.currentUser();
    if (!user || !user.user_id) {
      this.toast.warning('Please log in to continue with checkout.');
      this.router.navigate(['/login'], { queryParams: { returnUrl: '/checkout' } });
      return;
    }

    const parts = (user.fullname || '').trim().split(' ');
    this.billingFirstName = parts[0] || '';
    this.billingLastName = parts.slice(1).join(' ') || '';
    this.billingPhone = user.phone || '';
    this.billingEmail = user.email || '';
    this.billingAddress = user.address || '';
    this.billingState = 'Dhaka';
    this.billingCity = 'Dhanmondi';
    this.billingPostalCode = '1205';
  }

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

  applyCoupon(): void {
    const code = this.couponCode.trim().toUpperCase();
    if (!code) {
      this.toast.error('Please enter a coupon code');
      return;
    }
    if (code === 'RANGNODI10') {
      const discount = Math.round(this.subtotal() * 0.1);
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

  applyClubCard(): void {
    if (!this.clubCardNo.trim()) {
      this.toast.error('Please enter Club Card No or Employee ID');
      return;
    }
    this.toast.success(`Club card "${this.clubCardNo.trim()}" verified!`);
  }

  applyGiftCard(): void {
    if (!this.giftCardNo.trim()) {
      this.toast.error('Please enter Gift Card No');
      return;
    }
    this.toast.info(`Gift card "${this.giftCardNo.trim()}" validated.`);
  }

  placeOrder(): void {
    this.submitted.set(true);

    const currentUser = this.authService.currentUser();
    if (!currentUser || !currentUser.user_id) {
      this.toast.error('You must be logged in to place an order.');
      this.router.navigate(['/login'], { queryParams: { returnUrl: '/checkout' } });
      return;
    }

    if (this.cartService.items().length === 0) {
      this.toast.error('Your cart is empty');
      return;
    }

    if (!this.billingFirstName.trim()) {
      this.toast.error('First Name is required');
      return;
    }

    if (!this.billingPhone.trim()) {
      this.toast.error('Phone number is required');
      return;
    }

    if (!this.billingEmail.trim()) {
      this.toast.error('Email address is required');
      return;
    }

    if (!this.billingAddress.trim()) {
      this.toast.error('Address is required');
      return;
    }

    if (!this.acceptTerms) {
      this.toast.error('Please accept the Terms & Conditions to proceed');
      return;
    }

    this.isSubmitting.set(true);

    const payload = {
      userId: this.authService.currentUser()?.user_id || null,
      firstName: this.billingFirstName.trim(),
      lastName: this.billingLastName.trim(),
      customerName: `${this.billingFirstName.trim()} ${this.billingLastName.trim()}`.trim(),
      phone: this.billingPhone.trim(),
      email: this.billingEmail.trim(),
      deliveryAddress: this.billingAddress.trim(),
      subtotal: this.subtotal(),
      shippingCharge: this.shippingCharge(),
      discountAmount: this.discountAmount(),
      vatAmount: this.vatAmount(),
      roundingOff: this.roundingOff(),
      totalAmount: this.totalAmount(),
      paymentMethod: this.paymentMethod,
      items: this.cartService.items().map(i => ({
        productId: i.product_id,
        productTitle: i.title,
        sku: i.sku || i.product_id,
        selectedSize: i.selected_size,
        selectedColor: i.selected_color,
        unitPrice: i.unit_price,
        vat: Math.round(i.unit_price * 0.075 * 100) / 100,
        discount: (i.regular_price - i.unit_price) > 0 ? (i.regular_price - i.unit_price) : 0,
        quantity: i.quantity,
        totalPrice: i.unit_price * i.quantity
      }))
    };

    this.http.post<{ success: boolean; data: { orderId: string } }>('/api/v1/orders', payload).subscribe({
      next: (res) => {
        this.isSubmitting.set(false);
        if (res.success && res.data) {
          this.orderSuccess.set({ orderId: res.data.orderId });
          this.cartService.clearCart();
          this.toast.success(`Order placed successfully! Order ID: ${res.data.orderId}`);
        }
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.toast.error(err.error?.message || 'Failed to place order. Please try again.');
      }
    });
  }
}
