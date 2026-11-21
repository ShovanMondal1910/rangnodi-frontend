import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-contact-us',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './contact-us.component.html',
  styleUrl: './contact-us.component.css'
})
export class ContactUsComponent {
  private readonly toastService = inject(ToastService);

  name: string = '';
  email: string = '';
  phone: string = '';
  subject: string = '';
  message: string = '';
  submitted: boolean = false;

  onSubmit(): void {
    if (!this.name.trim() || !this.email.trim() || !this.message.trim()) {
      this.toastService.error('Please fill in your name, email, and message.');
      return;
    }

    this.submitted = true;
    this.toastService.success('Thank you! Your message has been received. Our team will contact you shortly.');

    this.name = '';
    this.email = '';
    this.phone = '';
    this.subject = '';
    this.message = '';
  }
}
