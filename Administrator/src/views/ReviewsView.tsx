import React, { useEffect, useState } from 'react';
import {
  Star,
  Trash2,
  MessageSquare,
  AlertCircle,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Search,
  Filter,
  Eye,
  X,
  FileSpreadsheet,
  Flag,
  ThumbsUp,
  ThumbsDown,
  UserX,
  Check,
} from 'lucide-react';
import { reviewsApi } from '../services/api';
import type { AdminReview } from '../services/types';

export function ReviewsView() {
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [loading, setLoading] = useState(false);
  const [ratingFilter, setRatingFilter] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'ALL' | 'POSITIVE' | 'NEGATIVE' | 'FLAGGED'>('ALL');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Toast
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  // Mock initial reviews for rich visual experience
  const [reviewList, setReviewList] = useState<any[]>([
    {
      id: 881,
      userName: 'Trần Minh Đức',
      userPhone: '0912.334.xxx',
      restaurantName: 'Cơm Tấm Ba Ghiền',
      rating: 5,
      comment: 'Cơm tấm sườn bì chả ở đây ngon xuất sắc, sườn nướng thơm phức dày cộm, shipper giao tới còn bốc khói nóng hổi!',
      createdAt: '10:20 - Hôm nay',
      hasImage: true,
      sentiment: 'POSITIVE',
      flagged: false,
      aiAnalysis: 'Cảm xúc tích cực (98%) • Khách quen',
    },
    {
      id: 880,
      userName: 'Nguyễn Thu Trang',
      userPhone: '0988.776.xxx',
      restaurantName: 'Bún Chả Hà Nội Phố Cổ',
      rating: 1,
      comment: 'Nước mắm hôm nay bị chua gắt bất thường, chả nướng có mùi lạ. Quán làm ăn cẩu thả cần xem xét lại vệ sinh an toàn thực phẩm!',
      createdAt: '09:45 - Hôm nay',
      hasImage: true,
      sentiment: 'NEGATIVE',
      flagged: true,
      aiAnalysis: 'Khiếu nại nghiêm trọng về VSATTP • Cần bộ phận chất lượng gọi kiểm tra',
    },
    {
      id: 879,
      userName: 'user_spam_99182',
      userPhone: '0344.112.xxx',
      restaurantName: 'Trà Sữa Gong Cha',
      rating: 1,
      comment: 'Quán dở tệ, phục vụ như đuổi khách, đừng ai mua quán này lừa đảo đó!!!',
      createdAt: '08:15 - Hôm nay',
      hasImage: false,
      sentiment: 'NEGATIVE',
      flagged: true,
      aiAnalysis: 'Nghi vấn Spam bot (Spam Score 92%) • Tài khoản mới tạo 15 phút',
    },
    {
      id: 878,
      userName: 'Lê Hoàng Minh',
      userPhone: '0903.456.xxx',
      restaurantName: 'Pizza 4P’s - Ben Thanh',
      rating: 5,
      comment: 'Pizza 4 loại phô mai mật ong đỉnh cao như mọi khi, đóng gói hộp giữ nhiệt rất cẩn thận và chuyên nghiệp.',
      createdAt: 'Hôm qua',
      hasImage: true,
      sentiment: 'POSITIVE',
      flagged: false,
      aiAnalysis: 'Cảm xúc tích cực (99%)',
    },
    {
      id: 877,
      userName: 'Võ Thanh Tùng',
      userPhone: '0977.889.xxx',
      restaurantName: 'Bánh Mì Huỳnh Hoa',
      rating: 4,
      comment: 'Bánh mì nhiều nhân patê béo ngậy, giao hàng nhanh trong 20 phút. Trừ 1 sao vì quên bỏ ớt theo ghi chú.',
      createdAt: 'Hôm qua',
      hasImage: false,
      sentiment: 'POSITIVE',
      flagged: false,
      aiAnalysis: 'Góp ý nhẹ về món phụ',
    },
  ]);

  const handleModerate = (id: number, action: 'APPROVE' | 'HIDE' | 'BAN_USER') => {
    if (action === 'APPROVE') {
      setReviewList((prev) =>
        prev.map((r) => (r.id === id ? { ...r, flagged: false } : r))
      );
      showToast('success', `Đã duyệt hiển thị công khai đánh giá #${id}.`);
    } else if (action === 'HIDE') {
      setReviewList((prev) => prev.filter((r) => r.id !== id));
      showToast('success', `Đã ẩn và xóa đánh giá vi phạm #${id} khỏi hệ thống.`);
    } else if (action === 'BAN_USER') {
      setReviewList((prev) => prev.filter((r) => r.id !== id));
      showToast('success', `Đã ẩn review và khóa vĩnh viễn tài khoản spammer!`);
    }
  };

  const filteredReviews = reviewList.filter((r) => {
    if (activeTab === 'POSITIVE' && r.rating < 4) return false;
    if (activeTab === 'NEGATIVE' && r.rating >= 4) return false;
    if (activeTab === 'FLAGGED' && !r.flagged) return false;
    if (ratingFilter && r.rating !== Number(ratingFilter)) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        r.userName.toLowerCase().includes(q) ||
        r.restaurantName.toLowerCase().includes(q) ||
        r.comment.toLowerCase().includes(q)
      );
    }
    return true;
  });

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
              AI Sentiment: Hoạt động bình thường
            </span>
          </div>

          <h2>Kiểm duyệt Đánh giá &amp; Giám sát Uy tín Đối tác</h2>
          <p className="title-subtext">
            Hệ thống phân tích cảm xúc (Sentiment AI), phát hiện spam đánh giá ảo, tự động gắn cờ khiếu nại an toàn thực phẩm và bảo vệ quyền lợi người dùng cũng như đối tác nhà hàng.
          </p>
        </div>

        <div className="dashboard-actions-right">
          <button
            className="btn-header-action"
            style={{ background: '#f8fafc', color: '#0f172a', border: '1px solid #cbd5e1' }}
            onClick={() => alert('Đang xuất danh sách đánh giá & phân tích cảm xúc định dạng CSV/Excel...')}
          >
            <FileSpreadsheet size={15} color="#ea580c" />
            <span>Xuất báo cáo CSAT / CS</span>
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
          <div className="card-big-value">4.890</div>
          <div className="card-footer-info" style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ fontSize: '0.74rem', color: '#64748b' }}>Đánh giá có ảnh: <strong>68.4%</strong></span>
            <span style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: 600 }}>↗ Tăng 8.2% tuần này</span>
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
            4.8 <small style={{ fontSize: '1.1rem', color: '#94a3b8' }}>/ 5.0</small>
          </div>
          <div className="card-footer-info">
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', marginBottom: 4 }}>
              <span style={{ color: '#0f172a' }}>Tỷ lệ hài lòng (4-5 sao)</span>
              <strong style={{ color: '#059669' }}>94.6%</strong>
            </div>
            <div style={{ width: '100%', height: 4, background: '#f1f5f9', borderRadius: 99 }}>
              <div style={{ width: '94.6%', height: '100%', background: '#059669', borderRadius: 99 }} />
            </div>
          </div>
        </div>

        {/* Card 3: Cảnh báo tiêu cực */}
        <div className="metric-card card-restaurants">
          <div className="card-top">
            <span className="card-top-title">CẢNH BÁO TIÊU CỰC (1-2 SAO)</span>
            <div className="card-top-icon" style={{ background: '#fee2e2', color: '#dc2626' }}>
              <AlertTriangle size={18} />
            </div>
          </div>
          <div className="card-big-value" style={{ color: '#dc2626' }}>18</div>
          <div className="card-footer-info" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem' }}>
            <span style={{ color: '#64748b' }}>Khiếu nại chất lượng món</span>
            <span style={{ color: '#dc2626', fontWeight: 700 }}>Cần phản hồi &lt; 24h</span>
          </div>
        </div>

        {/* Card 4: Nghi vấn spam */}
        <div className="metric-card card-users">
          <div className="card-top">
            <span className="card-top-title">NGHI VẤN SPAM / GIAN LẬN</span>
            <div className="card-top-icon" style={{ background: '#ffedd5', color: '#ea580c' }}>
              <Flag size={18} />
            </div>
          </div>
          <div className="card-big-value" style={{ color: '#ea580c' }}>07</div>
          <div className="card-footer-info" style={{ display: 'flex', flexDirection: 'column', gap: 2, fontSize: '0.74rem' }}>
            <span style={{ color: '#64748b' }}>AI tự động chặn &amp; gắn cờ</span>
            <span style={{ color: '#0284c7', fontWeight: 600 }}>Cạnh tranh không lành mạnh</span>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. WARNING BANNER FOR REVIEWS NEEDING MODERATION
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
            <ShieldCheck size={22} />
          </div>
          <div>
            <h4 style={{ fontSize: '0.98rem', fontWeight: 800, color: '#9a3412', marginBottom: 3 }}>
              02 Đánh giá bị AI gắn cờ rủi ro cao — Cần kiểm duyệt viên xác thực
            </h4>
            <p style={{ fontSize: '0.78rem', color: '#7c2d12', margin: 0 }}>
              Bao gồm: 01 khiếu nại nghiêm trọng về vệ sinh an toàn thực phẩm và 01 tài khoản nghi vấn spam bot công kích nhà hàng.
            </p>
          </div>
        </div>

        <button
          className="btn btn-primary"
          style={{ height: 34, background: '#9a3412', fontSize: '0.78rem' }}
          onClick={() => setActiveTab('FLAGGED')}
        >
          Xử lý ngay (02)
        </button>
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
              Tất cả
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
            <button
              className={`filter-chip ${activeTab === 'FLAGGED' ? 'active' : ''}`}
              onClick={() => setActiveTab('FLAGGED')}
            >
              Cảnh báo gắn cờ (2)
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
                <th>Nội Dung &amp; Đánh Giá AI</th>
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
                        <strong style={{ color: '#0f172a' }}>{rev.userName}</strong>
                        <span style={{ fontSize: '0.72rem', color: '#64748b' }}>{rev.userPhone}</span>
                      </div>
                    </td>

                    <td>
                      <strong style={{ color: '#0f172a' }}>{rev.restaurantName}</strong>
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
                      </div>
                    </td>

                    <td style={{ maxWidth: 360 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <span style={{ fontSize: '0.8rem', color: '#334155', lineHeight: 1.4 }}>
                          "{rev.comment}"
                        </span>
                        {rev.hasImage && (
                          <span style={{ fontSize: '0.68rem', color: '#0284c7', background: '#f0f9ff', padding: '1px 6px', borderRadius: 4, width: 'fit-content' }}>
                            📷 Kèm ảnh chụp thực tế
                          </span>
                        )}
                        <span style={{ fontSize: '0.7rem', color: rev.flagged ? '#dc2626' : '#64748b', fontStyle: 'italic' }}>
                          ⚡ {rev.aiAnalysis}
                        </span>
                      </div>
                    </td>

                    <td>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{rev.createdAt}</span>
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 6 }}>
                        {rev.flagged ? (
                          <>
                            <button
                              className="btn-action-sm"
                              style={{ background: '#ecfdf5', color: '#059669', borderColor: '#a7f3d0', fontWeight: 700 }}
                              title="Duyệt cho phép hiển thị"
                              onClick={() => handleModerate(rev.id, 'APPROVE')}
                            >
                              <Check size={13} />
                              <span>Duyệt</span>
                            </button>

                            <button
                              className="btn-action-sm"
                              style={{ background: '#fee2e2', color: '#dc2626', borderColor: '#fecaca', fontWeight: 700 }}
                              title="Ẩn và xóa khỏi hệ thống"
                              onClick={() => handleModerate(rev.id, 'HIDE')}
                            >
                              <Trash2 size={13} />
                              <span>Ẩn ĐG</span>
                            </button>

                            <button
                              className="btn-action-sm"
                              style={{ background: '#0f172a', color: '#fff', fontWeight: 700 }}
                              title="Khóa tài khoản Spammer"
                              onClick={() => handleModerate(rev.id, 'BAN_USER')}
                            >
                              <UserX size={13} />
                              <span>Ban</span>
                            </button>
                          </>
                        ) : (
                          <button
                            className="btn-action-sm"
                            style={{ color: '#dc2626' }}
                            title="Xóa đánh giá vi phạm"
                            onClick={() => handleModerate(rev.id, 'HIDE')}
                          >
                            <Trash2 size={13} />
                            <span>Xóa</span>
                          </button>
                        )}
                      </div>
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
