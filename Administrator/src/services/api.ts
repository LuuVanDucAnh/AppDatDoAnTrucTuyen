import type {
  AdminOrder,
  AdminPayment,
  AdminRestaurant,
  AdminReview,
  AdminUser,
  ApiEnvelope,
  OrderStatus,
  PlatformDashboard,
  RestaurantStatus,
  RevenueStatPoint,
  TopRestaurantStat,
  UserRole,
} from './types';

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

export class ApiError extends Error {
  status: number;
  errors?: unknown;

  constructor(message: string, status: number, errors?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
  }
}

// ── Token Management in localStorage ──────────────────────────────────────────
const TOKEN_KEY = 'admin_access_token';
const REFRESH_TOKEN_KEY = 'admin_refresh_token';
const USER_KEY = 'admin_user';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): AdminUser | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveSession(token: string, refreshToken?: string, user?: AdminUser) {
  localStorage.setItem(TOKEN_KEY, token);
  if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

// ── Centralized HTTP Request ──────────────────────────────────────────────────
async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiEnvelope<T>> {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const token = getStoredToken();
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const json = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMsg = json?.message || `Lỗi hệ thống (${response.status})`;
    if (response.status === 401) {
      clearSession();
      window.dispatchEvent(new Event('admin:unauthorized'));
    }
    throw new ApiError(errorMsg, response.status, json?.errors);
  }

  return json as ApiEnvelope<T>;
}

// ── Auth API ──────────────────────────────────────────────────────────────────
export const authApi = {
  async login(email: string, password: string):Promise<{ user: AdminUser; accessToken: string; refreshToken?: string }> {
    const res = await request<{ user: AdminUser; accessToken: string; refreshToken?: string }>(
      '/users/login',
      {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }
    );
    if (res.data.user.role !== 'ADMIN') {
      throw new ApiError('Tài khoản này không có quyền Quản trị viên (ADMIN)', 403);
    }
    saveSession(res.data.accessToken, res.data.refreshToken, res.data.user);
    return res.data;
  },

  logout() {
    clearSession();
  },
};

// ── Dashboard API ─────────────────────────────────────────────────────────────
export const dashboardApi = {
  async getDashboard(): Promise<PlatformDashboard> {
    const res = await request<PlatformDashboard>('/admin/dashboard');
    return res.data;
  },

  async getRevenueStats(params?: { from?: string; to?: string; groupBy?: 'day' | 'month' | 'year' }): Promise<RevenueStatPoint[]> {
    const q = new URLSearchParams();
    if (params?.from) q.append('from', params.from);
    if (params?.to) q.append('to', params.to);
    if (params?.groupBy) q.append('groupBy', params.groupBy);
    const res = await request<RevenueStatPoint[]>(`/admin/stats/revenue?${q.toString()}`);
    return res.data;
  },

  async getTopRestaurants(params?: { limit?: number; sortBy?: 'revenue' | 'orders' }): Promise<TopRestaurantStat[]> {
    const q = new URLSearchParams();
    if (params?.limit) q.append('limit', String(params.limit));
    if (params?.sortBy) q.append('sortBy', params.sortBy);
    const res = await request<TopRestaurantStat[]>(`/admin/stats/top-restaurants?${q.toString()}`);
    return res.data;
  },
};

// ── Users API ─────────────────────────────────────────────────────────────────
export const usersApi = {
  async getUsers(params?: {
    search?: string;
    role?: UserRole | '';
    status?: number | '';
    page?: number;
    limit?: number;
  }): Promise<ApiEnvelope<AdminUser[]>> {
    const q = new URLSearchParams();
    if (params?.search) q.append('search', params.search);
    if (params?.role) q.append('role', params.role);
    if (params?.status !== undefined && params?.status !== '') q.append('status', String(params.status));
    if (params?.page) q.append('page', String(params.page));
    if (params?.limit) q.append('limit', String(params.limit));
    return request<AdminUser[]>(`/admin/users?${q.toString()}`);
  },

  async getUserDetail(id: number): Promise<AdminUser> {
    const res = await request<AdminUser>(`/admin/users/${id}`);
    return res.data;
  },

  async toggleStatus(id: number): Promise<{ message: string; user: AdminUser }> {
    const res = await request<{ message: string; user: AdminUser }>(`/admin/users/${id}/toggle-status`, {
      method: 'PATCH',
    });
    return res.data;
  },

  async changeRole(id: number, role: UserRole): Promise<AdminUser> {
    const res = await request<AdminUser>(`/admin/users/${id}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
    return res.data;
  },

  async createUser(data: {
    full_name: string;
    email?: string;
    phone_number: string;
    password: string;
    role?: UserRole;
  }): Promise<AdminUser> {
    const res = await request<AdminUser>('/admin/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.data;
  },

  async updateUser(
    id: number,
    data: {
      full_name?: string;
      email?: string;
      phone_number?: string;
      role?: UserRole;
      status?: number;
      password?: string;
    }
  ): Promise<AdminUser> {
    const res = await request<AdminUser>(`/admin/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return res.data;
  },

  async deleteUser(id: number): Promise<string> {
    const res = await request<{ message: string }>(`/admin/users/${id}`, {
      method: 'DELETE',
    });
    return res.message;
  },
};

// ── Restaurants API ───────────────────────────────────────────────────────────
export const restaurantsApi = {
  async getRestaurants(params?: {
    search?: string;
    status?: RestaurantStatus | '';
    page?: number;
    limit?: number;
  }): Promise<ApiEnvelope<AdminRestaurant[]>> {
    const q = new URLSearchParams();
    if (params?.search) q.append('search', params.search);
    if (params?.status) q.append('status', params.status);
    if (params?.page) q.append('page', String(params.page));
    if (params?.limit) q.append('limit', String(params.limit));
    return request<AdminRestaurant[]>(`/admin/restaurants?${q.toString()}`);
  },

  async getRestaurantDetail(id: number): Promise<AdminRestaurant> {
    const res = await request<AdminRestaurant>(`/admin/restaurants/${id}`);
    return res.data;
  },

  async setStatus(id: number, status: RestaurantStatus): Promise<AdminRestaurant> {
    const res = await request<AdminRestaurant>(`/admin/restaurants/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    return res.data;
  },

  async createRestaurant(data: {
    owner_id?: number;
    name: string;
    address: string;
    phone_number?: string;
    description?: string;
    image?: string;
    opening_time?: string;
    closing_time?: string;
  }): Promise<AdminRestaurant> {
    const res = await request<AdminRestaurant>('/admin/restaurants', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.data;
  },

  async updateRestaurant(
    id: number,
    data: {
      name?: string;
      address?: string;
      phone_number?: string;
      description?: string;
      image?: string;
      opening_time?: string;
      closing_time?: string;
      status?: RestaurantStatus;
      owner_id?: number;
    }
  ): Promise<AdminRestaurant> {
    const res = await request<AdminRestaurant>(`/admin/restaurants/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return res.data;
  },

  async deleteRestaurant(id: number): Promise<string> {
    const res = await request<{ message: string }>(`/admin/restaurants/${id}`, {
      method: 'DELETE',
    });
    return res.message;
  },
};

// ── Orders API ────────────────────────────────────────────────────────────────
export const ordersApi = {
  async getOrders(params?: {
    search?: string;
    status?: OrderStatus | '';
    restaurant_id?: number;
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiEnvelope<AdminOrder[]>> {
    const q = new URLSearchParams();
    if (params?.search) q.append('search', params.search);
    if (params?.status) q.append('status', params.status);
    if (params?.restaurant_id) q.append('restaurant_id', String(params.restaurant_id));
    if (params?.from) q.append('from', params.from);
    if (params?.to) q.append('to', params.to);
    if (params?.page) q.append('page', String(params.page));
    if (params?.limit) q.append('limit', String(params.limit));
    return request<AdminOrder[]>(`/admin/orders?${q.toString()}`);
  },

  async getOrderDetail(id: number): Promise<AdminOrder> {
    const res = await request<AdminOrder>(`/admin/orders/${id}`);
    return res.data;
  },

  async forceUpdateStatus(id: number, status: OrderStatus): Promise<AdminOrder> {
    const res = await request<AdminOrder>(`/admin/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    return res.data;
  },

  async deleteOrder(id: number): Promise<string> {
    const res = await request<{ message: string }>(`/admin/orders/${id}`, {
      method: 'DELETE',
    });
    return res.message;
  },
};

// ── Payments API ──────────────────────────────────────────────────────────────
export const paymentsApi = {
  async getPayments(params?: {
    payment_method?: string;
    status?: string;
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiEnvelope<AdminPayment[]>> {
    const q = new URLSearchParams();
    if (params?.payment_method) q.append('payment_method', params.payment_method);
    if (params?.status) q.append('status', params.status);
    if (params?.from) q.append('from', params.from);
    if (params?.to) q.append('to', params.to);
    if (params?.page) q.append('page', String(params.page));
    if (params?.limit) q.append('limit', String(params.limit));
    return request<AdminPayment[]>(`/admin/payments?${q.toString()}`);
  },
};

// ── Reviews API ───────────────────────────────────────────────────────────────
export const reviewsApi = {
  async getReviews(params?: {
    search?: string;
    restaurant_id?: number;
    rating?: number;
    page?: number;
    limit?: number;
  }): Promise<ApiEnvelope<AdminReview[]>> {
    const q = new URLSearchParams();
    if (params?.search) q.append('search', params.search);
    if (params?.restaurant_id) q.append('restaurant_id', String(params.restaurant_id));
    if (params?.rating) q.append('rating', String(params.rating));
    if (params?.page) q.append('page', String(params.page));
    if (params?.limit) q.append('limit', String(params.limit));
    return request<AdminReview[]>(`/admin/reviews?${q.toString()}`);
  },

  async deleteReview(id: number): Promise<string> {
    const res = await request<{ message: string }>(`/admin/reviews/${id}`, {
      method: 'DELETE',
    });
    return res.message;
  },
};
