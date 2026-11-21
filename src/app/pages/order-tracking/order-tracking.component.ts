import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

interface TrackingResult {
  orderId: string;
  customerName: string;
  orderDate: string;
  status: string;
  currentStep: number;
  estimatedDelivery: string;
  courier: string;
  steps: { label: string; date?: string; done: boolean; active: boolean }[];
}

@Component({
  selector: 'app-order-tracking',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './order-tracking.component.html',
  styleUrl: './order-tracking.component.css'
})
export class OrderTrackingComponent {
  orderIdInput: string = '';
  phoneInput: string = '';
  searched: boolean = false;
  trackingResult: TrackingResult | null = null;
  errorMessage: string = '';

  trackOrder(): void {
    if (!this.orderIdInput.trim()) {
      this.errorMessage = 'Please enter a valid Order ID.';
      return;
    }

    this.errorMessage = '';
    this.searched = true;

    // Simulate looking up order
    const id = this.orderIdInput.trim().toUpperCase();
    this.trackingResult = {
      orderId: id.startsWith('RNG') ? id : `RNG-${id}`,
      customerName: 'Valued Rangnodi Customer',
      orderDate: 'Nov 19, 2026',
      status: 'In Transit',
      currentStep: 3,
      estimatedDelivery: 'Nov 22, 2026',
      courier: 'Steadfast Courier / RedX',
      steps: [
        { label: 'Order Placed & Verified', date: 'Nov 19, 10:30 AM', done: true, active: false },
        { label: 'Artisan Inspection & Handcrafted Packing', date: 'Nov 19, 04:15 PM', done: true, active: false },
        { label: 'Handed Over to Courier (In Transit)', date: 'Nov 20, 11:00 AM', done: true, active: true },
        { label: 'Out for Delivery', date: 'Pending', done: false, active: false },
        { label: 'Delivered', date: 'Pending', done: false, active: false }
      ]
    };
  }
}
