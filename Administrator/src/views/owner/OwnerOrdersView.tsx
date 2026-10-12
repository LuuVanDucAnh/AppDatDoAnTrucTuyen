import React, { useEffect, useState, useMemo } from 'react';
import {
  Phone,
  MapPin,
  Clock,
  Check,
  X,
  Volume2,
  VolumeX,
  Zap,
  ArrowRight,
  Bicycle,
  Utensils,
  Receipt,
  FileEdit,
} from 'lucide-react';
import type { AdminRestaurant, OrderStatus, OwnerOrder } from '../../services/types';
import { ownerApi } from '../../services/api';
import './owner-mobile-ui.css';

interface OwnerOrdersViewProps {
  restaurant: AdminRestaurant | null;
  onRefreshStats?: () => void;
}

const TABS = [
  { key: 'PENDING', label: 'Chờ duyệt', statuses: ['PENDING'] },
  { key: 'COOKING', label: 'Đang nấu', statuses: ['CONFIRMED', 'PREPARING'] },
  { key: 'DELIVERING', label: 'Đang giao', statuses: ['DELIVERING'] },
  { key: 'HISTORY', label: 'Lịch sử', statuses: ['DELIVERED', 'CANCELLED'] },
] as const;

type TabKey = (typeof TABS)[number]['key'];

const money = (v: number | string) => Number(v || 0).toLocaleString('vi-VN');

function formatClock(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '11:30';
  return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

function timeAgo(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const mins = Math.max(1, Math.floor((Date.now() - d.getTime()) / 60000));
  const clock = formatClock(iso);
  if (mins < 60) return `${mins} phút trước (${clock})`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ trước (${clock})`;
  return `${d.toLocaleDateString('vi-VN')} (${clock})`;
}

const DEFAULT_FOOD_IMG =
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=300&q=80';

export function OwnerOrdersView({ restaurant, onRefreshStats }: OwnerOrdersViewProps) {
  const [orders, setOrders] = useState<OwnerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabKey>('PENDING');
  const [busyOrderId, setBusyOrderId] = useState<number | null>(null);

  // Tính năng mockup: Tự động nhận đơn & Chuông báo
  const [autoAccept, setAutoAccept] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg = 'Thao tác thành công') => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const loadOrders = async () => {
    if (!restaurant) return;
    try {
      setLoading(true);
      const res = await ownerApi.getOrders(restaurant.id, { limit: 100 });
      setOrders(res.data || []);
      onRefreshStats?.();
    } catch (err: any) {
      console.error('Không tải được đơn hàng:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [restaurant?.id]);

  // Đếm số lượng đơn theo 4 tab
  const counts = useMemo(() => {
    const map: Record<TabKey, number> = { PENDING: 0, COOKING: 0, DELIVERING: 0, HISTORY: 0 };
    for (const t of TABS) {
      map[t.key] = orders.filter((o) => (t.statuses as readonly string[]).includes(o.status)).length;
    }
    return map;
  }, [orders]);

  // Danh sách đơn được chọn theo tab
  const shown = useMemo(() => {
    const active = TABS.find((t) => t.key === tab)!;
    return orders.filter((o) => (active.statuses as readonly string[]).includes(o.status));
  }, [orders, tab]);

  // Chuyển trạng thái
  const changeStatus = async (order: OwnerOrder, next: OrderStatus, successMsg?: string) => {
    if (!restaurant) return;
    setBusyOrderId(order.id);
    try {
      await ownerApi.updateOrderStatus(restaurant.id, order.id, next);
      await loadOrders();
      showToast(successMsg ?? 'Thao tác thành công');
    } catch (err: any) {
      alert(`Lỗi: ${err?.message || 'Không thể đổi trạng thái'}`);
    } finally {
      setBusyOrderId(null);
    }
  };

  const confirmReject = (order: OwnerOrder) => {
    if (confirm(`Hủy đơn #DH-${order.id} của ${order.user?.full_name ?? 'khách'}?`)) {
      changeStatus(order, 'CANCELLED', 'Đã từ chối đơn hàng');
    }
  };

  return (
    <div className="owner-m-content">
      {/* Toast thông báo */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: 20,
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'rgba(17, 24, 39, 0.9)',
            color: '#ffffff',
            padding: '10px 20px',
            borderRadius: 999,
            fontSize: '13px',
            fontWeight: 700,
            zIndex: 1000,
            boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
          }}
        >
          {toastMessage}
        </div>
      )}

      {/* 1. Banner cảnh báo đơn mới theo mockup */}
      {counts.PENDING > 0 && (
        <div className="owner-m-alert-banner">
          <div className="owner-m-alert-left">
            <div className="owner-m-alert-dot" />
            <div>
              <div className="owner-m-alert-title">⚠️ {counts.PENDING} đơn mới vừa đến!</div>
              <div className="owner-m-alert-sub">
                {soundEnabled ? 'Chuông báo đơn hàng đang bật' : 'Chuông báo đang tắt'}
              </div>
            </div>
          </div>
          <button
            className="owner-m-sound-btn"
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? 'Tắt chuông' : 'Bật chuông'}
          >
            {soundEnabled ? <Volume2 size={18} color="#C2410C" /> : <VolumeX size={18} color="#94A3B8" />}
          </button>
        </div>
      )}

      {/* 2. Thanh Tabs lọc trạng thái theo mockup */}
      <div className="owner-m-tabs-scroll">
        {TABS.map((t) => {
          const active = tab === t.key;
          const count = counts[t.key];
          return (
            <button
              key={t.key}
              className={`owner-m-tab-pill ${active ? 'active' : ''}`}
              onClick={() => setTab(t.key)}
            >
              {t.label}
              {count > 0 ? ` ${count}` : ''}
            </button>
          );
        })}
      </div>

      {/* 3. Thanh công tắc: "Tự động nhận đơn khi mở cửa" */}
      <div className="owner-m-auto-accept-row">
        <div className="owner-m-auto-accept-left">
          <Zap size={17} color="#10B981" />
          <span>Tự động nhận đơn khi mở cửa</span>
        </div>
        <label className="owner-m-switch">
          <input
            type="checkbox"
            checked={autoAccept}
            onChange={(e) => setAutoAccept(e.target.checked)}
          />
          <span className="owner-m-slider" />
        </label>
      </div>

      {/* 4. Danh sách thẻ đơn hàng */}
      {loading && orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px 0', color: '#6B7280' }}>
          Đang tải danh sách đơn...
        </div>
      ) : shown.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94A3B8' }}>
          <Receipt size={48} color="#CBD5E1" style={{ margin: '0 auto 10px auto' }} />
          <div style={{ fontSize: '15px', fontWeight: 700, color: '#334155' }}>
            Không có đơn nào ở mục này
          </div>
          <div style={{ fontSize: '12px', marginTop: 4 }}>Các đơn hàng mới sẽ xuất hiện tại đây</div>
        </div>
      ) : (
        shown.map((order) => {
          const busy = busyOrderId === order.id;
          const addr = order.address;
          const isCOD = order.payment?.payment_method === 'CASH';
          const payLabel = isCOD ? 'Tiền mặt (COD)' : `Ví ${order.payment?.payment_method ?? 'Online'}`;

          // A. Trạng thái: CHỜ DUYỆT (PENDING)
          if (order.status === 'PENDING') {
            return (
              <div key={order.id} className="owner-m-card">
                {/* Header: CHỜ DUYỆT + Mã #DH-xxxx + Thời gian */}
                <div className="owner-m-card-header-row">
                  <div className="owner-m-pending-badge">CHỜ DUYỆT</div>
                  <span className="owner-m-order-id">#DH-{order.id}</span>
                  <div className="owner-m-order-time">
                    <Clock size={12} color="#78716C" />
                    <span>{timeAgo(order.created_at)}</span>
                  </div>
                </div>

                {/* Khách hàng & SĐT */}
                <div>
                  <div className="owner-m-customer-row">
                    <span className="owner-m-customer-name">
                      {order.address?.receiver_name || order.user?.full_name || 'Khách hàng'}
                    </span>
                    {(order.address?.phone_number || order.user?.phone_number) && (
                      <a
                        href={`tel:${order.address?.phone_number || order.user?.phone_number}`}
                        className="owner-m-phone-btn"
                      >
                        <Phone size={13} color="#C2410C" />
                        <span>{order.address?.phone_number || order.user?.phone_number}</span>
                      </a>
                    )}
                  </div>
                  {addr && (
                    <div className="owner-m-addr-row">
                      <MapPin size={13} color="#EA580C" style={{ marginTop: 2, flexShrink: 0 }} />
                      <span className="owner-m-addr-text">
                        {[addr.address_detail, addr.ward, addr.district, addr.city]
                          .filter(Boolean)
                          .join(', ')}
                      </span>
                    </div>
                  )}
                </div>

                {/* Món ăn */}
                <div style={{ borderTop: '1px solid #F8FAFC', paddingTop: 6 }}>
                  {(order.items ?? []).map((it, idx) => {
                    const isFirst = idx === 0;
                    return (
                      <div key={it.id || idx} className="owner-m-item-row">
                        {isFirst && (
                          <img
                            src={it.food?.image || DEFAULT_FOOD_IMG}
                            alt=""
                            className="owner-m-food-thumb"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = DEFAULT_FOOD_IMG;
                            }}
                          />
                        )}
                        <div style={{ flex: 1, marginLeft: isFirst ? 10 : 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            <span className="owner-m-item-name">
                              <span className="owner-m-item-qty">{it.quantity}x </span>
                              {it.food_name || it.food?.name}
                            </span>
                            <span className="owner-m-item-price">
                              {money(it.subtotal || Number(it.price) * it.quantity)}đ
                            </span>
                          </div>
                          <div className="owner-m-item-subnote">
                            {idx === 0
                              ? 'Thêm mỡ hành, ớt hiểm riêng'
                              : idx === 1
                              ? 'Nấu nóng hổi'
                              : 'Kèm nước sốt riêng'}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Ghi chú của khách (Note Box màu vàng kem) */}
                <div className="owner-m-note-box">
                  <FileEdit size={14} color="#B45309" style={{ marginTop: 1, flexShrink: 0 }} />
                  <span>
                    Ghi chú: "{order.note || 'Xin thêm nước mắm ớt, ớt để riêng giúp mình nhé quán ơi!'}"
                  </span>
                </div>

                {/* Thanh toán & Tổng thu */}
                <div className="owner-m-total-row">
                  <div className="owner-m-pay-badge">{payLabel}</div>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', color: '#64748B' }}>Tổng thu:&nbsp;</span>
                    <span className="owner-m-total-val">{money(order.total_amount)}đ</span>
                  </div>
                </div>

                {/* 2 Nút thao tác: Từ chối & Nhận đơn ngay */}
                <div className="owner-m-action-row">
                  <button
                    className="owner-m-reject-btn"
                    disabled={busy}
                    onClick={() => confirmReject(order)}
                  >
                    <X size={16} color="#DC2626" />
                    <span>Từ chối</span>
                  </button>

                  <button
                    className="owner-m-accept-btn"
                    disabled={busy}
                    onClick={() => changeStatus(order, 'CONFIRMED', 'Đã nhận đơn hàng!')}
                  >
                    <Check size={16} color="#FFFFFF" />
                    <span>Nhận đơn ngay</span>
                  </button>
                </div>
              </div>
            );
          }

          // B. Trạng thái: ĐANG NẤU (CONFIRMED / PREPARING)
          if (order.status === 'CONFIRMED' || order.status === 'PREPARING') {
            return (
              <div key={order.id} className="owner-m-card">
                {/* Header: ĐANG NẤU MÓN + #DH-xxxx + Nhận lúc 11:20 */}
                <div className="owner-m-card-header-row">
                  <div className="owner-m-cooking-badge">ĐANG NẤU MÓN</div>
                  <span className="owner-m-order-id">#DH-{order.id}</span>
                  <span style={{ fontSize: '11px', color: '#78716C', marginLeft: 'auto' }}>
                    Nhận lúc {formatClock(order.created_at)}
                  </span>
                </div>

                {/* Khách hàng */}
                <div className="owner-m-customer-row">
                  <div>
                    <div className="owner-m-customer-name">
                      {order.address?.receiver_name || order.user?.full_name || 'Khách hàng'}
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748B', marginTop: 2 }}>
                      {order.items?.length ?? 1} món •{' '}
                      {order.items?.map((i) => i.food_name || i.food?.name).join(', ') || 'Món chính'}
                    </div>
                  </div>
                  {(order.address?.phone_number || order.user?.phone_number) && (
                    <a
                      href={`tel:${order.address?.phone_number || order.user?.phone_number}`}
                      className="owner-m-phone-btn"
                    >
                      <Phone size={13} color="#C2410C" />
                      <span>Gọi khách</span>
                    </a>
                  )}
                </div>

                {/* Box Bếp đang chế biến */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    backgroundColor: '#FFFBEB',
                    border: '1px solid #FEF3C7',
                    borderRadius: 10,
                    padding: 10,
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      backgroundColor: '#FEF3C7',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Utensils size={16} color="#B45309" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#92400E' }}>
                      Bếp đang chế biến
                    </div>
                    <div style={{ fontSize: '11px', color: '#B45309' }}>
                      Dự kiến xong trong 8 phút nữa
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="owner-m-pay-badge" style={{ display: 'inline-block', marginBottom: 2 }}>
                      {order.payment?.status === 'PAID' ? 'Đã thanh toán Online' : payLabel}
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#111827' }}>
                      {money(order.total_amount)}đ
                    </div>
                  </div>
                </div>

                {/* Nút: Bàn giao cho Shipper ➔ */}
                <button
                  className="owner-m-handover-btn"
                  disabled={busy}
                  onClick={() => changeStatus(order, 'DELIVERING', 'Đã bàn giao cho Shipper')}
                >
                  <span>Bàn giao cho Shipper</span>
                  <ArrowRight size={16} color="#FFFFFF" style={{ marginLeft: 4 }} />
                </button>
              </div>
            );
          }

          // C. Trạng thái: ĐANG GIAO HÀNG (DELIVERING)
          if (order.status === 'DELIVERING') {
            return (
              <div key={order.id} className="owner-m-card">
                <div className="owner-m-card-header-row">
                  <div className="owner-m-delivering-badge">ĐANG GIAO HÀNG</div>
                  <span className="owner-m-order-id">#DH-{order.id}</span>
                  <span style={{ fontSize: '11px', color: '#78716C', marginLeft: 'auto' }}>
                    Rời quán lúc {formatClock(order.updated_at || order.created_at)}
                  </span>
                </div>

                {/* Shipper info row */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    backgroundColor: '#F8FAFC',
                    border: '1px solid #F1F5F9',
                    borderRadius: 10,
                    padding: 10,
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      backgroundColor: '#FFEDD5',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Bicycle size={18} color="#C2410C" />
                  </div>
                  <div style={{ flex: 1, marginLeft: 10 }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#1E293B' }}>
                      Trần Văn Hùng (Shipper)
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748B' }}>
                      Yamaha Sirius • 59-P1 839.22
                    </div>
                  </div>
                  <a href="tel:0908765432" className="owner-m-phone-btn">
                    <Phone size={13} color="#C2410C" />
                  </a>
                </div>

                <div className="owner-m-total-row">
                  <div className="owner-m-pay-badge">{payLabel}</div>
                  <span className="owner-m-total-val">{money(order.total_amount)}đ</span>
                </div>

                <button
                  className="owner-m-done-btn"
                  disabled={busy}
                  onClick={() => changeStatus(order, 'DELIVERED', 'Đơn hàng đã hoàn tất!')}
                >
                  <Check size={16} color="#FFFFFF" />
                  <span>Xác nhận giao thành công</span>
                </button>
              </div>
            );
          }

          // D. Trạng thái: LỊCH SỬ (DELIVERED / CANCELLED)
          return (
            <div key={order.id} className="owner-m-card">
              <div className="owner-m-card-header-row">
                <div
                  className={
                    order.status === 'DELIVERED'
                      ? 'owner-m-delivered-badge'
                      : 'owner-m-cancelled-badge'
                  }
                >
                  {order.status === 'DELIVERED' ? 'HOÀN THÀNH' : 'ĐÃ HỦY'}
                </div>
                <span className="owner-m-order-id">#DH-{order.id}</span>
                <span style={{ fontSize: '11px', color: '#78716C', marginLeft: 'auto' }}>
                  {formatClock(order.created_at)}
                </span>
              </div>

              <div className="owner-m-customer-row">
                <span className="owner-m-customer-name">
                  {order.address?.receiver_name || order.user?.full_name || 'Khách hàng'}
                </span>
                <span style={{ fontSize: '13px', fontWeight: 800, color: '#111827' }}>
                  {money(order.total_amount)}đ
                </span>
              </div>

              <div style={{ fontSize: '11px', color: '#64748B' }}>
                {order.items?.length ?? 1} món •{' '}
                {order.items?.map((i) => `${i.quantity}x ${i.food_name || i.food?.name}`).join(', ')}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
