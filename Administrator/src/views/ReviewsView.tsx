import React, { useEffect, useState } from 'react';
import {
  Star,
  Trash2,
  MessageSquare,
  ShieldCheck,
  AlertTriangle,
  RotateCw,
  Search,
  FileSpreadsheet,
  Check,
} from 'lucide-react';
import { reviewsApi, dashboardApi } from '../services/api';
import type { AdminReview, PlatformDashboard } from '../services/types';

export function ReviewsView() {
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'ALL' | 'POSITIVE' | 'NEGATIVE'>('ALL');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [dashboard, setDashboard] = useState<PlatformDashboard | null>(null);

  // Toast
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const res = await reviewsApi.getReviews({
        page,
        limit: 20,
      });
      setReviews(res.data || []);
      if (res.meta) {
        setTotalPages(res.meta.totalPages || 1);
        setTotalCount(res.meta.total || 0);
      }
      dashboardApi.getDashboard().then(setDashboard).catch(() => {});
    } catch (err: any) {
      showToast('error', err?.message || 'Không thể tải danh sách đánh giá.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [page]);

  const handleDeleteReview = async (id: number) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn đánh giá #${id} khỏi hệ thống?`)) return;
    try {
      await reviewsApi.deleteReview(id);
      showToast('success', `Đã xóa đánh giá #${id} thành công.`);
      fetchReviews();
    } catch (err: any) {
      showToast('error', err?.message || 'Không thể xóa đánh giá.');
    }
  };

  const filteredReviews = reviews.filter((r) => {
    if (activeTab === 'POSITIVE' && r.rating < 4) return false;
    if (activeTab === 'NEGATIVE' && r.rating >= 4) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const userName = r.user?.full_name?.toLowerCase() || '';
      const resName = r.restaurant?.name?.toLowerCase() || '';
      const comment = r.comment?.toLowerCase() || '';
      return userName.includes(q) || resName.includes(q) || comment.includes(q);
    }
    return true;
  });

  const totalReviews = dashboard?.reviews?.total ?? totalCount;
  const avgRating = dashboard?.reviews?.avg_rating ?? (reviews.length > 0 ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) : '5.0');
  const positiveReviews = dashboard?.reviews?.positive ?? reviews.filter((r) => r.rating >= 4).length;
  const negativeReviews = dashboard?.reviews?.negative ?? reviews.filter((r) => r.rating <= 2).length;

  return (
    <div className="dashboard-content">
      {toast && (
        <div className="toast-container">
          <div className={`toast toast-${toast.type}`}>{toast.message}</div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          1. HEADER & ACTIONS
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
              ● MỤC 3.6 • ĐÁNH GIÁ &amp; KIỂM DUYỆT TOÀN SÀN
            </span>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                color: '#059669',
                background: '#ecfdf5',
                border: '1px solid #a7f3d0',
                padding: '3px 9px',
                borderRadius: 9999,
              }}
            >
              Dữ liệu đồng bộ trực tiếp từ Database
            </span>
          </div>

          <h2>Kiểm duyệt Đánh giá &amp; Giám sát Uy tín Đối tác</h2>
          <p className="title-subtext">
            Quản lý và kiểm duyệt đánh giá của khách hàng, theo dõi điểm số trung bình (CSAT) của từng nhà hàng và can thiệp xử lý các đánh giá vi phạm tiêu chuẩn cộng đồng.
          </p>
        </div>

        <div className="dashboard-actions-right">
          <button
            className="btn-header-action"
            style={{ background: '#f8fafc', color: '#0f172a', border: '1px solid #cbd5e1' }}
            onClick={fetchReviews}
          >
            <RotateCw size={15} color="#ea580c" />
            <span>Làm mới dữ liệu</span>
          </button>

          <button
            className="btn-header-action"
            style={{ background: '#f8fafc', color: '#0f172a', border: '1px solid #cbd5e1' }}
            onClick={() => alert('Đang xuất danh sách đánh giá định dạng CSV/Excel...')}
          >
            <FileSpreadsheet size={15} color="#ea580c" />
            <span>Xuất báo cáo CSAT</span>
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. 4 METRIC CARDS ROW
         ───────────────────────────────────────────────────────────── */}
      <div className="metrics-row">
        {/* Card 1: Tổng đánh giá */}
        <div className="metric-card card-revenue">
          <div className="card-top">
            <span className="card-top-title">TỔNG LƯỢT ĐÁNH GIÁ</span>
            <div className="card-top-icon" style={{ background: '#ffedd5', color: '#ea580c' }}>
              <MessageSquare size={18} />
            </div>
          </div>
          <div className="card-big-value">{Number(totalReviews).toLocaleString('vi-VN')}</div>
          <div className="card-footer-info" style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ fontSize: '0.74rem', color: '#64748b' }}>Đánh giá từ đơn hoàn tất: <strong>100%</strong></span>
            <span style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: 600 }}>Tất cả đánh giá hợp lệ</span>
          </div>
        </div>

        {/* Card 2: Điểm trung bình */}
        <div className="metric-card card-orders">
          <div className="card-top">
            <span className="card-top-title">ĐIỂM TRUNG BÌNH TOÀN SÀN</span>
            <div className="card-top-icon" style={{ background: '#fef3c7', color: '#d97706' }}>
              <Star size={18} fill="#d97706" />
            </div>
          </div>
          <div className="card-big-value" style={{ color: '#d97706' }}>
            {avgRating} <small style={{ fontSize: '1.1rem', color: '#94a3b8' }}>/ 5.0</small>
          </div>
          <div className="card-footer-info">
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', marginBottom: 4 }}>
              <span style={{ color: '#0f172a' }}>Tỷ lệ hài lòng (4-5 sao)</span>
              <strong style={{ color: '#059669' }}>
                {totalReviews > 0 ? Math.round((positiveReviews / totalReviews) * 100) : 100}%
              </strong>
            </div>
            <div style={{ width: '100%', height: 4, background: '#f1f5f9', borderRadius: 99 }}>
              <div
                style={{
                  width: `${totalReviews > 0 ? (positiveReviews / totalReviews) * 100 : 100}%`,
                  height: '100%',
                  background: '#059669',
                  borderRadius: 99,
                }}
              />
            </div>
          </div>
        </div>

        {/* Card 3: Tích cực */}
        <div className="metric-card card-restaurants">
          <div className="card-top">
            <span className="card-top-title">ĐÁNH GIÁ TÍCH CỰC (4-5 SAO)</span>
            <div className="card-top-icon" style={{ background: '#ecfdf5', color: '#059669' }}>
              <Star size={18} fill="#059669" />
            </div>
          </div>
          <div className="card-big-value" style={{ color: '#059669' }}>{positiveReviews}</div>
          <div className="card-footer-info" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem' }}>
            <span style={{ color: '#64748b' }}>Đánh giá khen ngợi món ăn</span>
            <span style={{ color: '#059669', fontWeight: 700 }}>Hài lòng cao</span>
          </div>
        </div>

        {/* Card 4: Cảnh báo tiêu cực */}
        <div className="metric-card card-users">
          <div className="card-top">
            <span className="card-top-title">CẢNH BÁO TIÊU CỰC (1-2 SAO)</span>
            <div className="card-top-icon" style={{ background: '#fee2e2', color: '#dc2626' }}>
              <AlertTriangle size={18} />
            </div>
          </div>
          <div className="card-big-value" style={{ color: '#dc2626' }}>{negativeReviews}</div>
          <div className="card-footer-info" style={{ display: 'flex', flexDirection: 'column', gap: 2, fontSize: '0.74rem' }}>
            <span style={{ color: '#64748b' }}>Khiếu nại dịch vụ/quán</span>
            <span style={{ color: negativeReviews > 0 ? '#dc2626' : '#059669', fontWeight: 600 }}>
              {negativeReviews > 0 ? 'Cần rà soát xử lý' : 'Chưa có khiếu nại'}
            </span>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. WARNING BANNER FOR REVIEWS
         ───────────────────────────────────────────────────────────── */}
      <div
        style={{
          background: negativeReviews > 0 ? '#fff7ed' : '#f0fdf4',
          border: negativeReviews > 0 ? '1px solid #ffedd5' : '1px solid #bbf7d0',
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
              background: negativeReviews > 0 ? '#9a3412' : '#15803d',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <ShieldCheck size={22} />
          </div>
          <div>
            <h4
              style={{
                fontSize: '0.98rem',
                fontWeight: 800,
                color: negativeReviews > 0 ? '#9a3412' : '#166534',
                marginBottom: 3,
              }}
            >
              {negativeReviews > 0
                ? `Có ${negativeReviews} đánh giá tiêu cực (1-2 sao) cần kiểm duyệt viên xem xét`
                : '100% đánh giá khách hàng đang ở mức độ hài lòng cao (4-5 sao)'}
            </h4>
            <p style={{ fontSize: '0.78rem', color: negativeReviews > 0 ? '#7c2d12' : '#15803d', margin: 0 }}>
              Admin có quyền kiểm duyệt và xóa vĩnh viễn các đánh giá sai sự thật, xúc phạm hoặc spam.
            </p>
          </div>
        </div>

        {negativeReviews > 0 && (
          <button
            className="btn btn-primary"
            style={{ height: 34, background: '#9a3412', fontSize: '0.78rem' }}
            onClick={() => setActiveTab('NEGATIVE')}
          >
            Xem đánh giá tiêu cực ({negativeReviews})
          </button>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          4. REVIEWS MANAGEMENT TABLE & FILTERS
         ───────────────────────────────────────────────────────────── */}
      <div className="glass-panel">
        <div className="filter-bar">
          <div className="search-input-group">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              className="input-styled"
              placeholder="Tìm theo Tên khách, Nhà hàng, Nội dung đánh giá..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.78rem', color: '#94a3b8', marginRight: 4 }}>Lọc nhanh:</span>
            <button
              className={`filter-chip ${activeTab === 'ALL' ? 'active' : ''}`}
              onClick={() => setActiveTab('ALL')}
            >
              Tất cả ({reviews.length})
            </button>
            <button
              className={`filter-chip ${activeTab === 'POSITIVE' ? 'active' : ''}`}
              onClick={() => setActiveTab('POSITIVE')}
            >
              Hài lòng (4-5 ⭐)
            </button>
            <button
              className={`filter-chip ${activeTab === 'NEGATIVE' ? 'active' : ''}`}
              onClick={() => setActiveTab('NEGATIVE')}
            >
              Tiêu cực (1-2 ⭐)
            </button>
          </div>
        </div>

        <div className="table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Mã ĐG</th>
                <th>Người Đánh Giá</th>
                <th>Nhà Hàng Đối Tác</th>
                <th>Xếp Hạng</th>
                <th>Nội Dung Đánh Giá</th>
                <th>Thời Gian</th>
                <th style={{ textAlign: 'right' }}>Kiểm Duyệt Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredReviews.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>
                    Không có đánh giá nào phù hợp với bộ lọc hiện tại.
                  </td>
                </tr>
              ) : (
                filteredReviews.map((rev) => (
                  <tr key={rev.id}>
                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#ea580c' }}>
                        #{rev.id}
                      </span>
                    </td>

                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <strong style={{ color: '#0f172a' }}>{rev.user?.full_name || `Khách #${rev.user_id}`}</strong>
                        <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                          {rev.user?.email || '—'}
                        </span>
                      </div>
                    </td>

                    <td>
                      <strong style={{ color: '#0f172a' }}>
                        {rev.restaurant?.name || `Quán #${rev.restaurant_id}`}
                      </strong>
                    </td>

                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            size={14}
                            fill={s <= rev.rating ? '#eab308' : '#e2e8f0'}
                            color={s <= rev.rating ? '#eab308' : '#cbd5e1'}
                          />
                        ))}
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#d97706', marginLeft: 4 }}>
                          {rev.rating}.0
                        </span>
                      </div>
                    </td>

                    <td style={{ maxWidth: 360 }}>
                      <span style={{ fontSize: '0.82rem', color: '#334155', lineHeight: 1.4 }}>
                        "{rev.comment || 'Không có bình luận chữ'}"
                      </span>
                    </td>

                    <td>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                        {rev.created_at ? new Date(rev.created_at).toLocaleDateString('vi-VN') : '—'}
                      </span>
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn-action-sm"
                        style={{ color: '#dc2626' }}
                        title="Xóa đánh giá vi phạm khỏi database"
                        onClick={() => handleDeleteReview(rev.id)}
                      >
                        <Trash2 size={13} />
                        <span>Xóa đánh giá</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
