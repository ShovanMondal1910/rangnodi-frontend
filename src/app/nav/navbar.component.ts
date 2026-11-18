import { Component, OnInit, inject, signal, HostListener, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CatalogService } from '../core/services/catalog.service';
import { AuthService } from '../core/services/auth.service';
import { CartService } from '../core/services/cart.service';
import { CategoryHierarchyItem, Subcategory } from '../core/models/catalog.models';
import $ from 'jquery';

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
  readonly cartService = inject(CartService);

  readonly categories = signal<CategoryHierarchyItem[]>([]);
  readonly activeCategory = signal<CategoryHierarchyItem | null>(null);
  readonly isMegaMenuOpen = signal<boolean>(false);
  readonly isScrolled = signal<boolean>(false);

  // Mobile Drawer & Search State (Sailor style)
  readonly isMobileDrawerOpen = signal<boolean>(false);
  readonly isMobileSearchOpen = signal<boolean>(false);
  readonly expandedDrawerCat = signal<string | null>(null);

  // Search state
  searchQuery = '';
  selectedSearchCategory = 'Categories';
  showCategoryPicker = false;

  private closeMenuTimer: any = null;

  @HostListener('window:scroll')
  onWindowScroll(): void {
    if (typeof window !== 'undefined') {
      this.isScrolled.set(window.scrollY > 100);
    }
  }

  toggleDrawer(): void {
    this.isMobileDrawerOpen.update((open) => !open);
  }

  closeDrawer(): void {
    this.isMobileDrawerOpen.set(false);
  }

  toggleMobileSearch(): void {
    this.isMobileSearchOpen.update((open) => !open);
  }

  toggleDrawerCat(catId: string): void {
    if (this.expandedDrawerCat() === catId) {
      this.expandedDrawerCat.set(null);
    } else {
      this.expandedDrawerCat.set(catId);
    }
  }

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

  @ViewChild('megaMenuPanel') megaMenuPanel?: ElementRef<HTMLElement>;

  // Hover / Mouse interactions
  onCategoryEnter(cat: CategoryHierarchyItem): void {
    this.clearCloseTimer();
    if (this.isMegaMenuOpen()) {
      this.switchCategory(cat);
    } else {
      this.openMegaMenu(cat);
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

  // Press / Click on a category in the navigation bar to expand its groups and subcategories
  onCategoryPress(cat: CategoryHierarchyItem, event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    if (this.activeCategory()?.category_id === cat.category_id && this.isMegaMenuOpen()) {
      this.closeMegaMenu();
      return;
    }

    this.clearCloseTimer();
    this.openMegaMenu(cat);
  }

  openMegaMenu(cat: CategoryHierarchyItem): void {
    this.activeCategory.set(cat);
    this.isMegaMenuOpen.set(true);

    setTimeout(() => {
      if (!this.megaMenuPanel) return;
      const $panel = $(this.megaMenuPanel.nativeElement);
      $panel.stop(true, true);
      $panel.css({ opacity: 0 });
      $panel.slideDown({
        duration: 260,
        easing: 'swing',
      }).animate({ opacity: 1 }, { queue: false, duration: 220 });

      // Staggered cascade entrance for groups via jQuery
      $panel.find('.mega-group-column').each((idx, el) => {
        $(el).css({ opacity: 0, transform: 'translateY(8px)' })
          .delay(30 + idx * 30)
          .animate({ opacity: 1, transform: 'translateY(0px)' }, 160);
      });

      // Pure touch & hover feedback animation via jQuery
      this.attachTouchAnimations($panel);
    }, 10);
  }

  switchCategory(cat: CategoryHierarchyItem): void {
    if (this.activeCategory()?.category_id === cat.category_id) return;
    if (!this.megaMenuPanel) {
      this.activeCategory.set(cat);
      return;
    }

    const $panel = $(this.megaMenuPanel.nativeElement);
    $panel.find('.mega-columns-grid').stop(true, true).animate(
      { opacity: 0.25 },
      80,
      () => {
        this.activeCategory.set(cat);
        setTimeout(() => {
          $panel.find('.mega-columns-grid').animate({ opacity: 1 }, 160);
          $panel.find('.mega-group-column').each((idx, el) => {
            $(el).css({ opacity: 0, transform: 'translateY(6px)' })
              .delay(idx * 20)
              .animate({ opacity: 1, transform: 'translateY(0px)' }, 140);
          });
          this.attachTouchAnimations($panel);
        }, 10);
      }
    );
  }

  private attachTouchAnimations($panel: JQuery<HTMLElement>): void {
    $panel.find('.mega-sub-link')
      .off('mouseenter mouseleave touchstart touchend mousedown mouseup')
      .on('mouseenter', function() {
        $(this).stop(true, true).animate({ paddingLeft: '3px' }, 80);
      })
      .on('mouseleave', function() {
        $(this).stop(true, true).animate({ paddingLeft: '0px' }, 80);
      })
      .on('touchstart mousedown', function() {
        $(this).stop(true, true).animate({ opacity: 0.5 }, 50);
      })
      .on('touchend mouseup', function() {
        $(this).stop(true, true).animate({ opacity: 1 }, 80);
      });
  }

  closeMegaMenu(): void {
    this.clearCloseTimer();
    if (!this.megaMenuPanel || !this.isMegaMenuOpen()) {
      this.isMegaMenuOpen.set(false);
      this.activeCategory.set(null);
      return;
    }

    const $panel = $(this.megaMenuPanel.nativeElement);
    $panel.stop(true, true).animate(
      { opacity: 0 },
      130,
      () => {
        $panel.slideUp(170, () => {
          $panel.css({ display: 'none' });
          this.isMegaMenuOpen.set(false);
          this.activeCategory.set(null);
        });
      }
    );
  }

  getTotalSubcategoryCount(cat: CategoryHierarchyItem | null): number {
    return cat?.subcategories?.length || 0;
  }

  private scheduleCloseMenu(): void {
    this.clearCloseTimer();
    this.closeMenuTimer = setTimeout(() => {
      this.closeMegaMenu();
    }, 280);
  }

  private clearCloseTimer(): void {
    if (this.closeMenuTimer) {
      clearTimeout(this.closeMenuTimer);
      this.closeMenuTimer = null;
    }
  }

  // Group subcategories by group_name and preserve sorted group order
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

    return Array.from(map.entries())
      .map(([groupName, items]) => {
        const sortedItems = items.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
        const minOrder = sortedItems.length > 0 ? (sortedItems[0].sort_order ?? 999) : 999;
        return { groupName, items: sortedItems, minOrder };
      })
      .sort((a, b) => a.minOrder - b.minOrder)
      .map(({ groupName, items }) => ({ groupName, items }));
  }

  onSearchSubmit(): void {
    if (this.searchQuery.trim()) {
      this.router.navigate(['/catalog'], {
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
    if (!target.closest('.category-nav-bar') && !target.closest('.mega-menu-overlay')) {
      this.closeMegaMenu();
    }
  }
}
