import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AdminOrderItem {
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

export interface AdminOrder {
  order_id: string;
  user_id: string;
  first_name: string;
  last_name?: string;
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
  items: AdminOrderItem[];
}

export interface OrderListResponse {
  success: boolean;
  data: AdminOrder[];
}

@Injectable({
  providedIn: 'root'
})
export class AdminOrderService {
  private http = inject(HttpClient);
  private apiUrl = '/api/v1/orders';

  getAllOrders(status?: string, search?: string): Observable<OrderListResponse> {
    let params = new HttpParams();
    if (status && status !== 'all') {
      params = params.set('status', status);
    }
    if (search && search.trim()) {
      params = params.set('search', search.trim());
    }
    return this.http.get<OrderListResponse>(this.apiUrl, { params });
  }

  getOrderById(id: string): Observable<{ success: boolean; data: { order: AdminOrder; items: AdminOrderItem[] } }> {
    return this.http.get<{ success: boolean; data: { order: AdminOrder; items: AdminOrderItem[] } }>(`${this.apiUrl}/${id}`);
  }

  updateOrderStatus(orderId: string, orderStatus: string, paymentStatus?: string): Observable<{ success: boolean; data: AdminOrder; message: string }> {
    return this.http.patch<{ success: boolean; data: AdminOrder; message: string }>(`${this.apiUrl}/${orderId}/status`, {
      orderStatus,
      paymentStatus
    });
  }

  deleteOrder(orderId: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.apiUrl}/${orderId}`);
  }
}
