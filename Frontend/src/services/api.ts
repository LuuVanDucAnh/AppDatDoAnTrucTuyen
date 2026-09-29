import { API_BASE_URL } from './config';
import { clearTokens, loadTokens, saveTokens } from './storage';
import type {
  ApiAddress,
  ApiCart,
  ApiCategory,
  ApiOwnerDashboard,
  ApiOwnerOrder,
  ApiRevenuePoint,
  ApiTopFood,
  ApiEnvelope,
  ApiFood,
  ApiOrder,
  ApiRestaurant,
  ApiRestaurantMenu,
  ApiReview,
  ApiSearchResult,
  ApiUser,
  LoginResult,
  OrderStatus,
  PaginationMeta,
  PaymentMethod,
} from './types';

/** Lỗi trả về từ Backend, giữ nguyên message tiếng Việt của server. */
export class ApiError extends Error {
  status: number;
  errors?: any;
  /** Mã lỗi nghiệp vụ suy ra từ response (ví dụ giỏ hàng khác nhà hàng). */
  code?: string;

  constructor(message: string, status: number, errors?: any, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
    this.code = code;
  }
}

// ── Token trong RAM (đồng bộ với AsyncStorage) ───────────────────────────────
let accessToken: string | null = null;
let refreshToken: string | null = null;
let onUnauthorized: (() => void) | null = null;

/** Gọi 1 lần khi app khởi động để đọc token đã lưu. */
export async function bootstrapTokens() {
  const stored = await loadTokens();
  accessToken = stored.accessToken;
  refreshToken = stored.refreshToken;
  return stored;
}

export function setTokens(access: string, refresh?: string | null) {
  accessToken = access;
  if (refresh !== undefined && refresh !== null) refreshToken = refresh;
  void saveTokens(access, refresh ?? undefined);
}

export async function resetTokens() {
  accessToken = null;
  refreshToken = null;
  await clearTokens();
}

export function hasSession() {
  return Boolean(accessToken);
}

/** AppContext đăng ký callback để tự đăng xuất khi refresh token cũng hết hạn. */
export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
}

// ── Lớp gọi HTTP ─────────────────────────────────────────────────────────────
interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined | null>;
  /** true = gắn Authorization header */
  auth?: boolean;
  /** Dùng nội bộ để tránh refresh token lặp vô hạn */
  _retried?: boolean;
}

function buildUrl(path: string, query?: RequestOptions['query']) {
  const url = `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
  if (!query) return url;
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') params.append(key, String(value));
  });
  const qs = params.toString();
  return qs ? `${url}?${qs}` : url;
}

/** Xin Access Token mới bằng Refresh Token. Trả về true nếu thành công. */
async function tryRefreshToken(): Promise<boolean> {
  if (!refreshToken) return false;
  try {
    const res = await fetch(buildUrl('/users/refresh'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    const json = (await res.json()) as ApiEnvelope<{ accessToken: string }>;
    if (!res.ok || !json?.success || !json.data?.accessToken) return false;
    setTokens(json.data.accessToken);
    return true;
  } catch {
    return false;
  }
}

async function request<T>(
  path: string,
  options: RequestOptions = {}
): Promise<{ data: T; message: string; meta?: PaginationMeta }> {
  const { method = 'GET', body, query, auth = false } = options;

  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (auth && accessToken) headers.Authorization = `Bearer ${accessToken}`;

  let res: Response;
  try {
    res = await fetch(buildUrl(path, query), {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(
      `Không kết nối được tới server (${API_BASE_URL}). Kiểm tra Backend đã chạy và máy đang cùng mạng Wi-Fi.`,
      0
    );
  }

  const text = await res.text();
  let json: ApiEnvelope<T> | null = null;
  try {
    json = text ? (JSON.parse(text) as ApiEnvelope<T>) : null;
  } catch {
    json = null;
  }

  if (res.status === 401 && auth && !options._retried) {
    if (await tryRefreshToken()) {
      return request<T>(path, { ...options, _retried: true });
    }
    await resetTokens();
    onUnauthorized?.();
    throw new ApiError(json?.message || 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.', 401);
  }

  if (!res.ok || !json?.success) {
    const message = json?.message || `Yêu cầu thất bại (HTTP ${res.status})`;
    const errs: any = json?.errors;
    // Backend trả 409 kèm errors.new_restaurant_id khi giỏ hàng đang có món của quán khác
    const code =
      res.status === 409 && errs && 'new_restaurant_id' in errs ? 'DIFFERENT_RESTAURANT' : undefined;
    throw new ApiError(message, res.status, errs, code);
  }

  return { data: json.data, message: json.message, meta: json.meta };
}

// ── AUTH ─────────────────────────────────────────────────────────────────────
export const authApi = {
  /** POST /users/login — lưu luôn cả 2 token */
  async login(email: string, password: string) {
    const { data } = await request<LoginResult>('/users/login', {
      method: 'POST',
      body: { email, password },
    });
    setTokens(data.accessToken, data.refreshToken);
    return data.user;
  },

  /** POST /users — đăng ký (role mặc định CUSTOMER) */
  async register(input: {
    full_name: string;
    phone_number: string;
    password: string;
    email?: string;
  }) {
    const { data } = await request<ApiUser>('/users', {
      method: 'POST',
      body: { ...input, role: 'CUSTOMER', status: 1 },
    });
    return data;
  },

  /** GET /profile/me */
  async me() {
    const { data } = await request<ApiUser>('/profile/me', { auth: true });
    return data;
  },

  /** PUT /profile/me */
  async updateMe(input: { full_name?: string; email?: string; phone_number?: string }) {
    const { data } = await request<ApiUser>('/profile/me', {
      method: 'PUT',
      body: input,
      auth: true,
    });
    return data;
  },

  /** PATCH /profile/change-password */
  async changePassword(current_password: string, new_password: string) {
    const { message } = await request<null>('/profile/change-password', {
      method: 'PATCH',
      body: { current_password, new_password },
      auth: true,
    });
    return message;
  },

  logout: resetTokens,
};

// ── NHÀ HÀNG & MÓN ĂN ────────────────────────────────────────────────────────
export const restaurantApi = {
  /** GET /restaurants/active — chỉ quán OPEN, kèm average_rating & total_reviews */
  async getActive(params: { search?: string; page?: number; limit?: number } = {}) {
    const { data, meta } = await request<ApiRestaurant[]>('/restaurants/active', {
      query: { search: params.search, page: params.page, limit: params.limit ?? 20 },
    });
    return { data, meta };
  },

  /** GET /restaurants/:id/menu — thông tin quán + danh mục kèm món AVAILABLE */
  async getMenu(restaurantId: number | string) {
    const { data } = await request<ApiRestaurantMenu>(`/restaurants/${restaurantId}/menu`);
    return data;
  },

  /** GET /restaurants/:id */
  async getById(restaurantId: number | string) {
    const { data } = await request<ApiRestaurant>(`/restaurants/${restaurantId}`);
    return data;
  },
};

export const foodApi = {
  /** GET /foods/featured — món bán chạy kèm thông tin quán */
  async getFeatured(limit = 10) {
    const { data } = await request<ApiFood[]>('/foods/featured', { query: { limit } });
    return data;
  },
};

// ── TÌM KIẾM ─────────────────────────────────────────────────────────────────
export const searchApi = {
  /** GET /search?q= — tìm đồng thời nhà hàng + món ăn */
  async searchAll(keyword: string, limit = 10) {
    const { data } = await request<ApiSearchResult>('/search', { query: { q: keyword, limit } });
    return data;
  },

  /** GET /search/foods?q=&min_price=&max_price= */
  async searchFoods(params: { q: string; min_price?: number; max_price?: number; limit?: number }) {
    const { data, meta } = await request<ApiFood[]>('/search/foods', { query: params });
    return { data, meta };
  },
};

// ── GIỎ HÀNG ─────────────────────────────────────────────────────────────────
export const cartApi = {
  /** GET /carts/my-cart */
  async getMyCart() {
    const { data } = await request<ApiCart>('/carts/my-cart', { auth: true });
    return data;
  },

  /**
   * POST /carts/add-item
   * Ném ApiError.code = 'DIFFERENT_RESTAURANT' (409) nếu giỏ đang có món quán khác.
   * Gọi lại với force_replace = true để xoá giỏ cũ.
   */
  async addItem(input: {
    food_id: number;
    quantity?: number;
    note?: string;
    force_replace?: boolean;
  }) {
    const { data } = await request<ApiCart>('/carts/add-item', {
      method: 'POST',
      body: input,
      auth: true,
    });
    return data;
  },

  /** PATCH /carts/items/:id — quantity <= 0 thì Backend tự xoá món */
  async updateItem(itemId: number, input: { quantity?: number; note?: string }) {
    const { data } = await request<ApiCart>(`/carts/items/${itemId}`, {
      method: 'PATCH',
      body: input,
      auth: true,
    });
    return data;
  },

  /** DELETE /carts/items/:id */
  async removeItem(itemId: number) {
    const { data } = await request<ApiCart>(`/carts/items/${itemId}`, {
      method: 'DELETE',
      auth: true,
    });
    return data;
  },

  /** DELETE /carts/clear */
  async clear() {
    const { data } = await request<ApiCart>('/carts/clear', { method: 'DELETE', auth: true });
    return data;
  },
};

// ── ĐƠN HÀNG ─────────────────────────────────────────────────────────────────
export const orderApi = {
  /** POST /orders/checkout — transaction: tạo order + order_items + payment, xoá giỏ */
  async checkout(input: { address_id: number; payment_method: PaymentMethod; note?: string }) {
    const { data } = await request<ApiOrder>('/orders/checkout', {
      method: 'POST',
      body: input,
      auth: true,
    });
    return data;
  },

  /** GET /orders/my-orders?status=ACTIVE|COMPLETED|CANCELLED */
  async getMyOrders(params: { status?: OrderStatus | 'ACTIVE' | 'COMPLETED'; limit?: number } = {}) {
    const { data, meta } = await request<ApiOrder[]>('/orders/my-orders', {
      query: { status: params.status, limit: params.limit ?? 50 },
      auth: true,
    });
    return { data, meta };
  },

  /** GET /orders/:id/detail */
  async getDetail(orderId: number) {
    const { data } = await request<ApiOrder>(`/orders/${orderId}/detail`, { auth: true });
    return data;
  },

  /** PATCH /orders/:id/cancel — chỉ được khi đơn còn PENDING */
  async cancel(orderId: number) {
    const { data } = await request<ApiOrder>(`/orders/${orderId}/cancel`, {
      method: 'PATCH',
      auth: true,
    });
    return data;
  },
};

// ── ĐỊA CHỈ ──────────────────────────────────────────────────────────────────
export const addressApi = {
  /** GET /profile/addresses — địa chỉ mặc định lên đầu */
  async getMine() {
    const { data } = await request<ApiAddress[]>('/profile/addresses', { auth: true });
    return data;
  },

  /** POST /profile/addresses */
  async create(input: {
    receiver_name: string;
    phone_number: string;
    address_detail: string;
    ward?: string;
    district?: string;
    city?: string;
    is_default?: boolean;
  }) {
    const { data } = await request<ApiAddress>('/profile/addresses', {
      method: 'POST',
      body: input,
      auth: true,
    });
    return data;
  },

  /** PATCH /profile/addresses/:id/set-default */
  async setDefault(addressId: number) {
    const { data } = await request<ApiAddress>(`/profile/addresses/${addressId}/set-default`, {
      method: 'PATCH',
      auth: true,
    });
    return data;
  },

  /** DELETE /profile/addresses/:id (soft delete) */
  async remove(addressId: number) {
    await request<null>(`/profile/addresses/${addressId}`, { method: 'DELETE', auth: true });
  },
};

// ── ĐÁNH GIÁ ─────────────────────────────────────────────────────────────────
export const reviewApi = {
  /** GET /profile/reviews */
  async getMine() {
    const { data } = await request<ApiReview[]>('/profile/reviews', { auth: true });
    return data;
  },

  /** POST /profile/reviews — chỉ đơn DELIVERED, mỗi đơn 1 lần */
  async create(input: { order_id: number; rating: number; comment?: string }) {
    const { data } = await request<ApiReview>('/profile/reviews', {
      method: 'POST',
      body: input,
      auth: true,
    });
    return data;
  },
};

// ── CHỦ QUÁN (OWNER) ─────────────────────────────────────────────────────────
// Mọi route đều yêu cầu đăng nhập bằng tài khoản role RESTAURANT_OWNER
// và chỉ thao tác được trên nhà hàng do chính mình sở hữu.
export const ownerApi = {
  /** GET /owner/my-restaurants */
  async getMyRestaurants() {
    const { data } = await request<ApiRestaurant[]>('/owner/my-restaurants', { auth: true });
    return data;
  },

  /** PATCH /owner/restaurants/:id/toggle-status — OPEN ↔ CLOSED */
  async toggleRestaurantStatus(restaurantId: number) {
    const { data } = await request<ApiRestaurant>(
      `/owner/restaurants/${restaurantId}/toggle-status`,
      { method: 'PATCH', auth: true }
    );
    return data;
  },

  // ── Đơn hàng ──────────────────────────────────────────────────────────────
  /** GET /owner/restaurants/:id/orders?status= */
  async getOrders(restaurantId: number, params: { status?: OrderStatus; limit?: number } = {}) {
    const { data, meta } = await request<ApiOwnerOrder[]>(
      `/owner/restaurants/${restaurantId}/orders`,
      { query: { status: params.status, limit: params.limit ?? 50 }, auth: true }
    );
    return { data, meta };
  },

  /**
   * PATCH /owner/restaurants/:id/orders/:orderId/status
   * Backend chỉ cho phép chuyển đúng luồng:
   *   PENDING → CONFIRMED | CANCELLED
   *   CONFIRMED → PREPARING | CANCELLED
   *   PREPARING → DELIVERING
   *   DELIVERING → DELIVERED
   */
  async updateOrderStatus(restaurantId: number, orderId: number, status: OrderStatus) {
    const { data } = await request<ApiOwnerOrder>(
      `/owner/restaurants/${restaurantId}/orders/${orderId}/status`,
      { method: 'PATCH', body: { status }, auth: true }
    );
    return data;
  },

  // ── Thực đơn ──────────────────────────────────────────────────────────────
  /** GET /owner/restaurants/:id/foods — khác API khách: trả cả món OUT_OF_STOCK */
  async getFoods(restaurantId: number, params: { status?: string; category_id?: number } = {}) {
    const { data, meta } = await request<ApiFood[]>(`/owner/restaurants/${restaurantId}/foods`, {
      query: { status: params.status, category_id: params.category_id, limit: 200 },
      auth: true,
    });
    return { data, meta };
  },

  /** PATCH /owner/restaurants/:id/foods/:foodId/toggle-status — AVAILABLE ↔ OUT_OF_STOCK */
  async toggleFoodStatus(restaurantId: number, foodId: number) {
    const { data } = await request<ApiFood>(
      `/owner/restaurants/${restaurantId}/foods/${foodId}/toggle-status`,
      { method: 'PATCH', auth: true }
    );
    return data;
  },

  /** POST /owner/restaurants/:id/foods */
  async createFood(
    restaurantId: number,
    input: { category_id: number; name: string; price: number; description?: string; image?: string }
  ) {
    const { data } = await request<ApiFood>(`/owner/restaurants/${restaurantId}/foods`, {
      method: 'POST',
      body: input,
      auth: true,
    });
    return data;
  },

  /** DELETE /owner/restaurants/:id/foods/:foodId */
  async deleteFood(restaurantId: number, foodId: number) {
    await request<null>(`/owner/restaurants/${restaurantId}/foods/${foodId}`, {
      method: 'DELETE',
      auth: true,
    });
  },

  // ── Danh mục ──────────────────────────────────────────────────────────────
  /** GET /owner/restaurants/:id/categories */
  async getCategories(restaurantId: number) {
    const { data } = await request<ApiCategory[]>(
      `/owner/restaurants/${restaurantId}/categories`,
      { auth: true }
    );
    return data;
  },

  /** POST /owner/restaurants/:id/categories */
  async createCategory(restaurantId: number, input: { name: string; description?: string }) {
    const { data } = await request<ApiCategory>(`/owner/restaurants/${restaurantId}/categories`, {
      method: 'POST',
      body: input,
      auth: true,
    });
    return data;
  },

  // ── Thống kê ──────────────────────────────────────────────────────────────
  /** GET /owner/restaurants/:id/dashboard */
  async getDashboard(restaurantId: number) {
    const { data } = await request<ApiOwnerDashboard>(
      `/owner/restaurants/${restaurantId}/dashboard`,
      { auth: true }
    );
    return data;
  },

  /** GET /owner/restaurants/:id/stats/revenue?groupBy=day|month|year */
  async getRevenueStats(
    restaurantId: number,
    params: { from?: string; to?: string; groupBy?: 'day' | 'month' | 'year' } = {}
  ) {
    const { data } = await request<ApiRevenuePoint[]>(
      `/owner/restaurants/${restaurantId}/stats/revenue`,
      { query: { ...params, groupBy: params.groupBy ?? 'day' }, auth: true }
    );
    return data;
  },

  /** GET /owner/restaurants/:id/stats/top-foods */
  async getTopFoods(restaurantId: number, limit = 5) {
    const { data } = await request<ApiTopFood[]>(
      `/owner/restaurants/${restaurantId}/stats/top-foods`,
      { query: { limit }, auth: true }
    );
    return data;
  },

  /** GET /owner/restaurants/:id/reviews */
  async getReviews(restaurantId: number) {
    const { data } = await request<ApiReview[]>(`/owner/restaurants/${restaurantId}/reviews`, {
      auth: true,
    });
    return data;
  },
};
