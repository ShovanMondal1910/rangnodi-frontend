import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

interface FaqItem {
  id: string;
  category: string;
  question: string;
  answer: string;
  isOpen?: boolean;
}

@Component({
  selector: 'app-faq',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './faq.component.html',
  styleUrl: './faq.component.css'
})
export class FaqComponent {
  searchQuery: string = '';
  selectedCategory: string = 'All';

  readonly categories: string[] = ['All', 'Jamdani & Craft', 'Orders & Payment', 'Delivery', 'Return & Exchange'];

  readonly faqs: FaqItem[] = [
    {
      id: '1',
      category: 'Jamdani & Craft',
      question: 'Are all Jamdani products genuine Bangladeshi handloom?',
      answer: 'Yes, 100%. All our Jamdani sarees, dupattas, and stoles are woven on traditional pit looms by heritage artisan families in the Narayanganj and Shitalakshya river basin regions. Each piece comes with our authenticity assurance guarantee.',
      isOpen: true
    },
    {
      id: '2',
      category: 'Jamdani & Craft',
      question: 'What materials are used in your handmade accessories?',
      answer: 'Our bags, wallets, coin pouches, and jewellery incorporate genuine traditional handwoven fabrics, authentic brass/metal fittings, sustainable jute, and genuine leather trims crafted by local artisans.',
      isOpen: false
    },
    {
      id: '3',
      category: 'Orders & Payment',
      question: 'What payment methods do you accept?',
      answer: 'We support Cash on Delivery (COD) nationwide across Bangladesh, as well as digital payments including bKash, Nagad, Rocket, Visa, Mastercard, and American Express.',
      isOpen: false
    },
    {
      id: '4',
      category: 'Delivery',
      question: 'How long does nationwide shipping take?',
      answer: 'Within Dhaka city, orders are delivered in 24–48 hours. For all other 63 districts, standard delivery takes 2–4 business days via verified courier partners with door-to-door tracking.',
      isOpen: false
    },
    {
      id: '5',
      category: 'Delivery',
      question: 'How much are the delivery charges?',
      answer: 'Inside Dhaka delivery is ৳60–80. Outside Dhaka is ৳120–150. We also offer Free Nationwide Shipping on orders over ৳2,000!',
      isOpen: false
    },
    {
      id: '6',
      category: 'Return & Exchange',
      question: 'What is your exchange and return policy?',
      answer: 'If you receive an item with any manufacturing flaw or mismatch, you can request an exchange within 7 days of delivery. The item must be in its original unworn condition with tags attached.',
      isOpen: false
    },
    {
      id: '7',
      category: 'Orders & Payment',
      question: 'Can I request bespoke or custom Jamdani colorways?',
      answer: 'Yes! We coordinate directly with weaver clusters for custom orders and special bridal sets. Please reach out to our WhatsApp concierge (+880 1758-814652) for custom requirements.',
      isOpen: false
    }
  ];

  toggleFaq(item: FaqItem): void {
    item.isOpen = !item.isOpen;
  }

  get filteredFaqs(): FaqItem[] {
    return this.faqs.filter(faq => {
      const matchesCategory = this.selectedCategory === 'All' || faq.category === this.selectedCategory;
      const q = this.searchQuery.toLowerCase().trim();
      const matchesQuery = !q || faq.question.toLowerCase().includes(q) || faq.answer.toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  }
}
