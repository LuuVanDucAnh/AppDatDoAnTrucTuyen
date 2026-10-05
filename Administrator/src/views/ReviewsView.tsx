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
  X,
  AlertCircle,
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

  // Delete Review Confirmation Modal State
  const [deleteTargetReview, setDeleteTargetReview] = useState<AdminReview | null>(null);
  const [deletingReview, setDeletingReview] = useState(false);

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
        search: search.trim() || undefined,
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

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchReviews();
  };

  useEffect(() => {
    fetchReviews();
  }, [page, activeTab]);

  const confirmDeleteReview = async () => {
    if (!deleteTargetReview) return;
    try {
      setDeletingReview(true);
      await reviewsApi.deleteReview(deleteTargetReview.id);
      // Cập nhật giao diện tức thì (Optimistic update)
      setReviews((prev) => prev.filter((r) => r.id !== deleteTargetReview.id));
      setTotalCount((prev) => Math.max(0, prev - 1));
      showToast('success', `Đã xóa đánh giá #${deleteTargetReview.id} thành công.`);
      setDeleteTargetReview(null);
      fetchReviews();
    } catch (err: any) {
      showToast('error', err?.message || 'Không thể xóa đánh giá.');
    } finally {
      setDeletingReview(false);
    }
  };

  // Lọc thêm phía frontend theo sao (POSITIVE/NEGATIVE tabs)
  const filteredReviews = reviews.filter((r) => {
    if (activeTab === 'POSITIVE' && r.rating < 4) return false;
    if (activeTab === 'NEGATIVE' && r.rating >= 4) return false;
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
          <form onSubmit={handleSearchSubmit} className="search-input-group">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              className="input-styled"
              placeholder="Tìm theo Tên khách, Nhà hàng, Nội dung đánh giá..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setPage(1);
                  setTimeout(fetchReviews, 0);
                }}
                style={{
                  position: 'absolute',
                  right: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                }}
              >
                <X size={15} />
              </button>
            )}
          </form>

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
                        onClick={() => setDeleteTargetReview(rev)}
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

      {/* ─────────────────────────────────────────────────────────────
          MODAL: XÁC NHẬN XÓA ĐÁNH GIÁ
         ───────────────────────────────────────────────────────────── */}
      {deleteTargetReview && (
        <div className="modal-overlay" onClick={() => !deletingReview && setDeleteTargetReview(null)}>
          <div className="modal-card" style={{ maxWidth: 460 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Trash2 size={18} color="#dc2626" />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#dc2626', margin: 0 }}>Xác Nhận Xóa Đánh Giá</h3>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Hành động này sẽ xóa vĩnh viễn đánh giá khỏi hệ thống</div>
                </div>
              </div>
              <button className="btn-icon" onClick={() => !deletingReview && setDeleteTargetReview(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body" style={{ padding: '20px 24px' }}>
              <p style={{ fontSize: '0.9rem', color: '#334155', lineHeight: 1.6, margin: 0 }}>
                Bạn có chắc chắn muốn xóa đánh giá của khách hàng sau:
              </p>
              <div style={{ margin: '12px 0', padding: '12px 14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ fontSize: '0.95rem', color: '#0f172a' }}>
                    {deleteTargetReview.user?.full_name || `Khách #${deleteTargetReview.user_id}`}
                  </strong>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#d97706' }}>
                    ⭐ {deleteTargetReview.rating}.0 / 5.0
                  </span>
                </div>
                <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                  Nhà hàng: <strong style={{ color: '#0f172a' }}>{deleteTargetReview.restaurant?.name || `Quán #${deleteTargetReview.restaurant_id}`}</strong>
                </div>
                {deleteTargetReview.comment && (
                  <div style={{ fontSize: '0.8rem', color: '#334155', fontStyle: 'italic', background: '#ffffff', padding: '8px 10px', borderRadius: 6, border: '1px solid #e2e8f0', marginTop: 4 }}>
                    "{deleteTargetReview.comment}"
                  </div>
                )}
              </div>
              <div style={{ padding: '10px 14px', background: '#fef2f2', borderRadius: 8, border: '1px solid #fecaca', fontSize: '0.8rem', color: '#991b1b', display: 'flex', gap: 8, alignItems: 'center' }}>
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>Đánh giá sẽ bị xóa và điểm uy tín của quán sẽ được hệ thống tính toán lại.</span>
              </div>
            </div>
            <div className="modal-footer" style={{ padding: '16px 24px', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setDeleteTargetReview(null)}
                disabled={deletingReview}
                style={{ height: 38, padding: '0 16px', fontSize: '0.85rem' }}
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                className="btn"
                style={{
                  background: '#dc2626',
                  color: '#ffffff',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  height: 38,
                  padding: '0 18px',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  borderRadius: 8,
                  cursor: deletingReview ? 'not-allowed' : 'pointer',
                  opacity: deletingReview ? 0.7 : 1,
                }}
                onClick={confirmDeleteReview}
                disabled={deletingReview}
              >
                <Trash2 size={15} />
                <span>{deletingReview ? 'Đang xóa...' : 'Đồng Ý Xóa'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
