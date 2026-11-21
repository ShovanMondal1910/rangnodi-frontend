import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  readTime: string;
  date: string;
  author: string;
}

@Component({
  selector: 'app-blogs',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './blogs.component.html',
  styleUrl: './blogs.component.css'
})
export class BlogsComponent {
  readonly posts: BlogPost[] = [
    {
      id: '1',
      title: 'The Art of Jamdani: Centuries of Intangible Handloom Mastery',
      excerpt: 'Explore the fascinating history of Jamdani weaving along the Shitalakshya river, where master weavers craft geometric motifs entirely by hand without mechanical guides.',
      category: 'Textile Heritage',
      readTime: '5 min read',
      date: 'Nov 18, 2026',
      author: 'Rangnodi Curators'
    },
    {
      id: '2',
      title: 'Digital Handcrafts: How E-Commerce Empowers Rural Artisans',
      excerpt: 'Discover how modern web technologies and transparent supply chains are delivering fair wages and global appreciation to grassroots Bangladeshi weavers.',
      category: 'Tech & Craft',
      readTime: '4 min read',
      date: 'Nov 12, 2026',
      author: 'Tech & Culture Desk'
    },
    {
      id: '3',
      title: 'Caring for Handcrafted Jewellery, Leather & Fabric Accessories',
      excerpt: 'Essential tips and care routines to maintain the luster, patina, and durability of your bespoke handmade bags, wallets, and ethnic jewellery items.',
      category: 'Care Guide',
      readTime: '3 min read',
      date: 'Nov 05, 2026',
      author: 'Master Craftsman'
    },
    {
      id: '4',
      title: 'Contemporary Styling: Incorporating Traditional Weaves in Modern Daily Wear',
      excerpt: 'From boardroom chic to festive gatherings, here is how modern Bangladeshi youth are styling authentic handwoven Jamdani and ethnic accessories.',
      category: 'Style & Trends',
      readTime: '6 min read',
      date: 'Oct 28, 2026',
      author: 'Editorial Team'
    }
  ];
}
