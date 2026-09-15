export type UserRole = 'CUSTOMER' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  avatar_url?: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  price: string;
  available_stock: number;
  image_url: string;
  is_active: boolean;
  created_at: string;
}

export interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  unit_price: string;
  subtotal: string;
  product: Product;
}

export interface Cart {
  id: string;
  user_id: string;
  status: 'ACTIVE' | 'CONVERTED' | 'ABANDONED';
  items: CartItem[];
  total_quantity: number;
  subtotal: string;
  updated_at: string;
}

export type OrderStatus = 'PENDING' | 'RESERVED' | 'PAID' | 'FAILED' | 'EXPIRED' | 'CANCELLED';

export interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  unit_price: string;
  quantity: number;
  subtotal: string;
}

export interface Reservation {
  id: string;
  product_id: string;
  quantity: number;
  status: 'ACTIVE' | 'CONSUMED' | 'RELEASED' | 'EXPIRED';
  expires_at: string;
  created_at: string;
}

export interface Order {
  id: string;
  user_id: string;
  customer?: {
    id: string;
    full_name: string;
    email: string;
  } | null;
  status: OrderStatus;
  subtotal: string;
  shipping_fee: string;
  total: string;
  shipping_address: Record<string, any>;
  items: OrderItem[];
  reservations: Reservation[];
  created_at: string;
  updated_at: string;
}


export type PaymentStatus = 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'TIMEOUT' | 'REFUNDED';
export type MockPaymentMode = 'MOCK_SUCCESS' | 'MOCK_FAILURE' | 'MOCK_TIMEOUT';

export interface Payment {
  id: string;
  order_id: string;
  idempotency_key: string;
  status: PaymentStatus;
  amount: string;
  provider: string;
  provider_reference?: string | null;
  error_message?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminStats {
  total_customers: number;
  total_products: number;
  total_orders: number;
  total_revenue: string;
  active_reservations: number;
  pending_orders: number;
  failed_payments: number;
}

export interface AuditUserIdentity {
  id: string;
  display_name: string;
  email: string;
  role: string;
  is_deleted: boolean;
}

export interface AuditLog {
  id: string;
  actor_user_id?: string | null;
  target_user_id?: string | null;
  actor?: AuditUserIdentity | null;
  target?: AuditUserIdentity | null;
  action: string;
  entity_type: string;
  entity_id: string;
  before_data?: Record<string, any> | null;
  after_data?: Record<string, any> | null;
  reason?: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
  request_id?: string | null;
  created_at: string;
}


export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}
