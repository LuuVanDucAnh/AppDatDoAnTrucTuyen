import React, { useEffect, useState, useMemo } from 'react';
import {
  Bell,
  ArrowRight,
  Star,
  ChevronRight,
  Receipt,
  UtensilsCrossed,
  Clock,
  BarChart2,
  TrendingUp,
  ShoppingBag,
  Sparkles,
} from 'lucide-react';
import type {
  AdminRestaurant,
  OwnerDashboardData,
  OwnerRevenuePoint,
  OwnerTopFood,
} from '../../services/types';
import { ownerApi } from '../../services/api';
import './owner-mobile-ui.css';
import './owner-web.css';

interface OwnerDashboardViewProps {
  restaurant: AdminRestaurant | null;
  onGoToOrders: () => void;
  onGoToMenu: () => void;
  onGoToSettings: () => void;
}

const money = (v: number | string) => Number(v || 0).toLocaleString('vi-VN');

function shortMoney(v: number) {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(v >= 10_000_000 ? 0 : 1)}tr`;
  if (v >= 1_000) return `${Math.round(v / 1_000)}k`;
  return String(v);
}

function dayLabel(period: string) {
  const d = new Date(period);
  if (Number.isNaN(d.getTime())) return period;
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

export function OwnerDashboardView({
  restaurant,
  onGoToOrders,
  onGoToMenu,
  onGoToSettings,
}: OwnerDashboardViewProps) {
  const [dashboard, setDashboard] = useState<OwnerDashboardData | null>(null);
  const [revenue, setRevenue] = useState<OwnerRevenuePoint[]>([]);
  const [topFoods, setTopFoods] = useState<OwnerTopFood[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    if (!restaurant) return;
    try {
      setLoading(true);
      const [d, r, t] = await Promise.all([
        ownerApi.getDashboard(restaurant.id),
        ownerApi.getRevenueStats(restaurant.id, { groupBy: 'day' }),
        ownerApi.getTopFoods(restaurant.id, 5),
      ]);
      setDashboard(d);
      setRevenue(r);
      setTopFoods(t);
    } catch (err: any) {
      console.error('Lỗi tải số liệu dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [restaurant?.id]);

  // Lấp đầy 7 ngày gần nhất y chang mobile buildLast7Days
  const chart = useMemo(() => {
    const byPeriod = new Map(revenue.map((p) => [p.period, p]));
    const out: { period: string; label: string; revenue: number; orders: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      const period = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
        d.getDate()
      ).padStart(2, '0')}`;
      const found = byPeriod.get(period);
      out.push({
        period,
        label: dayLabel(period),
        revenue: found ? Number(found.revenue) : 0,
        orders: found ? Number(found.order_count) : 0,
      });
    }
    return out;
  }, [revenue]);

  const chartMax = useMemo(() => Math.max(...chart.map((c) => c.revenue), 1), [chart]);
  const chartTotal = useMemo(() => chart.reduce((s, c) => s + c.revenue, 0), [chart]);
  const topMax = useMemo(
    () => Math.max(...topFoods.map((f) => f.total_sold), 1),
    [topFoods]
  );

  return (
    <div className="owner-web-view">
      {/* 1. Hero Banner đơn mới cần xử lý (nếu có đơn PENDING) */}
      {(dashboard?.pending_orders ?? 0) > 0 && (
        <div className="owner-web-hero" onClick={onGoToOrders}>
          <div className="owner-web-hero-left">
            <div className="owner-web-hero-icon">
              <Bell size={24} color="#FFFFFF" />
            </div>
            <div>
              <div className="owner-web-hero-title">
                Có {dashboard!.pending_orders} đơn hàng mới cần xác nhận!
              </div>
              <div className="owner-web-hero-sub">
                Khách hàng đang chờ nhà hàng xác nhận và nấu món. Hãy xử lý ngay để đảm bảo thời gian giao.
              </div>
            </div>
          </div>
          <button className="owner-web-hero-btn" onClick={onGoToOrders}>
            <span>Xử lý ngay</span>
            <ArrowRight size={16} />
          </button>
        </div>
      )}

      {/* 2. Hiệu suất vận hành (4 thẻ thống kê trực quan) */}
      <div className="owner-web-stats-grid">
        <div className="owner-web-stat-card">
          <span className="owner-web-stat-label">Doanh thu hôm nay</span>
          <span className="owner-web-stat-value highlight">
            {money(dashboard?.today?.revenue ?? 0)}đ
          </span>
          <span className="owner-web-stat-hint">
            Tính trên các đơn hoàn tất (DELIVERED)
          </span>
        </div>

        <div className="owner-web-stat-card">
          <span className="owner-web-stat-label">Đơn hàng hôm nay</span>
          <span className="owner-web-stat-value">
            {dashboard?.today?.orders ?? 0}
          </span>
          <span className="owner-web-stat-hint">
            <strong>{dashboard?.active_orders ?? 0}</strong> đơn đang nấu / đang giao
          </span>
        </div>

        <div className="owner-web-stat-card">
          <span className="owner-web-stat-label">Doanh thu tháng này</span>
          <span className="owner-web-stat-value">
            {money(dashboard?.month?.revenue ?? 0)}đ
          </span>
          <span className="owner-web-stat-hint">
            Tổng {dashboard?.month?.orders ?? 0} đơn giao thành công
          </span>
        </div>

        <div className="owner-web-stat-card">
          <span className="owner-web-stat-label">Đánh giá của khách</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="owner-web-stat-value">
              {Number(dashboard?.average_rating ?? 5).toFixed(1)}
            </span>
            <div style={{ display: 'flex', gap: 2 }}>
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  size={16}
                  fill={s <= Math.round(Number(dashboard?.average_rating ?? 5)) ? '#F59E0B' : '#E2E8F0'}
                  color={s <= Math.round(Number(dashboard?.average_rating ?? 5)) ? '#F59E0B' : '#CBD5E1'}
                />
              ))}
            </div>
          </div>
          <span className="owner-web-stat-hint">
            {dashboard?.total_reviews ?? 0} lượt phản hồi & chấm sao
          </span>
        </div>
      </div>

      {/* 3. Bố cục 2 cột: Biểu đồ doanh thu 7 ngày (trái) + Top món bán chạy (phải) */}
      <div className="owner-web-grid-2col">
        {/* Biểu đồ doanh thu 7 ngày */}
        <div className="owner-web-panel">
          <div className="owner-web-panel-header">
            <div>
              <div className="owner-web-panel-title">Biểu đồ doanh thu</div>
              <div className="owner-web-panel-sub">Số liệu thực tế 7 ngày gần nhất</div>
            </div>
            <div
              style={{
                backgroundColor: '#FFF7ED',
                border: '1px solid #FFEDD5',
                padding: '6px 14px',
                borderRadius: 10,
                color: '#C2410C',
                fontWeight: 800,
                fontSize: '0.9rem',
              }}
            >
              Tổng 7 ngày: {money(chartTotal)}đ
            </div>
          </div>

          {chartTotal === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px 0', color: '#94a3b8' }}>
              <BarChart2 size={44} color="#D1D5DB" style={{ margin: '0 auto 10px auto' }} />
              <div style={{ fontSize: '0.9rem', color: '#64748b' }}>
                Chưa có đơn hàng nào hoàn tất trong 7 ngày qua.
              </div>
            </div>
          ) : (
            <div className="owner-web-chart">
              {chart.map((c) => {
                const h = Math.max(8, Math.round((c.revenue / chartMax) * 140));
                const isTop = c.revenue === chartMax && c.revenue > 0;
                return (
                  <div key={c.period} className="owner-web-bar-col">
                    <span className="owner-web-bar-val">
                      {c.revenue > 0 ? shortMoney(c.revenue) : ''}
                    </span>
                    <div
                      className={`owner-web-bar ${isTop ? 'top-day' : ''}`}
                      style={{ height: `${h}px` }}
                      title={`${c.label}: ${money(c.revenue)}đ (${c.orders} đơn)`}
                    />
                    <span className="owner-web-bar-lbl">{c.label}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Top 5 món bán chạy */}
        <div className="owner-web-panel">
          <div className="owner-web-panel-header">
            <div>
              <div className="owner-web-panel-title">Top món bán chạy</div>
              <div className="owner-web-panel-sub">Các món được thực khách ưa chuộng nhất</div>
            </div>
            <button
              onClick={onGoToMenu}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#EA580C',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: 'pointer',
              }}
            >
              Xem thực đơn ›
            </button>
          </div>

          {topFoods.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px 0', color: '#94a3b8' }}>
              <UtensilsCrossed size={40} color="#D1D5DB" style={{ margin: '0 auto 10px auto' }} />
              <div style={{ fontSize: '0.88rem', color: '#64748b' }}>
                Chưa có dữ liệu món bán chạy.
              </div>
            </div>
          ) : (
            <div className="owner-web-top-list">
              {topFoods.map((f, i) => {
                const pct = topMax > 0 ? Math.round((f.total_sold / topMax) * 100) : 0;
                return (
                  <div key={f.food_id || i} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div
                        className={`owner-web-rank-badge ${
                          i === 0 ? 'first' : i === 1 ? 'second' : i === 2 ? 'third' : ''
                        }`}
                      >
                        #{i + 1}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: '0.9rem',
                            fontWeight: 700,
                            color: '#1E293B',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {f.food_name}
                        </div>
                        <div style={{ fontSize: '0.76rem', color: '#94A3B8' }}>
                          {f.total_sold} phần đã bán • {money(f.total_revenue)}đ
                        </div>
                      </div>

                      <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#EA580C' }}>
                        {f.total_sold} đĩa
                      </span>
                    </div>

                    {/* Progress track */}
                    <div
                      style={{
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: '#F1F5F9',
                        overflow: 'hidden',
                        marginLeft: 38,
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: `${pct}%`,
                          backgroundColor: i === 0 ? '#EA580C' : '#FB923C',
                          borderRadius: 3,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 4. Lối tắt quản lý nhanh */}
      <div className="owner-web-panel">
        <div className="owner-web-panel-title">Lối tắt quản lý vận hành</div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 14,
          }}
        >
          <div
            onClick={onGoToOrders}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              padding: '14px 18px',
              borderRadius: 12,
              backgroundColor: '#FFF7ED',
              border: '1px solid #FED7AA',
              cursor: 'pointer',
              transition: 'transform 0.15s',
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                backgroundColor: '#FFEDD5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#EA580C',
              }}
            >
              <Receipt size={20} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, color: '#C2410C', fontSize: '0.92rem' }}>
                Xử lý đơn hàng
              </div>
              <div style={{ fontSize: '0.78rem', color: '#9A3412', marginTop: 2 }}>
                Xem danh sách đơn mới & bàn giao shipper
              </div>
            </div>
            <ChevronRight size={18} color="#EA580C" />
          </div>

          <div
            onClick={onGoToMenu}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              padding: '14px 18px',
              borderRadius: 12,
              backgroundColor: '#EFF6FF',
              border: '1px solid #BFDBFE',
              cursor: 'pointer',
              transition: 'transform 0.15s',
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                backgroundColor: '#DBEAFE',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#2563EB',
              }}
            >
              <UtensilsCrossed size={20} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, color: '#1D4ED8', fontSize: '0.92rem' }}>
                Cập nhật thực đơn
              </div>
              <div style={{ fontSize: '0.78rem', color: '#1E40AF', marginTop: 2 }}>
                Bật/tắt món còn hay hết hàng, thêm món mới
              </div>
            </div>
            <ChevronRight size={18} color="#2563EB" />
          </div>

          <div
            onClick={onGoToSettings}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              padding: '14px 18px',
              borderRadius: 12,
              backgroundColor: '#F0FDF4',
              border: '1px solid #BBF7D0',
              cursor: 'pointer',
              transition: 'transform 0.15s',
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                backgroundColor: '#DCFCE7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#15803D',
              }}
            >
              <Clock size={20} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, color: '#15803D', fontSize: '0.92rem' }}>
                Hồ sơ & Giờ mở cửa
              </div>
              <div style={{ fontSize: '0.78rem', color: '#166534', marginTop: 2 }}>
                Cài đặt hotline, địa chỉ và giờ tiếp nhận đơn
              </div>
            </div>
            <ChevronRight size={18} color="#15803D" />
          </div>
        </div>
      </div>
    </div>
  );
}
