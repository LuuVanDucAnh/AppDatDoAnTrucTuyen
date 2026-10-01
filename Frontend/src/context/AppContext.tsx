import { router } from 'expo-router';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';

import {
  ApiError,
  addressApi,
  authApi,
  bootstrapTokens,
  cartApi,
  hasSession,
  orderApi,
  resetTokens,
  reviewApi,
  setUnauthorizedHandler,
} from '@/services/api';
import { DELIVERY_FEE, resolveImageUrl } from '@/services/config';
import type {
  ApiAddress,
  ApiCart,
  ApiOrder,
  ApiUser,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from '@/services/types';

// ─────────────────────────────────────────────────────────────────────────────
// KIỂU DỮ LIỆU DÙNG TRONG UI (đã chuyển từ snake_case của API sang camelCase)
// ─────────────────────────────────────────────────────────────────────────────

export interface User {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  role: 'CUSTOMER' | 'RESTAURANT_OWNER' | 'ADMIN';
}

export interface Address {
  id: number;
  recipientName: string;
  phone: string;
  detailAddress: string;
  ward: string;
  district: string;
  city: string;
  isDefault: boolean;
}

export interface CartItem {
  /** id của cart_items trên Backend */
  id: number;
  foodId: number;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  note?: string;
  restaurantId: number;
  restaurantName: string;
}

export interface OrderItemView {
  id: number;
  foodId: number;
  name: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: number;
  restaurantId: number;
  restaurantName: string;
  restaurantImage?: string;
  status: OrderStatus;
  items: OrderItemView[];
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  foodTotal: number;
  deliveryFee: number;
  discount: number;
  totalAmount: number;
  note?: string;
  createdAt: string;
  reviewed: boolean;
  reviewRating?: number;
}

export type OrderFilter = 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export interface NewAddressInput {
  receiverName: string;
  phone: string;
  addressDetail: string;
  ward?: string;
  district?: string;
  city?: string;
  isDefault?: boolean;
}

interface AppContextType {
  // Xác thực
  user: User | null;
  isAuthenticated: boolean;
  /** true khi app đang đọc token đã lưu lúc khởi động */
  authLoading: boolean;
  /** Trả về user vừa đăng nhập (để màn auth điều hướng theo role), null nếu thất bại. */
  login: (email: string, password: string) => Promise<User | null>;
  register: (input: {
    fullName: string;
    phone: string;
    password: string;
    email?: string;
  }) => Promise<boolean>;
  logout: () => Promise<void>;

  // Địa chỉ
  addresses: Address[];
  defaultAddress: Address | null;
  addressesLoading: boolean;
  refreshAddresses: () => Promise<void>;
  setDefaultAddress: (id: number) => Promise<void>;
  addAddress: (input: NewAddressInput) => Promise<Address | null>;
  updateAddress: (id: number, input: Partial<NewAddressInput>) => Promise<boolean>;
  deleteAddress: (id: number) => Promise<boolean>;

  // Giỏ hàng
  cartRestaurantId: number | null;
  cartRestaurantName: string | null;
  cartRestaurantAddress: string | null;
  cartItems: CartItem[];
  cartCount: number;
  foodTotal: number;
  deliveryFee: number;
  discount: number;
  totalAmount: number;
  cartLoading: boolean;
  refreshCart: () => Promise<void>;
  addToCart: (
    food: { id: number; name: string; price: number; image?: string },
    restaurant: { id: number; name: string; isOpen?: boolean }
  ) => Promise<void>;
  updateQuantity: (foodId: number, quantity: number) => Promise<void>;
  removeFromCart: (foodId: number) => Promise<void>;
  clearCart: () => Promise<void>;

  // Đơn hàng
  orders: Order[];
  ordersLoading: boolean;
  refreshOrders: () => Promise<void>;
  checkout: (
    address: Address,
    paymentMethod: PaymentMethod,
    note?: string
  ) => Promise<Order | null>;
  cancelOrder: (orderId: number) => Promise<boolean>;
  submitReview: (orderId: number, rating: number, comment?: string) => Promise<boolean>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// ─────────────────────────────────────────────────────────────────────────────
// MAPPER: API (snake_case) → UI (camelCase)
// ─────────────────────────────────────────────────────────────────────────────

const num = (value: number | string | null | undefined) => Number(value ?? 0) || 0;

function mapUser(u: ApiUser): User {
  return {
    id: u.id,
    fullName: u.full_name,
    email: u.email ?? '',
    phone: u.phone_number,
    role: u.role ?? 'CUSTOMER',
  };
}

function mapAddress(a: ApiAddress): Address {
  return {
    id: a.id,
    recipientName: a.receiver_name,
    phone: a.phone_number,
    detailAddress: a.address_detail,
    ward: a.ward ?? '',
    district: a.district ?? '',
    city: a.city ?? '',
    isDefault: Boolean(a.is_default),
  };
}

function mapCartItems(cart: ApiCart | null): CartItem[] {
  if (!cart?.items?.length) return [];
  return cart.items.map((it) => ({
    id: it.id,
    foodId: it.food_id,
    name: it.food_name,
    price: num(it.price),
    quantity: it.quantity,
    image: resolveImageUrl(it.image),
    note: it.note ?? undefined,
    restaurantId: cart.restaurant?.id ?? 0,
    restaurantName: cart.restaurant?.name ?? '',
  }));
}

function formatOrderTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;

  const now = new Date();
  const time = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  const sameDay = date.toDateString() === now.toDateString();
  if (sameDay) return `Hôm nay, ${time}`;

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return `Hôm qua, ${time}`;

  return `${date.toLocaleDateString('vi-VN')}, ${time}`;
}

function mapOrder(o: ApiOrder, reviewedMap: Map<number, number>): Order {
  return {
    id: o.id,
    restaurantId: o.restaurant_id,
    restaurantName: o.restaurant?.name ?? `Nhà hàng #${o.restaurant_id}`,
    restaurantImage: resolveImageUrl(o.restaurant?.image),
    status: o.status,
    items: (o.items ?? []).map((it) => ({
      id: it.id,
      foodId: it.food_id,
      name: it.food_name,
      price: num(it.unit_price),
      quantity: it.quantity,
    })),
    paymentMethod: o.payment?.payment_method ?? 'CASH',
    paymentStatus: o.payment?.status ?? 'UNPAID',
    foodTotal: num(o.food_total),
    deliveryFee: num(o.delivery_fee),
    discount: num(o.discount),
    totalAmount: num(o.total_amount),
    note: o.note || undefined,
    createdAt: formatOrderTime(o.created_at),
    reviewed: reviewedMap.has(o.id),
    reviewRating: reviewedMap.get(o.id),
  };
}

/** Hiển thị lỗi từ Backend bằng đúng message tiếng Việt mà server trả về. */
function showApiError(err: unknown, fallbackTitle = 'Có lỗi xảy ra') {
  const message =
    err instanceof ApiError ? err.message : err instanceof Error ? err.message : String(err);
  Alert.alert(fallbackTitle, message);
}

function promptLogin() {
  Alert.alert('Bạn chưa đăng nhập', 'Vui lòng đăng nhập để tiếp tục.', [
    { text: 'Để sau', style: 'cancel' },
    { text: 'Đăng nhập', onPress: () => router.push('/auth') },
  ]);
}

// ─────────────────────────────────────────────────────────────────────────────
// PROVIDER
// ─────────────────────────────────────────────────────────────────────────────

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressesLoading, setAddressesLoading] = useState(false);

  const [cart, setCart] = useState<ApiCart | null>(null);
  const [cartLoading, setCartLoading] = useState(false);

  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  const isAuthenticated = user !== null;

  // ── Đăng xuất cục bộ (không gọi API) ──────────────────────────────────────
  const resetLocalState = useCallback(() => {
    setUser(null);
    setAddresses([]);
    setCart(null);
    setOrders([]);
  }, []);

  // ── Tải dữ liệu ───────────────────────────────────────────────────────────
  const refreshCart = useCallback(async () => {
    if (!hasSession()) {
      setCart(null);
      return;
    }
    setCartLoading(true);
    try {
      setCart(await cartApi.getMyCart());
    } catch (err) {
      if (!(err instanceof ApiError && err.status === 401)) showApiError(err, 'Không tải được giỏ hàng');
    } finally {
      setCartLoading(false);
    }
  }, []);

  const refreshAddresses = useCallback(async () => {
    if (!hasSession()) {
      setAddresses([]);
      return;
    }
    setAddressesLoading(true);
    try {
      const data = await addressApi.getMine();
      setAddresses(data.map(mapAddress));
    } catch (err) {
      if (!(err instanceof ApiError && err.status === 401))
        showApiError(err, 'Không tải được danh sách địa chỉ');
    } finally {
      setAddressesLoading(false);
    }
  }, []);

  const refreshOrders = useCallback(async () => {
    if (!hasSession()) {
      setOrders([]);
      return;
    }
    setOrdersLoading(true);
    try {
      // Lấy đánh giá của tôi trước để biết đơn nào đã đánh giá (mỗi đơn chỉ 1 lần)
      let reviewedMap = new Map<number, number>();
      try {
        const reviews = await reviewApi.getMine();
        reviewedMap = new Map(reviews.map((r) => [r.order_id, r.rating]));
      } catch {
        // Không lấy được đánh giá thì vẫn hiển thị đơn hàng
      }
      const { data } = await orderApi.getMyOrders();
      setOrders(data.map((o) => mapOrder(o, reviewedMap)));
    } catch (err) {
      if (!(err instanceof ApiError && err.status === 401))
        showApiError(err, 'Không tải được đơn hàng');
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  const loadUserData = useCallback(async () => {
    await Promise.all([refreshCart(), refreshAddresses(), refreshOrders()]);
  }, [refreshAddresses, refreshCart, refreshOrders]);

  // ── Khởi động: đọc token đã lưu & lấy lại thông tin user ───────────────────
  useEffect(() => {
    let mounted = true;

    setUnauthorizedHandler(() => {
      resetLocalState();
      Alert.alert('Phiên đăng nhập đã hết hạn', 'Vui lòng đăng nhập lại để tiếp tục.');
    });

    (async () => {
      try {
        const { accessToken } = await bootstrapTokens();
        if (!accessToken) return;
        const me = await authApi.me();
        if (!mounted) return;
        setUser(mapUser(me));
        await loadUserData();
      } catch {
        await resetTokens();
      } finally {
        if (mounted) setAuthLoading(false);
      }
    })();

    return () => {
      mounted = false;
      setUnauthorizedHandler(null);
    };
    // Chỉ chạy 1 lần khi app khởi động
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Xác thực ──────────────────────────────────────────────────────────────
  const login = useCallback(
    async (email: string, password: string) => {
      try {
        const apiUser = await authApi.login(email.trim(), password);
        const mapped = mapUser(apiUser);
        setUser(mapped);
        setAuthLoading(false);
        // Token đã có → tải giỏ hàng, địa chỉ, đơn hàng của user vừa đăng nhập
        await loadUserData();
        return mapped;
      } catch (err) {
        showApiError(err, 'Đăng nhập thất bại');
        return null;
      }
    },
    [loadUserData]
  );

  const register = useCallback(
    async (input: { fullName: string; phone: string; password: string; email?: string }) => {
      try {
        await authApi.register({
          full_name: input.fullName.trim(),
          phone_number: input.phone.trim(),
          password: input.password,
          email: input.email?.trim() || undefined,
        });
        return true;
      } catch (err) {
        showApiError(err, 'Đăng ký thất bại');
        return false;
      }
    },
    []
  );

  const logout = useCallback(async () => {
    await authApi.logout();
    resetLocalState();
  }, [resetLocalState]);

  // ── Địa chỉ ───────────────────────────────────────────────────────────────
  const setDefaultAddressFn = useCallback(async (id: number) => {
    if (!hasSession()) return promptLogin();
    try {
      await addressApi.setDefault(id);
      setAddresses((prev) =>
        [...prev]
          .map((a) => ({ ...a, isDefault: a.id === id }))
          .sort((a, b) => Number(b.isDefault) - Number(a.isDefault) || b.id - a.id)
      );
    } catch (err) {
      showApiError(err, 'Không đặt được địa chỉ mặc định');
    }
  }, []);

  const addAddress = useCallback(
    async (input: NewAddressInput): Promise<Address | null> => {
      if (!hasSession()) {
        promptLogin();
        return null;
      }
      try {
        const created = await addressApi.create({
          receiver_name: input.receiverName.trim(),
          phone_number: input.phone.trim(),
          address_detail: input.addressDetail.trim(),
          ward: input.ward?.trim() || undefined,
          district: input.district?.trim() || undefined,
          city: input.city?.trim() || undefined,
          is_default: input.isDefault ?? addresses.length === 0,
        });
        await refreshAddresses();
        return mapAddress(created);
      } catch (err) {
        showApiError(err, 'Không thêm được địa chỉ');
        return null;
      }
    },
    [addresses.length, refreshAddresses]
  );

  const updateAddress = useCallback(
    async (id: number, input: Partial<NewAddressInput>): Promise<boolean> => {
      if (!hasSession()) {
        promptLogin();
        return false;
      }
      try {
        await addressApi.update(id, {
          receiver_name: input.receiverName?.trim(),
          phone_number: input.phone?.trim(),
          address_detail: input.addressDetail?.trim(),
          ward: input.ward?.trim() || undefined,
          district: input.district?.trim() || undefined,
          city: input.city?.trim() || undefined,
          is_default: input.isDefault,
        });
        await refreshAddresses();
        return true;
      } catch (err) {
        showApiError(err, 'Không cập nhật được địa chỉ');
        return false;
      }
    },
    [refreshAddresses]
  );

  const deleteAddress = useCallback(
    async (id: number): Promise<boolean> => {
      if (!hasSession()) {
        promptLogin();
        return false;
      }
      try {
        await addressApi.remove(id);
        await refreshAddresses();
        return true;
      } catch (err) {
        showApiError(err, 'Không xóa được địa chỉ');
        return false;
      }
    },
    [refreshAddresses]
  );

  // ── Giỏ hàng ──────────────────────────────────────────────────────────────
  const addToCart = useCallback<AppContextType['addToCart']>(
    async (food, restaurant) => {
      if (!hasSession()) return promptLogin();

      // Nghiệp vụ: quán đóng cửa thì không nhận đơn
      if (restaurant.isOpen === false) {
        Alert.alert(
          'Quán hiện đóng cửa',
          `Nhà hàng "${restaurant.name}" hiện đang tạm đóng cửa. Vui lòng quay lại sau!`
        );
        return;
      }

      const send = async (forceReplace: boolean) => {
        const updated = await cartApi.addItem({
          food_id: food.id,
          quantity: 1,
          force_replace: forceReplace,
        });
        setCart(updated);
      };

      try {
        await send(false);
        Alert.alert('Thành công', `Đã thêm "${food.name}" vào giỏ hàng!`);
      } catch (err) {
        // 409: giỏ đang có món của quán khác → hỏi người dùng có xoá giỏ cũ không
        if (err instanceof ApiError && err.code === 'DIFFERENT_RESTAURANT') {
          const currentName = cart?.restaurant?.name ?? 'quán khác';
          Alert.alert(
            'Tạo giỏ hàng mới?',
            `Giỏ hàng của bạn đang có món của "${currentName}". Bạn có muốn xoá giỏ cũ để đặt từ "${restaurant.name}" không?`,
            [
              { text: 'Hủy', style: 'cancel' },
              {
                text: 'Tạo giỏ mới',
                style: 'destructive',
                onPress: async () => {
                  try {
                    await send(true);
                    Alert.alert(
                      'Đã tạo giỏ mới',
                      `Đã thêm "${food.name}" vào giỏ hàng của "${restaurant.name}"!`
                    );
                  } catch (e) {
                    showApiError(e, 'Không thêm được món');
                  }
                },
              },
            ]
          );
          return;
        }
        showApiError(err, 'Không thêm được món vào giỏ');
      }
    },
    [cart?.restaurant?.name]
  );

  /** Tìm cart_item id từ food_id (các màn hình đang làm việc theo foodId). */
  const findCartItemId = useCallback(
    (foodId: number) => cart?.items.find((it) => it.food_id === foodId)?.id,
    [cart]
  );

  const updateQuantity = useCallback(
    async (foodId: number, quantity: number) => {
      if (!hasSession()) return promptLogin();
      const itemId = findCartItemId(foodId);
      if (!itemId) return;
      try {
        // Backend tự xoá món khi quantity <= 0
        setCart(await cartApi.updateItem(itemId, { quantity }));
      } catch (err) {
        showApiError(err, 'Không cập nhật được số lượng');
      }
    },
    [findCartItemId]
  );

  const removeFromCart = useCallback(
    async (foodId: number) => {
      if (!hasSession()) return promptLogin();
      const itemId = findCartItemId(foodId);
      if (!itemId) return;
      try {
        setCart(await cartApi.removeItem(itemId));
      } catch (err) {
        showApiError(err, 'Không xoá được món');
      }
    },
    [findCartItemId]
  );

  const clearCart = useCallback(async () => {
    if (!hasSession()) return;
    try {
      setCart(await cartApi.clear());
    } catch (err) {
      showApiError(err, 'Không xoá được giỏ hàng');
    }
  }, []);

  // ── Đặt hàng ──────────────────────────────────────────────────────────────
  const checkout = useCallback<AppContextType['checkout']>(
    async (address, paymentMethod, note) => {
      if (!hasSession()) {
        promptLogin();
        return null;
      }
      if (!address?.id) {
        Alert.alert('Thiếu địa chỉ giao hàng', 'Vui lòng thêm hoặc chọn địa chỉ giao hàng.');
        return null;
      }
      try {
        const created = await orderApi.checkout({
          address_id: address.id,
          payment_method: paymentMethod,
          note: note?.trim() || undefined,
        });
        // Backend đã xoá giỏ trong transaction → đồng bộ lại giỏ & danh sách đơn
        await Promise.all([refreshCart(), refreshOrders()]);
        return mapOrder(created, new Map());
      } catch (err) {
        showApiError(err, 'Đặt hàng thất bại');
        return null;
      }
    },
    [refreshCart, refreshOrders]
  );

  const cancelOrder = useCallback(
    async (orderId: number) => {
      try {
        await orderApi.cancel(orderId);
        await refreshOrders();
        Alert.alert('Đã huỷ đơn hàng', `Đơn hàng #${orderId} đã được huỷ thành công!`);
        return true;
      } catch (err) {
        showApiError(err, 'Không thể huỷ đơn');
        return false;
      }
    },
    [refreshOrders]
  );

  const submitReview = useCallback(
    async (orderId: number, rating: number, comment?: string) => {
      try {
        await reviewApi.create({ order_id: orderId, rating, comment: comment?.trim() || undefined });
        await refreshOrders();
        Alert.alert('Cảm ơn bạn', 'Đánh giá của bạn đã được ghi nhận và gửi đến quán!');
        return true;
      } catch (err) {
        showApiError(err, 'Không gửi được đánh giá');
        return false;
      }
    },
    [refreshOrders]
  );

  // ── Giá trị dẫn xuất ──────────────────────────────────────────────────────
  const cartItems = useMemo(() => mapCartItems(cart), [cart]);
  const cartCount = cart?.total_items ?? 0;
  const foodTotal = cart?.food_total ?? 0;
  // Nghiệp vụ Backend: phí ship cố định 15.000đ, chưa có voucher nên discount = 0
  const deliveryFee = cartItems.length > 0 ? DELIVERY_FEE : 0;
  const discount = 0;
  const totalAmount = Math.max(0, foodTotal + deliveryFee - discount);

  const defaultAddress = useMemo(
    () => addresses.find((a) => a.isDefault) ?? addresses[0] ?? null,
    [addresses]
  );

  const value: AppContextType = {
    user,
    isAuthenticated,
    authLoading,
    login,
    register,
    logout,

    addresses,
    defaultAddress,
    addressesLoading,
    refreshAddresses,
    setDefaultAddress: setDefaultAddressFn,
    addAddress,
    updateAddress,
    deleteAddress,

    cartRestaurantId: cart?.restaurant?.id ?? null,
    cartRestaurantName: cart?.restaurant?.name ?? null,
    cartRestaurantAddress: cart?.restaurant?.address ?? null,
    cartItems,
    cartCount,
    foodTotal,
    deliveryFee,
    discount,
    totalAmount,
    cartLoading,
    refreshCart,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,

    orders,
    ordersLoading,
    refreshOrders,
    checkout,
    cancelOrder,
    submitReview,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
