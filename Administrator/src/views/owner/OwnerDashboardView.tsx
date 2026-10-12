import React, { useEffect, useState, useMemo } from 'react';
import {
  DollarSign,
  ShoppingBag,
  TrendingUp,
  Clock,
  Star,
  UtensilsCrossed,
  ArrowRight,
  AlertCircle,
  Calendar,
  Flame,
  Award,
  Plus,
  Store,
  ChevronRight,
  Activity,
} from 'lucide-react';
import type {
  AdminRestaurant,
  OwnerDashboardData,
  OwnerRevenuePoint,
  OwnerTopFood,
} from '../../services/types';
import { ownerApi } from '../../services/api';
import {
  formatMoney,
  formatShortMoney,
  resolveImageUrl,
  DEFAULT_FOOD_IMAGE,
} from '../../services/utils';

interface OwnerDashboardViewProps {
  restaurant: AdminRestaurant | null;
  onGoToOrders: () => void;
  onGoToMenu: () => void;
  onGoToSettings: () => void;
}

export function OwnerDashboardView({
  restaurant,
  onGoToOrders,
  onGoToMenu,
  onGoToSettings,
}: OwnerDashboardViewProps) {
  const [dashboard, setDashboard] = useState<OwnerDashboardData | null>(null);
  const [revenueStats, setRevenueStats] = useState<OwnerRevenuePoint[]>([]);
  const [topFoods, setTopFoods] = useState<OwnerTopFood[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    if (!restaurant) return;
    try {
      setLoading(true);
      setError(null);
      const [dData, rData, tData] = await Promise.all([
        ownerApi.getDashboard(restaurant.id),
        ownerApi.getRevenueStats(restaurant.id, { groupBy: 'day' }),
        ownerApi.getTopFoods(restaurant.id, 6),
      ]);
      setDashboard(dData);
      setRevenueStats(rData);
      setTopFoods(tData);
    } catch (err: any) {
      setError(err?.message || 'Không thể tải dữ liệu báo cáo của quán ăn.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [restaurant?.id]);

  // Chuẩn bị 7 ngày gần nhất cho biểu đồ doanh thu
  const last7DaysData = useMemo(() => {
    const byPeriod = new Map<string, OwnerRevenuePoint>();
    revenueStats.forEach((p) => {
      byPeriod.set(p.period, p);
    });

    const result: { dateStr: string; label: string; revenue: number; orders: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      const period = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
        d.getDate()
      ).padStart(2, '0')}`;
      const found = byPeriod.get(period);
      result.push({
        dateStr: period,
        label: `${d.getDate()}/${d.getMonth() + 1}`,
        revenue: found ? Number(found.revenue) : 0,
        orders: found ? Number(found.order_count) : 0,
      });
    }
    return result;
  }, [revenueStats]);

  const maxRevenue = useMemo(() => {
    const m = Math.max(...last7DaysData.map((d) => d.revenue), 100000);
    return m * 1.15; // 15% headroom
  }, [last7DaysData]);

  const total7DaysRevenue = useMemo(() => {
    return last7DaysData.reduce((sum, d) => sum + d.revenue, 0);
  }, [last7DaysData]);

  const total7DaysOrders = useMemo(() => {
    return last7DaysData.reduce((sum, d) => sum + d.orders, 0);
  }, [last7DaysData]);

  if (!restaurant) {
    return (
      <div className="view-container">
        <div className="empty-state-card" style={{ padding: '60px 20px', textAlign: 'center' }}>
          <Store size={48} color="#94a3b8" style={{ margin: '0 auto 16px auto' }} />
          <h3>Chưa chọn nhà hàng quản lý</h3>
          <p style={{ color: '#64748b', marginTop: 8 }}>
            Vui lòng chọn một nhà hàng từ danh sách bên trái hoặc tạo nhà hàng mới để xem thống kê.
          </p>
        </div>
      </div>
    );
  }

  if (loading && !dashboard) {
    return (
      <div className="view-container">
        <div style={{ textAlign: 'center', padding: '80px 0', color: '#64748b' }}>
          <div className="spinner" style={{ margin: '0 auto 16px auto' }} />
          <p style={{ fontWeight: 600 }}>Đang nạp số liệu kinh doanh của quán...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="view-container" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Pending Orders Warning Alert Banner */}
      {(dashboard?.pending_orders || 0) > 0 && (
        <div
          style={{
            background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
            border: '1px solid #fed7aa',
            borderRadius: 16,
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 4px 15px rgba(234, 88, 12, 0.12)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: '#ea580c',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(234, 88, 12, 0.35)',
                animation: 'bounce 1.5s infinite',
              }}
            >
              <ShoppingBag size={22} />
            </div>
            <div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: '#9a3412' }}>
                Có {dashboard?.pending_orders} đơn hàng mới đang chờ quán xác nhận!
              </div>
              <div style={{ fontSize: '0.84rem', color: '#c2410c', marginTop: 2 }}>
                Vui lòng tiếp nhận và chuẩn bị món sớm để tài xế kịp lấy và giao cho khách.
              </div>
            </div>
          </div>

          <button
            onClick={onGoToOrders}
            className="btn btn-primary"
            style={{
              padding: '10px 18px',
              fontSize: '0.88rem',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: '#ea580c',
              borderColor: '#ea580c',
              boxShadow: '0 4px 12px rgba(234, 88, 12, 0.35)',
            }}
          >
            <span>Xử lý đơn ngay</span>
            <ArrowRight size={16} />
          </button>
        </div>
      )}

      {error && (
        <div
          style={{
            background: '#fef2f2',
            border: '1px solid #fee2e2',
            color: '#dc2626',
            borderRadius: 12,
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Main KPI Stat Cards */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
        {/* Doanh thu hôm nay */}
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Doanh thu hôm nay</span>
            <div
              className="stat-card-icon"
              style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}
            >
              <DollarSign size={20} />
            </div>
          </div>
          <div className="stat-card-value" style={{ color: '#0f172a' }}>
            {formatMoney(dashboard?.today?.revenue || 0)}
          </div>
          <div className="stat-card-footer">
            <span style={{ color: '#10b981', fontWeight: 600 }}>
              {dashboard?.today?.orders || 0} đơn thành công
            </span>
            <span style={{ color: '#94a3b8' }}>• Hôm nay</span>
          </div>
        </div>

        {/* Doanh thu tháng này */}
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Doanh thu tháng này</span>
            <div
              className="stat-card-icon"
              style={{ background: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6' }}
            >
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="stat-card-value" style={{ color: '#0f172a' }}>
            {formatMoney(dashboard?.month?.revenue || 0)}
          </div>
          <div className="stat-card-footer">
            <span style={{ color: '#3b82f6', fontWeight: 600 }}>
              {dashboard?.month?.orders || 0} đơn hoàn tất
            </span>
            <span style={{ color: '#94a3b8' }}>• Tháng hiện tại</span>
          </div>
        </div>

        {/* Đơn đang xử lý */}
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Đơn đang phục vụ</span>
            <div
              className="stat-card-icon"
              style={{ background: 'rgba(234, 88, 12, 0.12)', color: '#ea580c' }}
            >
              <Clock size={20} />
            </div>
          </div>
          <div className="stat-card-value" style={{ color: '#ea580c' }}>
            {(dashboard?.pending_orders || 0) + (dashboard?.active_orders || 0)}
          </div>
          <div className="stat-card-footer">
            <span style={{ color: '#ea580c', fontWeight: 600 }}>
              {dashboard?.pending_orders || 0} chờ xác nhận
            </span>
            <span style={{ color: '#94a3b8' }}>• {dashboard?.active_orders || 0} đang làm/giao</span>
          </div>
        </div>

        {/* Đánh giá & Menu */}
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Chất lượng quán</span>
            <div
              className="stat-card-icon"
              style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' }}
            >
              <Star size={20} />
            </div>
          </div>
          <div className="stat-card-value" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color: '#d97706' }}>
              {(dashboard?.average_rating || 0).toFixed(1)}
            </span>
            <span style={{ fontSize: '1rem', color: '#94a3b8', fontWeight: 500 }}>/ 5.0</span>
            <Star size={20} fill="#f59e0b" color="#f59e0b" style={{ marginLeft: 2 }} />
          </div>
          <div className="stat-card-footer">
            <span style={{ color: '#64748b' }}>
              {dashboard?.total_reviews || 0} đánh giá • {dashboard?.total_foods || 0} món trên thực đơn
            </span>
          </div>
        </div>
      </div>

      {/* Revenue Graph & Quick Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
        {/* Biểu đồ doanh thu 7 ngày */}
        <div className="panel" style={{ padding: 24, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
                Biểu đồ Doanh thu 7 Ngày Gần Nhất
              </h3>
              <p style={{ fontSize: '0.82rem', color: '#64748b', marginTop: 2 }}>
                Tổng 7 ngày: <strong>{formatMoney(total7DaysRevenue)}</strong> ({total7DaysOrders} đơn hoàn tất)
              </p>
            </div>
            <div
              style={{
                fontSize: '0.78rem',
                color: '#64748b',
                background: '#f8fafc',
                padding: '6px 12px',
                borderRadius: 8,
                border: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Calendar size={13} />
              <span>Theo ngày</span>
            </div>
          </div>

          {/* Bar Chart Visualization */}
          <div style={{ flex: 1, minHeight: 220, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: 12,
                height: 180,
                alignItems: 'flex-end',
                borderBottom: '1px solid #e2e8f0',
                paddingBottom: 8,
              }}
            >
              {last7DaysData.map((d, idx) => {
                const heightPercent = maxRevenue > 0 ? Math.min(100, Math.max(8, (d.revenue / maxRevenue) * 100)) : 8;
                const isToday = idx === last7DaysData.length - 1;
                return (
                  <div
                    key={d.dateStr}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      height: '100%',
                      justifyContent: 'flex-end',
                      position: 'relative',
                    }}
                    title={`${d.label}: ${formatMoney(d.revenue)} (${d.orders} đơn)`}
                  >
                    {/* Tooltip on top of bar */}
                    {d.revenue > 0 && (
                      <span
                        style={{
                          fontSize: '0.7rem',
                          color: isToday ? '#ea580c' : '#64748b',
                          fontWeight: 700,
                          marginBottom: 6,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {formatShortMoney(d.revenue)}
                      </span>
                    )}

                    {/* Bar */}
                    <div
                      style={{
                        width: '70%',
                        maxWidth: 42,
                        height: `${heightPercent}%`,
                        background: isToday
                          ? 'linear-gradient(180deg, #ea580c 0%, #c2410c 100%)'
                          : d.revenue > 0
                          ? 'linear-gradient(180deg, #fdba74 0%, #fb923c 100%)'
                          : '#e2e8f0',
                        borderRadius: '6px 6px 2px 2px',
                        transition: 'height 0.4s ease',
                        boxShadow: isToday ? '0 4px 10px rgba(234, 88, 12, 0.3)' : 'none',
                      }}
                    />
                  </div>
                );
              })}
            </div>

            {/* X-axis labels */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: 12,
                paddingTop: 8,
              }}
            >
              {last7DaysData.map((d, idx) => {
                const isToday = idx === last7DaysData.length - 1;
                return (
                  <div
                    key={d.dateStr}
                    style={{
                      textAlign: 'center',
                      fontSize: '0.76rem',
                      fontWeight: isToday ? 800 : 500,
                      color: isToday ? '#ea580c' : '#64748b',
                    }}
                  >
                    {d.label} {isToday && '(Nay)'}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Quick Operations & Store Status Card */}
        <div className="panel" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
            Hành Động Nhanh
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button
              onClick={onGoToOrders}
              className="btn btn-secondary"
              style={{
                justifyContent: 'flex-start',
                padding: '12px 14px',
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                background: '#ffffff',
                border: '1px solid #e2e8f0',
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: 'rgba(234, 88, 12, 0.1)',
                  color: '#ea580c',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ShoppingBag size={18} />
              </div>
              <div style={{ textAlign: 'left', flex: 1 }}>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a' }}>
                  Quản lý đơn hàng
                </div>
                <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                  Xem và tiếp nhận đơn đặt của khách
                </div>
              </div>
              <ChevronRight size={16} color="#94a3b8" />
            </button>

            <button
              onClick={onGoToMenu}
              className="btn btn-secondary"
              style={{
                justifyContent: 'flex-start',
                padding: '12px 14px',
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                background: '#ffffff',
                border: '1px solid #e2e8f0',
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: 'rgba(16, 185, 129, 0.1)',
                  color: '#10b981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <UtensilsCrossed size={18} />
              </div>
              <div style={{ textAlign: 'left', flex: 1 }}>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a' }}>
                  Thực đơn & Món ăn
                </div>
                <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                  Thêm món mới, bật/tắt còn món
                </div>
              </div>
              <ChevronRight size={16} color="#94a3b8" />
            </button>

            <button
              onClick={onGoToSettings}
              className="btn btn-secondary"
              style={{
                justifyContent: 'flex-start',
                padding: '12px 14px',
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                background: '#ffffff',
                border: '1px solid #e2e8f0',
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: 'rgba(59, 130, 246, 0.1)',
                  color: '#3b82f6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Store size={18} />
              </div>
              <div style={{ textAlign: 'left', flex: 1 }}>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a' }}>
                  Cài đặt quán ăn
                </div>
                <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                  Sửa địa chỉ, giờ mở cửa, ảnh bìa
                </div>
              </div>
              <ChevronRight size={16} color="#94a3b8" />
            </button>
          </div>

          {/* Store Info Mini Summary */}
          <div
            style={{
              marginTop: 'auto',
              background: '#f8fafc',
              borderRadius: 12,
              padding: 14,
              border: '1px solid #e2e8f0',
            }}
          >
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 700, letterSpacing: '0.04em' }}>
              Thông tin phục vụ
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', marginTop: 8 }}>
              <span style={{ color: '#64748b' }}>Giờ hoạt động:</span>
              <strong style={{ color: '#0f172a' }}>
                {restaurant.opening_time || '08:00'} - {restaurant.closing_time || '22:00'}
              </strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', marginTop: 4 }}>
              <span style={{ color: '#64748b' }}>Hotline quán:</span>
              <strong style={{ color: '#0f172a' }}>
                {restaurant.phone_number || 'Chưa cập nhật'}
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* Top Best Selling Foods */}
      <div className="panel" style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: 'rgba(234, 88, 12, 0.1)',
                color: '#ea580c',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Flame size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
                Top Món Ăn Bán Chạy Nhất
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
                Các món ăn được khách hàng gọi nhiều nhất và đem lại doanh thu cao
              </p>
            </div>
          </div>

          <button
            onClick={onGoToMenu}
            className="btn btn-secondary"
            style={{ fontSize: '0.82rem', padding: '6px 14px' }}
          >
            Xem tất cả món
          </button>
        </div>

        {topFoods.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px 0', color: '#94a3b8' }}>
            Chưa có dữ liệu món bán chạy trong các đơn hoàn tất.
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: 16,
            }}
          >
            {topFoods.map((item, idx) => (
              <div
                key={item.food_id || idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: 12,
                  borderRadius: 12,
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  transition: 'all 0.2s',
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: idx === 0 ? '#fef3c7' : idx === 1 ? '#e0e7ff' : '#f1f5f9',
                    color: idx === 0 ? '#b45309' : idx === 1 ? '#4338ca' : '#64748b',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  #{idx + 1}
                </div>

                <div style={{ minWidth: 0, flex: 1 }}>
                  <div
                    style={{
                      fontSize: '0.9rem',
                      fontWeight: 700,
                      color: '#0f172a',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {item.food_name}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 2 }}>
                    Đã bán: <strong style={{ color: '#ea580c' }}>{item.total_sold}</strong> phần • {item.order_count} đơn
                  </div>
                </div>

                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#10b981' }}>
                    {formatMoney(item.total_revenue)}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Doanh thu món</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
