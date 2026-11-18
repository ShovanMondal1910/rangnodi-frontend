export interface CartItem {
  id: string;
  user_id?: string;
  product_id: string;
  quantity: number;
  selected_size?: string | null;
  selected_color?: string | null;
  title: string;
  slug: string;
  sku?: string | null;
  regular_price: number;
  sale_price?: number | null;
  unit_price: number;
  image_url?: string | null;
  stock_quantity: number;
  stock_status: string;
  created_at?: string | Date;
}

export interface CartData {
  items: CartItem[];
  total_items: number;
  total_quantity: number;
  subtotal: number;
}

export interface CartResponse {
  success: boolean;
  message?: string;
  data: CartData;
}
