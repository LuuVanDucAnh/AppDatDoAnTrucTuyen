import React, { useEffect, useState, useMemo } from 'react';
import {
  Star,
  MessageSquare,
  Receipt,
  RotateCw,
} from 'lucide-react';
import type { AdminRestaurant, OwnerReview } from '../../services/types';
import { ownerApi } from '../../services/api';
import './owner-mobile-ui.css';
import './owner-web.css';

interface OwnerReviewsViewProps {
  restaurant: AdminRestaurant | null;
}

export function OwnerReviewsView({ restaurant }: OwnerReviewsViewProps) {
  const [reviews, setReviews] = useState<OwnerReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [starFilter, setStarFilter] = useState<number | 'all'>('all');

  const loadReviews = async () => {
    if (!restaurant) return;
    try {
      setLoading(true);
      const res = await ownerApi.getReviews(restaurant.id, { limit: 100 });
      const list = Array.isArray(res) ? res : (Array.isArray((res as any)?.data) ? (res as any).data : []);
      setReviews(list);
    } catch (err: any) {
      console.error('Không tải được đánh giá:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, [restaurant?.id]);

  // Thống kê phân bổ sao chuẩn như mobile stats
  const stats = useMemo(() => {
    const total = reviews.length;
    if (total === 0) {
      return { avg: 5.0, total: 0, counts: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } as Record<number, number> };
    }

    const counts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let sum = 0;
    reviews.forEach((r) => {
      const star = Math.min(5, Math.max(1, Math.round(Number(r.rating || 5))));
      counts[star] = (counts[star] || 0) + 1;
      sum += Number(r.rating || 5);
    });

    const avg = Number((sum / total).toFixed(1));
    return { avg, total, counts };
  }, [reviews]);

  const filteredReviews = useMemo(() => {
    if (starFilter === 'all') return reviews;
    return reviews.filter((r) => Math.round(Number(r.rating)) === starFilter);
  }, [reviews, starFilter]);

  if (!restaurant) {
    return (
      <div className="owner-web-view">
        <div className="owner-web-panel" style={{ textAlign: 'center', padding: '50px 20px' }}>
          <Star size={44} color="#94A3B8" style={{ margin: '0 auto 12px auto' }} />
          <h3>Chưa chọn nhà hàng</h3>
          <p style={{ color: '#64748B' }}>Vui lòng chọn nhà hàng để xem đánh giá từ thực khách.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="owner-web-view">
      {/* 1. Thẻ tổng quan điểm sao & Phân bổ sao (Y trang mobile nhưng rộng rãi cho Web) */}
      <div className="owner-web-reviews-summary">
        {/* Điểm lớn bên trái */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            borderRight: '1px solid #F1F5F9',
            paddingRight: 24,
            textAlign: 'center',
          }}
        >
          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>
            ĐÁNH GIÁ TRUNG BÌNH
          </span>
          <span style={{ fontSize: '3.5rem', fontWeight: 900, color: '#EA580C', lineHeight: 1.1, margin: '8px 0' }}>
            {stats.avg.toFixed(1)}
          </span>
          <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                size={20}
                fill={s <= Math.round(stats.avg) ? '#F59E0B' : '#E2E8F0'}
                color={s <= Math.round(stats.avg) ? '#F59E0B' : '#CBD5E1'}
              />
            ))}
          </div>
          <span style={{ fontSize: '0.84rem', color: '#64748B' }}>
            Dựa trên <strong>{stats.total}</strong> lượt đánh giá của thực khách
          </span>
        </div>

        {/* Thanh phân phối sao bên phải */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 8 }}>
          <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#1E293B', marginBottom: 2 }}>
            Phân bổ mức sao thực tế
          </div>
          {[5, 4, 3, 2, 1].map((star) => {
            const count = stats.counts[star] || 0;
            const pct = stats.total > 0 ? (count / stats.total) * 100 : 0;
            return (
              <div key={star} style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: '0.84rem' }}>
                <span style={{ fontWeight: 700, color: '#475569', width: 30 }}>{star}★</span>
                <div
                  style={{
                    flex: 1,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: '#F1F5F9',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${pct}%`,
                      backgroundColor: '#F59E0B',
                      borderRadius: 4,
                      transition: 'width 0.3s ease',
                    }}
                  />
                </div>
                <span style={{ color: '#64748B', width: 70, textAlign: 'right', fontWeight: 600 }}>
                  {count} lượt ({Math.round(pct)}%)
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Dải lọc sao & nút làm mới */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: 14,
          padding: '12px 18px',
        }}
      >
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {(['all', 5, 4, 3, 2, 1] as const).map((star) => {
            const isSelected = starFilter === star;
            return (
              <button
                key={String(star)}
                onClick={() => setStarFilter(star)}
                style={{
                  padding: '7px 16px',
                  borderRadius: 999,
                  backgroundColor: isSelected ? '#EA580C' : '#F8FAFC',
                  border: isSelected ? '1px solid #EA580C' : '1px solid #CBD5E1',
                  color: isSelected ? '#FFFFFF' : '#475569',
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {star === 'all' ? 'Tất cả' : `${star}★`}
              </button>
            );
          })}
        </div>

        <button
          onClick={loadReviews}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: '#F8FAFC',
            border: '1px solid #CBD5E1',
            borderRadius: 8,
            padding: '7px 12px',
            color: '#475569',
            fontSize: '0.82rem',
            fontWeight: 600,
            cursor: 'pointer',
          }}
          title="Tải lại đánh giá"
        >
          <RotateCw size={14} className={loading ? 'spinning' : ''} />
          <span>Làm mới</span>
        </button>
      </div>

      {/* 3. Lưới các đánh giá từ thực khách */}
      {loading ? (
        <div className="owner-web-panel" style={{ textAlign: 'center', padding: '60px 0' }}>
          <div style={{ color: '#EA580C', fontWeight: 700 }}>Đang tải danh sách đánh giá...</div>
        </div>
      ) : filteredReviews.length === 0 ? (
        <div className="owner-web-panel" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <MessageSquare size={48} color="#CBD5E1" style={{ margin: '0 auto 12px auto' }} />
          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#334155' }}>
            Chưa có đánh giá nào
          </div>
          <p style={{ fontSize: '0.85rem', color: '#94A3B8', marginTop: 4 }}>
            {starFilter === 'all'
              ? 'Khi thực khách hoàn tất đơn hàng và chấm sao, nhận xét sẽ hiển thị tại đây.'
              : `Không có đánh giá ${starFilter} sao nào.`}
          </p>
        </div>
      ) : (
        <div className="owner-web-reviews-list">
          {filteredReviews.map((item) => {
            const userName = item.user?.full_name || 'Khách hàng';
            const star = Number(item.rating || 5);
            const dateStr = item.created_at
              ? new Date(item.created_at).toLocaleDateString('vi-VN', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                })
              : 'Gần đây';

            return (
              <div
                key={item.id}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: 14,
                  padding: 18,
                  border: '1px solid #E2E8F0',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                  boxShadow: '0 2px 6px rgba(15, 23, 42, 0.04)',
                }}
              >
                {/* Header người đánh giá */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 21,
                      backgroundColor: '#FFEDD5',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.05rem',
                      fontWeight: 800,
                      color: '#EA580C',
                      flexShrink: 0,
                    }}
                  >
                    {userName.charAt(0).toUpperCase()}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0F172A' }}>
                      {userName}
                    </div>
                    <div style={{ display: 'flex', gap: 3, marginTop: 2 }}>
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          size={14}
                          fill={s <= star ? '#F59E0B' : '#E2E8F0'}
                          color={s <= star ? '#F59E0B' : '#CBD5E1'}
                        />
                      ))}
                    </div>
                  </div>

                  <span style={{ fontSize: '0.78rem', color: '#94A3B8' }}>{dateStr}</span>
                </div>

                {/* Nội dung nhận xét */}
                {item.comment ? (
                  <div style={{ fontSize: '0.88rem', color: '#334155', lineHeight: 1.5 }}>
                    "{item.comment}"
                  </div>
                ) : (
                  <div style={{ fontSize: '0.82rem', fontStyle: 'italic', color: '#94A3B8' }}>
                    (Khách hàng chỉ chấm sao không để lại lời bình)
                  </div>
                )}

                {/* Tag mã đơn hàng liên quan */}
                {item.order_id && (
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      alignSelf: 'flex-start',
                      backgroundColor: '#F8FAFC',
                      padding: '4px 10px',
                      borderRadius: 6,
                      border: '1px solid #F1F5F9',
                      fontSize: '0.75rem',
                      color: '#64748B',
                      fontWeight: 600,
                    }}
                  >
                    <Receipt size={13} color="#64748B" />
                    <span>Mã đơn hàng: #{item.order_id}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
