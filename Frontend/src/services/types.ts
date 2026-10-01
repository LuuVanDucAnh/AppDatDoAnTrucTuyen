/**
 * Các kiểu dữ liệu đúng theo response của Backend (snake_case).
 * Lưu ý: cột DECIMAL của MySQL được sequelize trả về dưới dạng string ("65000.00"),
 * nên mọi trường tiền tệ đều khai báo `number | string` và cần Number() trước khi tính.
 */

export type UserRole = 'CUSTOMER' | 'RESTAURANT_OWNER' | 'ADMIN';
export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'DELIVERING'
  | 'DELIVERED'
  | 'CANCELLED';
export type PaymentMethod = 'CASH' | 'MOMO' | 'VNPAY' | 'BANK_TRANSFER';
export type PaymentStatus = 'UNPAID' | 'PAID' | 'FAILED' | 'REFUNDED';
export type RestaurantStatus = 'OPEN' | 'CLOSED' | 'TEMPORARILY_CLOSED';
export type FoodStatus = 'AVAILABLE' | 'OUT_OF_STOCK';

export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: PaginationMeta;
  errors?: unknown;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage?: boolean;
  hasPrevPage?: boolean;
}

export interface ApiUser {
  id: number;
  full_name: string;
  email: string | null;
  phone_number: string;
  role: UserRole;
  status: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface LoginResult {
  user: ApiUser;
  accessToken: string;
  refreshToken: string;
}

export interface ApiAddress {
  id: number;
  user_id: number;
  receiver_name: string;
  phone_number: string;
  address_detail: string;
  ward: string | null;
  district: string | null;
  city: string | null;
  is_default: number | boolean | null;
}

export interface ApiRestaurant {
  id: number;
  owner_id: number | null;
  name: string;
  description: string | null;
  address: string;
  phone_number: string | null;
  image: string | null;
  opening_time: string | null;
  closing_time: string | null;
  status: RestaurantStatus;
  /** Chỉ có ở /restaurants/active, /restaurants/:id/menu và /search */
  average_rating?: number | string;
  total_reviews?: number | string;
}

export interface ApiFood {
  id: number;
  category_id: number;
  name: string;
  description: string | null;
  price: number | string;
  image: string | null;
  status: FoodStatus;
  /** Chỉ có ở /foods/featured và /search */
  sold_quantity?: number;
  category?: ApiCategory;
}

export interface ApiCategory {
  id: number;
  restaurant_id: number;
  name: string;
  description?: string | null;
  foods?: ApiFood[];
  restaurant?: ApiRestaurant;
}

export interface ApiRestaurantMenu extends ApiRestaurant {
  average_rating: number;
  total_reviews: number;
  categories: ApiCategory[];
}

export interface ApiCartItem {
  id: number;
  food_id: number;
  food_name: string;
  image: string | null;
  price: number;
  quantity: number;
  note: string | null;
  subtotal: number;
}

export interface ApiCart {
  cart_id: number;
  restaurant: Pick<ApiRestaurant, 'id' | 'name' | 'image' | 'address'> | null;
  total_items: number;
  food_total: number;
  items: ApiCartItem[];
}

export interface ApiOrderItem {
  id: number;
  order_id: number;
  food_id: number;
  food_name: string;
  quantity: number;
  unit_price: number | string;
  subtotal: number | string;
  note: string | null;
}

export interface ApiPayment {
  id: number;
  order_id: number;
  payment_method: PaymentMethod;
  amount: number | string;
  status: PaymentStatus;
  transaction_code: string | null;
  payment_date: string | null;
}

export interface ApiOrder {
  id: number;
  user_id: number;
  restaurant_id: number;
  address_id: number;
  food_total: number | string;
  delivery_fee: number | string;
  discount: number | string;
  total_amount: number | string;
  note: string | null;
  status: OrderStatus;
  created_at: string;
  updated_at: string;
  items?: ApiOrderItem[];
  restaurant?: Pick<ApiRestaurant, 'id' | 'name' | 'image' | 'address' | 'phone_number'>;
  address?: ApiAddress;
  payment?: ApiPayment;
}

export interface ApiReview {
  id: number;
  user_id: number;
  restaurant_id: number;
  order_id: number;
  rating: number;
  comment: string | null;
  created_at?: string;
  restaurant?: Pick<ApiRestaurant, 'id' | 'name' | 'image'>;
}

export interface ApiSearchResult {
  keyword: string;
  restaurants: { total: number; data: ApiRestaurant[] };
  foods: { total: number; data: ApiFood[] };
}

// ── CHỦ QUÁN (OWNER) ─────────────────────────────────────────────────────────

/** Đơn hàng phía chủ quán: có thêm thông tin khách đặt */
export interface ApiOwnerOrder extends ApiOrder {
  user?: {
    id: number;
    full_name: string;
    phone_number: string;
    email: string | null;
  };
}

export interface ApiOwnerDashboard {
  today: { orders: number; revenue: number };
  month: { orders: number; revenue: number };
  pending_orders: number;
  active_orders: number;
  average_rating: number;
  total_reviews: number;
  total_foods: number;
}

export interface ApiRevenuePoint {
  period: string;
  order_count: number;
  revenue: number;
  food_total: number;
}

export interface ApiTopFood {
  food_id: number;
  food_name: string;
  total_sold: number;
  total_revenue: number;
  order_count: number;
}

// ── QUẢN TRỊ VIÊN (ADMIN) ──────────────────────────────────────────────────

/** Đơn hàng phía Admin: có đầy đủ thông tin khách hàng và nhà hàng */
export interface ApiAdminOrder extends Omit<ApiOrder, 'restaurant'> {
  user?: {
    id: number;
    full_name: string;
    phone_number: string;
    email: string | null;
  };
  restaurant?: {
    id: number;
    name: string;
    address: string;
    phone_number: string | null;
    image?: string | null;
  };
}

export interface ApiAdminDashboard {
  users: { total: number; new_today: number };
  restaurants: { total: number; open: number; closed: number };
  orders: {
    total: number;
    today: number;
    this_month: number;
    pending: number;
    cancelled: number;
  };
  revenue: { total: number; today: number; this_month: number };
  total_reviews: number;
}
