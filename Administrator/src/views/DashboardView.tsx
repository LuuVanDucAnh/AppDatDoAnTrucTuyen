import React, { useEffect, useState } from 'react';
import {
  Download,
  Calendar,
  Wallet,
  Truck,
  Utensils,
  CreditCard,
  RotateCw,
  Filter,
  AlertTriangle,
  Clock,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { dashboardApi, ordersApi } from '../services/api';
import type { AdminOrder, PlatformDashboard } from '../services/types';

export function DashboardView() {
  const [timeFilter, setTimeFilter] = useState<'today' | '7days' | 'month' | 'custom'>('today');
  const [dashboard, setDashboard] = useState<PlatformDashboard | null>(null);
  const [recentOrders, setRecentOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [dash, ordRes] = await Promise.all([
        dashboardApi.getDashboard().catch(() => null),
        ordersApi.getOrders({ limit: 4 }).catch(() => ({ data: [] })),
      ]);
      if (dash) setDashboard(dash);
      if (ordRes?.data) setRecentOrders(ordRes.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Numbers directly from Database
  const totalRevenue = Number(dashboard?.revenue?.total || 0);
  const todayRevenue = Number(dashboard?.revenue?.today || 0);
  const monthRevenue = Number(dashboard?.revenue?.this_month || 0);

  const totalOrders = Number(dashboard?.orders?.total || 0);
  const todayOrders = Number(dashboard?.orders?.today || 0);
  const pendingOrders = Number(dashboard?.orders?.pending || 0);
  const preparingOrders = Number(dashboard?.orders?.preparing || 0);
  const deliveringOrders = Number(dashboard?.orders?.delivering || 0);
  const completedOrders = Number(dashboard?.orders?.completed || 0);
  const cancelledOrders = Number(dashboard?.orders?.cancelled || 0);

  const totalRestaurants = Number(dashboard?.restaurants?.total || 0);
  const openRestaurants = Number(dashboard?.restaurants?.open || 0);
  const closedRestaurants = Number(dashboard?.restaurants?.closed || 0);

  const totalUsers = Number(dashboard?.users?.total || 0);
  const newUsersToday = Number(dashboard?.users?.new_today || 0);
  const customerCount = Number(dashboard?.users?.customers || 0);
  const ownerCount = Number(dashboard?.users?.owners || 0);
  const adminCount = Number(dashboard?.users?.admins || 0);

  return (
    <div className="dashboard-content">
      {/* ─────────────────────────────────────────────────────────────
          1. TITLE BAR & FILTERS
         ───────────────────────────────────────────────────────────── */}
      <div className="dashboard-title-bar">
        <div className="title-details">
          <h2>Tổng quan Vận hành Toàn sàn</h2>
          <div className="status-tag-row">
            <span className="tag-uptime">
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: '#10b981',
                  boxShadow: '0 0 6px #10b981',
                }}
              />
              Hệ thống hoạt động bình thường (99.98% Uptime)
            </span>
            <span className="tag-cluster">ID: CLUSTER-VN-SOUTH</span>
          </div>
          <p className="title-subtext">
            Giám sát số liệu bán hàng, lưu lượng tài khoản, rủi ro gian lận và điều phối đơn giao hàng tức thời.
          </p>
        </div>

        <div className="dashboard-actions-right">
          {/* Time Filter Pills */}
          <div className="time-filter-group">
            <button
              className={`time-filter-btn ${timeFilter === 'today' ? 'active' : ''}`}
              onClick={() => setTimeFilter('today')}
            >
              Hôm nay
            </button>
            <button
              className={`time-filter-btn ${timeFilter === '7days' ? 'active' : ''}`}
              onClick={() => setTimeFilter('7days')}
            >
              7 ngày qua
            </button>
            <button
              className={`time-filter-btn ${timeFilter === 'month' ? 'active' : ''}`}
              onClick={() => setTimeFilter('month')}
            >
              Tháng này
            </button>
            <button
              className={`time-filter-btn ${timeFilter === 'custom' ? 'active' : ''}`}
              onClick={() => setTimeFilter('custom')}
            >
              Tùy chọn 📅
            </button>
          </div>

          {/* Export Button */}
          <button
            className="btn-export-bi"
            onClick={() => alert('Đang trích xuất báo cáo dữ liệu định dạng Excel/BI...')}
          >
            <Download size={16} />
            <span>Xuất báo cáo BI/Excel</span>
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. 4 METRIC CARDS ROW (Matching image)
         ───────────────────────────────────────────────────────────── */}
      <div className="metrics-row">
        {/* Card 1: Doanh thu tích lũy */}
        <div className="metric-card card-revenue">
          <div className="card-top">
            <span className="card-top-title">DOANH THU TÍCH LŨY</span>
            <div
              className="card-top-icon"
              style={{ background: '#ffedd5', color: '#c2410c' }}
            >
              <Wallet size={19} />
            </div>
          </div>
          <div className="card-big-value">
            {Number(totalRevenue).toLocaleString('vi-VN')}
            <small>đ</small>
          </div>
          <div className="card-footer-info">
            <div>
              Hôm nay: <strong>{Number(todayRevenue).toLocaleString('vi-VN')}đ</strong>
            </div>
            <div>
              Tháng này: <strong>{Number(monthRevenue).toLocaleString('vi-VN')}đ</strong>{' '}
              <span style={{ color: '#16a34a', fontWeight: 700 }}>+14.2%</span>
            </div>
          </div>
        </div>

        {/* Card 2: Tổng đơn hàng sàn */}
        <div className="metric-card card-orders">
          <div className="card-top">
            <span className="card-top-title">TỔNG ĐƠN HÀNG SÀN</span>
            <div
              className="card-top-icon"
              style={{ background: '#fef9c3', color: '#ca8a04' }}
            >
              <Truck size={19} />
            </div>
          </div>
          <div className="card-big-value">
            {Number(totalOrders).toLocaleString('vi-VN')}
            <small>đơn</small>
          </div>
          <div className="card-footer-info">
            <div>
              Đơn phát sinh hôm nay: <strong style={{ color: '#c2410c' }}>{todayOrders} đơn</strong>
            </div>
            <div>
              Chờ duyệt: <strong>{pendingOrders}</strong> &nbsp;•&nbsp; Đã hủy:{' '}
              <strong style={{ color: '#dc2626' }}>
                {cancelledOrders} ({((cancelledOrders / (totalOrders || 1)) * 100).toFixed(2)}%)
              </strong>
            </div>
          </div>
        </div>

        {/* Card 3: Nhà hàng đối tác */}
        <div className="metric-card card-restaurants">
          <div className="card-top">
            <span className="card-top-title">NHÀ HÀNG ĐỐI TÁC</span>
            <div
              className="card-top-icon"
              style={{ background: '#dcfce7', color: '#15803d' }}
            >
              <Utensils size={19} />
            </div>
          </div>
          <div className="card-big-value">
            {totalRestaurants}
            <small>quán</small>
          </div>
          <div className="card-footer-info">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>● Mở: <strong>{openRestaurants}</strong></span>
              <span>● Tạm đóng: <strong>{closedRestaurants}</strong></span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
              <span>Tỉ lệ mở cửa:</span>
              <span className="badge-onboard">
                {totalRestaurants > 0 ? Math.round((openRestaurants / totalRestaurants) * 100) : 0}%
              </span>
            </div>
          </div>
        </div>

        {/* Card 4: Người dùng hệ thống */}
        <div className="metric-card card-users">
          <div className="card-top">
            <span className="card-top-title">NGƯỜI DÙNG HỆ THỐNG</span>
            <div
              className="card-top-icon"
              style={{ background: '#f3e8ff', color: '#7e22ce' }}
            >
              <CreditCard size={19} />
            </div>
          </div>
          <div className="card-big-value">
            {Number(totalUsers).toLocaleString('vi-VN')}
            <small>tài khoản</small>
          </div>
          <div className="card-footer-info">
            <div>
              Hôm nay: <strong style={{ color: '#16a34a' }}>+{newUsersToday} mới</strong>{' '}
              &nbsp;•&nbsp; {dashboard?.reviews?.avg_rating || 5}★ ({dashboard?.reviews?.total || 0} đánh giá)
            </div>
            <div style={{ color: '#64748b' }}>
              {customerCount} Khách • {ownerCount} Chủ quán • {adminCount} Admin
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. ANALYTICS ROW: SPLINE CHART & DONUT STATUS
         ───────────────────────────────────────────────────────────── */}
      <div className="analytics-row">
        {/* Left: Dual Line Spline Curve Chart */}
        <div className="panel-card">
          <div className="panel-card-header">
            <div className="panel-title">
              <h3>Xu hướng Tăng trưởng & Doanh thu sàn</h3>
              <p>Tổng hợp phân tích chuỗi giao dịch và biến động số lượng đơn giao dịch thành công</p>
            </div>
            <div className="chart-legends">
              <div className="legend-item">
                <span className="legend-dot" style={{ background: '#9a3412' }} />
                <span>Doanh thu (triệu đ)</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot" style={{ background: '#d97706' }} />
                <span>Số đơn (nghìn)</span>
              </div>
            </div>
          </div>

          {/* SVG Multi-line Spline Area Chart */}
          <div className="svg-chart-wrap">
            <svg
              viewBox="0 0 700 200"
              style={{ width: '100%', height: '100%', overflow: 'visible' }}
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ea580c" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#ea580c" stopOpacity="0.01" />
                </linearGradient>
                <linearGradient id="ordersGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1="0" y1="40" x2="700" y2="40" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="0" y1="90" x2="700" y2="90" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="0" y1="140" x2="700" y2="140" stroke="#f1f5f9" strokeWidth="1" />

              {/* Area 1: Revenue */}
              <path
                d="M 20,160 Q 120,145 220,115 T 420,95 T 570,90 T 680,60 L 680,200 L 20,200 Z"
                fill="url(#revenueGrad)"
              />
              {/* Line 1: Revenue Curve */}
              <path
                d="M 20,160 Q 120,145 220,115 T 420,95 T 570,90 T 680,60"
                fill="none"
                stroke="#9a3412"
                strokeWidth="3.2"
                strokeLinecap="round"
              />
              {/* Points on Line 1 */}
              <circle cx="20" cy="160" r="4" fill="#9a3412" />
              <circle cx="220" cy="115" r="4" fill="#9a3412" />
              <circle cx="420" cy="95" r="4" fill="#9a3412" />
              <circle cx="570" cy="90" r="4.5" fill="#9a3412" />
              <circle cx="680" cy="60" r="5" fill="#ea580c" stroke="#fff" strokeWidth="2" />

              {/* Area 2: Orders Count */}
              <path
                d="M 20,175 Q 120,160 220,140 T 420,120 T 570,110 T 680,85 L 680,200 L 20,200 Z"
                fill="url(#ordersGrad)"
              />
              {/* Line 2: Orders Curve */}
              <path
                d="M 20,175 Q 120,160 220,140 T 420,120 T 570,110 T 680,85"
                fill="none"
                stroke="#d97706"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeDasharray="4 2"
              />
              <circle cx="680" cy="85" r="4" fill="#d97706" />
            </svg>
          </div>

          <div className="chart-x-labels">
            <span>T2 (01/11)</span>
            <span>T3 (02/11)</span>
            <span>T4 (03/11)</span>
            <span>T5 (04/11)</span>
            <span>T6 (05/11)</span>
            <span>T7 (06/11)</span>
            <span style={{ color: '#ea580c', fontWeight: 700 }}>CN Hôm nay (Hạ tầng 100%)</span>
          </div>
        </div>

        {/* Right: Donut Status Today */}
        <div className="panel-card">
          <div className="panel-card-header">
            <div className="panel-title">
              <h3>Trạng thái Đơn hàng</h3>
            </div>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: '#059669',
                background: '#ecfdf5',
                padding: '3px 8px',
                borderRadius: 12,
              }}
            >
              {totalOrders} đơn
            </span>
          </div>

          <div className="donut-center-box">
            <div className="donut-svg-wrap">
              <svg width="170" height="170" viewBox="0 0 100 100">
                {/* Background Ring */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="#f1f5f9"
                  strokeWidth="11"
                />
                {/* Segment: Completed */}
                {totalOrders > 0 && (
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    fill="none"
                    stroke="#059669"
                    strokeWidth="11"
                    strokeDasharray={`${Math.max(1, (completedOrders / totalOrders) * 238)} 238`}
                    strokeDashoffset="60"
                    strokeLinecap="round"
                  />
                )}
                {/* Segment: Delivering */}
                {totalOrders > 0 && deliveringOrders > 0 && (
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    fill="none"
                    stroke="#ea580c"
                    strokeWidth="11"
                    strokeDasharray={`${(deliveringOrders / totalOrders) * 238} 238`}
                    strokeDashoffset={String(60 - (completedOrders / totalOrders) * 238)}
                  />
                )}
              </svg>
              <div className="donut-text-center">
                <span className="pct">
                  {totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0}%
                </span>
                <span className="sub">Hoàn tất</span>
              </div>
            </div>
          </div>

          <div className="donut-status-list">
            <div className="donut-status-item">
              <div className="left">
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#059669' }} />
                <span>Đã giao thành công (COMPLETED)</span>
              </div>
              <span className="right">
                {completedOrders} đơn ({totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0}%)
              </span>
            </div>

            <div className="donut-status-item">
              <div className="left">
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ea580c' }} />
                <span>Đang giao hàng (DELIVERING)</span>
              </div>
              <span className="right">
                {deliveringOrders} đơn ({totalOrders > 0 ? Math.round((deliveringOrders / totalOrders) * 100) : 0}%)
              </span>
            </div>

            <div className="donut-status-item">
              <div className="left">
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ca8a04' }} />
                <span>Bếp đang nấu (PREPARING)</span>
              </div>
              <span className="right">
                {preparingOrders} đơn ({totalOrders > 0 ? Math.round((preparingOrders / totalOrders) * 100) : 0}%)
              </span>
            </div>

            <div className="donut-status-item">
              <div className="left">
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#0284c7' }} />
                <span>Chờ nhận đơn (PENDING)</span>
              </div>
              <span className="right">
                {pendingOrders} đơn ({totalOrders > 0 ? Math.round((pendingOrders / totalOrders) * 100) : 0}%)
              </span>
            </div>

            {cancelledOrders > 0 && (
              <div className="donut-status-item">
                <div className="left">
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#dc2626' }} />
                  <span>Đã huỷ (CANCELLED)</span>
                </div>
                <span className="right">
                  {cancelledOrders} đơn ({totalOrders > 0 ? Math.round((cancelledOrders / totalOrders) * 100) : 0}%)
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          4. BOTTOM ROW: ORDERS MONITORING & SYSTEM ALERTS
         ───────────────────────────────────────────────────────────── */}
      <div className="bottom-row">
        {/* Left: Orders Needing Intervention */}
        <div className="panel-card">
          <div className="panel-card-header">
            <div className="panel-title">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <h3>Đơn hàng cần Giám sát & Can thiệp</h3>
                <span className="alert-badge">
                  {pendingOrders + deliveringOrders > 0
                    ? `${pendingOrders + deliveringOrders} Đơn đang luân chuyển`
                    : 'Hệ thống thông suốt'}
                </span>
              </div>
              <p>Quyền can thiệp trạng thái (PATCH /orders/:id/status) áp dụng khi shipper gặp sự cố hoặc quán trễ hẹn.</p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className="btn-action-sm"
                onClick={fetchData}
                style={{ display: 'flex', alignItems: 'center', gap: 4 }}
              >
                <RotateCw size={13} />
                <span>Cập nhật live</span>
              </button>
            </div>
          </div>

          <table className="quick-table">
            <thead>
              <tr>
                <th>Mã Đơn</th>
                <th>Khách Hàng / SĐT</th>
                <th>Quán Ăn</th>
                <th>Tổng Tiền</th>
                <th>Trạng Thái</th>
                <th style={{ textAlign: 'right' }}>Xử Lý Nhanh</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.length > 0 ? (
                recentOrders.map((ord) => (
                  <tr key={ord.id}>
                    <td>
                      <strong style={{ color: '#ea580c' }}>#{ord.id}</strong>
                    </td>
                    <td>
                      <div>{ord.user?.full_name || `Khách #${ord.user_id}`}</div>
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                        {ord.user?.phone_number || ord.address?.phone_number || '—'}
                      </div>
                    </td>
                    <td>{ord.restaurant?.name || `Quán #${ord.restaurant_id}`}</td>
                    <td>
                      <strong>{Number(ord.total_amount || 0).toLocaleString('vi-VN')}đ</strong>
                    </td>
                    <td>
                      <span className={`badge-pill pill-${ord.status.toLowerCase()}`}>
                        {ord.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn-action-sm btn-force-update"
                        onClick={() => alert(`Can thiệp đơn #${ord.id}: Mở tab Quản lý Đơn hàng để chuyển trạng thái.`)}
                      >
                        Can thiệp
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
                    Không có đơn hàng nào cần can thiệp tại thời điểm này.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Right: Risk Alerts */}
        <div className="panel-card">
          <div className="panel-card-header">
            <div className="panel-title">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <AlertTriangle size={18} color="#ea580c" />
                <h3>Cảnh báo & Rủi ro sàn</h3>
              </div>
            </div>
            <span className="alert-badge">
              {pendingOrders + cancelledOrders > 0 ? `${pendingOrders + cancelledOrders} Cần chú ý` : 'An toàn'}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {pendingOrders > 0 && (
              <div
                style={{
                  padding: 12,
                  borderRadius: 10,
                  background: '#fff7ed',
                  border: '1px solid #fed7aa',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                }}
              >
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#c2410c' }}>
                  Đơn hàng chờ tiếp nhận ({pendingOrders} đơn)
                </div>
                <div style={{ fontSize: '0.76rem', color: '#78350f' }}>
                  Có {pendingOrders} đơn hàng đang ở trạng thái PENDING chờ quán xác nhận và shipper nhận giao.
                </div>
              </div>
            )}

            {cancelledOrders > 0 && (
              <div
                style={{
                  padding: 12,
                  borderRadius: 10,
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                }}
              >
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#dc2626' }}>
                  Đơn đã huỷ ({cancelledOrders} đơn)
                </div>
                <div style={{ fontSize: '0.76rem', color: '#7f1d1d' }}>
                  Hệ thống ghi nhận {cancelledOrders} đơn huỷ. Kiểm tra lý do huỷ từ phía khách hàng hoặc nhà hàng.
                </div>
              </div>
            )}

            <div
              style={{
                padding: 12,
                borderRadius: 10,
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
              }}
            >
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#15803d' }}>
                Hạ tầng thanh toán &amp; Đối soát
              </div>
              <div style={{ fontSize: '0.76rem', color: '#166534' }}>
                Cổng thanh toán MoMo, VNPay và đối soát tiền mặt Shipper COD hoạt động bình thường, không có lỗi gateway.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
