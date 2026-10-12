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
} from 'lucide-react';
import type {
  AdminRestaurant,
  OwnerDashboardData,
  OwnerRevenuePoint,
  OwnerTopFood,
} from '../../services/types';
import { ownerApi } from '../../services/api';
import './owner-mobile-ui.css';

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
      console.error('Lỗi tải số liệu:', err);
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
    <div className="owner-m-content">
      {/* 1. Hero Banner đơn mới cần xử lý (nếu có đơn PENDING) */}
      {(dashboard?.pending_orders ?? 0) > 0 && (
        <div className="owner-m-hero" onClick={onGoToOrders}>
          <div className="owner-m-hero-icon">
            <Bell size={18} color="#FFFFFF" />
          </div>
          <div style={{ flex: 1 }}>
            <div className="owner-m-hero-title">{dashboard!.pending_orders} đơn mới</div>
            <div className="owner-m-hero-sub">Đang chờ bạn xác nhận</div>
          </div>
          <div className="owner-m-hero-btn">
            <span className="owner-m-hero-btn-text">Xử lý ngay</span>
            <ArrowRight size={13} color="#C2410C" />
          </div>
        </div>
      )}

      {/* 2. Hiệu suất vận hành */}
      <div className="owner-m-section-title">Hiệu suất vận hành</div>

      <div className="owner-m-stat-grid">
        <div className="owner-m-stat-card wide">
          <span className="owner-m-stat-label">Doanh thu hôm nay</span>
          <span className="owner-m-stat-value">{money(dashboard?.today?.revenue ?? 0)}đ</span>
          <span className="owner-m-stat-hint">Tính trên đơn đã giao (DELIVERED)</span>
        </div>

        <div className="owner-m-stat-card">
          <span className="owner-m-stat-label">Đơn hôm nay</span>
          <span className="owner-m-stat-value">{dashboard?.today?.orders ?? 0}</span>
          <span className="owner-m-stat-hint">
            {dashboard?.active_orders ?? 0} đơn đang xử lý
          </span>
        </div>

        <div className="owner-m-stat-card">
          <span className="owner-m-stat-label">Doanh thu tháng</span>
          <span className="owner-m-stat-value">{money(dashboard?.month?.revenue ?? 0)}đ</span>
          <span className="owner-m-stat-hint">
            {dashboard?.month?.orders ?? 0} đơn trong tháng
          </span>
        </div>

        <div className="owner-m-stat-card">
          <span className="owner-m-stat-label">Đánh giá</span>
          <div className="owner-m-rating-row">
            <span className="owner-m-stat-value">
              {Number(dashboard?.average_rating ?? 5).toFixed(1)}
            </span>
            <Star size={15} fill="#D97706" color="#D97706" />
          </div>
          <span className="owner-m-stat-hint">
            {dashboard?.total_reviews ?? 0} lượt đánh giá
          </span>
        </div>
      </div>

      {/* 3. Biểu đồ doanh thu 7 ngày */}
      <div className="owner-m-card">
        <div className="owner-m-card-header">
          <div>
            <div className="owner-m-card-title">Biểu đồ doanh thu</div>
            <div className="owner-m-card-sub">7 ngày gần nhất</div>
          </div>
          <div className="owner-m-total-pill">
            <span className="owner-m-total-pill-text">{money(chartTotal)}đ</span>
          </div>
        </div>

        {chartTotal === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px 0', color: '#94a3b8' }}>
            <BarChart2 size={34} color="#D1D5DB" style={{ margin: '0 auto 8px auto' }} />
            <div style={{ fontSize: '12.5px', color: '#6B7280' }}>
              Chưa có đơn giao thành công nào trong 7 ngày qua.
            </div>
          </div>
        ) : (
          <div className="owner-m-chart">
            {chart.map((c) => {
              const h = Math.max(6, Math.round((c.revenue / chartMax) * 110));
              const isTop = c.revenue === chartMax && c.revenue > 0;
              return (
                <div key={c.period} className="owner-m-bar-col">
                  <span className="owner-m-bar-val">
                    {c.revenue > 0 ? shortMoney(c.revenue) : ''}
                  </span>
                  <div
                    className={`owner-m-bar ${isTop ? 'top-day' : ''}`}
                    style={{ height: `${h}px` }}
                  />
                  <span className="owner-m-bar-lbl">{c.label}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Top món bán chạy */}
      <div className="owner-m-card">
        <div className="owner-m-card-header">
          <div>
            <div className="owner-m-card-title">Top món bán chạy</div>
            <div className="owner-m-card-sub">Theo số lượng đã bán (đơn đã giao)</div>
          </div>
          <button className="owner-m-link-text" onClick={onGoToMenu}>
            Xem thực đơn
          </button>
        </div>

        {topFoods.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 0', color: '#94a3b8' }}>
            <UtensilsCrossed size={34} color="#D1D5DB" style={{ margin: '0 auto 8px auto' }} />
            <div style={{ fontSize: '12.5px', color: '#6B7280' }}>
              Chưa có dữ liệu bán hàng.
            </div>
          </div>
        ) : (
          topFoods.map((f, idx) => (
            <div key={f.food_id} className="owner-m-top-row">
              <div className={`owner-m-rank-badge ${idx === 0 ? 'first' : ''}`}>
                <span className={`owner-m-rank-text ${idx === 0 ? 'first' : ''}`}>
                  {idx + 1}
                </span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="owner-m-top-name">{f.food_name}</div>
                <div className="owner-m-top-meta">
                  Đã bán {f.total_sold} phần · {money(f.total_revenue)}đ
                </div>
                <div className="owner-m-progress-track">
                  <div
                    className="owner-m-progress-fill"
                    style={{ width: `${Math.round((f.total_sold / topMax) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 5. Quản lý & Thiết lập nhanh */}
      <div className="owner-m-card">
        <div className="owner-m-card-title">Quản lý & Thiết lập nhanh</div>

        {/* Xử lý đơn hàng */}
        <button className="owner-m-quick-row" onClick={onGoToOrders}>
          <div className="owner-m-quick-icon" style={{ backgroundColor: '#FFEDD5' }}>
            <Receipt size={16} color="#C2410C" />
          </div>
          <div style={{ flex: 1 }}>
            <div className="owner-m-quick-title">Xử lý đơn hàng</div>
            <div className="owner-m-quick-sub">
              {dashboard?.pending_orders ?? 0} chờ xác nhận · {dashboard?.active_orders ?? 0} đang làm
            </div>
          </div>
          <ChevronRight size={17} color="#CBD5E1" />
        </button>

        {/* Quản lý thực đơn */}
        <button className="owner-m-quick-row" onClick={onGoToMenu}>
          <div className="owner-m-quick-icon" style={{ backgroundColor: '#DCFCE7' }}>
            <UtensilsCrossed size={16} color="#15803D" />
          </div>
          <div style={{ flex: 1 }}>
            <div className="owner-m-quick-title">Quản lý thực đơn</div>
            <div className="owner-m-quick-sub">
              {dashboard?.total_foods ?? 0} món trong quán
            </div>
          </div>
          <ChevronRight size={17} color="#CBD5E1" />
        </button>

        {/* Thông tin & giờ hoạt động */}
        <button className="owner-m-quick-row" onClick={onGoToSettings}>
          <div className="owner-m-quick-icon" style={{ backgroundColor: '#E0E7FF' }}>
            <Clock size={16} color="#4338CA" />
          </div>
          <div style={{ flex: 1 }}>
            <div className="owner-m-quick-title">Thông tin & giờ hoạt động</div>
            <div className="owner-m-quick-sub">
              {restaurant?.opening_time?.slice(0, 5) ?? '08:00'} -{' '}
              {restaurant?.closing_time?.slice(0, 5) ?? '22:00'}
            </div>
          </div>
          <ChevronRight size={17} color="#CBD5E1" />
        </button>
      </div>
    </div>
  );
}
