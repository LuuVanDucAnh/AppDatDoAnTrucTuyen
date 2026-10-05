export type UserRole = 'CUSTOMER' | 'RESTAURANT_OWNER' | 'ADMIN' | 'OWNER';

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'DELIVERING'
  | 'DELIVERED'
  | 'CANCELLED';

export type PaymentMethod = 'CASH' | 'MOMO' | 'VNPAY' | 'ZALOPAY' | 'BANK_TRANSFER';
export type PaymentStatus = 'UNPAID' | 'PAID' | 'FAILED' | 'REFUNDED';
export type RestaurantStatus = 'OPEN' | 'CLOSED' | 'BUSY' | 'SUSPENDED' | 'TEMPORARILY_CLOSED';

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage?: boolean;
  hasPrevPage?: boolean;
}

export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: PaginationMeta;
  errors?: unknown;
}

export interface AdminUser {
  id: number;
  full_name: string;
  email: string | null;
  phone_number: string;
  role: UserRole;
  status: number; // 1 = active, 0 = locked
  created_at: string;
  updated_at?: string;
  month_orders?: number;
  month_revenue?: number;
  total_orders?: number;
  total_revenue?: number;
  total_spent?: number;
  addresses?: Array<{
    id: number;
    receiver_name: string;
    phone_number: string;
    address_detail: string;
    is_default: boolean;
  }>;
}

export interface AdminRestaurant {
  id: number;
  owner_id: number;
  name: string;
  address: string;
  phone_number?: string;
  description?: string;
  image?: string;
  status: RestaurantStatus;
  opening_time?: string;
  closing_time?: string;
  created_at: string;
  owner?: {
    id: number;
    full_name: string;
    email: string;
    phone_number: string;
  };
  total_orders?: number;
  total_revenue?: number | string;
  rating?: number | string;
  review_count?: number;
}

export interface AdminOrderItem {
  id: number;
  food_id: number;
  food_name: string;
  quantity: number;
  price: number | string;
  subtotal?: number | string;
  food?: {
    id: number;
    name: string;
    image?: string;
  };
}

export interface AdminOrder {
  id: number;
  user_id: number;
  restaurant_id: number;
  total_amount: number | string;
  food_total?: number | string;
  delivery_fee?: number | string;
  discount?: number | string;
  status: OrderStatus;
  note?: string;
  created_at: string;
  updated_at?: string;
  user?: {
    id: number;
    full_name: string;
    phone_number: string;
    email?: string;
  };
  restaurant?: {
    id: number;
    name: string;
    address: string;
    phone_number?: string;
  };
  items?: AdminOrderItem[];
  payment?: {
    id: number;
    payment_method: PaymentMethod;
    status: PaymentStatus;
    amount: number | string;
  };
  address?: {
    receiver_name: string;
    phone_number: string;
    address_detail: string;
  };
}

export interface AdminPayment {
  id: number;
  order_id: number;
  user_id: number;
  payment_method: PaymentMethod;
  amount: number | string;
  status: PaymentStatus;
  created_at: string;
  order?: {
    id: number;
    total_amount: number | string;
    status: OrderStatus;
    restaurant?: {
      id: number;
      name: string;
    };
    user?: {
      id: number;
      full_name: string;
    };
  };
}

export interface AdminReview {
  id: number;
  order_id: number;
  user_id: number;
  restaurant_id: number;
  rating: number;
  comment?: string;
  created_at: string;
  user?: {
    id: number;
    full_name: string;
    email?: string;
  };
  restaurant?: {
    id: number;
    name: string;
  };
}

export interface PlatformDashboard {
  users: {
    total: number;
    new_today: number;
    customers?: number;
    owners?: number;
    admins?: number;
    active?: number;
    locked?: number;
  };
  restaurants: {
    total: number;
    open: number;
    closed: number;
  };
  orders: {
    total: number;
    today: number;
    this_month: number;
    pending: number;
    preparing?: number;
    delivering?: number;
    completed?: number;
    cancelled: number;
  };
  revenue: {
    total: number | string;
    today: number | string;
    this_month: number | string;
  };
  reviews?: {
    total: number;
    avg_rating: number;
    positive: number;
    negative: number;
  };
  payments?: {
    total_gmv: number;
    paid_amount: number;
    unpaid_amount: number;
    methods: Array<{
      method: string;
      count: number;
      amount: number;
    }>;
  };
  total_reviews: number;
}

export interface TopRestaurantStat {
  restaurant_id: number;
  name: string;
  image?: string;
  order_count?: number;
  total_revenue?: number | string;
}

export interface RevenueStatPoint {
  date?: string;
  period?: string;
  order_count: number;
  revenue: number;
}
