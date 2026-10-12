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
  Bike,
  Utensils,
  Receipt,
  FileEdit,
  RotateCw,
  Search,
  Calendar,
  ArrowUpDown,
  Filter,
} from 'lucide-react';
import type { AdminRestaurant, OrderStatus, OwnerOrder } from '../../services/types';
import { ownerApi } from '../../services/api';
import './owner-mobile-ui.css';
import './owner-web.css';

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

  // Bộ lọc, Tìm kiếm và Sắp xếp Lịch sử đơn hàng
  const [searchQuery, setSearchQuery] = useState('');
  const [historyStatusFilter, setHistoryStatusFilter] = useState<'ALL' | 'DELIVERED' | 'CANCELLED'>('ALL');
  const [historyDateFilter, setHistoryDateFilter] = useState<'all' | 'today' | '7days' | '30days'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'amount_desc' | 'amount_asc'>('newest');

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
      const res = await ownerApi.getOrders(restaurant.id, { limit: 200 });
      const list = Array.isArray(res) ? res : ((res as any)?.data || []);
      setOrders(list);
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

  // Danh sách đơn được chọn theo tab, kèm Tìm kiếm, Lọc & Sắp xếp
  const filteredOrders = useMemo(() => {
    const activeTabObj = TABS.find((t) => t.key === tab);
    if (!activeTabObj) return [];

    let list = orders.filter((o) => (activeTabObj.statuses as readonly string[]).includes(o.status));

    // Lọc riêng cho tab Lịch sử
    if (tab === 'HISTORY') {
      if (historyStatusFilter !== 'ALL') {
        list = list.filter((o) => o.status === historyStatusFilter);
      }

      if (historyDateFilter !== 'all') {
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        list = list.filter((o) => {
          if (!o.created_at) return true;
          const orderTime = new Date(o.created_at).getTime();
          if (historyDateFilter === 'today') return orderTime >= startOfToday;
          if (historyDateFilter === '7days') return orderTime >= now.getTime() - 7 * 86400 * 1000;
          if (historyDateFilter === '30days') return orderTime >= now.getTime() - 30 * 86400 * 1000;
          return true;
        });
      }
    }

    // Tìm kiếm từ khoá (áp dụng cho đơn: mã đơn, tên khách, số điện thoại, tên món)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((o) => {
        const idMatch = String(o.id).includes(q) || `dh${o.id}`.includes(q) || `#${o.id}`.includes(q);
        const nameMatch = (
          o.customer_name ||
          (o as any).user?.full_name ||
          (o as any).address?.receiver_name ||
          ''
        )
          .toLowerCase()
          .includes(q);
        const phoneMatch = (
          o.customer_phone ||
          (o as any).user?.phone_number ||
          (o as any).address?.phone_number ||
          ''
        )
          .toLowerCase()
          .includes(q);
        const addressMatch = (
          o.delivery_address ||
          (o as any).address?.address_detail ||
          ''
        )
          .toLowerCase()
          .includes(q);
        const foodMatch = o.items?.some((it) =>
          (it.food_name || (it as any).name || '').toLowerCase().includes(q)
        );
        return idMatch || nameMatch || phoneMatch || addressMatch || foodMatch;
      });
    }

    // Sắp xếp đơn hàng
    list = [...list].sort((a, b) => {
      const timeA = new Date(a.created_at || 0).getTime();
      const timeB = new Date(b.created_at || 0).getTime();
      const amountA = Number(a.total_amount || 0);
      const amountB = Number(b.total_amount || 0);

      switch (sortBy) {
        case 'newest':
          return timeB - timeA;
        case 'oldest':
          return timeA - timeB;
        case 'amount_desc':
          return amountB - amountA;
        case 'amount_asc':
          return amountA - amountB;
        default:
          return timeB - timeA;
      }
    });

    return list;
  }, [orders, tab, historyStatusFilter, historyDateFilter, searchQuery, sortBy]);

  // Thống kê tóm tắt các đơn sau lọc
  const historySummary = useMemo(() => {
    const delivered = filteredOrders.filter((o) => o.status === 'DELIVERED');
    const cancelled = filteredOrders.filter((o) => o.status === 'CANCELLED');
    const totalRev = delivered.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
    return {
      total: filteredOrders.length,
      deliveredCount: delivered.length,
      cancelledCount: cancelled.length,
      deliveredRevenue: totalRev,
    };
  }, [filteredOrders]);

  // Cập nhật trạng thái đơn hàng
  const handleUpdateStatus = async (orderId: number, nextStatus: OrderStatus) => {
    if (!restaurant) return;
    try {
      setBusyOrderId(orderId);
      const updated = await ownerApi.updateOrderStatus(restaurant.id, orderId, nextStatus);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: updated.status } : o)));
      onRefreshStats?.();
      showToast(
        nextStatus === 'PREPARING'
          ? `Đã nhận đơn #${orderId}! Nhà bếp đang chuẩn bị.`
          : nextStatus === 'DELIVERING'
          ? `Đã bàn giao đơn #${orderId} cho tài xế!`
          : nextStatus === 'DELIVERED'
          ? `Đơn hàng #${orderId} đã giao thành công!`
          : `Đã cập nhật trạng thái đơn #${orderId}.`
      );
    } catch (err: any) {
      alert(`Không thể chuyển trạng thái đơn: ${err?.message || 'Lỗi thao tác'}`);
    } finally {
      setBusyOrderId(null);
    }
  };

  // Từ chối đơn
  const handleReject = async (orderId: number) => {
    if (!confirm(`Bạn chắc chắn muốn từ chối đơn hàng #${orderId}?`)) return;
    await handleUpdateStatus(orderId, 'CANCELLED');
  };

  if (!restaurant) {
    return (
      <div className="owner-web-view">
        <div className="owner-web-panel" style={{ textAlign: 'center', padding: '50px 20px' }}>
          <Receipt size={44} color="#94A3B8" style={{ margin: '0 auto 12px auto' }} />
          <h3>Chưa chọn nhà hàng</h3>
          <p style={{ color: '#64748B' }}>Vui lòng chọn nhà hàng để xem danh sách đơn hàng trực tuyến.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="owner-web-view">
      {/* Toast Alert */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            backgroundColor: '#0F172A',
            color: '#FFFFFF',
            padding: '12px 20px',
            borderRadius: 12,
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
            zIndex: 9999,
            fontSize: '0.88rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Check size={18} color="#10B981" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Thanh điều khiển đơn hàng (Tabs & Công cụ thông minh) */}
      <div className="owner-web-orders-controls">
        {/* 4 Tabs chuẩn mobile */}
        <div className="owner-web-status-tabs">
          {TABS.map((t) => {
            const active = tab === t.key;
            const c = counts[t.key];
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`owner-web-tab-btn ${active ? 'active' : ''}`}
              >
                <span>{t.label}</span>
                <span className="owner-web-tab-badge">{c}</span>
              </button>
            );
          })}
        </div>

        {/* Công cụ bên phải: Chuông báo, Tự nhận đơn, Nút tải lại */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Nút bật/tắt âm thanh chuông */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: soundEnabled ? '#FFEDD5' : '#F1F5F9',
              border: soundEnabled ? '1px solid #FED7AA' : '1px solid #CBD5E1',
              color: soundEnabled ? '#C2410C' : '#64748B',
              padding: '7px 12px',
              borderRadius: 8,
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
            title={soundEnabled ? 'Đang bật chuông báo đơn mới' : 'Đang tắt chuông'}
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            <span>{soundEnabled ? 'Chuông: Bật' : 'Chuông: Tắt'}</span>
          </button>

          {/* Công tắc tự động nhận đơn */}
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: '0.82rem',
              fontWeight: 700,
              color: '#334155',
              cursor: 'pointer',
              userSelect: 'none',
            }}
          >
            <Zap size={15} color={autoAccept ? '#EA580C' : '#94A3B8'} />
            <span>Tự nhận đơn</span>
            <div className="owner-m-switch">
              <input
                type="checkbox"
                checked={autoAccept}
                onChange={(e) => {
                  setAutoAccept(e.target.checked);
                  showToast(
                    e.target.checked
                      ? 'Đã bật tự động nhận đơn mới!'
                      : 'Đã tắt chế độ tự động nhận đơn.'
                  );
                }}
              />
              <span className="owner-m-slider" />
            </div>
          </label>

          <button
            onClick={loadOrders}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              padding: '7px 12px',
              borderRadius: 8,
              color: '#475569',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
            title="Tải lại danh sách"
          >
            <RotateCw size={14} className={loading ? 'spinning' : ''} />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {/* 2. Thanh Tìm kiếm, Lọc & Sắp xếp đơn hàng (Đặc biệt cho Tab Lịch sử & toàn bộ đơn) */}
      <div
        style={{
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: 14,
          padding: '12px 18px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          boxShadow: '0 2px 6px rgba(15, 23, 42, 0.03)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          {/* Ô tìm kiếm đơn hàng */}
          <div
            style={{
              flex: '1 1 280px',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Search
              size={16}
              color="#94A3B8"
              style={{ position: 'absolute', left: 12, pointerEvents: 'none' }}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo mã đơn (#12, DH1), tên khách, SĐT, món ăn..."
              style={{
                width: '100%',
                height: 40,
                paddingLeft: 38,
                paddingRight: searchQuery ? 36 : 14,
                borderRadius: 10,
                border: '1px solid #CBD5E1',
                fontSize: '0.85rem',
                outline: 'none',
                background: '#F8FAFC',
                color: '#0F172A',
                transition: 'all 0.2s',
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: 10,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#94A3B8',
                  padding: 4,
                }}
                title="Xoá tìm kiếm"
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* Bộ lọc trạng thái con (chỉ hiển thị khi ở tab HISTORY) */}
          {tab === 'HISTORY' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748B' }}>Lọc:</span>
              <div style={{ display: 'flex', gap: 4 }}>
                {[
                  { key: 'ALL', label: 'Tất cả' },
                  { key: 'DELIVERED', label: 'Hoàn tất' },
                  { key: 'CANCELLED', label: 'Đã huỷ' },
                ].map((s) => (
                  <button
                    key={s.key}
                    onClick={() => setHistoryStatusFilter(s.key as any)}
                    style={{
                      padding: '7px 12px',
                      borderRadius: 8,
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      border: historyStatusFilter === s.key ? '1px solid #EA580C' : '1px solid #E2E8F0',
                      backgroundColor: historyStatusFilter === s.key ? '#FFF7ED' : '#F8FAFC',
                      color: historyStatusFilter === s.key ? '#EA580C' : '#475569',
                      transition: 'all 0.15s',
                    }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Lọc thời gian */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Calendar size={15} color="#64748B" />
            <select
              value={historyDateFilter}
              onChange={(e) => setHistoryDateFilter(e.target.value as any)}
              style={{
                height: 40,
                padding: '0 12px',
                borderRadius: 10,
                border: '1px solid #CBD5E1',
                fontSize: '0.82rem',
                fontWeight: 600,
                color: '#334155',
                background: '#FFFFFF',
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              <option value="all">Tất cả thời gian</option>
              <option value="today">Hôm nay</option>
              <option value="7days">7 ngày qua</option>
              <option value="30days">30 ngày qua</option>
            </select>
          </div>

          {/* Sắp xếp */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <ArrowUpDown size={15} color="#64748B" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              style={{
                height: 40,
                padding: '0 12px',
                borderRadius: 10,
                border: '1px solid #CBD5E1',
                fontSize: '0.82rem',
                fontWeight: 600,
                color: '#334155',
                background: '#FFFFFF',
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              <option value="newest">Mới nhất trước</option>
              <option value="oldest">Cũ nhất trước</option>
              <option value="amount_desc">Giá trị cao nhất</option>
              <option value="amount_asc">Giá trị thấp nhất</option>
            </select>
          </div>
        </div>

        {/* Thanh kết quả lọc & tóm tắt */}
        {(searchQuery || historyStatusFilter !== 'ALL' || historyDateFilter !== 'all' || tab === 'HISTORY') && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: 8,
              borderTop: '1px solid #F1F5F9',
              fontSize: '0.8rem',
              color: '#64748B',
              flexWrap: 'wrap',
              gap: 8,
            }}
          >
            <div>
              Hiển thị <strong>{filteredOrders.length}</strong> đơn hàng
              {tab === 'HISTORY' && (
                <>
                  {' '}(Hoàn tất:{' '}
                  <strong style={{ color: '#10B981' }}>{historySummary.deliveredCount}</strong>, Đã huỷ:{' '}
                  <strong style={{ color: '#EF4444' }}>{historySummary.cancelledCount}</strong>) • Tổng doanh thu hoàn tất:{' '}
                  <strong style={{ color: '#EA580C' }}>{money(historySummary.deliveredRevenue)}đ</strong>
                </>
              )}
            </div>

            {(searchQuery || historyStatusFilter !== 'ALL' || historyDateFilter !== 'all' || sortBy !== 'newest') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setHistoryStatusFilter('ALL');
                  setHistoryDateFilter('all');
                  setSortBy('newest');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#EA580C',
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  padding: '2px 6px',
                }}
              >
                ✕ Đặt lại bộ lọc
              </button>
            )}
          </div>
        )}
      </div>

      {/* 3. Danh sách đơn hàng dạng thẻ hiển thị đầy đặn trên Web */}
      {loading && orders.length === 0 ? (
        <div className="owner-web-panel" style={{ textAlign: 'center', padding: '60px 0' }}>
          <div style={{ color: '#EA580C', fontWeight: 700, fontSize: '0.95rem' }}>
            Đang tải dữ liệu đơn hàng...
          </div>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="owner-web-panel" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <Receipt size={48} color="#CBD5E1" style={{ margin: '0 auto 12px auto' }} />
          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#334155' }}>
            {searchQuery || historyStatusFilter !== 'ALL' || historyDateFilter !== 'all'
              ? 'Không tìm thấy đơn hàng nào khớp với tìm kiếm / bộ lọc'
              : 'Không có đơn hàng nào trong mục này'}
          </div>
          <p style={{ fontSize: '0.85rem', color: '#94A3B8', marginTop: 4 }}>
            {searchQuery || historyStatusFilter !== 'ALL' || historyDateFilter !== 'all' ? (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setHistoryStatusFilter('ALL');
                  setHistoryDateFilter('all');
                }}
                style={{
                  marginTop: 8,
                  padding: '6px 14px',
                  borderRadius: 8,
                  background: '#EA580C',
                  color: '#FFFFFF',
                  border: 'none',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontSize: '0.82rem',
                }}
              >
                Xoá bộ lọc để xem tất cả
              </button>
            ) : tab === 'PENDING' ? (
              'Khi khách hàng đặt món, đơn hàng mới sẽ xuất hiện tại đây cùng chuông báo.'
            ) : (
              `Hiện tại không có đơn nào ở trạng thái "${TABS.find((t) => t.key === tab)?.label}".`
            )}
          </p>
        </div>
      ) : (
        <div className="owner-web-orders-grid">
          {filteredOrders.map((order) => {
            const isBusy = busyOrderId === order.id;
            const items = order.items || [];
            const custName = (order as any).user?.full_name || order.customer_name || 'Khách hàng';
            const custPhone = (order as any).user?.phone_number || order.customer_phone || '';
            const deliveryAddr = order.delivery_address || 'Địa chỉ giao hàng';

            return (
              <div key={order.id} className="owner-web-order-card">
                {/* Header thẻ đơn: Mã đơn + Huy hiệu trạng thái + Thời gian */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span
                      style={{
                        padding: '4px 10px',
                        borderRadius: 6,
                        fontSize: '0.78rem',
                        fontWeight: 800,
                        backgroundColor:
                          order.status === 'PENDING'
                            ? '#FEF3C7'
                            : order.status === 'PREPARING' || order.status === 'CONFIRMED'
                            ? '#FFEDD5'
                            : order.status === 'DELIVERING'
                            ? '#E0E7FF'
                            : order.status === 'DELIVERED'
                            ? '#DCFCE7'
                            : '#FEE2E2',
                        color:
                          order.status === 'PENDING'
                            ? '#B45309'
                            : order.status === 'PREPARING' || order.status === 'CONFIRMED'
                            ? '#C2410C'
                            : order.status === 'DELIVERING'
                            ? '#4338CA'
                            : order.status === 'DELIVERED'
                            ? '#15803D'
                            : '#B91C1C',
                      }}
                    >
                      {order.status === 'PENDING'
                        ? 'Chờ duyệt'
                        : order.status === 'PREPARING'
                        ? 'Đang nấu'
                        : order.status === 'CONFIRMED'
                        ? 'Đã nhận'
                        : order.status === 'DELIVERING'
                        ? 'Đang giao'
                        : order.status === 'DELIVERED'
                        ? 'Đã giao'
                        : 'Đã hủy'}
                    </span>

                    <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0F172A' }}>
                      #{order.id}
                    </span>
                  </div>

                  <span
                    style={{
                      fontSize: '0.76rem',
                      color: '#64748B',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <Clock size={13} />
                    <span>{timeAgo(order.created_at)}</span>
                  </span>
                </div>

                {/* Thông tin khách hàng & Địa chỉ */}
                <div
                  style={{
                    backgroundColor: '#F8FAFC',
                    border: '1px solid #F1F5F9',
                    borderRadius: 10,
                    padding: '10px 12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1E293B' }}>
                      {custName}
                    </div>

                    {custPhone && (
                      <a
                        href={`tel:${custPhone}`}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          backgroundColor: '#FFEDD5',
                          padding: '3px 8px',
                          borderRadius: 6,
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          color: '#C2410C',
                          textDecoration: 'none',
                        }}
                      >
                        <Phone size={12} />
                        <span>{custPhone}</span>
                      </a>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, fontSize: '0.8rem', color: '#475569' }}>
                    <MapPin size={14} color="#94A3B8" style={{ flexShrink: 0, marginTop: 2 }} />
                    <span style={{ lineHeight: 1.4 }}>{deliveryAddr}</span>
                  </div>
                </div>

                {/* Danh sách món ăn trong đơn */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '4px 0' }}>
                  {items.map((it, idx) => (
                    <div
                      key={it.id || idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        borderBottom: idx < items.length - 1 ? '1px solid #F8FAFC' : 'none',
                        paddingBottom: 6,
                      }}
                    >
                      <img
                        src={it.food_image || it.image || DEFAULT_FOOD_IMG}
                        alt="Dish"
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 8,
                          objectFit: 'cover',
                          backgroundColor: '#E2E8F0',
                          flexShrink: 0,
                        }}
                      />

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#1E293B' }}>
                          <span style={{ color: '#EA580C', fontWeight: 800, marginRight: 6 }}>
                            {it.quantity}x
                          </span>
                          {it.food_name || it.name || 'Món ăn'}
                        </div>
                        {it.notes && (
                          <div style={{ fontSize: '0.74rem', color: '#94A3B8', marginTop: 1 }}>
                            Ghi chú: {it.notes}
                          </div>
                        )}
                      </div>

                      <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#0F172A' }}>
                        {money(Number(it.price) * it.quantity)}đ
                      </div>
                    </div>
                  ))}
                </div>

                {/* Ghi chú bếp của khách hàng (nếu có) */}
                {order.note && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 6,
                      backgroundColor: '#FFFBEB',
                      border: '1px solid #FEF3C7',
                      borderRadius: 8,
                      padding: '8px 10px',
                      fontSize: '0.78rem',
                      color: '#B45309',
                    }}
                  >
                    <FileEdit size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                    <span>Lưu ý của khách: "{order.note}"</span>
                  </div>
                )}

                {/* Hàng tổng tiền & phương thức thanh toán */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: 8,
                    borderTop: '1px solid #F1F5F9',
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: 6,
                      backgroundColor: '#F1F5F9',
                      color: '#475569',
                    }}
                  >
                    {order.payment_method === 'COD' ? 'Tiền mặt khi nhận (COD)' : 'Đã thanh toán Online'}
                  </span>

                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.76rem', color: '#64748B', marginRight: 6 }}>Tổng cộng:</span>
                    <span style={{ fontSize: '1.05rem', fontWeight: 900, color: '#EA580C' }}>
                      {money(order.total_amount)}đ
                    </span>
                  </div>
                </div>

                {/* Các nút hành động chuyển đổi trạng thái */}
                <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                  {order.status === 'PENDING' && (
                    <>
                      <button
                        onClick={() => handleReject(order.id)}
                        disabled={isBusy}
                        style={{
                          flex: 1,
                          padding: '10px',
                          borderRadius: 10,
                          backgroundColor: '#FEF2F2',
                          border: '1px solid #FECACA',
                          color: '#DC2626',
                          fontWeight: 700,
                          fontSize: '0.84rem',
                          cursor: 'pointer',
                        }}
                      >
                        Từ chối
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'PREPARING')}
                        disabled={isBusy}
                        style={{
                          flex: 2,
                          padding: '10px',
                          borderRadius: 10,
                          backgroundColor: '#EA580C',
                          border: 'none',
                          color: '#FFFFFF',
                          fontWeight: 800,
                          fontSize: '0.86rem',
                          cursor: 'pointer',
                          boxShadow: '0 4px 12px rgba(234, 88, 12, 0.25)',
                        }}
                      >
                        {isBusy ? 'Đang nhận...' : 'Nhận đơn & Nấu món'}
                      </button>
                    </>
                  )}

                  {(order.status === 'PREPARING' || order.status === 'CONFIRMED') && (
                    <button
                      onClick={() => handleUpdateStatus(order.id, 'DELIVERING')}
                      disabled={isBusy}
                      style={{
                        width: '100%',
                        padding: '11px',
                        borderRadius: 10,
                        backgroundColor: '#C2410C',
                        border: 'none',
                        color: '#FFFFFF',
                        fontWeight: 800,
                        fontSize: '0.88rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        boxShadow: '0 4px 12px rgba(194, 65, 12, 0.25)',
                      }}
                    >
                      <Bike size={16} />
                      <span>{isBusy ? 'Đang cập nhật...' : 'Bàn giao cho Shipper'}</span>
                    </button>
                  )}

                  {order.status === 'DELIVERING' && (
                    <button
                      onClick={() => handleUpdateStatus(order.id, 'DELIVERED')}
                      disabled={isBusy}
                      style={{
                        width: '100%',
                        padding: '11px',
                        borderRadius: 10,
                        backgroundColor: '#16A34A',
                        border: 'none',
                        color: '#FFFFFF',
                        fontWeight: 800,
                        fontSize: '0.88rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                      }}
                    >
                      <Check size={16} />
                      <span>{isBusy ? 'Đang lưu...' : 'Xác nhận đã giao thành công'}</span>
                    </button>
                  )}

                  {(order.status === 'DELIVERED' || order.status === 'CANCELLED') && (
                    <div
                      style={{
                        width: '100%',
                        textAlign: 'center',
                        fontSize: '0.78rem',
                        color: '#94A3B8',
                        padding: '6px 0',
                      }}
                    >
                      Đơn hàng đã kết thúc
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
