import { Component, OnInit, inject, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CatalogService } from '../core/services/catalog.service';
import { AuthService } from '../core/services/auth.service';
import { CategoryHierarchyItem, Subcategory } from '../core/models/catalog.models';

export interface GroupedSubcategories {
  groupName: string;
  items: Subcategory[];
}

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
})
export class NavbarComponent implements OnInit {
  private readonly catalogService = inject(CatalogService);
  private readonly router = inject(Router);
  readonly authService = inject(AuthService);

  readonly categories = signal<CategoryHierarchyItem[]>([]);
  readonly activeCategory = signal<CategoryHierarchyItem | null>(null);
  readonly isMegaMenuOpen = signal<boolean>(false);

  // Search state
  searchQuery = '';
  selectedSearchCategory = 'Categories';
  showCategoryPicker = false;

  private closeMenuTimer: any = null;

  ngOnInit(): void {
    this.loadCatalog();
  }

  loadCatalog(): void {
    this.catalogService.getHierarchy('active').subscribe({
      next: (data) => {
        // Sort categories by sort_order
        const sorted = data.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
        this.categories.set(sorted);
      },
      error: (err) => {
        console.error('Failed to load navigation categories:', err);
      },
    });
  }

  // Hover / Mouse interactions
  onCategoryEnter(cat: CategoryHierarchyItem): void {
    this.clearCloseTimer();
    this.activeCategory.set(cat);
    // Only open mega menu if category has subcategories
    if (cat.subcategories && cat.subcategories.length > 0) {
      this.isMegaMenuOpen.set(true);
    } else {
      this.isMegaMenuOpen.set(false);
    }
  }

  onCategoryLeave(): void {
    this.scheduleCloseMenu();
  }

  onMegaMenuEnter(): void {
    this.clearCloseTimer();
  }

  onMegaMenuLeave(): void {
    this.scheduleCloseMenu();
  }

  // Touch support for tablets/mobile
  onCategoryTouch(cat: CategoryHierarchyItem, event: Event): void {
    if (cat.subcategories && cat.subcategories.length > 0) {
      if (this.activeCategory()?.category_id === cat.category_id && this.isMegaMenuOpen()) {
        this.isMegaMenuOpen.set(false);
        this.activeCategory.set(null);
      } else {
        event.preventDefault();
        this.activeCategory.set(cat);
        this.isMegaMenuOpen.set(true);
      }
    }
  }

  private scheduleCloseMenu(): void {
    this.clearCloseTimer();
    this.closeMenuTimer = setTimeout(() => {
      this.isMegaMenuOpen.set(false);
      this.activeCategory.set(null);
    }, 150);
  }

  private clearCloseTimer(): void {
    if (this.closeMenuTimer) {
      clearTimeout(this.closeMenuTimer);
      this.closeMenuTimer = null;
    }
  }

  // Group subcategories by group_name
  getGroupedSubcategories(cat: CategoryHierarchyItem | null): GroupedSubcategories[] {
    if (!cat || !cat.subcategories || cat.subcategories.length === 0) return [];

    const map = new Map<string, Subcategory[]>();
    cat.subcategories.forEach((sub) => {
      const group = (sub.group_name && sub.group_name.trim()) || 'General';
      if (!map.has(group)) {
        map.set(group, []);
      }
      map.get(group)!.push(sub);
    });

    return Array.from(map.entries()).map(([groupName, items]) => ({
      groupName,
      items: items.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)),
    }));
  }

  onSearchSubmit(): void {
    if (this.searchQuery.trim()) {
      this.router.navigate(['/products/edit'], {
        queryParams: { search: this.searchQuery.trim() },
      });
    }
  }

  selectCategoryFilter(catName: string): void {
    this.selectedSearchCategory = catName;
    this.showCategoryPicker = false;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.search-category-dropdown')) {
      this.showCategoryPicker = false;
    }
  }
}
