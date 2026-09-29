import React, { createContext, useContext, useState } from 'react';
import { Alert } from 'react-native';

export interface User {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  role: 'CUSTOMER' | 'RESTAURANT_OWNER' | 'ADMIN';
  avatar?: string;
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
  id: string;
  foodId: number;
  name: string;
  price: number;
  quantity: number;
  image: string;
  restaurantId: number;
  restaurantName: string;
}

export interface Order {
  id: string;
  restaurantId: number;
  restaurantName: string;
  status: 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'DELIVERING' | 'DELIVERED' | 'CANCELLED';
  address: Address;
  items: CartItem[];
  paymentMethod: 'CASH' | 'MOMO' | 'VNPAY';
  paymentStatus: 'UNPAID' | 'PAID' | 'REFUNDED';
  foodTotal: number;
  deliveryFee: number;
  discount: number;
  voucherCode?: string;
  totalAmount: number;
  note?: string;
  createdAt: string;
  reviewed?: boolean;
  reviewRating?: number;
  reviewComment?: string;
}

interface AppContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  addresses: Address[];
  defaultAddress: Address;
  setDefaultAddress: (id: number) => void;
  cartRestaurantId: number | null;
  cartRestaurantName: string | null;
  cartItems: CartItem[];
  cartCount: number;
  foodTotal: number;
  deliveryFee: number;
  discount: number;
  voucherCode: string | null;
  totalAmount: number;
  addToCart: (
    food: { id: number; name: string; price: number; image: string },
    restaurant: { id: number; name: string; isOpen?: boolean }
  ) => void;
  updateQuantity: (foodId: number, quantity: number) => void;
  removeFromCart: (foodId: number) => void;
  clearCart: () => void;
  applyVoucher: (code: string) => boolean;
  checkout: (
    address: Address,
    paymentMethod: 'CASH' | 'MOMO' | 'VNPAY',
    note?: string
  ) => Order | null;
  orders: Order[];
  cancelOrder: (orderId: string) => boolean;
  submitReview: (orderId: string, rating: number, comment?: string) => boolean;
}

const DEFAULT_ADDRESSES: Address[] = [
  {
    id: 1,
    recipientName: 'Đức Anh',
    phone: '0987654321',
    detailAddress: 'Số 123 Đường Nguyễn Tri Phương',
    ward: 'Phường 5',
    district: 'Quận 5',
    city: 'TP. Hồ Chí Minh',
    isDefault: true,
  },
  {
    id: 2,
    recipientName: 'Đức Anh (Công ty)',
    phone: '0987654321',
    detailAddress: 'Tòa nhà Landmark 81, 720A Điện Biên Phủ',
    ward: 'Phường 22',
    district: 'Bình Thạnh',
    city: 'TP. Hồ Chí Minh',
    isDefault: false,
  },
];

const INITIAL_ORDERS: Order[] = [
  {
    id: 'ORD-98214',
    restaurantId: 1,
    restaurantName: 'Cơm Tấm Ba Ghiền',
    status: 'DELIVERED',
    address: DEFAULT_ADDRESSES[0],
    items: [
      {
        id: 'ci-1',
        foodId: 101,
        name: 'Cơm Tấm Sườn Bì Chả',
        price: 55000,
        quantity: 2,
        image:
          'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80',
        restaurantId: 1,
        restaurantName: 'Cơm Tấm Ba Ghiền',
      },
    ],
    paymentMethod: 'CASH',
    paymentStatus: 'PAID',
    foodTotal: 110000,
    deliveryFee: 15000,
    discount: 15000,
    voucherCode: 'FREESHIP',
    totalAmount: 110000,
    createdAt: 'Hôm qua, 18:30',
    reviewed: false,
  },
  {
    id: 'ORD-98215',
    restaurantId: 3,
    restaurantName: 'Trà Sữa KOI Thé - Pasteur',
    status: 'DELIVERING',
    address: DEFAULT_ADDRESSES[0],
    items: [
      {
        id: 'ci-2',
        foodId: 103,
        name: 'Trà Sữa KOI Macchiato',
        price: 45000,
        quantity: 2,
        image:
          'https://images.unsplash.com/photo-1558857563-b37cf5a5b515?w=600&auto=format&fit=crop&q=80',
        restaurantId: 3,
        restaurantName: 'Trà Sữa KOI Thé - Pasteur',
      },
    ],
    paymentMethod: 'MOMO',
    paymentStatus: 'PAID',
    foodTotal: 90000,
    deliveryFee: 15000,
    discount: 0,
    totalAmount: 105000,
    note: 'Ít đá 50% đường giúp mình nhé',
    createdAt: 'Hôm nay, 08:15',
  },
];

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  // Người dùng hiện tại
  const [user, setUser] = useState<User | null>({
    id: 1,
    fullName: 'Lưu Văn Đức Anh',
    email: 'ducanh@gmail.com',
    phone: '0987654321',
    role: 'CUSTOMER',
  });

  // Địa chỉ giao hàng
  const [addresses, setAddresses] = useState<Address[]>(DEFAULT_ADDRESSES);
  const defaultAddress = addresses.find((a) => a.isDefault) || addresses[0];

  const setDefaultAddress = (id: number) => {
    setAddresses((prev) =>
      prev.map((a) => ({
        ...a,
        isDefault: a.id === id,
      }))
    );
  };

  // Trạng thái giỏ hàng
  const [cartRestaurantId, setCartRestaurantId] = useState<number | null>(1);
  const [cartRestaurantName, setCartRestaurantName] = useState<string | null>('Cơm Tấm Ba Ghiền');
  const [cartItems, setCartItems] = useState<CartItem[]>([
    {
      id: 'ci-init-1',
      foodId: 1,
      name: 'Cơm Tấm Sườn Bì Chả',
      price: 55000,
      quantity: 1,
      image:
        'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80',
      restaurantId: 1,
      restaurantName: 'Cơm Tấm Ba Ghiền',
    },
    {
      id: 'ci-init-2',
      foodId: 2,
      name: 'Canh Khổ Qua Nhồi Thịt',
      price: 35000,
      quantity: 1,
      image:
        'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80',
      restaurantId: 1,
      restaurantName: 'Cơm Tấm Ba Ghiền',
    },
  ]);

  const [voucherCode, setVoucherCode] = useState<string | null>(null);
  const [discount, setDiscount] = useState<number>(0);

  // Danh sách đơn hàng
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);

  // Tính toán giỏ hàng theo nghiệp vụ
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const foodTotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryFee = cartItems.length > 0 ? 15000 : 0; // 15.000đ cố định theo nghiệp vụ
  const totalAmount = Math.max(0, foodTotal + deliveryFee - discount);

  // 1. Thêm món vào giỏ hàng (Áp dụng đúng nghiệp vụ: 1 quán tại 1 thời điểm & Quán phải OPEN)
  const addToCart = (
    food: { id: number; name: string; price: number; image: string },
    restaurant: { id: number; name: string; isOpen?: boolean }
  ) => {
    // Nghiệp vụ: Nếu quán đóng cửa -> không cho đặt món
    if (restaurant.isOpen === false) {
      Alert.alert(
        'Quán hiện đóng cửa',
        `Nhà hàng "${restaurant.name}" hiện đang tạm đóng cửa. Vui lòng quay lại sau!`
      );
      return;
    }

    // Nghiệp vụ: Nếu giỏ đang có món của quán khác -> Hỏi xác nhận tạo giỏ mới
    if (cartRestaurantId && cartRestaurantId !== restaurant.id && cartItems.length > 0) {
      Alert.alert(
        'Tạo giỏ hàng mới?',
        `Giỏ hàng của bạn đang có món của "${cartRestaurantName}". Bạn có muốn xoá giỏ hàng cũ để bắt đầu đặt từ "${restaurant.name}" không?`,
        [
          { text: 'Hủy', style: 'cancel' },
          {
            text: 'Tạo giỏ mới',
            style: 'destructive',
            onPress: () => {
              setCartRestaurantId(restaurant.id);
              setCartRestaurantName(restaurant.name);
              setVoucherCode(null);
              setDiscount(0);
              setCartItems([
                {
                  id: `ci-${Date.now()}`,
                  foodId: food.id,
                  name: food.name,
                  price: food.price,
                  quantity: 1,
                  image: food.image,
                  restaurantId: restaurant.id,
                  restaurantName: restaurant.name,
                },
              ]);
              Alert.alert('Đã tạo giỏ mới', `Đã thêm "${food.name}" vào giỏ hàng của "${restaurant.name}"!`);
            },
          },
        ]
      );
      return;
    }

    // Cùng quán hoặc giỏ trống: Thêm hoặc tăng số lượng
    setCartRestaurantId(restaurant.id);
    setCartRestaurantName(restaurant.name);

    setCartItems((prev) => {
      const existing = prev.find((item) => item.foodId === food.id);
      if (existing) {
        return prev.map((item) =>
          item.foodId === food.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [
        ...prev,
        {
          id: `ci-${Date.now()}`,
          foodId: food.id,
          name: food.name,
          price: food.price,
          quantity: 1,
          image: food.image,
          restaurantId: restaurant.id,
          restaurantName: restaurant.name,
        },
      ];
    });

    Alert.alert('Thành công', `Đã thêm "${food.name}" vào giỏ hàng!`);
  };

  // 2. Sửa số lượng món trong giỏ (giảm về 0 tự động xoá)
  const updateQuantity = (foodId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(foodId);
      return;
    }
    setCartItems((prev) =>
      prev.map((item) => (item.foodId === foodId ? { ...item, quantity } : item))
    );
  };

  // 3. Xoá món khỏi giỏ
  const removeFromCart = (foodId: number) => {
    setCartItems((prev) => {
      const filtered = prev.filter((item) => item.foodId !== foodId);
      if (filtered.length === 0) {
        setCartRestaurantId(null);
        setCartRestaurantName(null);
        setVoucherCode(null);
        setDiscount(0);
      }
      return filtered;
    });
  };

  // 4. Xoá toàn bộ giỏ
  const clearCart = () => {
    setCartItems([]);
    setCartRestaurantId(null);
    setCartRestaurantName(null);
    setVoucherCode(null);
    setDiscount(0);
  };

  // 5. Áp dụng mã giảm giá
  const applyVoucher = (code: string): boolean => {
    const upper = code.trim().toUpperCase();
    if (upper === 'FREESHIP') {
      setVoucherCode('FREESHIP');
      setDiscount(15000); // Miễn phí giao hàng 15k
      Alert.alert('Áp dụng mã thành công', 'Giảm 15.000đ phí giao hàng với mã FREESHIP!');
      return true;
    }
    if (upper === 'MILKTEA' || upper === 'GIAM30') {
      setVoucherCode(upper);
      const discountVal = Math.min(Math.round(foodTotal * 0.3), 30000);
      setDiscount(discountVal);
      Alert.alert('Áp dụng mã thành công', `Giảm 30% (${discountVal.toLocaleString('vi-VN')}đ) đơn hàng!`);
      return true;
    }
    if (upper === 'FOOD50K') {
      if (foodTotal < 150000) {
        Alert.alert('Không đủ điều kiện', 'Mã FOOD50K áp dụng cho đơn từ 150.000đ trở lên!');
        return false;
      }
      setVoucherCode('FOOD50K');
      setDiscount(50000);
      Alert.alert('Áp dụng mã thành công', 'Giảm 50.000đ cho đơn hàng!');
      return true;
    }
    Alert.alert('Mã không hợp lệ', 'Vui lòng kiểm tra lại mã ưu đãi hoặc thời hạn sử dụng!');
    return false;
  };

  // 6. Đặt hàng (Checkout) theo đúng Transaction nghiệp vụ
  const checkout = (
    address: Address,
    paymentMethod: 'CASH' | 'MOMO' | 'VNPAY',
    note?: string
  ): Order | null => {
    if (cartItems.length === 0 || !cartRestaurantId || !cartRestaurantName) {
      Alert.alert('Giỏ hàng trống', 'Vui lòng thêm món trước khi thanh toán!');
      return null;
    }

    const newOrder: Order = {
      id: `ORD-${Math.floor(10000 + Math.random() * 90000)}`,
      restaurantId: cartRestaurantId,
      restaurantName: cartRestaurantName,
      status: 'PENDING',
      address,
      items: [...cartItems],
      paymentMethod,
      paymentStatus: paymentMethod === 'CASH' ? 'UNPAID' : 'PAID',
      foodTotal,
      deliveryFee,
      discount,
      voucherCode: voucherCode || undefined,
      totalAmount,
      note,
      createdAt: 'Vừa xong',
    };

    setOrders((prev) => [newOrder, ...prev]);
    clearCart();

    return newOrder;
  };

  // 7. Huỷ đơn hàng (Chỉ huỷ được khi PENDING theo nghiệp vụ)
  const cancelOrder = (orderId: string): boolean => {
    const target = orders.find((o) => o.id === orderId);
    if (!target) return false;

    if (target.status !== 'PENDING') {
      Alert.alert(
        'Không thể huỷ đơn',
        'Quán đã xác nhận và đang chế biến món ăn. Đơn hàng chỉ có thể huỷ khi còn ở trạng thái Chờ xác nhận (PENDING)!'
      );
      return false;
    }

    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status: 'CANCELLED',
              paymentStatus: o.paymentStatus === 'PAID' ? 'REFUNDED' : o.paymentStatus,
            }
          : o
      )
    );

    Alert.alert('Đã huỷ đơn hàng', `Đơn hàng #${orderId} đã được huỷ thành công!`);
    return true;
  };

  // 8. Viết đánh giá (Chỉ đánh giá được khi DELIVERED, mỗi đơn 1 lần)
  const submitReview = (orderId: string, rating: number, comment?: string): boolean => {
    const target = orders.find((o) => o.id === orderId);
    if (!target) return false;

    if (target.status !== 'DELIVERED') {
      Alert.alert('Chưa thể đánh giá', 'Bạn chỉ có thể đánh giá những đơn hàng đã giao thành công!');
      return false;
    }

    if (target.reviewed) {
      Alert.alert('Đã đánh giá', 'Mỗi đơn hàng chỉ được gửi đánh giá một lần duy nhất!');
      return false;
    }

    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              reviewed: true,
              reviewRating: rating,
              reviewComment: comment,
            }
          : o
      )
    );

    Alert.alert('Cảm ơn bạn', 'Đánh giá của bạn đã được ghi nhận và gửi đến quán!');
    return true;
  };

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        addresses,
        defaultAddress,
        setDefaultAddress,
        cartRestaurantId,
        cartRestaurantName,
        cartItems,
        cartCount,
        foodTotal,
        deliveryFee,
        discount,
        voucherCode,
        totalAmount,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        applyVoucher,
        checkout,
        orders,
        cancelOrder,
        submitReview,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
