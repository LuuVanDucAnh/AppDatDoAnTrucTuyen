import React, { useEffect, useState, useMemo } from 'react';
import {
  ShoppingBag,
  Search,
  RotateCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  Truck,
  XCircle,
  ChefHat,
  Eye,
  FileText,
  User,
  Phone,
  MapPin,
  CreditCard,
  DollarSign,
  Printer,
  X,
  ArrowRight,
  Filter,
} from 'lucide-react';
import type { AdminRestaurant, OrderStatus, OwnerOrder } from '../../services/types';
import { ownerApi } from '../../services/api';
import {
  formatDate,
  formatMoney,
  formatTimeAgo,
  getOrderStatusColor,
  getOrderStatusLabel,
  resolveImageUrl,
  DEFAULT_FOOD_IMAGE,
} from '../../services/utils';

interface OwnerOrdersViewProps {
  restaurant: AdminRestaurant | null;
  onRefreshStats?: () => void;
}

type FilterTab = 'ALL' | 'PENDING' | 'IN_PROGRESS' | 'DELIVERING' | 'DELIVERED' | 'CANCELLED';

export function OwnerOrdersView({ restaurant, onRefreshStats }: OwnerOrdersViewProps) {
  const [orders, setOrders] = useState<OwnerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState<FilterTab>('ALL');
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<OwnerOrder | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchOrders = async () => {
    if (!restaurant) return;
    try {
      setLoading(true);
      setError(null);
      const res = await ownerApi.getOrders(restaurant.id, { limit: 100 });
      setOrders(res.data || []);
      onRefreshStats?.();
    } catch (err: any) {
      setError(err?.message || 'Không thể tải danh sách đơn hàng.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [restaurant?.id]);

  // Tự động làm mới mỗi 30 giây để bắt đơn hàng mới nếu bật autoRefresh
  useEffect(() => {
    if (!autoRefresh || !restaurant) return;
    const interval = setInterval(() => {
      ownerApi
        .getOrders(restaurant.id, { limit: 100 })
        .then((res) => {
          setOrders(res.data || []);
          onRefreshStats?.();
        })
        .catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh, restaurant?.id]);

  // Chuyển trạng thái đơn hàng
  const handleUpdateStatus = async (orderId: number, nextStatus: OrderStatus) => {
    if (!restaurant) return;
    try {
      setUpdatingOrderId(orderId);
      const updated = await ownerApi.updateOrderStatus(restaurant.id, orderId, nextStatus);

      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: updated.status } : o)));

      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder((prev) => (prev ? { ...prev, status: updated.status } : null));
      }

      onRefreshStats?.();
    } catch (err: any) {
      alert(`Không thể chuyển trạng thái đơn hàng: ${err?.message || 'Lỗi thao tác'}`);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // Đếm số lượng theo tab
  const counts = useMemo(() => {
    const p = orders.filter((o) => o.status === 'PENDING').length;
    const inProg = orders.filter((o) => o.status === 'CONFIRMED' || o.status === 'PREPARING').length;
    const deliv = orders.filter((o) => o.status === 'DELIVERING').length;
    const comp = orders.filter((o) => o.status === 'DELIVERED').length;
    const canc = orders.filter((o) => o.status === 'CANCELLED').length;
    return {
      ALL: orders.length,
      PENDING: p,
      IN_PROGRESS: inProg,
      DELIVERING: deliv,
      DELIVERED: comp,
      CANCELLED: canc,
    };
  }, [orders]);

  // Lọc danh sách
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      // Tab filter
      if (filterTab === 'PENDING' && o.status !== 'PENDING') return false;
      if (filterTab === 'IN_PROGRESS' && o.status !== 'CONFIRMED' && o.status !== 'PREPARING') return false;
      if (filterTab === 'DELIVERING' && o.status !== 'DELIVERING') return false;
      if (filterTab === 'DELIVERED' && o.status !== 'DELIVERED') return false;
      if (filterTab === 'CANCELLED' && o.status !== 'CANCELLED') return false;

      // Search filter
      if (search.trim()) {
        const q = search.toLowerCase();
        const idMatch = String(o.id).includes(q);
        const nameMatch = o.user?.full_name?.toLowerCase().includes(q) || false;
        const phoneMatch = o.user?.phone_number?.includes(q) || false;
        const receiverMatch = o.address?.receiver_name?.toLowerCase().includes(q) || false;
        if (!idMatch && !nameMatch && !phoneMatch && !receiverMatch) return false;
      }

      return true;
    });
  }, [orders, filterTab, search]);

  if (!restaurant) {
    return (
      <div className="view-container">
        <div className="empty-state-card" style={{ padding: '60px 20px', textAlign: 'center' }}>
          <ShoppingBag size={48} color="#94a3b8" style={{ margin: '0 auto 16px auto' }} />
          <h3>Chưa chọn nhà hàng</h3>
          <p style={{ color: '#64748b' }}>Vui lòng chọn một nhà hàng từ menu bên trái để quản lý đơn hàng.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="view-container" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Top Controls Bar: Tabs, Search, Refresh */}
      <div className="panel" style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          {/* Status Tabs */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <button
              onClick={() => setFilterTab('ALL')}
              className={`filter-pill ${filterTab === 'ALL' ? 'active' : ''}`}
            >
              Tất cả ({counts.ALL})
            </button>

            <button
              onClick={() => setFilterTab('PENDING')}
              className={`filter-pill ${filterTab === 'PENDING' ? 'active' : ''}`}
              style={
                counts.PENDING > 0
                  ? { borderColor: '#ea580c', color: filterTab === 'PENDING' ? '#fff' : '#ea580c', fontWeight: 700 }
                  : {}
              }
            >
              Chờ xác nhận ({counts.PENDING})
              {counts.PENDING > 0 && <span style={{ marginLeft: 4 }}>🔥</span>}
            </button>

            <button
              onClick={() => setFilterTab('IN_PROGRESS')}
              className={`filter-pill ${filterTab === 'IN_PROGRESS' ? 'active' : ''}`}
            >
              Đang chuẩn bị ({counts.IN_PROGRESS})
            </button>

            <button
              onClick={() => setFilterTab('DELIVERING')}
              className={`filter-pill ${filterTab === 'DELIVERING' ? 'active' : ''}`}
            >
              Đang giao ({counts.DELIVERING})
            </button>

            <button
              onClick={() => setFilterTab('DELIVERED')}
              className={`filter-pill ${filterTab === 'DELIVERED' ? 'active' : ''}`}
            >
              Hoàn thành ({counts.DELIVERED})
            </button>

            <button
              onClick={() => setFilterTab('CANCELLED')}
              className={`filter-pill ${filterTab === 'CANCELLED' ? 'active' : ''}`}
            >
              Đã hủy ({counts.CANCELLED})
            </button>
          </div>

          {/* Search Box & Refresh */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="search-input-box" style={{ width: 260 }}>
              <Search size={15} className="icon" />
              <input
                type="text"
                placeholder="Tìm mã đơn, tên, SĐT..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <button
              onClick={fetchOrders}
              className="btn btn-secondary"
              title="Làm mới danh sách đơn"
              style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <RotateCw size={14} className={loading ? 'spinning' : ''} />
              <span>Tải lại</span>
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fee2e2', color: '#dc2626', borderRadius: 12, padding: '12px 16px' }}>
          {error}
        </div>
      )}

      {/* Orders List Table */}
      <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
        {loading && orders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
            <div className="spinner" style={{ margin: '0 auto 12px auto' }} />
            <p>Đang tải danh sách đơn hàng...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
            <ShoppingBag size={40} style={{ margin: '0 auto 12px auto', opacity: 0.5 }} />
            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#475569' }}>
              Không tìm thấy đơn hàng nào
            </div>
            <p style={{ fontSize: '0.84rem', marginTop: 4 }}>
              Không có đơn hàng nào khớp với bộ lọc hiện tại.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ width: 90 }}>Mã đơn</th>
                  <th>Thời gian đặt</th>
                  <th>Khách hàng</th>
                  <th>Địa chỉ nhận</th>
                  <th>Món ăn / Số lượng</th>
                  <th>Thanh toán</th>
                  <th>Tổng tiền</th>
                  <th>Trạng thái</th>
                  <th style={{ textAlign: 'right', width: 220 }}>Thao tác xử lý</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => {
                  const statusStyle = getOrderStatusColor(order.status);
                  const isUpdating = updatingOrderId === order.id;

                  return (
                    <tr key={order.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      {/* Mã đơn */}
                      <td>
                        <strong style={{ color: '#0f172a', fontSize: '0.92rem' }}>
                          #{order.id}
                        </strong>
                      </td>

                      {/* Thời gian */}
                      <td>
                        <div style={{ fontSize: '0.84rem', color: '#0f172a', fontWeight: 600 }}>
                          {formatDate(order.created_at)}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                          {formatTimeAgo(order.created_at)}
                        </div>
                      </td>

                      {/* Khách hàng */}
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.88rem' }}>
                            {order.address?.receiver_name || order.user?.full_name || 'Khách vãng lai'}
                          </span>
                          <span style={{ fontSize: '0.76rem', color: '#64748b' }}>
                            {order.address?.phone_number || order.user?.phone_number || '—'}
                          </span>
                        </div>
                      </td>

                      {/* Địa chỉ */}
                      <td style={{ maxWidth: 200 }}>
                        <div
                          style={{
                            fontSize: '0.82rem',
                            color: '#475569',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                          title={order.address?.address_detail}
                        >
                          {order.address?.address_detail || 'Giao tại quán / Địa chỉ mặc định'}
                        </div>
                      </td>

                      {/* Danh sách món rút gọn */}
                      <td style={{ maxWidth: 220 }}>
                        <div style={{ fontSize: '0.82rem', color: '#0f172a' }}>
                          {order.items && order.items.length > 0 ? (
                            <>
                              <span style={{ fontWeight: 600 }}>
                                {order.items[0].food_name || order.items[0].food?.name || 'Món ăn'} x {order.items[0].quantity}
                              </span>
                              {order.items.length > 1 && (
                                <span style={{ color: '#94a3b8', fontSize: '0.76rem', marginLeft: 4 }}>
                                  (+{order.items.length - 1} món khác)
                                </span>
                              )}
                            </>
                          ) : (
                            <span style={{ color: '#94a3b8' }}>Chi tiết trong đơn</span>
                          )}
                        </div>
                        {order.note && (
                          <div
                            style={{
                              fontSize: '0.72rem',
                              color: '#ea580c',
                              marginTop: 2,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                            title={`Ghi chú: ${order.note}`}
                          >
                            📝 {order.note}
                          </div>
                        )}
                      </td>

                      {/* Thanh toán */}
                      <td>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: 6,
                            background: order.payment?.payment_method === 'CASH' ? '#f1f5f9' : '#e0e7ff',
                            color: order.payment?.payment_method === 'CASH' ? '#475569' : '#4338ca',
                          }}
                        >
                          {order.payment?.payment_method || 'CASH'}
                        </span>
                      </td>

                      {/* Tổng tiền */}
                      <td>
                        <strong style={{ color: '#059669', fontSize: '0.92rem' }}>
                          {formatMoney(order.total_amount)}
                        </strong>
                      </td>

                      {/* Trạng thái */}
                      <td>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '4px 10px',
                            borderRadius: 999,
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            background: statusStyle.bg,
                            color: statusStyle.color,
                            border: `1px solid ${statusStyle.border}`,
                          }}
                        >
                          {getOrderStatusLabel(order.status)}
                        </span>
                      </td>

                      {/* Nút hành động */}
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                          {/* Nút xem chi tiết */}
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="btn btn-secondary"
                            style={{ padding: '6px 10px', fontSize: '0.78rem' }}
                            title="Xem chi tiết đơn hàng"
                          >
                            <Eye size={14} />
                          </button>

                          {/* Hành động theo đúng flow Backend:
                              PENDING → CONFIRMED | CANCELLED
                              CONFIRMED → PREPARING
                              PREPARING → DELIVERING
                              DELIVERING → DELIVERED
                          */}
                          {order.status === 'PENDING' && (
                            <>
                              <button
                                onClick={() => handleUpdateStatus(order.id, 'CONFIRMED')}
                                disabled={isUpdating}
                                className="btn btn-primary"
                                style={{
                                  padding: '6px 12px',
                                  fontSize: '0.78rem',
                                  background: '#10b981',
                                  borderColor: '#10b981',
                                }}
                              >
                                {isUpdating ? '...' : 'Nhận đơn'}
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm(`Bạn có chắc muốn từ chối / hủy đơn #${order.id}?`)) {
                                    handleUpdateStatus(order.id, 'CANCELLED');
                                  }
                                }}
                                disabled={isUpdating}
                                style={{
                                  padding: '6px 10px',
                                  fontSize: '0.78rem',
                                  background: '#fee2e2',
                                  border: '1px solid #fecaca',
                                  color: '#dc2626',
                                  borderRadius: 8,
                                  cursor: 'pointer',
                                }}
                              >
                                Hủy
                              </button>
                            </>
                          )}

                          {order.status === 'CONFIRMED' && (
                            <button
                              onClick={() => handleUpdateStatus(order.id, 'PREPARING')}
                              disabled={isUpdating}
                              className="btn btn-primary"
                              style={{
                                padding: '6px 12px',
                                fontSize: '0.78rem',
                                background: '#7c3aed',
                                borderColor: '#7c3aed',
                              }}
                            >
                              <ChefHat size={13} style={{ marginRight: 4 }} />
                              {isUpdating ? '...' : 'Nấu món'}
                            </button>
                          )}

                          {order.status === 'PREPARING' && (
                            <button
                              onClick={() => handleUpdateStatus(order.id, 'DELIVERING')}
                              disabled={isUpdating}
                              className="btn btn-primary"
                              style={{
                                padding: '6px 12px',
                                fontSize: '0.78rem',
                                background: '#0284c7',
                                borderColor: '#0284c7',
                              }}
                            >
                              <Truck size={13} style={{ marginRight: 4 }} />
                              {isUpdating ? '...' : 'Giao tài xế'}
                            </button>
                          )}

                          {order.status === 'DELIVERING' && (
                            <button
                              onClick={() => handleUpdateStatus(order.id, 'DELIVERED')}
                              disabled={isUpdating}
                              className="btn btn-primary"
                              style={{
                                padding: '6px 12px',
                                fontSize: '0.78rem',
                                background: '#059669',
                                borderColor: '#059669',
                              }}
                            >
                              <CheckCircle2 size={13} style={{ marginRight: 4 }} />
                              {isUpdating ? '...' : 'Hoàn tất'}
                            </button>
                          )}

                          {order.status === 'DELIVERED' && (
                            <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 600 }}>
                              ✓ Đã xong
                            </span>
                          )}

                          {order.status === 'CANCELLED' && (
                            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                              Đã hủy
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Chi tiết đơn hàng */}
      {selectedOrder && (
        <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div
            className="modal-card"
            style={{ maxWidth: 640, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Modal */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingBottom: 16,
                borderBottom: '1px solid #e2e8f0',
              }}
            >
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
                  Chi Tiết Đơn Hàng #{selectedOrder.id}
                </h3>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  Đặt lúc: {formatDate(selectedOrder.created_at)}
                </span>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#94a3b8',
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Thông tin khách hàng & Giao nhận */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 16,
                padding: '16px 0',
                borderBottom: '1px solid #e2e8f0',
              }}
            >
              <div style={{ background: '#f8fafc', padding: 12, borderRadius: 10 }}>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>
                  Người Nhận Hàng
                </div>
                <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.92rem', marginTop: 4 }}>
                  {selectedOrder.address?.receiver_name || selectedOrder.user?.full_name || 'Khách vãng lai'}
                </div>
                <div style={{ fontSize: '0.82rem', color: '#475569', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Phone size={13} />
                  <span>{selectedOrder.address?.phone_number || selectedOrder.user?.phone_number || 'Chưa có SĐT'}</span>
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: 12, borderRadius: 10 }}>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>
                  Địa Chỉ Nhận
                </div>
                <div style={{ fontSize: '0.82rem', color: '#0f172a', marginTop: 4, display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                  <MapPin size={14} style={{ marginTop: 2, flexShrink: 0, color: '#ea580c' }} />
                  <span>{selectedOrder.address?.address_detail || 'Giao tại quán'}</span>
                </div>
              </div>
            </div>

            {/* Ghi chú khách dặn */}
            {selectedOrder.note && (
              <div
                style={{
                  background: '#fff7ed',
                  border: '1px solid #ffedd5',
                  padding: '10px 14px',
                  borderRadius: 10,
                  margin: '14px 0',
                  fontSize: '0.85rem',
                  color: '#9a3412',
                }}
              >
                <strong>Ghi chú của khách:</strong> {selectedOrder.note}
              </div>
            )}

            {/* Danh sách món ăn */}
            <div style={{ padding: '14px 0' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', marginBottom: 10 }}>
                Danh Sách Món Ăn Trong Đơn
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {selectedOrder.items?.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 12px',
                      background: '#f8fafc',
                      borderRadius: 10,
                      border: '1px solid #e2e8f0',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 8,
                          overflow: 'hidden',
                          background: '#e2e8f0',
                          flexShrink: 0,
                        }}
                      >
                        <img
                          src={resolveImageUrl(item.food?.image)}
                          alt={item.food_name || ''}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = DEFAULT_FOOD_IMAGE;
                          }}
                        />
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.88rem' }}>
                          {item.food_name || item.food?.name}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                          {formatMoney(item.price)} x <strong>{item.quantity}</strong>
                        </div>
                      </div>
                    </div>

                    <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.92rem' }}>
                      {formatMoney(Number(item.price) * item.quantity)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tổng kết tiền */}
            <div
              style={{
                background: '#f8fafc',
                padding: '14px 18px',
                borderRadius: 12,
                border: '1px solid #e2e8f0',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#64748b' }}>
                <span>Tiền món:</span>
                <span>{formatMoney(selectedOrder.food_total || selectedOrder.total_amount)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#64748b' }}>
                <span>Phí giao hàng:</span>
                <span>{formatMoney(selectedOrder.delivery_fee || 0)}</span>
              </div>
              {Number(selectedOrder.discount || 0) > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#ea580c' }}>
                  <span>Giảm giá khuyến mãi:</span>
                  <span>-{formatMoney(selectedOrder.discount)}</span>
                </div>
              )}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '1.05rem',
                  fontWeight: 800,
                  color: '#0f172a',
                  borderTop: '1px solid #e2e8f0',
                  paddingTop: 8,
                  marginTop: 2,
                }}
              >
                <span>Tổng thu người mua:</span>
                <span style={{ color: '#059669' }}>{formatMoney(selectedOrder.total_amount)}</span>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: 18,
                marginTop: 10,
                borderTop: '1px solid #e2e8f0',
              }}
            >
              <button
                onClick={() => window.print()}
                className="btn btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <Printer size={15} />
                <span>In hoá đơn</span>
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {selectedOrder.status === 'PENDING' && (
                  <button
                    onClick={() => handleUpdateStatus(selectedOrder.id, 'CONFIRMED')}
                    className="btn btn-primary"
                    style={{ background: '#10b981', borderColor: '#10b981' }}
                  >
                    Xác nhận đơn ngay
                  </button>
                )}
                {selectedOrder.status === 'CONFIRMED' && (
                  <button
                    onClick={() => handleUpdateStatus(selectedOrder.id, 'PREPARING')}
                    className="btn btn-primary"
                    style={{ background: '#7c3aed', borderColor: '#7c3aed' }}
                  >
                    Bắt đầu nấu món
                  </button>
                )}
                {selectedOrder.status === 'PREPARING' && (
                  <button
                    onClick={() => handleUpdateStatus(selectedOrder.id, 'DELIVERING')}
                    className="btn btn-primary"
                    style={{ background: '#0284c7', borderColor: '#0284c7' }}
                  >
                    Bàn giao tài xế
                  </button>
                )}
                {selectedOrder.status === 'DELIVERING' && (
                  <button
                    onClick={() => handleUpdateStatus(selectedOrder.id, 'DELIVERED')}
                    className="btn btn-primary"
                    style={{ background: '#059669', borderColor: '#059669' }}
                  >
                    Hoàn tất giao hàng
                  </button>
                )}
                <button onClick={() => setSelectedOrder(null)} className="btn btn-secondary">
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
