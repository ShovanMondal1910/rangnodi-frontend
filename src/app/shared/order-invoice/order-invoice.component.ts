import { Component, OnInit, Input, inject, signal } from '@angular/core';
import { CommonModule, DecimalPipe, DatePipe, Location } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AdminOrder } from '../../core/services/admin-order.service';

@Component({
  selector: 'app-order-invoice',
  standalone: true,
  imports: [CommonModule, RouterModule, DecimalPipe, DatePipe],
  templateUrl: './order-invoice.component.html',
  styleUrl: './order-invoice.component.css'
})
export class OrderInvoiceComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly http = inject(HttpClient);

  // Can be passed via @Input if rendered inside a modal/drawer
  @Input() orderInput: AdminOrder | null = null;

  order = signal<AdminOrder | null>(null);
  isLoading = signal<boolean>(false);
  errorMessage = signal<string>('');

  ngOnInit(): void {
    if (this.orderInput) {
      this.order.set(this.orderInput);
      return;
    }

    // Otherwise check route parameters
    const orderId = this.route.snapshot.paramMap.get('id');
    if (orderId) {
      this.fetchOrder(orderId);
    }
  }

  fetchOrder(orderId: string): void {
    this.isLoading.set(true);
    this.http.get<{ success: boolean; data: AdminOrder }>(`/api/v1/orders/${orderId}`).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res.success && res.data) {
          this.order.set(res.data);
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.message || 'Invoice not found or failed to load');
      }
    });
  }

  print(): void {
    window.print();
  }

  goBack(): void {
    const isCustomer = !this.router.url.includes('/admin');
    const targetRoute = isCustomer ? '/profile' : '/admin/orders';
    const queryParams = isCustomer ? { tab: 'orders' } : undefined;

    // If this tab was opened via window.open / target="_blank"
    if (window.opener && !window.opener.closed) {
      try {
        window.close();
      } catch (e) {
        // Fallback to router navigation if closing is blocked
      }
    }

    if (window.history.length > 1 && document.referrer && document.referrer.includes(window.location.host)) {
      this.location.back();
    } else {
      this.router.navigate([targetRoute], { queryParams });
    }
  }

  onImageError(event: Event): void {
    (event.target as HTMLImageElement).src = '/icons/logo.jpeg';
  }
}
