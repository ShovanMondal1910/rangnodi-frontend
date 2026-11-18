import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subject, Subscription, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { CatalogService } from '../../../core/services/catalog.service';
import { ProductService } from '../../../core/services/product.service';
import { ToastService } from '../../../core/services/toast.service';
import {
  CategoryHierarchyItem,
  Subcategory,
} from '../../../core/models/catalog.models';
import {
  CreateProductPayload,
  GalleryImageItem,
  ProductResponse,
  ProductStatus,
  StockStatus,
} from '../../../core/models/product.models';

interface ExistingGalleryImage {
  image_id: string;
  image_url: string;
  sort_order: number;
}

@Component({
  selector: 'app-edit-product',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './edit-product.component.html',
  styleUrl: './edit-product.component.css',
})
export class EditProductComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly catalogService = inject(CatalogService);
  private readonly productService = inject(ProductService);
  private readonly toast = inject(ToastService);

  // State Signals
  readonly isLoading = signal<boolean>(false);
  readonly isSaving = signal<boolean>(false);
  readonly isDeleting = signal<boolean>(false);
  readonly categories = signal<CategoryHierarchyItem[]>([]);

  // Search Bar Signals
  readonly searchQuery = signal<string>('');
  readonly searchResults = signal<ProductResponse[]>([]);
  readonly isSearching = signal<boolean>(false);
  readonly showSearchDropdown = signal<boolean>(false);
  readonly recentProducts = signal<ProductResponse[]>([]);

  private readonly searchSubject = new Subject<string>();
  private searchSub?: Subscription;
  private routeSub?: Subscription;

  productId = '';

  // Category & Subcategory selection state
  readonly selectedCategoryId = signal<string>('');
  readonly selectedGroupName = signal<string>('');
  readonly selectedSubcategoryId = signal<string>('');

  // Form State
  title = '';
  slug = '';
  sku = '';
  brand = 'Rangnodi';
  shortDescription = '';
  description = '';

  // Pricing & Inventory
  regularPrice: number | null = null;
  salePrice: number | null = null;
  warehouseStockQty = 10;
  lowStockAlert = 5;
  stockStatus: StockStatus = 'in_stock';
  maxPurchaseLimit = 5;
  weightKg = 0.5;

  // Variants, Sizes & Tags
  availableSizes = '';
  colorOptions = '';
  searchKeywords = '';
  warrantyPeriod = '7-Day Easy Replacement';

  // Visibility & Policies
  publishStatus: ProductStatus = 'active';
  cardBadge: string = '';
  isFeatured = false;
  freeShipping = false;
  cashOnDelivery = true;
  flashDealExpiration = '';

  // Image handling
  mainImageFile: File | null = null;
  mainImagePreview = signal<string | null>(null);
  mainImageBase64: string | null | undefined = undefined; // undefined means unchanged
  mainImageMime = 'image/jpeg';
  isMainImageDragging = signal<boolean>(false);

  // Existing gallery images in DB
  existingGalleryImages = signal<ExistingGalleryImage[]>([]);

  // Newly added gallery images (not yet in DB)
  newGalleryImages = signal<GalleryImageItem[]>([]);
  isGalleryDragging = signal<boolean>(false);

  private isSlugManuallyEdited = false;

  ngOnInit(): void {
    this.initSearchPipeline();
    this.loadCatalogHierarchy();
    this.loadRecentProducts();

    this.routeSub = this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) {
        this.productId = id;
        this.loadProductDetails();
      } else {
        this.productId = '';
        this.isLoading.set(false);
      }
    });
  }

  ngOnDestroy(): void {
    this.searchSub?.unsubscribe();
    this.routeSub?.unsubscribe();
  }

  // Setup debounce search pipeline
  private initSearchPipeline(): void {
    this.searchSub = this.searchSubject
      .pipe(
        debounceTime(250),
        distinctUntilChanged(),
        switchMap((query) => {
          if (!query.trim()) {
            this.isSearching.set(false);
            return [];
          }
          this.isSearching.set(true);
          return this.productService.getProducts({ search: query.trim() });
        })
      )
      .subscribe({
        next: (items) => {
          this.searchResults.set(items);
          this.isSearching.set(false);
          this.showSearchDropdown.set(true);
        },
        error: () => {
          this.isSearching.set(false);
        },
      });
  }

  onSearchChange(term: string): void {
    this.searchQuery.set(term);
    if (!term.trim()) {
      this.searchResults.set([]);
      this.showSearchDropdown.set(false);
    } else {
      this.searchSubject.next(term);
    }
  }

  onSearchFocus(): void {
    if (this.searchResults().length > 0) {
      this.showSearchDropdown.set(true);
    }
  }

  closeSearchDropdown(): void {
    setTimeout(() => {
      this.showSearchDropdown.set(false);
    }, 200);
  }

  selectProduct(p: ProductResponse): void {
    this.showSearchDropdown.set(false);
    this.searchQuery.set('');
    this.router.navigate(['/products/edit', p.product_id]);
  }

  loadRecentProducts(): void {
    this.productService.getProducts().subscribe({
      next: (prods) => {
        this.recentProducts.set(prods.slice(0, 8));
      },
    });
  }

  loadCatalogHierarchy(): void {
    this.catalogService.getHierarchy('active').subscribe({
      next: (cats) => {
        this.categories.set(cats);
      },
      error: () => {
        this.toast.error('Failed to load category hierarchy');
      },
    });
  }

  loadProductDetails(): void {
    if (!this.productId) return;
    this.isLoading.set(true);
    this.productService.getProductById(this.productId).subscribe({
      next: (product) => {
        this.isLoading.set(false);
        if (!product) {
          this.toast.error('Product not found');
          this.productId = '';
          return;
        }

        // Fill form
        this.title = product.title || '';
        this.slug = product.slug || '';
        this.sku = product.sku || '';
        this.brand = product.brand || 'Rangnodi';
        this.shortDescription = product.short_description || '';
        this.description = product.description || '';

        this.selectedCategoryId.set(product.category_id || '');
        this.selectedGroupName.set(product.subcategory_group || '');
        this.selectedSubcategoryId.set(product.subcategory_id || '');

        this.regularPrice = product.regular_price ? Number(product.regular_price) : null;
        this.salePrice = product.sale_price ? Number(product.sale_price) : null;
        this.warehouseStockQty = product.stock_quantity ?? 10;
        this.lowStockAlert = product.low_stock_threshold ?? 5;
        this.stockStatus = product.stock_status || 'in_stock';
        this.maxPurchaseLimit = product.max_purchase_limit ?? 5;
        this.weightKg = product.weight_kg ? Number(product.weight_kg) : 0.5;

        this.availableSizes = Array.isArray(product.sizes) ? product.sizes.join(', ') : '';
        this.colorOptions = Array.isArray(product.colors) ? product.colors.join(', ') : '';
        this.searchKeywords = Array.isArray(product.tags) ? product.tags.join(', ') : '';
        this.warrantyPeriod = product.warranty_period || '7-Day Easy Replacement';

        this.publishStatus = product.status || 'active';
        this.cardBadge = product.badge || '';
        this.isFeatured = Boolean(product.is_featured);
        this.freeShipping = Boolean(product.free_shipping);
        this.cashOnDelivery = Boolean(product.is_cod_available);

        if (product.flash_deal_end) {
          const d = new Date(product.flash_deal_end);
          this.flashDealExpiration = d.toISOString().slice(0, 16);
        } else {
          this.flashDealExpiration = '';
        }

        // Main Image
        if (product.has_main_image && product.main_image_url) {
          this.mainImagePreview.set(product.main_image_url);
        } else {
          this.mainImagePreview.set(null);
        }
        this.mainImageBase64 = undefined;

        // Gallery Images
        if (Array.isArray(product.gallery_images)) {
          this.existingGalleryImages.set(product.gallery_images);
        } else {
          this.existingGalleryImages.set([]);
        }
        this.newGalleryImages.set([]);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.toast.error(err.error?.message || 'Failed to load product details');
      },
    });
  }

  // Computed helper for currently selected category
  readonly selectedCategory = computed(() => {
    const catId = this.selectedCategoryId();
    return this.categories().find((c) => c.category_id === catId) || null;
  });

  // Computed distinct group names for selected category
  readonly availableGroupNames = computed(() => {
    const cat = this.selectedCategory();
    if (!cat || !cat.subcategories) return [];
    const groups = new Set<string>();
    cat.subcategories.forEach((s) => {
      if (s.group_name && s.group_name.trim()) {
        groups.add(s.group_name.trim());
      }
    });
    return Array.from(groups);
  });

  // Computed subcategories filtered by selected group (or all in category)
  readonly availableSubcategories = computed(() => {
    const cat = this.selectedCategory();
    if (!cat || !cat.subcategories) return [];
    const group = this.selectedGroupName();
    if (!group) return cat.subcategories;
    return cat.subcategories.filter((s) => s.group_name === group);
  });

  onCategoryChange(catId: string): void {
    this.selectedCategoryId.set(catId);
    this.selectedGroupName.set('');
    this.selectedSubcategoryId.set('');

    const groups = this.availableGroupNames();
    if (groups.length > 0) {
      this.selectedGroupName.set(groups[0]);
    }
    const subs = this.availableSubcategories();
    if (subs.length > 0) {
      this.selectedSubcategoryId.set(subs[0].subcategory_id);
    }
  }

  onGroupChange(groupName: string): void {
    this.selectedGroupName.set(groupName);
    this.selectedSubcategoryId.set('');
    const subs = this.availableSubcategories();
    if (subs.length > 0) {
      this.selectedSubcategoryId.set(subs[0].subcategory_id);
    }
  }

  onTitleInput(): void {
    if (!this.isSlugManuallyEdited) {
      this.slug = this.slugify(this.title);
    }
  }

  onSlugManualEdit(): void {
    this.isSlugManuallyEdited = true;
  }

  generateSku(): void {
    const categoryName = this.selectedCategory()?.name || 'GEN';
    this.productService.generateSku(categoryName).subscribe({
      next: (generatedSku) => {
        this.sku = generatedSku;
      },
      error: () => {
        this.sku = `RNG-${categoryName.slice(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
      },
    });
  }

  // Main Image Handling
  onMainImageSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.processMainFile(input.files[0]);
    }
  }

  onMainImageDrop(event: DragEvent): void {
    event.preventDefault();
    this.isMainImageDragging.set(false);
    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      this.processMainFile(event.dataTransfer.files[0]);
    }
  }

  onMainImageDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isMainImageDragging.set(true);
  }

  onMainImageDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isMainImageDragging.set(false);
  }

  removeMainImage(): void {
    this.mainImageFile = null;
    this.mainImagePreview.set(null);
    this.mainImageBase64 = null; // explicit null tells backend to clear image
  }

  private processMainFile(file: File): void {
    if (!file.type.startsWith('image/')) {
      this.toast.error('Please upload a valid image file (PNG, JPG, WEBP)');
      return;
    }
    this.mainImageFile = file;
    this.mainImageMime = file.type || 'image/jpeg';

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      this.mainImagePreview.set(result);
      this.mainImageBase64 = result;
    };
    reader.readAsDataURL(file);
  }

  // Gallery Images Handling
  deleteExistingGalleryImage(imageId: string): void {
    if (!confirm('Are you sure you want to delete this gallery photo?')) return;
    this.productService.deleteGalleryImage(imageId).subscribe({
      next: () => {
        this.existingGalleryImages.update((list) => list.filter((img) => img.image_id !== imageId));
        this.toast.success('Gallery image deleted');
      },
      error: () => {
        this.toast.error('Failed to delete gallery image');
      },
    });
  }

  onNewGallerySelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.processNewGalleryFiles(input.files);
    }
  }

  onNewGalleryDrop(event: DragEvent): void {
    event.preventDefault();
    this.isGalleryDragging.set(false);
    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      this.processNewGalleryFiles(event.dataTransfer.files);
    }
  }

  onNewGalleryDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isGalleryDragging.set(true);
  }

  onNewGalleryDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isGalleryDragging.set(false);
  }

  removeNewGalleryImage(index: number): void {
    this.newGalleryImages.update((list) => list.filter((_, i) => i !== index));
  }

  private processNewGalleryFiles(files: FileList): void {
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        this.newGalleryImages.update((list) => [
          ...list,
          {
            id: Math.random().toString(36).substring(2, 9),
            file,
            previewUrl: result,
            base64: result,
            mime: file.type || 'image/jpeg',
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
  }

  // Submit Update
  updateProduct(statusToSave?: ProductStatus): void {
    if (!this.title.trim()) {
      this.toast.error('Product title is required');
      return;
    }
    if (!this.selectedCategoryId()) {
      this.toast.error('Please select a Category');
      return;
    }
    if (this.regularPrice === null || this.regularPrice < 0) {
      this.toast.error('Please enter a valid regular price');
      return;
    }
    if (this.salePrice !== null && this.salePrice > this.regularPrice) {
      this.toast.error('Sale price cannot be higher than regular price');
      return;
    }

    this.isSaving.set(true);

    const payload: any = {
      title: this.title.trim(),
      slug: this.slug.trim() || this.slugify(this.title),
      sku: this.sku.trim(),
      category_id: this.selectedCategoryId(),
      subcategory_id: this.selectedSubcategoryId() || null,
      brand: this.brand.trim() || 'Rangnodi',
      regular_price: Number(this.regularPrice),
      sale_price: this.salePrice !== null ? Number(this.salePrice) : null,
      stock_quantity: Number(this.warehouseStockQty),
      low_stock_threshold: Number(this.lowStockAlert),
      stock_status: this.stockStatus,
      max_purchase_limit: Number(this.maxPurchaseLimit),
      weight_kg: Number(this.weightKg),
      free_shipping: this.freeShipping,
      is_cod_available: this.cashOnDelivery,
      warranty_period: this.warrantyPeriod.trim(),
      short_description: this.shortDescription.trim(),
      description: this.description.trim(),
      sizes: this.availableSizes
        ? this.availableSizes.split(',').map((s) => s.trim()).filter(Boolean)
        : [],
      colors: this.colorOptions
        ? this.colorOptions.split(',').map((c) => c.trim()).filter(Boolean)
        : [],
      tags: this.searchKeywords
        ? this.searchKeywords.split(',').map((t) => t.trim()).filter(Boolean)
        : [],
      badge: this.cardBadge || null,
      is_featured: this.isFeatured,
      flash_deal_end: this.flashDealExpiration || null,
      status: statusToSave || this.publishStatus,
    };

    // If main image was updated or removed
    if (this.mainImageBase64 !== undefined) {
      payload.main_image_base64 = this.mainImageBase64;
      payload.main_image_mime = this.mainImageMime;
    }

    // If new gallery images are being uploaded
    if (this.newGalleryImages().length > 0) {
      payload.gallery_images = this.newGalleryImages().map((img, idx) => ({
        image_blob_base64: img.base64 || '',
        image_mime: img.mime,
        sort_order: this.existingGalleryImages().length + idx,
      }));
    }

    this.productService.updateProduct(this.productId, payload).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.toast.success('Product updated successfully!');
        this.loadRecentProducts();
      },
      error: (err) => {
        this.isSaving.set(false);
        this.toast.error(err.error?.message || 'Failed to update product');
      },
    });
  }

  // Soft Delete Product
  deleteProduct(): void {
    if (!confirm('Are you sure you want to delete this product? It will be archived.')) return;

    this.isDeleting.set(true);
    this.productService.deleteProduct(this.productId).subscribe({
      next: () => {
        this.isDeleting.set(false);
        this.toast.success('Product deleted successfully');
        this.productId = '';
        this.loadRecentProducts();
        this.router.navigate(['/products/edit']);
      },
      error: (err) => {
        this.isDeleting.set(false);
        this.toast.error(err.error?.message || 'Failed to delete product');
      },
    });
  }

  slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}
