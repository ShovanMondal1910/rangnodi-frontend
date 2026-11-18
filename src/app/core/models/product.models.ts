export type StockStatus = 'in_stock' | 'out_of_stock' | 'pre_order';
export type ProductStatus = 'active' | 'inactive' | 'draft';
export type ProductBadge = 'HOT' | 'NEW' | 'SALE' | 'LIMITED' | 'TRENDING' | '';

export interface GalleryImageItem {
  id: string; // client temporary ID
  file?: File;
  previewUrl: string;
  base64?: string;
  mime?: string;
}

export interface CreateProductPayload {
  product_id?: string;
  title: string;
  slug: string;
  sku: string;
  category_id: string;
  subcategory_id?: string | null;
  brand: string;
  regular_price: number;
  sale_price?: number | null;
  stock_quantity: number;
  low_stock_threshold: number;
  stock_status: StockStatus;
  max_purchase_limit: number;
  weight_kg: number;
  free_shipping: boolean;
  is_cod_available: boolean;
  warranty_period: string;
  short_description?: string;
  description?: string;
  sizes?: string[];
  colors?: string[];
  tags?: string[];
  badge?: string | null;
  is_featured: boolean;
  flash_deal_end?: string | null;
  status: ProductStatus;
  main_image_base64?: string | null;
  main_image_mime?: string;
  gallery_images?: {
    image_blob_base64: string;
    image_mime?: string;
    sort_order?: number;
  }[];
}

export interface ProductResponse {
  product_id: string;
  title: string;
  slug: string;
  sku: string;
  category_id: string;
  category_name?: string;
  subcategory_id: string | null;
  subcategory_name?: string;
  regular_price: number;
  sale_price: number | null;
  stock_quantity: number;
  stock_status: StockStatus;
  status: ProductStatus;
  badge?: string | null;
  is_featured?: boolean;
  rating_avg?: number;
  rating_count?: number;
  has_main_image?: boolean;
  created_at: string;
}
