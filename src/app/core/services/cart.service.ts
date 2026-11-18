import { Injectable, signal, computed, inject, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';
import { ToastService } from './toast.service';
import { CartItem, CartResponse } from '../models/cart.models';

const GUEST_CART_KEY = 'rangnodi_guest_cart';
const CART_LAST_ACTIVE_KEY = 'rangnodi_cart_last_active';
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private toast = inject(ToastService);
  private apiUrl = '/api/v1/cart';

  // State Signals
  items = signal<CartItem[]>([]);
  isLoading = signal<boolean>(false);

  // Computed state
  totalQuantity = computed(() =>
    this.items().reduce((sum, item) => sum + (item.quantity || 1), 0)
  );

  subtotal = computed(() => {
    const total = this.items().reduce((sum, item) => {
      const price = item.unit_price ?? (item.sale_price || item.regular_price);
      return sum + (Number(price) * (item.quantity || 1));
    }, 0);
    return Math.round(total * 100) / 100;
  });

  constructor() {
    this.loadCart();

    // Auto-sync guest cart when user logs in
    effect(() => {
      const user = this.authService.currentUser();
      if (user?.user_id) {
        this.syncGuestCart(user.user_id);
      }
    });
  }

  /**
   * Check if 7 days have passed since the user last accessed or used the cart/site.
   * If > 7 days, wipe the cart automatically. Otherwise, refresh the timestamp.
   */
  private checkSevenDayInactivity(): boolean {
    try {
      const lastActiveRaw = localStorage.getItem(CART_LAST_ACTIVE_KEY);
      if (lastActiveRaw) {
        const lastActiveTime = Number(lastActiveRaw);
        if (!isNaN(lastActiveTime) && (Date.now() - lastActiveTime > SEVEN_DAYS_MS)) {
          this.clearCart();
          return true;
        }
      }
      localStorage.setItem(CART_LAST_ACTIVE_KEY, Date.now().toString());
    } catch {
      // Ignored if local storage is restricted
    }
    return false;
  }

  /**
   * Load Cart from Database (if logged in) or LocalStorage (if guest)
   */
  loadCart(): void {
    if (this.checkSevenDayInactivity()) {
      return;
    }

    const user = this.authService.currentUser();
    if (user?.user_id) {
      this.isLoading.set(true);
      this.http.get<CartResponse>(`${this.apiUrl}?userId=${user.user_id}`).subscribe({
        next: (res) => {
          this.isLoading.set(false);
          if (res.success && res.data) {
            this.items.set(res.data.items);
          }
        },
        error: () => {
          this.isLoading.set(false);
        }
      });
    } else {
      // Guest mode
      try {
        const raw = localStorage.getItem(GUEST_CART_KEY);
        const parsed: CartItem[] = raw ? JSON.parse(raw) : [];
        const sanitized = parsed.map(item => ({
          ...item,
          image_url: (item.image_url && !item.image_url.endsWith('/photo'))
            ? item.image_url
            : `/api/v1/products/${item.product_id}/main-image`
        }));
        this.items.set(sanitized);
        this.saveGuestCart(sanitized);
      } catch {
        this.items.set([]);
      }
    }
  }

  /**
   * Add Product to Cart
   */
  addToCart(product: any, quantity = 1, size?: string, color?: string): void {
    const user = this.authService.currentUser();
    const productId = product.product_id;
    const unitPrice = product.sale_price !== null && product.sale_price !== undefined
      ? Number(product.sale_price)
      : Number(product.regular_price);

    if (user?.user_id) {
      // Logged in: Sync directly to PostgreSQL
      this.http.post<CartResponse>(this.apiUrl, {
        userId: user.user_id,
        productId,
        quantity,
        selectedSize: size || null,
        selectedColor: color || null
      }).subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.items.set(res.data.items);
            this.toast.success(`"${product.title}" added to cart!`);
          }
        },
        error: (err) => {
          this.toast.error(err.error?.message || 'Failed to add item to cart');
        }
      });
    } else {
      // Guest Mode: Update LocalStorage
      const current = [...this.items()];
      const existingIdx = current.findIndex(
        i => i.product_id === productId && i.selected_size === (size || null) && i.selected_color === (color || null)
      );

      if (existingIdx > -1) {
        current[existingIdx].quantity += quantity;
      } else {
        const newItem: CartItem = {
          id: 'guest_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
          product_id: productId,
          quantity,
          selected_size: size || null,
          selected_color: color || null,
          title: product.title,
          slug: product.slug || '',
          sku: product.sku || product.product_id,
          regular_price: Number(product.regular_price),
          sale_price: product.sale_price !== null && product.sale_price !== undefined ? Number(product.sale_price) : null,
          unit_price: unitPrice,
          image_url: `/api/v1/products/${productId}/main-image`,
          stock_quantity: product.stock_quantity ?? 10,
          stock_status: product.stock_status ?? 'in_stock',
        };
        current.unshift(newItem);
      }

      this.items.set(current);
      this.saveGuestCart(current);
      this.toast.success(`"${product.title}" added to cart!`);
    }
  }

  /**
   * Update Quantity (+ or -)
   */
  updateQuantity(cartItemId: string, newQty: number): void {
    if (newQty <= 0) {
      this.removeItem(cartItemId);
      return;
    }

    const user = this.authService.currentUser();
    if (user?.user_id) {
      this.http.patch<CartResponse>(`${this.apiUrl}/${cartItemId}`, {
        userId: user.user_id,
        quantity: newQty
      }).subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.items.set(res.data.items);
          }
        }
      });
    } else {
      const current = this.items().map(i => {
        if (i.id === cartItemId) {
          return { ...i, quantity: newQty };
        }
        return i;
      });
      this.items.set(current);
      this.saveGuestCart(current);
    }
  }

  /**
   * Remove item from Cart
   */
  removeItem(cartItemId: string): void {
    const user = this.authService.currentUser();
    if (user?.user_id) {
      this.http.delete<CartResponse>(`${this.apiUrl}/${cartItemId}?userId=${user.user_id}`).subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.items.set(res.data.items);
            this.toast.info('Item removed from cart');
          }
        }
      });
    } else {
      const current = this.items().filter(i => i.id !== cartItemId);
      this.items.set(current);
      this.saveGuestCart(current);
      this.toast.info('Item removed from cart');
    }
  }

  /**
   * Clear entire cart (UI state, LocalStorage, and Database if logged in)
   */
  clearCart(): void {
    // 1. Immediately reset Angular state signals
    this.items.set([]);

    // 2. Wipe guest storage & activity timer
    try {
      localStorage.removeItem(GUEST_CART_KEY);
      localStorage.removeItem(CART_LAST_ACTIVE_KEY);
    } catch {
      // Ignored
    }

    // 3. Clear database record if user is logged in
    const user = this.authService.currentUser();
    if (user?.user_id) {
      this.http.delete<CartResponse>(`${this.apiUrl}?userId=${user.user_id}`).subscribe();
    }
  }

  /**
   * Auto-sync guest cart when logging in
   */
  private syncGuestCart(userId: string): void {
    try {
      const raw = localStorage.getItem(GUEST_CART_KEY);
      if (!raw) {
        this.loadCart();
        return;
      }

      const guestItems: CartItem[] = JSON.parse(raw);
      if (!guestItems || guestItems.length === 0) {
        this.loadCart();
        return;
      }

      const payload = {
        userId,
        items: guestItems.map(i => ({
          product_id: i.product_id,
          quantity: i.quantity,
          selected_size: i.selected_size,
          selected_color: i.selected_color
        }))
      };

      this.http.post<CartResponse>(`${this.apiUrl}/sync`, payload).subscribe({
        next: (res) => {
          localStorage.removeItem(GUEST_CART_KEY);
          if (res.success && res.data) {
            this.items.set(res.data.items);
          }
        },
        error: () => {
          this.loadCart();
        }
      });
    } catch {
      this.loadCart();
    }
  }

  private saveGuestCart(items: CartItem[]): void {
    try {
      localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
      localStorage.setItem(CART_LAST_ACTIVE_KEY, Date.now().toString());
    } catch {
      // Ignored
    }
  }
}
