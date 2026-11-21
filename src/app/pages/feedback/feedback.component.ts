import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-feedback',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './feedback.component.html',
  styleUrl: './feedback.component.css'
})
export class FeedbackComponent {
  private readonly toastService = inject(ToastService);

  category: string = 'Product Quality';
  rating: number = 5;
  orderId: string = '';
  fullName: string = '';
  phone: string = '';
  email: string = '';
  comment: string = '';

  setRating(val: number): void {
    this.rating = val;
  }

  submitFeedback(): void {
    if (!this.comment.trim() || !this.fullName.trim()) {
      this.toastService.error('Please provide your name and your feedback comments.');
      return;
    }

    this.toastService.success('Thank you! Your feedback has been forwarded to our quality control team.');
    this.orderId = '';
    this.fullName = '';
    this.phone = '';
    this.email = '';
    this.comment = '';
    this.rating = 5;
  }
}
