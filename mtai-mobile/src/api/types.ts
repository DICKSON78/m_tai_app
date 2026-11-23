export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: 'customer' | 'transporter' | 'employee' | 'business_owner' | 'admin';
  full_name?: string;
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
  quantity: number;
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

export type DeliveryStatus =
  | 'pending'
  | 'accepted'
  | 'in_transit'
  | 'delivered'
  | 'cancelled';

export interface DeliveryBusiness {
  id: number;
  business_name?: string;
  name?: string;
}

export interface DeliveryCustomer {
  id: number;
  full_name?: string;
  name?: string;
  avatar?: string;
  phone?: string;
  user_id?: number;
}

export interface Delivery {
  id: number;
  business_id?: number;
  order_id?: number | null;
  customer_id?: number;
  goods_category?: string;
  item_description?: string;
  quantity?: number;

  /** Real API field names. */
  pickup_location?: string;
  destination?: string;
  offered_price?: number | string;

  /** Kept as optional aliases so older screens keep compiling. */
  pickup_address?: string;
  delivery_address?: string;
  latitude?: number;
  longitude?: number;
  estimated_delivery?: string;

  pickup_latitude?: number | null;
  pickup_longitude?: number | null;
  transporter_id?: number | null;
  offered_at?: string | null;
  accepted_at?: string | null;
  offer_expires_at?: string | null;
  auto_dispatched?: boolean;
  rejected?: boolean;
  rejected_reason?: string | null;
  counter_price?: number | string | null;
  counter_status?: string | null;

  status: DeliveryStatus | string;
  created_at?: string;
  updated_at?: string;
  order?: Order;
  business?: DeliveryBusiness;
  customer?: DeliveryCustomer;
  transporter?: User;
}

export interface TransporterProfile {
  id?: number;
  name?: string;
  email?: string;
  phone?: string;
  avatar?: string;
  vehicle_type?: string | null;
  vehicle_plate?: string | null;
  plate_number?: string | null;
  region?: string | null;
  is_online?: boolean;
  is_available?: boolean;
  is_active?: boolean;
  rating?: number;
  latitude?: number | null;
  longitude?: number | null;
  transporter?: TransporterProfile;
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
