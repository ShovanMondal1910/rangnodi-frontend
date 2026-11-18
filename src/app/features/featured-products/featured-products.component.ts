import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ProductService } from '../../core/services/product.service';
import { ToastService } from '../../core/services/toast.service';
import { CartService } from '../../core/services/cart.service';
import { ProductResponse } from '../../core/models/product.models';
import { HeroSliderComponent } from '../hero-slider/hero-slider.component';

@Component({
  selector: 'app-featured-products',
  standalone: true,
  imports: [CommonModule, RouterLink, DecimalPipe, HeroSliderComponent],
  templateUrl: './featured-products.component.html',
  styleUrls: ['./featured-products.component.css'],
})
export class FeaturedProductsComponent implements OnInit {
  private readonly productService = inject(ProductService);
  private readonly toastService = inject(ToastService);
  private readonly cartService = inject(CartService);

  featuredProducts = signal<ProductResponse[]>([]);
  isLoading = signal<boolean>(true);

  ngOnInit(): void {
    this.loadFeaturedProducts();
  }

  loadFeaturedProducts(): void {
    this.isLoading.set(true);
    this.productService.getProducts({ is_featured: true, status: 'active' }).subscribe({
      next: (products) => {
        this.featuredProducts.set(products);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load featured products:', err);
        this.isLoading.set(false);
        this.toastService.error('Failed to load featured products from database');
      }
    });
  }

  addToCart(product: ProductResponse, event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    this.cartService.addToCart(product, 1);
  }

  getProductImageUrl(product: ProductResponse): string {
    if (product.has_main_image) {
      return `/api/v1/products/${product.product_id}/main-image`;
    }
    return '/icons/logo.jpeg';
  }

  onImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    if (target) {
      target.src = '/icons/logo.jpeg';
    }
  }
}
