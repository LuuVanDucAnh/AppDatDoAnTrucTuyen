import Constants from 'expo-constants';
import { Platform } from 'react-native';

const BACKEND_PORT = 3000;

/**
 * Xác định địa chỉ Backend.
 *
 * Thứ tự ưu tiên:
 *  1. Biến môi trường EXPO_PUBLIC_API_URL (đặt trong file .env của Frontend)
 *  2. IP của máy đang chạy Metro (hostUri) — dùng được cho cả máy ảo & điện thoại thật
 *     đang cùng mạng Wi-Fi.
 *  3. Mặc định theo nền tảng: Android emulator dùng 10.0.2.2, còn lại localhost.
 */
function resolveBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv) return fromEnv.replace(/\/+$/, '');

  const hostUri =
    Constants.expoConfig?.hostUri ??
    (Constants as any).expoGoConfig?.debuggerHost ??
    (Constants as any).manifest2?.extra?.expoGo?.debuggerHost;

  if (typeof hostUri === 'string' && hostUri.length > 0) {
    const host = hostUri.split(':')[0];
    if (host) return `http://${host}:${BACKEND_PORT}`;
  }

  if (Platform.OS === 'android') return `http://10.0.2.2:${BACKEND_PORT}`;
  return `http://localhost:${BACKEND_PORT}`;
}

/** Ví dụ: http://192.168.1.10:3000 */
export const SERVER_URL = resolveBaseUrl();

/** Ví dụ: http://192.168.1.10:3000/api/v1 */
export const API_BASE_URL = `${SERVER_URL}/api/v1`;

/** Phí giao hàng cố định theo nghiệp vụ Backend (orders.service.js) */
export const DELIVERY_FEE = 15000;

/** Địa chỉ trang Web Quản Trị dành cho Quản trị viên sàn (Admin Portal) */
export const ADMIN_WEB_URL = process.env.EXPO_PUBLIC_ADMIN_WEB_URL || 'http://localhost:5173';

export const DEFAULT_RESTAURANT_IMAGE =
  'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80';
export const DEFAULT_FOOD_IMAGE =
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80';

/**
 * Ảnh do Backend upload trả về đường dẫn tương đối (/uploads/...),
 * hàm này ghép thành URL đầy đủ để <Image> tải được.
 */
export function resolveImageUrl(
  image?: string | null,
  fallback: string = DEFAULT_RESTAURANT_IMAGE,
): string {
  if (!image || typeof image !== 'string') return fallback;
  const trimmed = image.trim();
  if (trimmed === '') return fallback;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith('/uploads/')) return `${SERVER_URL}${trimmed}`;
  if (trimmed.startsWith('uploads/')) return `${SERVER_URL}/${trimmed}`;
  // Nếu là chuỗi file name tương đối cũ không nằm trong thư mục uploads (ví dụ: 'pho-viet.jpg')
  return fallback;
}
