import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ProductService } from '../../../core/services/product.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-product-details',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './product-details.component.html',
  styleUrls: ['./product-details.component.css']
})
export class ProductDetailsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly productService = inject(ProductService);
  private readonly toast = inject(ToastService);

  // Core State Signals
  readonly product = signal<any | null>(null);
  readonly isLoading = signal<boolean>(true);
  readonly hasError = signal<boolean>(false);

  // Gallery Presentation Signals
  readonly activeImage = signal<string>('');
  readonly galleryList = signal<string[]>([]);
  readonly isZoomOpen = signal<boolean>(false);

  // Variant Selections
  readonly selectedColor = signal<string>('Red');
  readonly selectedSize = signal<string>('S');
  readonly quantity = signal<number>(1);
  readonly isWishlisted = signal<boolean>(false);

  // Accordion Sections State ('details' | 'sizeGuide' | 'storeAvailability' | null)
  readonly openAccordion = signal<string | null>(null);

  // Variant selections computed directly from database records
  readonly availableColors = computed(() => {
    const dbColors = this.product()?.colors;
    if (Array.isArray(dbColors) && dbColors.length > 0) {
      return dbColors;
    }
    return [];
  });

  readonly availableSizes = computed(() => {
    const dbSizes = this.product()?.sizes;
    if (Array.isArray(dbSizes) && dbSizes.length > 0) {
      return dbSizes;
    }
    return [];
  });

  // Price calculations
  readonly regularPrice = computed(() => {
    const p = this.product();
    return p?.regular_price ? Number(p.regular_price) : 0;
  });

  readonly salePrice = computed(() => {
    const p = this.product();
    return p?.sale_price ? Number(p.sale_price) : null;
  });

  readonly discountPercent = computed(() => {
    const reg = this.regularPrice();
    const sale = this.salePrice();
    if (reg > 0 && sale !== null && sale < reg) {
      return Math.round(((reg - sale) / reg) * 100);
    }
    return 0;
  });

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.loadProductDetails(id);
      } else {
        this.hasError.set(true);
        this.isLoading.set(false);
      }
    });
  }

  loadProductDetails(id: string): void {
    this.isLoading.set(true);
    this.hasError.set(false);

    this.productService.getProductById(id).subscribe({
      next: (data) => {
        this.product.set(data);
        this.isLoading.set(false);

        // Prepare gallery thumbnails list from database
        const images: string[] = [];
        if (data.has_main_image) {
          images.push(`/api/v1/products/${data.product_id}/main-image`);
        }

        if (Array.isArray(data.gallery_images) && data.gallery_images.length > 0) {
          data.gallery_images.forEach((g: any) => {
            if (g.image_url && !images.includes(g.image_url)) {
              images.push(g.image_url);
            }
          });
        }

        if (images.length === 0) {
          images.push('/icons/logo.jpeg');
        }

        this.galleryList.set(images);
        this.activeImage.set(images[0]);

        // Variant selections from database
        const colors = this.availableColors();
        this.selectedColor.set(colors.length > 0 ? colors[0] : '');

        const sizes = this.availableSizes();
        this.selectedSize.set(sizes.length > 0 ? sizes[0] : '');
      },
      error: (err) => {
        console.error('Failed to load product details', err);
        this.hasError.set(true);
        this.isLoading.set(false);
        this.toast.error('Failed to load product details.');
      }
    });
  }

  selectThumbnail(imgUrl: string): void {
    this.activeImage.set(imgUrl);
  }

  selectColor(color: string): void {
    this.selectedColor.set(color);
  }

  selectSize(size: string): void {
    this.selectedSize.set(size);
  }

  toggleAccordion(section: string): void {
    if (this.openAccordion() === section) {
      this.openAccordion.set(null);
    } else {
      this.openAccordion.set(section);
    }
  }

  toggleWishlist(): void {
    this.isWishlisted.update(v => !v);
    if (this.isWishlisted()) {
      this.toast.success(`Saved "${this.product()?.title}" to your Wishlist!`);
    } else {
      this.toast.info(`Removed "${this.product()?.title}" from Wishlist.`);
    }
  }

  addToBag(): void {
    const p = this.product();
    if (!p) return;
    this.toast.success(
      `Added "${p.title}" (Color: ${this.selectedColor()}, Size: ${this.selectedSize()}) to your Bag!`
    );
  }

  buyNow(): void {
    const p = this.product();
    if (!p) return;
    this.toast.success(
      `Proceeding to checkout with "${p.title}" (Color: ${this.selectedColor()}, Size: ${this.selectedSize()})!`
    );
  }

  shareProduct(): void {
    const url = window.location.href;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        this.toast.info('Product link copied to clipboard!');
      }).catch(() => {
        this.toast.info('Share URL: ' + url);
      });
    } else {
      this.toast.info('Share URL: ' + url);
    }
  }

  toggleZoom(state: boolean): void {
    this.isZoomOpen.set(state);
  }

  onImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    if (target) {
      target.src = '/icons/logo.jpeg';
    }
  }
}
