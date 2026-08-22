export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: 'customer' | 'transporter' | 'employee' | 'business_owner' | 'admin';
  current_business_id?: number;
  avatar?: string;
}

export interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;
  compare_at_price?: number;
  sku?: string;
  barcode?: string;
  stock_quantity: number;
  images?: { id: number; url: string }[];
  category?: { id: number; name: string };
  business?: { id: number; name: string };
  is_active: boolean;
}

export interface Order {
  id: number;
  order_number: string;
  status: string;
  total: number;
  items_count?: number;
  created_at: string;
  customer?: User;
  business?: { id: number; name: string };
  delivery?: Delivery;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Delivery {
  id: number;
  status: string;
  pickup_address: string;
  delivery_address: string;
  latitude?: number;
  longitude?: number;
  estimated_delivery?: string;
  order?: Order;
  transporter?: User;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}
