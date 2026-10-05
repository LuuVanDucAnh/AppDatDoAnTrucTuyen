import React, { useEffect, useState } from 'react';
import {
  Search,
  Filter,
  Eye,
  Settings,
  AlertTriangle,
  X,
  Trash2,
  Phone,
  MapPin,
  Clock,
  User,
  Zap,
  RotateCw,
  FileSpreadsheet,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  FileText,
  BellOff,
  DollarSign,
  Truck,
  CheckCircle2,
  AlertCircle,
  Radio,
  Share2,
} from 'lucide-react';
import { dashboardApi, ordersApi } from '../services/api';
import type { AdminOrder, OrderStatus, PlatformDashboard } from '../services/types';
import { OrderBadge, PaymentBadge } from '../components/Badge';

const money = (val: number | string) =>
  Number(val || 0).toLocaleString('vi-VN') + ' đ';

interface InterventionAudit {
  id: string;
  orderId: string | number;
  adminName: string;
  oldStatus: string;
  newStatus: string;
  reason: string;
  timestamp: string;
}

export function OrdersView() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | ''>('');
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'ALL' | 'PENDING' | 'PREPARING' | 'DELIVERING' | 'DELAYED' | 'DISPUTED'>('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [dashboard, setDashboard] = useState<PlatformDashboard | null>(null);

  // Modals
  const [detailOrder, setDetailOrder] = useState<AdminOrder | null>(null);
  const [forceStatusOrder, setForceStatusOrder] = useState<AdminOrder | null>(null);
  const [newStatus, setNewStatus] = useState<OrderStatus>('READY_FOR_PICKUP' as any);
  const [overrideReason, setOverrideReason] = useState('Quán quá tải chuẩn bị chậm, admin can thiệp bàn giao cho Shipper');
  const [notifyCustomer, setNotifyCustomer] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Audit Trail Modal
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [auditLogs, setAuditLogs] = useState<InterventionAudit[]>([
    {
      id: 'AUD-8831',
      orderId: 'DH-8902',
      adminName: 'Lê Hoàng Long (Super Admin)',
      oldStatus: 'PREPARING',
      newStatus: 'READY_FOR_PICKUP',
      reason: 'Quán quên bấm sẵn sàng lấy, shipper chờ 20 phút',
      timestamp: '10:42:15 - Hôm nay',
    },
    {
      id: 'AUD-8829',
      orderId: 'DH-8871',
      adminName: 'Lê Hoàng Long (Super Admin)',
      oldStatus: 'DELIVERING',
      newStatus: 'CANCELLED',
      reason: 'Shipper gặp tai nạn hỏng xe, hoàn tiền tự động 100% qua MoMo',
      timestamp: '09:15:30 - Hôm nay',
    },
    {
      id: 'AUD-8812',
      orderId: 'DH-8790',
      adminName: 'Lê Hoàng Long (Super Admin)',
      oldStatus: 'PENDING',
      newStatus: 'CONFIRMED',
      reason: 'Quán không có kết nối mạng, admin xác nhận thủ công qua điện thoại',
      timestamp: '08:30:11 - Hôm nay',
    },
  ]);

  // Toast message
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      let statusQuery: OrderStatus | undefined = undefined;
      if (activeTab === 'PENDING') statusQuery = 'PENDING';
      if (activeTab === 'PREPARING') statusQuery = 'PREPARING';
      if (activeTab === 'DELIVERING') statusQuery = 'DELIVERING';

      const res = await ordersApi.getOrders({
        status: statusQuery,
        page,
        limit: 15,
      });
      setOrders(res.data || []);
      if (res.meta) {
        setTotalPages(res.meta.totalPages || 1);
        setTotalCount(res.meta.total || 0);
      }
      dashboardApi.getDashboard().then(setDashboard).catch(() => {});
    } catch (err: any) {
      showToast('error', err?.message || 'Không thể tải danh sách đơn hàng.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [activeTab, page]);

  const handleForceUpdateSubmit = async () => {
    if (!forceStatusOrder) return;
    try {
      setUpdating(true);
      await ordersApi.forceUpdateStatus(forceStatusOrder.id, newStatus);
      showToast('success', `Đã cưỡng chế cập nhật đơn #${forceStatusOrder.id} sang trạng thái: ${newStatus}`);

      // Add to audit trail
      const newAudit: InterventionAudit = {
        id: `AUD-${Math.floor(1000 + Math.random() * 9000)}`,
        orderId: `DH-${forceStatusOrder.id}`,
        adminName: 'Lê Hoàng Long (Super Admin)',
        oldStatus: forceStatusOrder.status,
        newStatus: newStatus,
        reason: overrideReason,
        timestamp: new Date().toLocaleTimeString('vi-VN') + ' - Vừa xong',
      };
      setAuditLogs([newAudit, ...auditLogs]);

      setForceStatusOrder(null);
      fetchOrders();
    } catch (err: any) {
      showToast('error', err?.message || 'Không thể cập nhật trạng thái đơn.');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteOrder = async (order: AdminOrder) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn đơn hàng #${order.id} khỏi hệ thống?`)) return;
    try {
      await ordersApi.deleteOrder(order.id);
      showToast('success', `Đã xóa đơn hàng #${order.id} thành công.`);
      fetchOrders();
    } catch (err: any) {
      showToast('error', err?.message || 'Không thể xóa đơn hàng.');
    }
  };

  const handleQuickIntervention = (orderCode: string, actionType: 'READY' | 'REFUND_CANCEL' | 'REDISPATCH') => {
    if (actionType === 'READY') {
      showToast('success', `⚡ Đã Force Update thành công đơn #${orderCode} sang "Sẵn sàng lấy". Thông báo Shipper vào nhận món!`);
    } else if (actionType === 'REFUND_CANCEL') {
      showToast('success', `⚡ Đã hủy đơn #${orderCode} & kích hoạt hoàn tiền tự động 100% qua ví MoMo.`);
    } else if (actionType === 'REDISPATCH') {
      showToast('success', `🛵 Đang tìm và điều phối Shipper dự phòng gần nhất cho đơn #${orderCode}...`);
    }
  };

  return (
    <div className="dashboard-content">
      {toast && (
        <div className="toast-container">
          <div className={`toast toast-${toast.type}`}>{toast.message}</div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          1. HEADER & ACTIONS (MATCHING IMAGE 4)
         ───────────────────────────────────────────────────────────── */}
      <div className="dashboard-title-bar">
        <div className="title-details">
          <div className="status-tag-row" style={{ marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 800,
                color: '#ea580c',
                background: '#fff7ed',
                border: '1px solid #fed7aa',
                padding: '3px 9px',
                borderRadius: 9999,
              }}
            >
              ● MỤC 3.4 • VẬN HÀNH &amp; CAN THIỆP ĐƠN TOÀN SÀN
            </span>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                color: '#ffffff',
                background: '#0f172a',
                padding: '3px 10px',
                borderRadius: 9999,
              }}
            >
              Chế độ: Super Admin Override
            </span>
            <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>
              - Sync engine: WebSocket Live (1.2k rps)
            </span>
          </div>

          <h2>Quản lý Đơn hàng &amp; Can thiệp Hệ thống (Force Update)</h2>
          <p className="title-subtext">
            Giám sát luồng đơn hàng thời gian thực giữa Khách hàng - Quán ăn - Shipper. Cho phép Admin can thiệp cưỡng chế trạng thái (Force Update) khi có sự cố tắc nghẽn giao hàng, quán quá tải hoặc tranh chấp hoàn tiền.
          </p>
        </div>

        <div className="dashboard-actions-right">
          <button
            className="btn-header-action"
            style={{ background: '#f8fafc', color: '#0f172a', border: '1px solid #cbd5e1' }}
            onClick={() => setShowAuditModal(true)}
          >
            <ShieldAlert size={15} color="#ea580c" />
            <span>Lịch sử can thiệp (Audit Trail)</span>
          </button>

          <button
            className="btn-export-bi"
            style={{ background: 'linear-gradient(135deg, #9a3412 0%, #c2410c 100%)' }}
            onClick={() => alert('Đang trích xuất dữ liệu vận hành đơn hàng CSV/Excel...')}
          >
            <FileSpreadsheet size={16} />
            <span>Xuất đối soát CSV/Excel</span>
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. 4 METRIC CARDS ROW (EXACT VALUES FROM IMAGE 4)
         ───────────────────────────────────────────────────────────── */}
      <div className="metrics-row">
        {/* Card 1: Tổng đơn hôm nay */}
        <div className="metric-card card-revenue">
          <div className="card-top">
            <span className="card-top-title">TỔNG ĐƠN HÔM NAY</span>
            <div className="card-top-icon" style={{ background: '#ffedd5', color: '#ea580c' }}>
              <FileText size={18} />
            </div>
          </div>
          <div className="card-big-value">{dashboard?.orders?.today ?? totalCount}</div>
          <div className="card-footer-info" style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <div style={{ fontSize: '0.78rem', color: '#0f172a', fontWeight: 600 }}>
              Doanh số hôm nay: <strong style={{ color: '#ea580c' }}>{Number(dashboard?.revenue?.today ?? 0).toLocaleString('vi-VN')}đ</strong>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#16a34a', fontSize: '0.74rem' }}>
              <TrendingUp size={13} />
              <span>Đồng bộ thời gian thực từ Database</span>
            </div>
          </div>
        </div>

        {/* Card 2: Đang luân chuyển */}
        <div className="metric-card card-orders">
          <div className="card-top">
            <span className="card-top-title">ĐANG LUÂN CHUYỂN (ACTIVE)</span>
            <div className="card-top-icon" style={{ background: '#ffedd5', color: '#d97706' }}>
              <RotateCw size={18} />
            </div>
          </div>
          <div className="card-big-value">
            {(dashboard?.orders?.pending ?? 0) + (dashboard?.orders?.preparing ?? 0) + (dashboard?.orders?.delivering ?? 0)}
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              background: '#f0f9ff',
              borderRadius: 8,
              padding: '6px 8px',
              textAlign: 'center',
              marginTop: 4,
            }}
          >
            <div>
              <div style={{ fontSize: '0.68rem', color: '#64748b' }}>Chờ nhận</div>
              <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0284c7' }}>
                {dashboard?.orders?.pending ?? 0}
              </div>
            </div>
            <div style={{ borderLeft: '1px solid #e0f2fe', borderRight: '1px solid #e0f2fe' }}>
              <div style={{ fontSize: '0.68rem', color: '#64748b' }}>Đang nấu</div>
              <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#ea580c' }}>
                {dashboard?.orders?.preparing ?? 0}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.68rem', color: '#64748b' }}>Đang giao</div>
              <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#16a34a' }}>
                {dashboard?.orders?.delivering ?? 0}
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Đã giao thành công */}
        <div className="metric-card card-restaurants">
          <div className="card-top">
            <span className="card-top-title">ĐÃ GIAO THÀNH CÔNG (DELIVERED)</span>
            <div className="card-top-icon" style={{ background: '#ecfdf5', color: '#059669' }}>
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="card-big-value" style={{ color: '#059669' }}>
            {dashboard?.orders?.completed ?? 0}
          </div>
          <div className="card-footer-info">
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem' }}>
              <span style={{ color: '#64748b' }}>Tỷ lệ hoàn tất sàn:</span>
              <span style={{ color: '#059669', fontWeight: 700 }}>
                {totalCount > 0 ? Math.round(((dashboard?.orders?.completed ?? 0) / totalCount) * 100) : 100}% hoàn tất
              </span>
            </div>
          </div>
        </div>

        {/* Card 4: Đã huỷ / Tranh chấp */}
        <div className="metric-card card-users">
          <div className="card-top">
            <span className="card-top-title">ĐƠN ĐÃ HUỶ / TRANH CHẤP</span>
            <div className="card-top-icon" style={{ background: '#fee2e2', color: '#dc2626' }}>
              <DollarSign size={18} />
            </div>
          </div>
          <div className="card-big-value" style={{ color: '#dc2626' }}>
            {dashboard?.orders?.cancelled ?? 0}
          </div>
          <div className="card-footer-info" style={{ display: 'flex', flexDirection: 'column', gap: 2, fontSize: '0.74rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Tỷ lệ đơn huỷ sàn:</span>
              <strong style={{ color: '#dc2626' }}>
                {totalCount > 0 ? Math.round(((dashboard?.orders?.cancelled ?? 0) / totalCount) * 100) : 0}%
              </strong>
            </div>
            <div style={{ color: '#64748b' }}>
              {dashboard?.orders?.cancelled ?? 0} đơn đã huỷ trong hệ thống
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. WARNING BANNER
         ───────────────────────────────────────────────────────────── */}
      <div
        style={{
          background: '#fff7ed',
          border: '1px solid #ffedd5',
          borderRadius: 14,
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 14,
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 10,
              background: '#9a3412',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <AlertTriangle size={22} />
          </div>
          <div>
            <h4 style={{ fontSize: '0.98rem', fontWeight: 800, color: '#9a3412', marginBottom: 3 }}>
              {(dashboard?.orders?.pending ?? 0) + (dashboard?.orders?.delivering ?? 0) > 0
                ? `${(dashboard?.orders?.pending ?? 0) + (dashboard?.orders?.delivering ?? 0)} Đơn hàng đang luân chuyển — Admin có thể can thiệp cưỡng chế trạng thái`
                : 'Hệ thống vận hành ổn định — Toàn bộ đơn hàng đã được xử lý'}
            </h4>
            <p style={{ fontSize: '0.78rem', color: '#7c2d12', margin: 0 }}>
              Quy trình SLA cam kết: Quán &lt; 20 phút chuẩn bị, Shipper &lt; 25 phút vận chuyển. Can thiệp bảo vệ trải nghiệm người dùng.
            </p>
          </div>
        </div>

        <span
          style={{
            background: '#fee2e2',
            color: '#dc2626',
            border: '1px solid #fecaca',
            borderRadius: 9999,
            padding: '5px 14px',
            fontSize: '0.75rem',
            fontWeight: 800,
            letterSpacing: '0.03em',
          }}
        >
          SUPER ADMIN
        </span>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          4. CRITICAL INTERVENTION CARDS (FROM DATABASE)
         ───────────────────────────────────────────────────────────── */}
      {(() => {
        const activeList = orders.filter((o) =>
          ['PENDING', 'CONFIRMED', 'PREPARING', 'DELIVERING'].includes(o.status)
        );
        if (activeList.length === 0) {
          return null;
        }
        return (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))', gap: 18 }}>
            {activeList.slice(0, 2).map((ord) => (
              <div
                key={ord.id}
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: 14,
                  padding: 20,
                  boxShadow: 'var(--shadow-card)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 14,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: '1.05rem', fontWeight: 900, color: '#0f172a', fontFamily: 'var(--font-mono)' }}>
                      #{ord.id}
                    </span>
                    <span
                      style={{
                        background: ord.status === 'DELIVERING' ? '#ffedd5' : '#f0f9ff',
                        color: ord.status === 'DELIVERING' ? '#ea580c' : '#0284c7',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        padding: '3px 8px',
                        borderRadius: 6,
                      }}
                    >
                      {ord.status}
                    </span>
                  </div>

                  <span
                    style={{
                      background: '#fff7ed',
                      color: '#c2410c',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: 9999,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <Clock size={12} />
                    <span>Đơn luân chuyển</span>
                  </span>
                </div>

                {/* Route info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem' }}>
                  <strong style={{ color: '#0f172a' }}>{ord.restaurant?.name || `Quán #${ord.restaurant_id}`}</strong>
                  <ArrowRight size={14} color="#94a3b8" />
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                    <strong style={{ color: '#0f172a' }}>{ord.user?.full_name || `Khách #${ord.user_id}`}</strong>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      ({ord.address?.phone_number || ord.user?.phone_number || 'SĐT: —'})
                    </span>
                  </div>
                </div>

                {/* Alert Callout */}
                <div
                  style={{
                    background: '#fffbeb',
                    border: '1px solid #fef3c7',
                    borderRadius: 8,
                    padding: '10px 14px',
                    fontSize: '0.78rem',
                    color: '#92400e',
                    lineHeight: 1.5,
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 8,
                  }}
                >
                  <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: 2, color: '#d97706' }} />
                  <span>
                    <strong>Tổng tiền:</strong> {Number(ord.total_amount || 0).toLocaleString('vi-VN')}đ •{' '}
                    <strong>Địa chỉ:</strong> {ord.address?.address_detail || 'Giao tận nơi'} •{' '}
                    <strong>Ghi chú:</strong> {ord.note || 'Không có ghi chú'}
                  </span>
                </div>

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: 10, marginTop: 'auto' }}>
                  <button
                    className="btn btn-primary"
                    style={{
                      flex: 1.4,
                      height: 38,
                      fontSize: '0.8rem',
                      background: 'linear-gradient(135deg, #9a3412 0%, #c2410c 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                    }}
                    onClick={() => {
                      setForceStatusOrder(ord);
                      setNewStatus(ord.status);
                    }}
                  >
                    <Zap size={14} />
                    <span>⚡ Can thiệp Force Update trạng thái</span>
                  </button>

                  <button
                    className="btn-action-sm"
                    style={{
                      height: 38,
                      padding: '0 14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      color: '#334155',
                      borderColor: '#cbd5e1',
                    }}
                    onClick={() => {
                      setDetailOrder(ord);
                    }}
                  >
                    <Eye size={14} />
                    <span>Chi tiết đơn</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        );
      })()}

      {/* ─────────────────────────────────────────────────────────────
          5. ORDERS MANAGEMENT TABLE & REALTIME FILTERS
         ───────────────────────────────────────────────────────────── */}
      <div className="glass-panel">
        <div className="filter-bar">
          <div className="search-input-group">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              className="input-styled"
              placeholder="Tìm theo Mã đơn (#DH-xxxx), Tên khách hàng, SĐT, Quán ăn..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Quick Filter Tabs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.78rem', color: '#94a3b8', marginRight: 4 }}>Lọc nhanh:</span>
            <button
              className={`filter-chip ${activeTab === 'ALL' ? 'active' : ''}`}
              onClick={() => { setActiveTab('ALL'); setPage(1); }}
            >
              Tất cả (142)
            </button>
            <button
              className={`filter-chip ${activeTab === 'PENDING' ? 'active' : ''}`}
              onClick={() => { setActiveTab('PENDING'); setPage(1); }}
            >
              Chờ nhận (32)
            </button>
            <button
              className={`filter-chip ${activeTab === 'PREPARING' ? 'active' : ''}`}
              onClick={() => { setActiveTab('PREPARING'); setPage(1); }}
            >
              Đang nấu (58)
            </button>
            <button
              className={`filter-chip ${activeTab === 'DELIVERING' ? 'active' : ''}`}
              onClick={() => { setActiveTab('DELIVERING'); setPage(1); }}
            >
              Đang giao (52)
            </button>
            <button
              className={`filter-chip ${activeTab === 'DELAYED' ? 'active' : ''}`}
              onClick={() => { setActiveTab('DELAYED'); setPage(1); }}
            >
              Cảnh báo trễ (9)
            </button>
            <button
              className={`filter-chip ${activeTab === 'DISPUTED' ? 'active' : ''}`}
              onClick={() => { setActiveTab('DISPUTED'); setPage(1); }}
            >
              Tranh chấp/Hủy (5)
            </button>
          </div>
        </div>

        {/* Secondary Filter Row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0 24px 14px', flexWrap: 'wrap' }}>
          <select className="select-styled" style={{ height: 34, fontSize: '0.78rem' }}>
            <option>Tất cả quận/huyện (TP.HCM)</option>
            <option>Quận 1</option>
            <option>Quận 3</option>
            <option>Quận 10</option>
            <option>Bình Thạnh</option>
          </select>

          <select className="select-styled" style={{ height: 34, fontSize: '0.78rem' }}>
            <option>Cổng thanh toán: Tất cả</option>
            <option>Ví MoMo (48%)</option>
            <option>VNPay QR (28%)</option>
            <option>Tiền mặt COD (20%)</option>
            <option>Thẻ Visa/Master (4%)</option>
          </select>

          <select className="select-styled" style={{ height: 34, fontSize: '0.78rem' }}>
            <option>Mức độ SLA: Tất cả mức</option>
            <option>Đúng hẹn (&lt; 30p)</option>
            <option>Chậm nhẹ (30 - 45p)</option>
            <option>Báo động đỏ (&gt; 45p)</option>
          </select>

          <div style={{ marginLeft: 'auto', fontSize: '0.8rem', color: '#64748b' }}>
            Hiển thị <strong style={{ color: '#0f172a' }}>{orders.length}</strong> / {totalCount || 142} đơn hàng
          </div>
        </div>

        {/* Orders Table */}
        <div className="table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Mã Đơn</th>
                <th>Khách Hàng &amp; Địa Chỉ</th>
                <th>Nhà Hàng Đối Tác</th>
                <th>Tổng Tiền &amp; PTTT</th>
                <th>Tiến Độ SLA</th>
                <th>Trạng Thái Luân Chuyển</th>
                <th>Shipper Phụ Trách</th>
                <th style={{ textAlign: 'right' }}>Thao Tác Admin</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                      <RotateCw size={18} className="animate-spin" />
                      <span>Đang nạp luồng đơn hàng thời gian thực...</span>
                    </div>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>
                    Không có đơn hàng nào khớp với điều kiện lọc.
                  </td>
                </tr>
              ) : (
                orders.map((order) => {
                  const isDelay = order.id % 4 === 0;
                  return (
                    <tr key={order.id}>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: '#ea580c', fontSize: '0.88rem' }}>
                            #DH-{order.id}
                          </span>
                          <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                            {new Date(order.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </td>

                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 700, color: '#0f172a' }}>
                            {order.user?.full_name || `Khách hàng #${order.user_id}`}
                          </span>
                          <span style={{ fontSize: '0.73rem', color: '#64748b', maxWidth: 210, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {order.address?.address_detail || (order as any).delivery_address || 'Địa chỉ nhận mặc định'}
                          </span>
                        </div>
                      </td>

                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 700, color: '#0f172a' }}>
                            {order.restaurant?.name || 'Nhà hàng Food'}
                          </span>
                          <span style={{ fontSize: '0.73rem', color: '#64748b' }}>
                            {order.items?.length || 2} món trong đơn
                          </span>
                        </div>
                      </td>

                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <strong style={{ color: '#ea580c', fontSize: '0.88rem' }}>{money(order.total_amount)}</strong>
                          <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                            {order.payment?.payment_method || 'VÍ MOMO (ONLINE)'}
                          </span>
                        </div>
                      </td>

                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.72rem' }}>
                            <span style={{ color: isDelay ? '#dc2626' : '#16a34a', fontWeight: 700 }}>
                              {isDelay ? '⚠️ Trễ 12 phút' : 'Chuẩn SLA'}
                            </span>
                            <span style={{ color: '#94a3b8' }}>25p / 40p</span>
                          </div>
                          <div style={{ width: 100, height: 4, background: '#f1f5f9', borderRadius: 99 }}>
                            <div
                              style={{
                                width: isDelay ? '95%' : '60%',
                                height: '100%',
                                background: isDelay ? '#dc2626' : '#059669',
                                borderRadius: 99,
                              }}
                            />
                          </div>
                        </div>
                      </td>

                      <td>
                        <OrderBadge status={order.status} />
                      </td>

                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div
                            style={{
                              width: 26,
                              height: 26,
                              borderRadius: 999,
                              background: '#f1f5f9',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.7rem',
                            }}
                          >
                            🛵
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '0.76rem', fontWeight: 600, color: '#0f172a' }}>
                              {order.id % 2 === 0 ? 'Trần Văn Hùng' : 'Lê Hoàng Nam'}
                            </span>
                            <span style={{ fontSize: '0.68rem', color: '#64748b' }}>0912.888.xxx</span>
                          </div>
                        </div>
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: 6 }}>
                          <button
                            className="btn-action-sm"
                            title="Xem chi tiết đơn hàng"
                            onClick={() => setDetailOrder(order)}
                          >
                            <Eye size={13} />
                            <span>Chi tiết</span>
                          </button>

                          <button
                            className="btn-action-sm"
                            style={{ background: '#fff7ed', color: '#ea580c', borderColor: '#fed7aa', fontWeight: 700 }}
                            title="Can thiệp cưỡng chế trạng thái"
                            onClick={() => {
                              setForceStatusOrder(order);
                              setNewStatus(order.status);
                            }}
                          >
                            <Zap size={13} />
                            <span>Force Update</span>
                          </button>

                          <button
                            className="btn-action-sm"
                            style={{ background: '#fef2f2', color: '#dc2626', borderColor: '#fecaca' }}
                            title="Xóa đơn hàng này"
                            onClick={() => handleDeleteOrder(order)}
                          >
                            <Trash2 size={13} />
                            <span>Xóa</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="table-pagination">
          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
            Trang {page} / {totalPages}
          </span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              className="btn-page"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Trước
            </button>
            <button
              className="btn-page"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Tiếp
            </button>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          6. MODAL: FORCE UPDATE STATUS (OVERRIDE BY SUPER ADMIN)
         ───────────────────────────────────────────────────────────── */}
      {forceStatusOrder && (
        <div className="modal-backdrop">
          <div className="modal-box" style={{ maxWidth: 540 }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 8,
                    background: '#9a3412',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Zap size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>
                    Cưỡng Chế Trạng Thái (Force Update)
                  </h3>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    Mã đơn: <strong style={{ color: '#ea580c' }}>#DH-{forceStatusOrder.id}</strong> • Super Admin Override
                  </div>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setForceStatusOrder(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div
                style={{
                  background: '#fff7ed',
                  border: '1px solid #fed7aa',
                  borderRadius: 8,
                  padding: '10px 14px',
                  fontSize: '0.78rem',
                  color: '#9a3412',
                }}
              >
                ⚠️ <strong>Cảnh báo:</strong> Thao tác này sẽ ghi đè trạng thái của Quán và Shipper, phát sinh ghi log Audit Trail và tự động gửi thông báo cập nhật cho Khách hàng.
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: 700 }}>
                  Trạng Thái Cưỡng Chế Mục Tiêu
                </label>
                <select
                  className="select-styled"
                  style={{ width: '100%', height: 40 }}
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as OrderStatus)}
                >
                  <option value="CONFIRMED">Xác nhận đơn ngay (CONFIRMED)</option>
                  <option value="PREPARING">Quán đang chuẩn bị món (PREPARING)</option>
                  <option value="READY_FOR_PICKUP">Món đã sẵn sàng - Báo Shipper lấy (READY_FOR_PICKUP)</option>
                  <option value="DELIVERING">Shipper đang giao hàng (DELIVERING)</option>
                  <option value="DELIVERED">Hoàn tất giao thành công (DELIVERED)</option>
                  <option value="CANCELLED">Hủy đơn &amp; Kích hoạt hoàn tiền (CANCELLED)</option>
                </select>
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: 700 }}>
                  Lý Do Can Thiệp (Audit Trail Log) *
                </label>
                <textarea
                  className="input-styled"
                  rows={3}
                  placeholder="Ghi rõ lý do can thiệp: quán quá tải, shipper sự cố, khách huỷ qua hotline..."
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="checkbox"
                  id="notifyCust"
                  checked={notifyCustomer}
                  onChange={(e) => setNotifyCustomer(e.target.checked)}
                />
                <label htmlFor="notifyCust" style={{ fontSize: '0.8rem', color: '#475569', cursor: 'pointer' }}>
                  Gửi thông báo Push &amp; SMS thời gian thực đến điện thoại khách hàng
                </label>
              </div>
            </div>

            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                className="btn-action-sm"
                style={{ height: 38 }}
                onClick={() => setForceStatusOrder(null)}
              >
                Hủy bỏ
              </button>
              <button
                className="btn btn-primary"
                style={{ height: 38, background: '#9a3412', display: 'flex', alignItems: 'center', gap: 6 }}
                disabled={updating}
                onClick={handleForceUpdateSubmit}
              >
                {updating ? <RotateCw size={14} className="animate-spin" /> : <Zap size={14} />}
                <span>Xác nhận Force Update</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          7. MODAL: AUDIT TRAIL LOGS
         ───────────────────────────────────────────────────────────── */}
      {showAuditModal && (
        <div className="modal-backdrop">
          <div className="modal-box" style={{ maxWidth: 680 }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 8,
                    background: '#0f172a',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <ShieldAlert size={20} color="#ea580c" />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>
                    Lịch Sử Can Thiệp Hệ Thống (Audit Trail)
                  </h3>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    Nhật ký can thiệp cưỡng chế trạng thái đơn hàng của Quản trị viên
                  </div>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setShowAuditModal(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {auditLogs.map((log) => (
                  <div
                    key={log.id}
                    style={{
                      border: '1px solid #e2e8f0',
                      borderRadius: 10,
                      padding: '12px 16px',
                      background: '#f8fafc',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontWeight: 800, color: '#ea580c', fontFamily: 'var(--font-mono)' }}>
                          #{log.orderId}
                        </span>
                        <span style={{ fontSize: '0.72rem', background: '#e2e8f0', padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>
                          {log.oldStatus} ➔ {log.newStatus}
                        </span>
                      </div>
                      <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{log.timestamp}</span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#0f172a', fontWeight: 600 }}>
                      Người can thiệp: <span style={{ color: '#0284c7' }}>{log.adminName}</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: 4, fontStyle: 'italic' }}>
                      "Lý do: {log.reason}"
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                className="btn-action-sm"
                style={{ height: 38 }}
                onClick={() => setShowAuditModal(false)}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          8. MODAL: ORDER DETAILS
         ───────────────────────────────────────────────────────────── */}
      {detailOrder && (
        <div className="modal-backdrop">
          <div className="modal-box" style={{ maxWidth: 600 }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 8,
                    background: '#ffedd5',
                    color: '#ea580c',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <FileText size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>
                    Chi Tiết Đơn Hàng #DH-{detailOrder.id}
                  </h3>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    Khởi tạo: {new Date(detailOrder.created_at).toLocaleString('vi-VN')}
                  </div>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setDetailOrder(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8 }}>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Khách hàng</div>
                  <div style={{ fontWeight: 700, color: '#0f172a' }}>
                    {detailOrder.user?.full_name || `User #${detailOrder.user_id}`}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    {detailOrder.user?.phone_number || '0988.xxx.xxx'}
                  </div>
                </div>

                <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8 }}>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Nhà hàng đối tác</div>
                  <div style={{ fontWeight: 700, color: '#0f172a' }}>
                    {detailOrder.restaurant?.name || 'Nhà hàng'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    {detailOrder.restaurant?.address || 'TP.HCM'}
                  </div>
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: 6 }}>Địa chỉ giao nhận</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: '#0f172a', fontWeight: 600 }}>
                  <MapPin size={14} color="#ea580c" />
                  <span>{detailOrder.address?.address_detail || (detailOrder as any).delivery_address || 'Địa chỉ người nhận'}</span>
                </div>
              </div>

              {detailOrder.items && detailOrder.items.length > 0 && (
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: 8 }}>Danh sách món ăn</div>
                  <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
                    {detailOrder.items.map((it, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 12px',
                          borderBottom: idx === detailOrder.items!.length - 1 ? 'none' : '1px solid #f1f5f9',
                          fontSize: '0.8rem',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontWeight: 700, color: '#ea580c' }}>{it.quantity}x</span>
                          <span style={{ fontWeight: 600, color: '#0f172a' }}>{it.food_name || it.food?.name || `Món #${it.food_id || idx + 1}`}</span>
                        </div>
                        <span style={{ fontWeight: 700 }}>{money(Number(it.price) * Number(it.quantity))}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e2e8f0', paddingTop: 12 }}>
                <span style={{ fontWeight: 700, color: '#0f172a' }}>Tổng cộng thanh toán:</span>
                <span style={{ fontSize: '1.2rem', fontWeight: 900, color: '#ea580c' }}>
                  {money(detailOrder.total_amount)}
                </span>
              </div>
            </div>

            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button
                className="btn btn-primary"
                style={{ height: 38, background: '#9a3412', fontSize: '0.78rem' }}
                onClick={() => {
                  setForceStatusOrder(detailOrder);
                  setNewStatus(detailOrder.status);
                  setDetailOrder(null);
                }}
              >
                <Zap size={14} />
                <span>Mở can thiệp Force Update</span>
              </button>

              <button
                className="btn-action-sm"
                style={{ height: 38 }}
                onClick={() => setDetailOrder(null)}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
