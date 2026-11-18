import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { CatalogService } from '../../core/services/catalog.service';
import { ToastService } from '../../core/services/toast.service';
import {
  Category,
  Subcategory,
  CategoryHierarchyItem,
  CatalogSummary,
  EntityStatus,
} from '../../core/models/catalog.models';

type ActiveTab = 'category' | 'subcategory';
type FilterStatus = 'all' | 'active' | 'inactive';

@Component({
  selector: 'app-catalog-management',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './catalog-management.component.html',
  styleUrl: './catalog-management.component.css',
})
export class CatalogManagementComponent implements OnInit {
  private readonly catalogService = inject(CatalogService);
  private readonly toast = inject(ToastService);
  private readonly route = inject(ActivatedRoute);

  // State Signals
  readonly activeTab = signal<ActiveTab>('category');
  readonly filterStatus = signal<FilterStatus>('all');
  readonly searchQuery = signal<string>('');
  readonly isLoading = signal<boolean>(false);
  readonly isSaving = signal<boolean>(false);

  // Data Signals
  readonly summary = signal<CatalogSummary>({
    totalCategories: 0,
    activeCategories: 0,
    inactiveCategories: 0,
    totalSubcategories: 0,
    activeSubcategories: 0,
    inactiveSubcategories: 0,
    campaignBadgesCount: 0,
    linkedProductsCount: 4,
  });
  readonly categories = signal<CategoryHierarchyItem[]>([]);
  readonly expandedCategoryIds = signal<Set<string>>(new Set());

  // Editing state
  readonly editingCategoryId = signal<string | null>(null);
  readonly editingSubcategoryId = signal<string | null>(null);

  // Category Form State
  categoryForm = {
    category_id: '',
    name: '',
    slug: '',
    badge: '',
    is_highlighted: false,
    sort_order: 10,
    status: 'active' as EntityStatus,
  };
  private isSlugManuallyEdited = false;

  // Subcategory Form State
  subcategoryForm = {
    subcategory_id: '',
    category_id: '',
    group_name: 'Main Collection',
    name: '',
    slug: '',
    sort_order: 10,
    status: 'active' as EntityStatus,
  };
  private isSubSlugManuallyEdited = false;

  // Computed filter count pills
  readonly allCount = computed(() => this.summary().totalCategories);
  readonly activeCount = computed(() => this.summary().activeCategories);
  readonly inactiveCount = computed(() => this.summary().inactiveCategories);

  onTabChange(tab: ActiveTab): void {
    this.activeTab.set(tab);
    if (tab === 'subcategory' && !this.subcategoryForm.subcategory_id) {
      this.initNewSubcategoryForm();
    }
  }

  onImgError(event: Event): void {
    const target = event.target as HTMLElement;
    if (target) {
      target.style.display = 'none';
    }
  }

  // Preview computed text
  get previewName(): string {
    return this.categoryForm.name.trim() || 'CATEGORY NAME';
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['tab'] === 'subcategory') {
        this.onTabChange('subcategory');
      } else if (params['tab'] === 'category') {
        this.onTabChange('category');
      }
    });
    this.refreshAll();
    this.initNewCategoryForm();
  }

  refreshAll(): void {
    this.loadSummary();
    this.loadHierarchy();
  }

  loadSummary(): void {
    this.catalogService.getSummary().subscribe({
      next: (data) => this.summary.set(data),
      error: (err) => console.error('Failed to load summary', err),
    });
  }

  loadHierarchy(): void {
    this.isLoading.set(true);
    this.catalogService
      .getHierarchy(this.filterStatus(), this.searchQuery())
      .subscribe({
        next: (items) => {
          this.categories.set(items);
          this.isLoading.set(false);
        },
        error: (err) => {
          this.isLoading.set(false);
          this.toast.error('Failed to load catalog hierarchy');
          console.error(err);
        },
      });
  }

  setFilterStatus(status: FilterStatus): void {
    this.filterStatus.set(status);
    this.loadHierarchy();
  }

  onSearchChange(): void {
    this.loadHierarchy();
  }

  toggleExpand(categoryId: string): void {
    this.expandedCategoryIds.update((set) => {
      const next = new Set(set);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  }

  expandAll(): void {
    const allIds = new Set(this.categories().map((c) => c.category_id));
    this.expandedCategoryIds.set(allIds);
  }

  collapseAll(): void {
    this.expandedCategoryIds.set(new Set());
  }

  isExpanded(categoryId: string): boolean {
    return this.expandedCategoryIds().has(categoryId);
  }

  // ----------------------------------------------------
  // Form Actions: Category
  // ----------------------------------------------------
  initNewCategoryForm(): void {
    this.editingCategoryId.set(null);
    this.isSlugManuallyEdited = false;
    this.catalogService.generateCategoryId().subscribe({
      next: (id) => {
        this.categoryForm = {
          category_id: id,
          name: '',
          slug: '',
          badge: '',
          is_highlighted: false,
          sort_order: (this.categories().length + 1) * 10,
          status: 'active',
        };
      },
      error: () => {
        this.categoryForm.category_id = Math.floor(
          1000000000 + Math.random() * 9000000000
        ).toString();
      },
    });
  }

  onCategoryNameChange(): void {
    if (!this.isSlugManuallyEdited) {
      this.categoryForm.slug = this.slugify(this.categoryForm.name);
    }
  }

  onCategorySlugChange(): void {
    this.isSlugManuallyEdited = true;
  }

  regenCategoryId(): void {
    this.catalogService.generateCategoryId().subscribe({
      next: (id) => {
        this.categoryForm.category_id = id;
        this.toast.info('New 10-digit ID generated');
      },
    });
  }

  copyToClipboard(text: string, label = 'ID'): void {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      this.toast.success(`${label} copied to clipboard!`);
    });
  }

  saveCategory(): void {
    if (!this.categoryForm.name.trim()) {
      this.toast.error('Category Name is required');
      return;
    }
    if (!this.categoryForm.category_id || this.categoryForm.category_id.length !== 10) {
      this.toast.error('Valid 10-digit Category ID is required');
      return;
    }

    this.isSaving.set(true);
    const payload = {
      ...this.categoryForm,
      slug: this.categoryForm.slug || this.slugify(this.categoryForm.name),
    };

    const editId = this.editingCategoryId();
    if (editId) {
      this.catalogService.updateCategory(editId, payload).subscribe({
        next: () => {
          this.isSaving.set(false);
          this.toast.success('Category updated successfully');
          this.initNewCategoryForm();
          this.refreshAll();
        },
        error: (err) => {
          this.isSaving.set(false);
          this.toast.error(err.error?.message || 'Failed to update category');
        },
      });
    } else {
      this.catalogService.createCategory(payload).subscribe({
        next: () => {
          this.isSaving.set(false);
          this.toast.success('Category created successfully');
          this.initNewCategoryForm();
          this.refreshAll();
        },
        error: (err) => {
          this.isSaving.set(false);
          this.toast.error(err.error?.message || 'Failed to create category');
        },
      });
    }
  }

  editCategory(cat: Category): void {
    this.activeTab.set('category');
    this.editingCategoryId.set(cat.category_id);
    this.isSlugManuallyEdited = true;
    this.categoryForm = {
      category_id: cat.category_id,
      name: cat.name,
      slug: cat.slug,
      badge: cat.badge || '',
      is_highlighted: cat.is_highlighted,
      sort_order: cat.sort_order,
      status: cat.status,
    };
  }

  deleteCategory(cat: Category, event: Event): void {
    event.stopPropagation();
    const count = cat.subcategories_count || 0;
    const confirmMsg =
      count > 0
        ? `Are you sure you want to delete category "${cat.name}" and all ${count} of its subcategories?`
        : `Are you sure you want to delete category "${cat.name}"?`;

    if (confirm(confirmMsg)) {
      this.catalogService.deleteCategory(cat.category_id).subscribe({
        next: (res) => {
          const subsDeleted = res.deletedSubcategoriesCount ?? count;
          this.toast.success(
            subsDeleted > 0
              ? `Deleted category "${cat.name}" and ${subsDeleted} subcategory(s)`
              : `Deleted category "${cat.name}"`
          );
          if (this.editingCategoryId() === cat.category_id) {
            this.initNewCategoryForm();
          }
          if (this.subcategoryForm.category_id === cat.category_id) {
            this.initNewSubcategoryForm();
          }
          this.expandedCategoryIds.update((set) => {
            const next = new Set(set);
            next.delete(cat.category_id);
            return next;
          });
          this.refreshAll();
        },
        error: (err) => this.toast.error(err.error?.message || 'Failed to delete category'),
      });
    }
  }

  // ----------------------------------------------------
  // Form Actions: Subcategory
  // ----------------------------------------------------
  initNewSubcategoryForm(preselectedCategoryId?: string): void {
    this.editingSubcategoryId.set(null);
    this.isSubSlugManuallyEdited = false;
    const defaultCatId =
      preselectedCategoryId ||
      this.subcategoryForm.category_id ||
      (this.categories()[0]?.category_id ?? '');

    this.catalogService.generateSubcategoryId().subscribe({
      next: (id) => {
        this.subcategoryForm = {
          subcategory_id: id,
          category_id: defaultCatId,
          group_name: 'Main Collection',
          name: '',
          slug: '',
          sort_order: 10,
          status: 'active',
        };
      },
      error: () => {
        this.subcategoryForm.subcategory_id = Math.floor(
          1000000000 + Math.random() * 9000000000
        ).toString();
      },
    });
  }

  onSubcategoryNameChange(): void {
    if (!this.isSubSlugManuallyEdited) {
      this.subcategoryForm.slug = this.slugify(this.subcategoryForm.name);
    }
  }

  onSubcategorySlugChange(): void {
    this.isSubSlugManuallyEdited = true;
  }

  regenSubcategoryId(): void {
    this.catalogService.generateSubcategoryId().subscribe({
      next: (id) => {
        this.subcategoryForm.subcategory_id = id;
        this.toast.info('New 10-digit Subcategory ID generated');
      },
    });
  }

  saveSubcategory(): void {
    if (!this.subcategoryForm.name.trim()) {
      this.toast.error('Subcategory Name is required');
      return;
    }
    if (!this.subcategoryForm.category_id) {
      this.toast.error('Please select a parent category');
      return;
    }
    if (
      !this.subcategoryForm.subcategory_id ||
      this.subcategoryForm.subcategory_id.length !== 10
    ) {
      this.toast.error('Valid 10-digit Subcategory ID is required');
      return;
    }

    this.isSaving.set(true);
    const payload = {
      ...this.subcategoryForm,
      slug: this.subcategoryForm.slug || this.slugify(this.subcategoryForm.name),
    };

    const editId = this.editingSubcategoryId();
    if (editId) {
      this.catalogService.updateSubcategory(editId, payload).subscribe({
        next: () => {
          this.isSaving.set(false);
          this.toast.success('Subcategory updated successfully');
          this.initNewSubcategoryForm();
          this.refreshAll();
        },
        error: (err) => {
          this.isSaving.set(false);
          this.toast.error(err.error?.message || 'Failed to update subcategory');
        },
      });
    } else {
      this.catalogService.createSubcategory(payload).subscribe({
        next: () => {
          this.isSaving.set(false);
          this.toast.success('Subcategory created successfully');
          const catId = this.subcategoryForm.category_id;
          this.initNewSubcategoryForm(catId);
          // auto expand parent category to show newly added subcategory
          this.expandedCategoryIds.update((set) => new Set([...set, catId]));
          this.refreshAll();
        },
        error: (err) => {
          this.isSaving.set(false);
          this.toast.error(err.error?.message || 'Failed to create subcategory');
        },
      });
    }
  }

  openAddSubcategoryFor(cat: Category, event: Event): void {
    event.stopPropagation();
    this.activeTab.set('subcategory');
    this.initNewSubcategoryForm(cat.category_id);
    this.expandedCategoryIds.update((set) => new Set([...set, cat.category_id]));
  }

  editSubcategory(sub: Subcategory, event: Event): void {
    event.stopPropagation();
    this.activeTab.set('subcategory');
    this.editingSubcategoryId.set(sub.subcategory_id);
    this.isSubSlugManuallyEdited = true;
    this.subcategoryForm = {
      subcategory_id: sub.subcategory_id,
      category_id: sub.category_id,
      group_name: sub.group_name || 'Main Collection',
      name: sub.name,
      slug: sub.slug,
      sort_order: sub.sort_order,
      status: sub.status,
    };
  }

  deleteSubcategory(sub: Subcategory, event: Event): void {
    event.stopPropagation();
    if (confirm(`Are you sure you want to delete subcategory "${sub.name}"?`)) {
      this.catalogService.deleteSubcategory(sub.subcategory_id).subscribe({
        next: () => {
          this.toast.success(`Subcategory "${sub.name}" deleted`);
          if (this.editingSubcategoryId() === sub.subcategory_id) {
            this.initNewSubcategoryForm(sub.category_id);
          }
          this.refreshAll();
        },
        error: (err) =>
          this.toast.error(err.error?.message || 'Failed to delete subcategory'),
      });
    }
  }

  // ----------------------------------------------------
  // Helpers
  // ----------------------------------------------------
  getSubcategoriesByGroup(subcategories: Subcategory[]): { group: string; items: Subcategory[] }[] {
    const map = new Map<string, Subcategory[]>();
    for (const sub of subcategories) {
      const g = sub.group_name || 'Main Collection';
      if (!map.has(g)) {
        map.set(g, []);
      }
      map.get(g)!.push(sub);
    }
    return Array.from(map.entries()).map(([group, items]) => ({ group, items }));
  }

  private slugify(text: string): string {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]+/g, '')
      .replace(/--+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '');
  }
}
