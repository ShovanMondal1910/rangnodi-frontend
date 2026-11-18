import {
  Component,
  OnInit,
  OnDestroy,
  signal,
  computed,
  PLATFORM_ID,
  inject
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';

export interface HeroSlide {
  id: number;
  image: string;
  alt: string;
  badge?: string;
  title?: string;
  subtitle?: string;
  ctaText?: string;
  ctaLink: string;
}

@Component({
  selector: 'app-hero-slider',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './hero-slider.component.html',
  styleUrls: ['./hero-slider.component.css']
})
export class HeroSliderComponent implements OnInit, OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  private timer: any = null;

  readonly slides: HeroSlide[] = [
    {
      id: 1,
      image: '/hero/Ivn2Xz6RpiVcipmIgxn5LsU2CrVGsRcxpqdofsmW.webp',
      alt: 'Rangnodi Festive & Heritage Collection',
      badge: 'NEW ARRIVALS 2026',
      title: 'The Festive & Heritage Edit',
      subtitle: 'Handcrafted luxury panjabis and ethnic silhouettes designed for celebrations of culture and distinction.',
      ctaText: 'SHOP COLLECTION',
      ctaLink: '/catalog'
    },
    {
      id: 2,
      image: '/hero/2EdkGodKhbVENelEIjxJF11ZHCTpDLrJupUWuyHG.webp',
      alt: 'Artisanal Festive Wear',
      badge: 'EXCLUSIVE AT RANGNODI',
      title: 'Crafted for Distinction',
      subtitle: 'Finest combed cottons and artisanal motif embroidery tailored for effortless modern elegance.',
      ctaText: 'EXPLORE PANJABIS',
      ctaLink: '/catalog'
    },
    {
      id: 3,
      image: '/hero/QiNsIhrPu5Kwg3Sbmt0S10rpCs2r1XsiqQzFV8Aw.webp',
      alt: 'Season Festive Drops',
      badge: 'SEASON SPECIAL',
      title: 'Tradition Meets Comfort',
      subtitle: 'Breathable weaves and statement aesthetics for every celebration and festive gathering.',
      ctaText: 'DISCOVER DROPS',
      ctaLink: '/catalog'
    }
  ];

  readonly currentIndex = signal<number>(0);
  readonly isPaused = signal<boolean>(false);

  // Touch swipe tracking
  private touchStartX = 0;
  private touchEndX = 0;

  ngOnInit(): void {
    this.startAutoplay();
  }

  ngOnDestroy(): void {
    this.stopAutoplay();
  }

  startAutoplay(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.stopAutoplay();
    this.timer = setInterval(() => {
      this.nextSlide();
    }, 2000); // Automatically transitions every 2 seconds
  }

  stopAutoplay(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  nextSlide(): void {
    this.currentIndex.update((idx) => (idx + 1) % this.slides.length);
  }

  prevSlide(): void {
    this.currentIndex.update((idx) => (idx - 1 + this.slides.length) % this.slides.length);
  }

  goToSlide(index: number): void {
    if (index >= 0 && index < this.slides.length) {
      this.currentIndex.set(index);
    }
  }

  onMouseEnter(): void {
    this.isPaused.set(true);
  }

  onMouseLeave(): void {
    this.isPaused.set(false);
  }

  onTouchStart(e: TouchEvent): void {
    this.touchStartX = e.changedTouches[0].screenX;
  }

  onTouchEnd(e: TouchEvent): void {
    this.touchEndX = e.changedTouches[0].screenX;
    this.handleSwipe();
  }

  private handleSwipe(): void {
    const diff = this.touchStartX - this.touchEndX;
    const threshold = 40; // minimum swipe distance in px
    if (Math.abs(diff) > threshold) {
      if (diff > 0) {
        this.nextSlide();
      } else {
        this.prevSlide();
      }
    }
  }
}
