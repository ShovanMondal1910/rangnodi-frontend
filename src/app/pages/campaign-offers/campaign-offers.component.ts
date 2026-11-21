import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ToastService } from '../../core/services/toast.service';

interface Offer {
  id: string;
  code: string;
  discount: string;
  title: string;
  description: string;
  validUntil: string;
  minSpend?: string;
  tag: string;
}

@Component({
  selector: 'app-campaign-offers',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './campaign-offers.component.html',
  styleUrl: './campaign-offers.component.css'
})
export class CampaignOffersComponent {
  private readonly toastService = inject(ToastService);

  readonly offers: Offer[] = [
    {
      id: '1',
      code: 'JAMDANI15',
      discount: '15% OFF',
      title: 'First Order Celebration',
      description: 'Enjoy 15% discount on all authentic handloom Jamdani sarees and stoles on your first purchase.',
      validUntil: 'Valid till 31 Dec 2026',
      minSpend: 'Min spend ৳1,500',
      tag: 'New Customer'
    },
    {
      id: '2',
      code: 'FREESHIP',
      discount: 'FREE DELIVERY',
      title: 'Nationwide Free Shipping',
      description: 'Complimentary safe door-to-door shipping across all 64 districts in Bangladesh.',
      validUntil: 'Ongoing Campaign',
      minSpend: 'Orders over ৳2,000',
      tag: 'Nationwide'
    },
    {
      id: '3',
      code: 'CRAFTCOMBO',
      discount: '৳300 OFF',
      title: 'Handmade Accessories Combo',
      description: 'Get flat ৳300 off when ordering any matching Jewellery and Handcrafted Bag combo.',
      validUntil: 'Limited Time Offer',
      minSpend: 'Min spend ৳2,500',
      tag: 'Accessories Special'
    },
    {
      id: '4',
      code: 'FESTIVE20',
      discount: '20% OFF',
      title: 'Festive Artisan Collection',
      description: 'Special festive pricing on our exclusive collector series wallets, coin pouches, and gift boxes.',
      validUntil: 'Seasonal Special',
      minSpend: 'Min spend ৳3,000',
      tag: 'Festive'
    }
  ];

  copyCode(code: string): void {
    navigator.clipboard.writeText(code).then(() => {
      this.toastService.success(`Promo code "${code}" copied to clipboard!`);
    }).catch(() => {
      this.toastService.info(`Promo code: ${code}`);
    });
  }
}
