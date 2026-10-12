import type { OrderStatus, RestaurantStatus } from './types';

export const API_ORIGIN = import.meta.env.VITE_API_URL
  ? new URL(import.meta.env.VITE_API_URL).origin
  : 'http://localhost:3000';

export const DEFAULT_FOOD_IMAGE =
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80';

export const DEFAULT_RESTAURANT_IMAGE =
  'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80';

export function formatMoney(v: number | string | null | undefined): string {
  const num = Number(v) || 0;
  return num.toLocaleString('vi-VN') + ' đ';
}

export function formatShortMoney(v: number | string | null | undefined): string {
  const num = Number(v) || 0;
  if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(1).replace(/\.0$/, '') + ' tỷ';
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + ' tr';
  if (num >= 1_000) return Math.round(num / 1_000) + 'k';
  return num.toLocaleString('vi-VN') + ' đ';
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export function formatTimeAgo(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000);
    if (diffSec < 60) return 'Vừa xong';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)} phút trước`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} giờ trước`;
    return `${Math.floor(diffSec / 86400)} ngày trước`;
  } catch {
    return '';
  }
}

export function resolveImageUrl(url?: string | null, fallback = DEFAULT_FOOD_IMAGE): string {
  if (!url || typeof url !== 'string' || !url.trim()) return fallback;
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith('/uploads/')) return `${API_ORIGIN}${trimmed}`;
  if (trimmed.startsWith('uploads/')) return `${API_ORIGIN}/${trimmed}`;
  if (/\.(jpe?g|png|webp|gif|svg)$/i.test(trimmed)) {
    return `${API_ORIGIN}/uploads/foods/${trimmed}`;
  }
  return fallback;
}

export function getOrderStatusLabel(status: OrderStatus): string {
  switch (status) {
    case 'PENDING':
      return 'Chờ xác nhận';
    case 'CONFIRMED':
      return 'Đã xác nhận';
    case 'PREPARING':
      return 'Đang chuẩn bị';
    case 'DELIVERING':
      return 'Đang giao hàng';
    case 'DELIVERED':
      return 'Hoàn thành';
    case 'CANCELLED':
      return 'Đã hủy';
    default:
      return status;
  }
}

export function getOrderStatusColor(status: OrderStatus): { bg: string; color: string; border: string } {
  switch (status) {
    case 'PENDING':
      return { bg: '#fff7ed', color: '#ea580c', border: '#ffedd5' };
    case 'CONFIRMED':
      return { bg: '#eff6ff', color: '#2563eb', border: '#dbeafe' };
    case 'PREPARING':
      return { bg: '#faf5ff', color: '#7c3aed', border: '#f3e8ff' };
    case 'DELIVERING':
      return { bg: '#f0fdf4', color: '#16a34a', border: '#dcfce7' };
    case 'DELIVERED':
      return { bg: '#ecfdf5', color: '#059669', border: '#a7f3d0' };
    case 'CANCELLED':
      return { bg: '#fef2f2', color: '#dc2626', border: '#fee2e2' };
    default:
      return { bg: '#f1f5f9', color: '#475569', border: '#e2e8f0' };
  }
}
