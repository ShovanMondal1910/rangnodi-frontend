import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, DecimalPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AdminOrderService, AdminOrder } from '../../core/services/admin-order.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-order-management',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, DecimalPipe, DatePipe],
  templateUrl: './order-management.component.html',
  styleUrl: './order-management.component.css'
})
export class OrderManagementComponent implements OnInit {
  private readonly orderService = inject(AdminOrderService);
  private readonly toast = inject(ToastService);

  // Orders State
  orders = signal<AdminOrder[]>([]);
  isLoading = signal<boolean>(true);
  isUpdating = signal<boolean>(false);

  // Inspection Drawer / Modal State
  selectedOrder = signal<AdminOrder | null>(null);
  editOrderStatus = '';
  editPaymentStatus = '';

  // Filter & Search
  searchQuery = '';
  selectedStatusFilter = 'all';

  // Status Filter Options
  readonly statusTabs = [
    { key: 'all', label: 'All Orders' },
    { key: 'processing', label: 'Processing' },
    { key: 'pending', label: 'Pending' },
    { key: 'shipped', label: 'Shipped' },
    { key: 'delivered', label: 'Delivered' },
    { key: 'cancelled', label: 'Cancelled' }
  ];

  // Available Status List
  readonly orderStatuses = ['processing', 'pending', 'shipped', 'delivered', 'cancelled'];
  readonly paymentStatuses = ['pending', 'paid', 'failed', 'refunded'];

  // Metrics
  totalOrdersCount = computed(() => this.orders().length);

  totalRevenue = computed(() => {
    return this.orders()
      .filter(o => o.order_status?.toLowerCase() !== 'cancelled')
      .reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
  });

  processingCount = computed(() => 
    this.orders().filter(o => o.order_status?.toLowerCase() === 'processing').length
  );

  pendingCount = computed(() => 
    this.orders().filter(o => o.order_status?.toLowerCase() === 'pending').length
  );

  shippedCount = computed(() => 
    this.orders().filter(o => o.order_status?.toLowerCase() === 'shipped').length
  );

  deliveredCount = computed(() => 
    this.orders().filter(o => o.order_status?.toLowerCase() === 'delivered').length
  );

  cancelledCount = computed(() => 
    this.orders().filter(o => o.order_status?.toLowerCase() === 'cancelled').length
  );

  // Filtered Orders List
  filteredOrders = computed(() => {
    let list = this.orders();
    const query = this.searchQuery.trim().toLowerCase();

    // 1. Filter by status
    if (this.selectedStatusFilter !== 'all') {
      list = list.filter(o => (o.order_status || '').toLowerCase() === this.selectedStatusFilter);
    }

    // 2. Filter by search query
    if (query) {
      list = list.filter(o => 
        (o.order_id || '').toLowerCase().includes(query) ||
        (o.customer_name || '').toLowerCase().includes(query) ||
        (o.phone || '').toLowerCase().includes(query) ||
        (o.email || '').toLowerCase().includes(query) ||
        (o.delivery_address || '').toLowerCase().includes(query)
      );
    }

    return list;
  });

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.isLoading.set(true);
    this.orderService.getAllOrders().subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res.success && res.data) {
          this.orders.set(res.data);
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        this.toast.error(err.error?.message || 'Failed to load orders from database');
      }
    });
  }

  onSearchChange(): void {
    // Computed automatically reacts to searchQuery
  }

  onStatusFilterChange(status: string): void {
    this.selectedStatusFilter = status;
  }

  /**
   * Quick status change directly from table select dropdown
   */
  onQuickStatusChange(order: AdminOrder, newStatus: string): void {
    if (order.order_status === newStatus) return;

    this.isUpdating.set(true);
    this.orderService.updateOrderStatus(order.order_id, newStatus).subscribe({
      next: (res) => {
        this.isUpdating.set(false);
        if (res.success) {
          this.toast.success(`Order #${order.order_id} marked as ${newStatus.toUpperCase()}`);
          this.updateOrderInList(order.order_id, { order_status: newStatus });
        }
      },
      error: (err) => {
        this.isUpdating.set(false);
        this.toast.error(err.error?.message || 'Failed to update order status');
      }
    });
  }

  openOrderDetails(order: AdminOrder): void {
    this.selectedOrder.set(order);
    this.editOrderStatus = order.order_status || 'processing';
    this.editPaymentStatus = order.payment_status || 'pending';
  }

  closeOrderDetails(): void {
    this.selectedOrder.set(null);
  }

  saveStatusFromModal(): void {
    const order = this.selectedOrder();
    if (!order) return;

    this.isUpdating.set(true);
    this.orderService.updateOrderStatus(order.order_id, this.editOrderStatus, this.editPaymentStatus).subscribe({
      next: (res) => {
        this.isUpdating.set(false);
        if (res.success) {
          this.toast.success(`Order #${order.order_id} updated successfully!`);
          this.updateOrderInList(order.order_id, {
            order_status: this.editOrderStatus,
            payment_status: this.editPaymentStatus
          });
          if (this.selectedOrder()?.order_id === order.order_id) {
            this.selectedOrder.update(curr => curr ? {
              ...curr,
              order_status: this.editOrderStatus,
              payment_status: this.editPaymentStatus
            } : null);
          }
        }
      },
      error: (err) => {
        this.isUpdating.set(false);
        this.toast.error(err.error?.message || 'Failed to update order');
      }
    });
  }

  deleteOrder(order: AdminOrder, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }

    if (!confirm(`Are you sure you want to delete Order #${order.order_id}? This action cannot be undone.`)) {
      return;
    }

    this.orderService.deleteOrder(order.order_id).subscribe({
      next: (res) => {
        if (res.success) {
          this.toast.success(`Order #${order.order_id} deleted successfully.`);
          this.orders.update(current => current.filter(o => o.order_id !== order.order_id));
          if (this.selectedOrder()?.order_id === order.order_id) {
            this.closeOrderDetails();
          }
        }
      },
      error: (err) => {
        this.toast.error(err.error?.message || 'Failed to delete order');
      }
    });
  }

  private updateOrderInList(orderId: string, partial: Partial<AdminOrder>): void {
    this.orders.update(current =>
      current.map(o => o.order_id === orderId ? { ...o, ...partial } : o)
    );
  }

  openInvoice(orderId: string, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    window.open(`/admin/orders/invoice/${orderId}`, '_blank');
  }

  printInvoice(): void {
    window.print();
  }

  onImageError(event: Event): void {
    (event.target as HTMLImageElement).src = '/icons/logo.jpeg';
  }
}
