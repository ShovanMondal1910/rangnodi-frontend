import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';

interface PolicyData {
  title: string;
  category: string;
  lastUpdated: string;
  summary: string;
  sections: { heading: string; paragraphs: string[] }[];
}

@Component({
  selector: 'app-policy-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './policy-page.component.html',
  styleUrl: './policy-page.component.css'
})
export class PolicyPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);

  policyKey: string = 'privacy';
  policyData: PolicyData = {
    title: 'Privacy Policy',
    category: 'Legal & Security',
    lastUpdated: 'November 2026',
    summary: 'How Rangnodi collects, protects, and handles your personal information with full transparency and security.',
    sections: [
      {
        heading: '1. Information We Collect',
        paragraphs: [
          'We collect information you provide directly to us when placing an order, creating an account, or communicating with our team. This includes your name, shipping address, phone number, and email address.',
          'Payment credentials (e.g. card details, bKash PINs) are processed directly by certified payment gateways; Rangnodi never stores sensitive card or PIN data on our servers.'
        ]
      },
      {
        heading: '2. How We Use Your Information',
        paragraphs: [
          'Your information is strictly used to process, fulfill, and ship your handcrafted orders, provide real-time tracking, and send important service notifications.',
          'We will never sell or rent your personal information to third-party marketing brokers.'
        ]
      },
      {
        heading: '3. Data Security',
        paragraphs: [
          'We employ industry-standard SSL encryption and secure cloud database safeguards to protect all personal information collected through our web storefront.'
        ]
      }
    ]
  };

  ngOnInit(): void {
    this.route.data.subscribe(data => {
      const type = data['type'] || 'privacy';
      this.loadPolicy(type);
    });
  }

  loadPolicy(type: string): void {
    this.policyKey = type;
    switch (type) {
      case 'warranty':
        this.policyData = {
          title: 'Handloom & Craft Warranty Policy',
          category: 'Quality Assurance',
          lastUpdated: 'November 2026',
          summary: 'Our guarantee of 100% authentic handloom Jamdani weaving and master craft integrity.',
          sections: [
            {
              heading: '1. Authenticity Guarantee',
              paragraphs: [
                'Every Jamdani item sold by Rangnodi is certified authentic Bangladeshi handloom, woven by skilled artisan clusters along the traditional Shitalakshya river basin.',
                'Because handloom is an organic manual craft, minor weave variations or irregular motif spacing are natural hallmarks of authentic hand-spun textiles, not defects.'
              ]
            },
            {
              heading: '2. Craftsmanship Protection',
              paragraphs: [
                'We guarantee that our handmade accessories (jewellery, bags, wallets, coin pouches) are free from material defects in stitching and hardware for 30 days from purchase.'
              ]
            }
          ]
        };
        break;

      case 'exchange-return':
        this.policyData = {
          title: 'Exchange & Return Policy',
          category: 'Customer Support',
          lastUpdated: 'November 2026',
          summary: 'Simple, hassle-free returns and exchanges within 7 days of delivery across Bangladesh.',
          sections: [
            {
              heading: '1. Eligibility for Returns & Exchanges',
              paragraphs: [
                'You may request an exchange or return within 7 calendar days of receiving your parcel if the item arrives damaged, flawed, or differs from your order.',
                'Items must be unworn, unwashed, unaltered, and retained with all original tags, accessories, and packaging intact.'
              ]
            },
            {
              heading: '2. Return Process',
              paragraphs: [
                'Contact our WhatsApp support team at +880 1758-814652 or email rongnodi.shop@gmail.com with your Order ID and photos of the item. We will arrange a courier pickup or exchange parcel.'
              ]
            }
          ]
        };
        break;

      case 'delivery':
        this.policyData = {
          title: 'Nationwide Delivery Policy',
          category: 'Shipping & Logistics',
          lastUpdated: 'November 2026',
          summary: 'Fast, secure doorstep delivery across all 64 districts in Bangladesh.',
          sections: [
            {
              heading: '1. Delivery Timelines',
              paragraphs: [
                'Inside Dhaka: 24 to 48 business hours.',
                'Outside Dhaka (all other 63 districts): 2 to 4 business days via our verified courier partners (Steadfast, RedX, Pathao).'
              ]
            },
            {
              heading: '2. Shipping Charges',
              paragraphs: [
                'Inside Dhaka: ৳60–৳80 standard rate.',
                'Outside Dhaka: ৳120–৳150 standard rate.',
                'Free Delivery: Available nationwide on orders of ৳2,000 or more!'
              ]
            }
          ]
        };
        break;

      case 'refund':
        this.policyData = {
          title: 'Refund Policy',
          category: 'Payment Protection',
          lastUpdated: 'November 2026',
          summary: 'Transparent, prompt refunds for approved returns or cancelled pre-payments.',
          sections: [
            {
              heading: '1. Refund Methods & Timelines',
              paragraphs: [
                'bKash / Nagad / MFS refunds are processed within 2–3 business days after the returned item is inspected at our workshop.',
                'Debit/Credit card refunds are initiated within 3–5 business days, subject to your issuing bank’s settlement cycle.'
              ]
            }
          ]
        };
        break;

      case 'terms':
        this.policyData = {
          title: 'Terms of Service',
          category: 'Legal Terms',
          lastUpdated: 'November 2026',
          summary: 'The terms and guidelines governing your use and purchases on the Rangnodi web storefront.',
          sections: [
            {
              heading: '1. Storefront Use & Pricing',
              paragraphs: [
                'All prices listed are in Bangladeshi Taka (BDT) and include all applicable taxes unless specifically noted.',
                'Rangnodi reserves the right to modify promotional pricing, campaign voucher rules, and stock availability at any time.'
              ]
            },
            {
              heading: '2. Intellectual Property',
              paragraphs: [
                'All photographs, brand marks, motifs, and editorial content on Rangnodi are the exclusive intellectual property of Rangnodi and our artisan partners.'
              ]
            }
          ]
        };
        break;

      default:
        // default privacy
        break;
    }
  }
}
