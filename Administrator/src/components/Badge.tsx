import React from 'react';
import type { OrderStatus, PaymentStatus, RestaurantStatus, UserRole } from '../services/types';

export function OrderBadge({ status }: { status: OrderStatus }) {
  const map: Record<OrderStatus, { label: string; cls: string }> = {
    PENDING: { label: 'Chờ duyệt', cls: 'badge-warning' },
    CONFIRMED: { label: 'Đã xác nhận', cls: 'badge-blue' },
    PREPARING: { label: 'Đang nấu', cls: 'badge-purple' },
    DELIVERING: { label: 'Đang giao', cls: 'badge-warning' },
    DELIVERED: { label: 'Thành công', cls: 'badge-success' },
    CANCELLED: { label: 'Đã hủy', cls: 'badge-danger' },
  };
  const conf = map[status] || { label: status, cls: 'badge-neutral' };
  return <span className={`badge ${conf.cls}`}>{conf.label}</span>;
}

export function RestaurantBadge({ status }: { status: RestaurantStatus }) {
  const map: Record<string, { label: string; cls: string }> = {
    OPEN: { label: 'Đang mở cửa', cls: 'badge-success' },
    CLOSED: { label: 'Đóng cửa', cls: 'badge-neutral' },
    BUSY: { label: 'Đang bận', cls: 'badge-warning' },
    SUSPENDED: { label: 'Đình chỉ', cls: 'badge-danger' },
  };
  const conf = map[status] || { label: status, cls: 'badge-neutral' };
  return <span className={`badge ${conf.cls}`}>{conf.label}</span>;
}

export function UserRoleBadge({ role }: { role: UserRole }) {
  const map: Record<string, { label: string; cls: string }> = {
    ADMIN: { label: 'Quản trị viên', cls: 'badge-danger' },
    RESTAURANT_OWNER: { label: 'Chủ nhà hàng', cls: 'badge-blue' },
    OWNER: { label: 'Chủ nhà hàng', cls: 'badge-blue' },
    CUSTOMER: { label: 'Khách hàng', cls: 'badge-neutral' },
  };
  const conf = map[role] || { label: role, cls: 'badge-neutral' };
  return <span className={`badge ${conf.cls}`}>{conf.label}</span>;
}

export function PaymentBadge({ status }: { status: PaymentStatus }) {
  const map: Record<PaymentStatus, { label: string; cls: string }> = {
    PAID: { label: 'Đã thanh toán', cls: 'badge-success' },
    UNPAID: { label: 'Chưa thanh toán', cls: 'badge-warning' },
    REFUNDED: { label: 'Đã hoàn tiền', cls: 'badge-purple' },
    FAILED: { label: 'Thất bại', cls: 'badge-danger' },
  };
  const conf = map[status] || { label: status, cls: 'badge-neutral' };
  return <span className={`badge ${conf.cls}`}>{conf.label}</span>;
}
