import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
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
  ProductStatus,
  StockStatus,
} from '../../../core/models/product.models';

@Component({
  selector: 'app-add-product',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './add-product.component.html',
  styleUrl: './add-product.component.css',
})
export class AddProductComponent implements OnInit {
  private readonly catalogService = inject(CatalogService);
  private readonly productService = inject(ProductService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  // Loading & State signals
  readonly isLoading = signal<boolean>(false);
  readonly isSaving = signal<boolean>(false);
  readonly categories = signal<CategoryHierarchyItem[]>([]);

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
  regularPrice: number | null = 3850.0;
  salePrice: number | null = 2990.0;
  warehouseStockQty = 20;
  lowStockAlert = 5;
  stockStatus: StockStatus = 'in_stock';
  maxPurchaseLimit = 5;
  weightKg = 0.5;

  // Variants, Sizes & Tags
  availableSizes = 'S, M, L, XL, XXL';
  colorOptions = 'Midnight Crimson, Navy Blue, Snow White';
  searchKeywords = 'panjabi, eid, festive, cotton';
  warrantyPeriod = '7-Day Easy Replacement';

  // Visibility & Policies
  publishStatus: ProductStatus = 'active';
  cardBadge: string = '';
  isFeatured = true;
  freeShipping = false;
  cashOnDelivery = true;
  flashDealExpiration = '';

  // Image upload states
  mainImageFile: File | null = null;
  mainImagePreview = signal<string | null>(null);
  mainImageBase64: string | null = null;
  mainImageMime = 'image/jpeg';
  isMainImageDragging = signal<boolean>(false);

  galleryImages = signal<GalleryImageItem[]>([]);
  isGalleryDragging = signal<boolean>(false);

  private isSlugManuallyEdited = false;

  ngOnInit(): void {
    this.loadCatalogHierarchy();
    this.generateSku();
  }

  // Load Categories & Subcategories directly from DB
  loadCatalogHierarchy(): void {
    this.isLoading.set(true);
    this.catalogService.getHierarchy('active').subscribe({
      next: (data) => {
        this.categories.set(data);
        this.isLoading.set(false);
        // Default select first category if available
        if (data.length > 0 && !this.selectedCategoryId()) {
          this.onCategoryChange(data[0].category_id);
        }
      },
      error: () => {
        this.isLoading.set(false);
        this.toast.error('Failed to load categories from database');
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

    const cat = this.selectedCategory();
    if (cat) {
      this.generateSku(cat.name);
      // Auto select first group and subcategory if available
      const groups = this.availableGroupNames();
      if (groups.length > 0) {
        this.selectedGroupName.set(groups[0]);
      }
      const subs = this.availableSubcategories();
      if (subs.length > 0) {
        this.selectedSubcategoryId.set(subs[0].subcategory_id);
      }
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

  // Slug generator
  onTitleInput(): void {
    if (!this.isSlugManuallyEdited) {
      this.slug = this.slugify(this.title);
    }
  }

  onSlugManualEdit(): void {
    this.isSlugManuallyEdited = true;
  }

  generateSku(hint?: string): void {
    const categoryName = hint || this.selectedCategory()?.name || 'GEN';
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
    this.mainImageBase64 = null;
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
  onGallerySelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.processGalleryFiles(input.files);
    }
  }

  onGalleryDrop(event: DragEvent): void {
    event.preventDefault();
    this.isGalleryDragging.set(false);
    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      this.processGalleryFiles(event.dataTransfer.files);
    }
  }

  onGalleryDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isGalleryDragging.set(true);
  }

  onGalleryDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isGalleryDragging.set(false);
  }

  removeGalleryImage(index: number): void {
    this.galleryImages.update((list) => list.filter((_, i) => i !== index));
  }

  private processGalleryFiles(files: FileList): void {
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        this.galleryImages.update((list) => [
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

  // Save product
  submitProduct(statusToSave: ProductStatus = 'active'): void {
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

    const payload: CreateProductPayload = {
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
      status: statusToSave,
      main_image_base64: this.mainImageBase64,
      main_image_mime: this.mainImageMime,
      gallery_images: this.galleryImages().map((img, idx) => ({
        image_blob_base64: img.base64 || '',
        image_mime: img.mime,
        sort_order: idx,
      })),
    };

    this.productService.createProduct(payload).subscribe({
      next: (res) => {
        this.isSaving.set(false);
        this.toast.success(
          statusToSave === 'active'
            ? 'Product published successfully!'
            : 'Product saved as draft!'
        );
        this.router.navigate(['/catalog']);
      },
      error: (err) => {
        this.isSaving.set(false);
        this.toast.error(err.error?.message || 'Failed to save product');
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
