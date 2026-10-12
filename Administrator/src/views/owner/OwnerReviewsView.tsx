import React, { useEffect, useState, useMemo } from 'react';
import {
  Star,
  MessageSquare,
  ThumbsUp,
  User,
  Calendar,
  AlertCircle,
  RotateCw,
  ShoppingBag,
  Filter,
} from 'lucide-react';
import type { AdminRestaurant, OwnerReview } from '../../services/types';
import { ownerApi } from '../../services/api';
import { formatDate, formatTimeAgo } from '../../services/utils';

interface OwnerReviewsViewProps {
  restaurant: AdminRestaurant | null;
}

export function OwnerReviewsView({ restaurant }: OwnerReviewsViewProps) {
  const [reviews, setReviews] = useState<OwnerReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [starFilter, setStarFilter] = useState<number | 'ALL'>('ALL');

  const fetchReviews = async () => {
    if (!restaurant) return;
    try {
      setLoading(true);
      setError(null);
      const res = await ownerApi.getReviews(restaurant.id, {
        rating: starFilter === 'ALL' ? undefined : starFilter,
        limit: 100,
      });
      setReviews(res.data || []);
    } catch (err: any) {
      setError(err?.message || 'Không thể tải đánh giá của quán.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [restaurant?.id, starFilter]);

  // Thống kê phân bổ sao
  const stats = useMemo(() => {
    const total = reviews.length;
    if (total === 0) {
      return { avg: 5.0, total: 0, counts: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } };
    }
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let sum = 0;
    reviews.forEach((r) => {
      const star = Math.min(5, Math.max(1, Math.round(r.rating || 5))) as 1 | 2 | 3 | 4 | 5;
      counts[star]++;
      sum += r.rating;
    });
    return {
      avg: Number((sum / total).toFixed(1)),
      total,
      counts,
    };
  }, [reviews]);

  if (!restaurant) {
    return (
      <div className="view-container">
        <div className="empty-state-card" style={{ padding: '60px 20px', textAlign: 'center' }}>
          <Star size={48} color="#94a3b8" style={{ margin: '0 auto 16px auto' }} />
          <h3>Chưa chọn nhà hàng</h3>
          <p style={{ color: '#64748b' }}>Vui lòng chọn nhà hàng để xem đánh giá từ khách hàng.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="view-container" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Overview Star Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 20 }}>
        {/* Điểm trung bình */}
        <div
          className="panel"
          style={{
            padding: 24,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            background: 'linear-gradient(135deg, #ffffff 0%, #fffbf5 100%)',
          }}
        >
          <div style={{ fontSize: '0.82rem', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 700, letterSpacing: '0.05em' }}>
            ĐÁNH GIÁ TRUNG BÌNH
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 10 }}>
            <span style={{ fontSize: '3rem', fontWeight: 900, color: '#ea580c', lineHeight: 1 }}>
              {stats.avg.toFixed(1)}
            </span>
            <span style={{ fontSize: '1.2rem', color: '#94a3b8', fontWeight: 600 }}>/ 5</span>
          </div>

          <div style={{ display: 'flex', gap: 4, marginTop: 10 }}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                size={22}
                fill={star <= Math.round(stats.avg) ? '#f59e0b' : '#e2e8f0'}
                color={star <= Math.round(stats.avg) ? '#f59e0b' : '#cbd5e1'}
              />
            ))}
          </div>

          <p style={{ fontSize: '0.84rem', color: '#64748b', marginTop: 12 }}>
            Dựa trên <strong>{stats.total}</strong> lượt đánh giá của khách hàng
          </p>
        </div>

        {/* Breakdown từng mức sao */}
        <div className="panel" style={{ padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 10 }}>
          <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>
            Phân bổ mức sao
          </div>

          {[5, 4, 3, 2, 1].map((star) => {
            const count = stats.counts[star as 1 | 2 | 3 | 4 | 5] || 0;
            const percent = stats.total > 0 ? (count / stats.total) * 100 : 0;

            return (
              <div key={star} style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: '0.82rem' }}>
                <div style={{ width: 44, display: 'flex', alignItems: 'center', gap: 4, fontWeight: 700, color: '#475569' }}>
                  <span>{star}</span>
                  <Star size={13} fill="#f59e0b" color="#f59e0b" />
                </div>

                <div style={{ flex: 1, height: 8, background: '#f1f5f9', borderRadius: 999, overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${percent}%`,
                      height: '100%',
                      background: star >= 4 ? '#10b981' : star === 3 ? '#f59e0b' : '#ef4444',
                      borderRadius: 999,
                      transition: 'width 0.4s ease',
                    }}
                  />
                </div>

                <div style={{ width: 60, textAlign: 'right', color: '#64748b', fontWeight: 600 }}>
                  {count} ({Math.round(percent)}%)
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filter bar by star rating */}
      <div className="panel" style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#475569', marginRight: 4 }}>
            Lọc theo sao:
          </span>

          <button
            onClick={() => setStarFilter('ALL')}
            className={`filter-pill ${starFilter === 'ALL' ? 'active' : ''}`}
          >
            Tất cả sao ({stats.total})
          </button>

          {[5, 4, 3, 2, 1].map((s) => (
            <button
              key={s}
              onClick={() => setStarFilter(s)}
              className={`filter-pill ${starFilter === s ? 'active' : ''}`}
            >
              {s} sao ({stats.counts[s as 1 | 2 | 3 | 4 | 5] || 0})
            </button>
          ))}
        </div>

        <button
          onClick={fetchReviews}
          className="btn btn-secondary"
          style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <RotateCw size={13} className={loading ? 'spinning' : ''} />
          <span>Tải lại</span>
        </button>
      </div>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fee2e2', color: '#dc2626', borderRadius: 12, padding: '12px 16px' }}>
          {error}
        </div>
      )}

      {/* Reviews List */}
      <div className="panel" style={{ padding: 20 }}>
        {loading && reviews.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px 0', color: '#64748b' }}>
            <div className="spinner" style={{ margin: '0 auto 12px auto' }} />
            <p>Đang tải danh sách đánh giá...</p>
          </div>
        ) : reviews.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
            <MessageSquare size={42} style={{ margin: '0 auto 12px auto', opacity: 0.5 }} />
            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#475569' }}>
              Chưa có đánh giá nào
            </div>
            <p style={{ fontSize: '0.84rem', marginTop: 4 }}>
              Khách hàng sau khi nhận món và hoàn tất đơn hàng sẽ để lại nhận xét tại đây.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {reviews.map((rev) => (
              <div
                key={rev.id}
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 14,
                  padding: '16px 18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}
              >
                {/* Header: User + Stars + Date */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 10,
                        background: '#e2e8f0',
                        color: '#475569',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.95rem',
                      }}
                    >
                      {rev.user?.full_name ? rev.user.full_name.charAt(0).toUpperCase() : 'K'}
                    </div>

                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a' }}>
                        {rev.user?.full_name || 'Khách hàng ẩn danh'}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                        {formatTimeAgo(rev.created_at)} ({formatDate(rev.created_at)})
                      </div>
                    </div>
                  </div>

                  {/* Stars */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        size={16}
                        fill={s <= rev.rating ? '#f59e0b' : '#e2e8f0'}
                        color={s <= rev.rating ? '#f59e0b' : '#cbd5e1'}
                      />
                    ))}
                    <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#b45309', marginLeft: 4 }}>
                      {rev.rating} sao
                    </span>
                  </div>
                </div>

                {/* Comment Content */}
                <div style={{ fontSize: '0.88rem', color: '#334155', lineHeight: 1.5 }}>
                  {rev.comment ? (
                    <span>"{rev.comment}"</span>
                  ) : (
                    <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>
                      (Khách hàng không để lại nhận xét chữ)
                    </span>
                  )}
                </div>

                {/* Order tag if available */}
                {rev.order_id && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: '#64748b', marginTop: 2 }}>
                    <ShoppingBag size={12} />
                    <span>Đơn hàng liên quan: #{rev.order_id}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
