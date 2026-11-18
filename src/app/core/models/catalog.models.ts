export type EntityStatus = 'active' | 'inactive';

export interface Category {
  category_id: string;
  name: string;
  slug: string;
  badge: string | null;
  is_highlighted: boolean;
  sort_order: number;
  status: EntityStatus;
  created_at?: string;
  updated_at?: string;
  products_count?: number;
  subcategories_count?: number;
}

export interface Subcategory {
  subcategory_id: string;
  category_id: string;
  group_name: string;
  name: string;
  slug: string;
  sort_order: number;
  status: EntityStatus;
  created_at?: string;
  updated_at?: string;
  category_name?: string;
  products_count?: number;
}

export interface CategoryHierarchyItem extends Category {
  subcategories: Subcategory[];
}

export interface CatalogSummary {
  totalCategories: number;
  activeCategories: number;
  inactiveCategories: number;
  totalSubcategories: number;
  activeSubcategories: number;
  inactiveSubcategories: number;
  campaignBadgesCount: number;
  linkedProductsCount: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}
