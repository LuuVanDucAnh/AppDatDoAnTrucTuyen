import React, { useEffect, useState } from 'react';
import {
  Search,
  Plus,
  Store,
  CheckCircle2,
  AlertOctagon,
  Clock,
  Phone,
  Mail,
  MapPin,
  ExternalLink,
  Trash2,
  X,
  FileText,
  AlertTriangle,
  History,
  FileSpreadsheet,
  RotateCw,
} from 'lucide-react';
import { restaurantsApi } from '../services/api';
import type { AdminRestaurant, RestaurantStatus } from '../services/types';

export function RestaurantsView() {
  const [restaurants, setRestaurants] = useState<AdminRestaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusTab, setStatusTab] = useState<'ALL' | 'OPEN' | 'CLOSED' | 'ONBOARD' | 'SUSPENDED'>('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [statusModalRes, setStatusModalRes] = useState<AdminRestaurant | null>(null);
  const [newStatus, setNewStatus] = useState<RestaurantStatus>('OPEN');
  const [savingStatus, setSavingStatus] = useState(false);

  // Add restaurant form
  const [form, setForm] = useState({
    name: '',
    address: '',
    phone_number: '',
    description: '',
    owner_id: '',
    opening_time: '08:00',
    closing_time: '22:00',
  });
  const [submitting, setSubmitting] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchRestaurants = async () => {
    try {
      setLoading(true);
      let statusQuery: RestaurantStatus | undefined = undefined;
      if (statusTab === 'OPEN') statusQuery = 'OPEN';
      if (statusTab === 'CLOSED') statusQuery = 'CLOSED';
      if (statusTab === 'SUSPENDED') statusQuery = 'SUSPENDED';

      const res = await restaurantsApi.getRestaurants({
        search: search.trim() || undefined,
        status: statusQuery,
        page,
        limit: 15,
      });
      setRestaurants(res.data || []);
      if (res.meta) {
        setTotalPages(res.meta.totalPages || 1);
        setTotalCount(res.meta.total || 0);
      }
    } catch (err: any) {
      showToast('error', err?.message || 'Không thể tải danh sách nhà hàng.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRestaurants();
  }, [statusTab, page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchRestaurants();
  };

  const handleCreateRestaurant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.address.trim()) {
      showToast('error', 'Vui lòng điền tên và địa chỉ nhà hàng.');
      return;
    }

    try {
      setSubmitting(true);
      await restaurantsApi.createRestaurant({
        name: form.name.trim(),
        address: form.address.trim(),
        phone_number: form.phone_number.trim() || undefined,
        description: form.description.trim() || undefined,
        owner_id: form.owner_id ? Number(form.owner_id) : undefined,
        opening_time: form.opening_time || undefined,
        closing_time: form.closing_time || undefined,
      });
      showToast('success', 'Tạo và kích hoạt gian hàng thành công! Đã tự động nâng role đối tác lên RESTAURANT_OWNER.');
      setShowAddModal(false);
      setForm({
        name: '',
        address: '',
        phone_number: '',
        description: '',
        owner_id: '',
        opening_time: '08:00',
        closing_time: '22:00',
      });
      fetchRestaurants();
    } catch (err: any) {
      showToast('error', err?.message || 'Không thể tạo nhà hàng.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveStatus = async () => {
    if (!statusModalRes) return;
    try {
      setSavingStatus(true);
      await restaurantsApi.setStatus(statusModalRes.id, newStatus);
      showToast('success', `Đã cập nhật trạng thái quán "${statusModalRes.name}" thành ${newStatus}`);
      setStatusModalRes(null);
      fetchRestaurants();
    } catch (err: any) {
      showToast('error', err?.message || 'Không thể cập nhật trạng thái.');
    } finally {
      setSavingStatus(false);
    }
  };

  const handleDeleteRestaurant = async (res: AdminRestaurant) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa nhà hàng "${res.name}"? Chỉ xóa được khi quán không còn đơn đang chạy.`)) {
      return;
    }
    try {
      await restaurantsApi.deleteRestaurant(res.id);
      showToast('success', `Đã xóa nhà hàng "${res.name}" thành công.`);
      fetchRestaurants();
    } catch (err: any) {
      showToast('error', err?.message || 'Không thể xóa nhà hàng.');
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
          1. HEADER & ACTIONS
         ───────────────────────────────────────────────────────────── */}
      <div className="dashboard-title-bar">
        <div className="title-details">
          <div className="status-tag-row" style={{ marginBottom: 6 }}>
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
              ● MỤC 3.3 • KIỂM DUYỆT & GIÁM SÁT TOÀN SÀN
            </span>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 600,
                color: '#64748b',
                background: '#f1f5f9',
                padding: '3px 9px',
                borderRadius: 9999,
              }}
            >
              Cập nhật: Vừa xong
            </span>
          </div>

          <h2>Quản lý Nhà hàng & Đối tác</h2>
          <p className="title-subtext">
            Duyệt đơn mở quán mới, kiểm soát an toàn thực phẩm, giám sát doanh số và đình chỉ/kích hoạt trạng thái kinh doanh của các gian hàng trên toàn hệ thống Warm Feast.
          </p>
        </div>

        <div className="dashboard-actions-right">
          <button
            className="btn-header-action"
            style={{ background: '#f0f9ff', color: '#0284c7', border: '1px solid #bae6fd' }}
            onClick={() => alert('Mở lịch sử thanh tra vệ sinh an toàn thực phẩm toàn sàn.')}
          >
            <History size={15} />
            <span>Lịch sử thanh tra</span>
          </button>

          <button
            className="btn-header-action"
            style={{ background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0' }}
            onClick={() => alert('Đang xuất danh sách gian hàng định dạng PDF/Excel...')}
          >
            <FileSpreadsheet size={15} />
            <span>Xuất báo cáo PDF/Excel</span>
          </button>

          <button
            className="btn-export-bi"
            style={{ background: 'linear-gradient(135deg, #9a3412 0%, #c2410c 100%)' }}
            onClick={() => setShowAddModal(true)}
          >
            <Plus size={16} />
            <span>+ Thêm Nhà hàng Mới</span>
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. 4 METRIC CARDS ROW (Exact metrics from image)
         ───────────────────────────────────────────────────────────── */}
      <div className="metrics-row">
        {/* Card 1 */}
        <div className="metric-card card-revenue">
          <div className="card-top">
            <span className="card-top-title">TỔNG GIAN HÀNG SÀN</span>
            <div className="card-top-icon" style={{ background: '#ffedd5', color: '#ea580c' }}>
              <Store size={19} />
            </div>
          </div>
          <div className="card-big-value">150</div>
          <div className="card-footer-info">
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#16a34a' }}>
              <span>↗ +5 đối tác</span>
              <span style={{ color: '#64748b' }}>tuần này • Toàn quốc</span>
            </div>
          </div>
        </div>

        {/* Card 2 */}
        <div className="metric-card card-orders">
          <div className="card-top">
            <span className="card-top-title">ĐANG MỞ BÁN (ACTIVE)</span>
            <div className="card-top-icon" style={{ background: '#ecfdf5', color: '#059669' }}>
              <CheckCircle2 size={19} />
            </div>
          </div>
          <div className="card-big-value">
            120 <small style={{ fontSize: '1.1rem', color: '#94a3b8' }}>/ 150</small>
          </div>
          <div className="card-footer-info">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span>Tỷ lệ hoạt động</span>
              <strong>80.0%</strong>
            </div>
            <div style={{ width: '100%', height: 4, background: '#f1f5f9', borderRadius: 99 }}>
              <div style={{ width: '80%', height: '100%', background: '#059669', borderRadius: 99 }} />
            </div>
          </div>
        </div>

        {/* Card 3 */}
        <div className="metric-card card-restaurants">
          <div className="card-top">
            <span className="card-top-title">CHỜ DUYỆT ONBOARDING</span>
            <div className="card-top-icon" style={{ background: '#fef08a', color: '#ca8a04' }}>
              <Clock size={19} />
            </div>
          </div>
          <div className="card-big-value">06</div>
          <div className="card-footer-info" style={{ display: 'flex', flexDirection: 'row', gap: 8 }}>
            <span style={{ color: '#d97706', fontWeight: 700 }}>⚡ Xử lý gấp &lt; 24h</span>
            <span>• Hồ sơ mới</span>
          </div>
        </div>

        {/* Card 4 */}
        <div className="metric-card card-users">
          <div className="card-top">
            <span className="card-top-title">ĐÌNH CHỈ / VI PHẠM</span>
            <div className="card-top-icon" style={{ background: '#fee2e2', color: '#dc2626' }}>
              <AlertOctagon size={19} />
            </div>
          </div>
          <div className="card-big-value" style={{ color: '#dc2626' }}>08</div>
          <div className="card-footer-info" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>5 do VSATTP • 3 nợ d...</span>
            <span className="alert-badge">Cần xử lý</span>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. ONBOARDING APPROVAL QUEUE SECTION (Exact cards from image)
         ───────────────────────────────────────────────────────────── */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: 16,
          padding: 24,
          boxShadow: 'var(--shadow-card)',
          display: 'flex',
          flexDirection: 'column',
          gap: 18,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: '#ea580c',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FileText size={18} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>Hồ sơ Chờ Phê duyệt Mở quán Mới</h3>
                <span className="alert-badge" style={{ background: '#ffedd5', color: '#c2410c' }}>
                  6 chờ xử lý
                </span>
              </div>
              <p style={{ fontSize: '0.78rem', color: '#64748b' }}>
                Onboarding Approval Queue • Xử lý tự động phân quyền đối tác
              </p>
            </div>
          </div>

          <div style={{ fontSize: '0.78rem', color: '#059669', background: '#ecfdf5', padding: '6px 12px', borderRadius: 9999, fontWeight: 600 }}>
            🛡️ Sau duyệt: Cấp role RESTAURANT_OWNER &amp; mở quyền menu
          </div>
        </div>

        {/* 2 Pending Partner Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))', gap: 18 }}>
          {/* Card 1: Tiệm Cơm Niêu Sài Gòn */}
          <div
            style={{
              border: '1px solid #e2e8f0',
              borderRadius: 12,
              padding: 18,
              background: '#ffffff',
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', gap: 12 }}>
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 10,
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    color: '#ea580c',
                    fontSize: '1.1rem',
                  }}
                >
                  🍲
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <h4 style={{ fontSize: '0.98rem', fontWeight: 800 }}>Tiệm Cơm Niêu Sài Gòn</h4>
                    <span style={{ fontSize: '0.7rem', color: '#059669', background: '#ecfdf5', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>
                      Đủ chứng từ
                    </span>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 2 }}>
                    Mã hồ sơ: <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>#REQ-2024-1189</span>
                  </div>
                </div>
              </div>
              <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Gửi 4 giờ trước</span>
            </div>

            <div style={{ fontSize: '0.78rem', color: '#475569', display: 'flex', alignItems: 'center', gap: 6 }}>
              <MapPin size={14} color="#ea580c" />
              <span>120 Hai Bà Trưng, Phường Bến Nghé, Quận 1, TP.HCM</span>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1.2fr 1fr',
                gap: 12,
                padding: '10px 14px',
                background: '#f8fafc',
                borderRadius: 8,
                fontSize: '0.75rem',
              }}
            >
              <div>
                <span style={{ color: '#94a3b8' }}>Chủ đại diện:</span>
                <div style={{ fontWeight: 700, color: '#0f172a' }}>Trần Thị Mai</div>
                <div style={{ color: '#64748b' }}>0918.234.567 • tranmai.saigon@gmail.com</div>
              </div>
              <div>
                <span style={{ color: '#94a3b8' }}>Pháp lý &amp; VSATTP:</span>
                <div style={{ fontWeight: 700, color: '#059669', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <CheckCircle2 size={13} /> Chứng nhận #VS-2024-889
                </div>
                <div style={{ color: '#64748b' }}>GPKD số 0318928371 (Cấp lại 2023)</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
              <button
                className="btn-action-sm"
                style={{ flex: 1.2, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                onClick={() => alert('Mở xem hồ sơ chi tiết và thực đơn 28 món của Tiệm Cơm Niêu Sài Gòn.')}
              >
                <span>Xem hồ sơ &amp; Menu mẫu (28 món)</span>
              </button>
              <button
                className="btn-action-sm"
                style={{ color: '#dc2626', height: 36 }}
                onClick={() => alert('Đã gửi yêu cầu từ chối hồ sơ kèm lý do cho chủ quán.')}
              >
                Từ chối
              </button>
              <button
                className="btn btn-primary"
                style={{ height: 36, padding: '0 16px', fontSize: '0.8rem', background: '#9a3412' }}
                onClick={() => {
                  showToast('success', 'Đã phê duyệt đối tác "Tiệm Cơm Niêu Sài Gòn" thành công!');
                }}
              >
                Duyệt &amp; Kích hoạt ngay
              </button>
            </div>
          </div>

          {/* Card 2: Bún Bò Huế Cố Đô */}
          <div
            style={{
              border: '1px solid #e2e8f0',
              borderRadius: 12,
              padding: 18,
              background: '#ffffff',
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', gap: 12 }}>
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 10,
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    color: '#ca8a04',
                    fontSize: '1.1rem',
                  }}
                >
                  🍜
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <h4 style={{ fontSize: '0.98rem', fontWeight: 800 }}>Bún Bò Huế Cố Đô</h4>
                    <span style={{ fontSize: '0.7rem', color: '#c2410c', background: '#ffedd5', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>
                      Thiếu ảnh bếp chế biến
                    </span>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 2 }}>
                    Mã hồ sơ: <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>#REQ-2024-1188</span>
                  </div>
                </div>
              </div>
              <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Gửi 18 giờ trước</span>
            </div>

            <div style={{ fontSize: '0.78rem', color: '#475569', display: 'flex', alignItems: 'center', gap: 6 }}>
              <MapPin size={14} color="#ea580c" />
              <span>45 Lê Duẩn, Phường Đa Kao, Quận 1 (Cơ sở 2), TP.HCM</span>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1.2fr 1fr',
                gap: 12,
                padding: '10px 14px',
                background: '#f8fafc',
                borderRadius: 8,
                fontSize: '0.75rem',
              }}
            >
              <div>
                <span style={{ color: '#94a3b8' }}>Chủ đại diện:</span>
                <div style={{ fontWeight: 700, color: '#0f172a' }}>Hoàng Văn Khang</div>
                <div style={{ color: '#64748b' }}>0983.112.233 • khang.bunbo@gmail.com</div>
              </div>
              <div>
                <span style={{ color: '#94a3b8' }}>Ghi chú kiểm duyệt viên:</span>
                <div style={{ color: '#b45309', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <AlertTriangle size={13} /> Cần thêm ảnh tủ bảo quản thịt &amp; bếp nấu
                </div>
                <div style={{ color: '#64748b' }}>GPKD đã khớp CCCD đại diện</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
              <button
                className="btn-action-sm"
                style={{ flex: 1.2, height: 36 }}
                onClick={() => alert('Đã gửi thông báo yêu cầu quán bổ sung ảnh chụp khu chế biến.')}
              >
                Yêu cầu bổ sung tài liệu
              </button>
              <button
                className="btn-action-sm"
                style={{ color: '#dc2626', height: 36 }}
                onClick={() => alert('Từ chối hồ sơ này.')}
              >
                Từ chối hồ sơ
              </button>
              <button
                className="btn-action-sm"
                style={{ height: 36, opacity: 0.6, cursor: 'not-allowed' }}
                disabled
              >
                Chưa đủ điều kiện duyệt
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          4. MAIN RESTAURANTS TABLE & FILTERS
         ───────────────────────────────────────────────────────────── */}
      <div className="glass-panel">
        <div className="filter-bar">
          <form onSubmit={handleSearchSubmit} className="search-input-group">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              className="input-styled"
              placeholder="Tìm theo Tên quán, Mã ID (#RES-xxxx), Tên..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </form>

          {/* Quick Filter Tabs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.78rem', color: '#94a3b8', marginRight: 4 }}>Lọc nhanh:</span>
            <button
              className={`filter-chip ${statusTab === 'ALL' ? 'active' : ''}`}
              onClick={() => { setStatusTab('ALL'); setPage(1); }}
            >
              Tất cả (150)
            </button>
            <button
              className={`filter-chip ${statusTab === 'OPEN' ? 'active' : ''}`}
              onClick={() => { setStatusTab('OPEN'); setPage(1); }}
            >
              Mở cửa (120)
            </button>
            <button
              className={`filter-chip ${statusTab === 'CLOSED' ? 'active' : ''}`}
              onClick={() => { setStatusTab('CLOSED'); setPage(1); }}
            >
              Đóng cửa (16)
            </button>
            <button
              className={`filter-chip ${statusTab === 'ONBOARD' ? 'active' : ''}`}
              onClick={() => { setStatusTab('ONBOARD'); setPage(1); }}
            >
              Chờ duyệt (6)
            </button>
            <button
              className={`filter-chip ${statusTab === 'SUSPENDED' ? 'active' : ''}`}
              onClick={() => { setStatusTab('SUSPENDED'); setPage(1); }}
            >
              Đình chỉ (8)
            </button>
          </div>
        </div>

        {/* Secondary Filter Row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0 24px 14px', flexWrap: 'wrap' }}>
          <select className="select-styled" style={{ height: 34, fontSize: '0.78rem' }}>
            <option>Tất cả quận/huyện (TP.HCM)</option>
            <option>Quận 1</option>
            <option>Quận 3</option>
            <option>Bình Thạnh</option>
            <option>Cầu Giấy, Hà Nội</option>
          </select>

          <select className="select-styled" style={{ height: 34, fontSize: '0.78rem' }}>
            <option>Tất cả danh mục ẩm thực</option>
            <option>Cơm / Món Việt</option>
            <option>Bún / Phở / Mì</option>
            <option>Trà sữa &amp; Cà phê</option>
            <option>Pizza &amp; Fastfood</option>
          </select>

          <select className="select-styled" style={{ height: 34, fontSize: '0.78rem' }}>
            <option>Chất lượng: Tất cả mức sao</option>
            <option>⭐ 4.5 sao trở lên</option>
            <option>⭐ Dưới 4.0 sao</option>
          </select>

          <select className="select-styled" style={{ height: 34, fontSize: '0.78rem', marginLeft: 'auto' }}>
            <option>Sắp xếp: Doanh thu tháng (Cao ➔ Thấp)</option>
            <option>Đơn hoàn tất (Nhiều nhất)</option>
            <option>Mới hợp tác gần đây</option>
          </select>
        </div>

        {/* Table */}
        <div className="table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Gian Hàng</th>
                <th>Chủ Đại Diện / Liên Hệ</th>
                <th>Khu Vực &amp; Giờ Bán</th>
                <th>Doanh Thu Tháng</th>
                <th>Trạng Thái</th>
                <th style={{ textAlign: 'right' }}>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: 48, color: '#94a3b8' }}>
                    Đang nạp danh sách nhà hàng đối tác...
                  </td>
                </tr>
              ) : restaurants.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: 48, color: '#64748b' }}>
                    Không tìm thấy nhà hàng nào phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                restaurants.map((res) => (
                  <tr key={res.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div
                          style={{
                            width: 38,
                            height: 38,
                            borderRadius: 8,
                            background: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1rem',
                          }}
                        >
                          🏪
                        </div>
                        <div>
                          <strong style={{ fontSize: '0.88rem', color: '#0f172a' }}>{res.name}</strong>
                          <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>
                            #RES-{String(res.id).padStart(4, '0')}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div>{res.owner?.full_name || `Chủ quán #${res.owner_id}`}</div>
                      <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                        {res.phone_number || res.owner?.phone_number || '—'}
                      </div>
                    </td>

                    <td>
                      <div style={{ maxWidth: 240, fontSize: '0.8rem', color: '#475569' }}>{res.address}</div>
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                        {res.opening_time || '08:00'} - {res.closing_time || '22:00'}
                      </div>
                    </td>

                    <td>
                      <strong style={{ color: '#ea580c' }}>
                        {Number(res.total_revenue || 48500000).toLocaleString('vi-VN')}đ
                      </strong>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{res.total_orders || 342} đơn</div>
                    </td>

                    <td>
                      {res.status === 'OPEN' && (
                        <span className="badge-pill pill-completed">● Mở cửa (OPEN)</span>
                      )}
                      {res.status === 'CLOSED' && (
                        <span className="badge-pill" style={{ background: '#f1f5f9', color: '#475569' }}>
                          ● Đóng cửa
                        </span>
                      )}
                      {res.status === 'SUSPENDED' && (
                        <span className="badge-pill" style={{ background: '#fef2f2', color: '#dc2626' }}>
                          ● Đình chỉ vi phạm
                        </span>
                      )}
                      {res.status === 'BUSY' && (
                        <span className="badge-pill pill-preparing">● Đang bận</span>
                      )}
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 6 }}>
                        <button
                          className="btn-icon"
                          title="Đổi trạng thái / Đình chỉ"
                          onClick={() => {
                            setStatusModalRes(res);
                            setNewStatus(res.status);
                          }}
                          style={{ color: res.status === 'SUSPENDED' ? '#dc2626' : '#0284c7' }}
                        >
                          <AlertOctagon size={15} />
                        </button>

                        <button
                          className="btn-icon"
                          title="Xóa nhà hàng"
                          onClick={() => handleDeleteRestaurant(res)}
                          style={{ color: '#dc2626' }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div
            style={{
              padding: '16px 24px',
              borderTop: '1px solid var(--border-card)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Trang {page} / {totalPages} (Tổng số {totalCount} quán)
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className="btn btn-secondary"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                style={{ height: 34, padding: '0 14px', fontSize: '0.8rem' }}
              >
                Trước
              </button>
              <button
                className="btn btn-secondary"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                style={{ height: 34, padding: '0 14px', fontSize: '0.8rem' }}
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal: Thêm nhà hàng mới */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Thêm Gian Hàng Mới (Onboard Đối Tác)</h3>
              <button className="btn-icon" onClick={() => setShowAddModal(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateRestaurant}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Tên nhà hàng / quán ăn *</label>
                  <input
                    type="text"
                    placeholder="VD: Cơm Tấm Ba Ghiền"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Địa chỉ cụ thể *</label>
                  <input
                    type="text"
                    placeholder="84 Đặng Văn Ngữ, Phường 10, Phú Nhuận, TP.HCM"
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div className="form-group">
                    <label>Số điện thoại</label>
                    <input
                      type="text"
                      placeholder="0901234567"
                      value={form.phone_number}
                      onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>ID Chủ Quán (User ID)</label>
                    <input
                      type="number"
                      placeholder="VD: 3"
                      value={form.owner_id}
                      onChange={(e) => setForm({ ...form, owner_id: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div className="form-group">
                    <label>Giờ mở cửa</label>
                    <input
                      type="text"
                      placeholder="08:00"
                      value={form.opening_time}
                      onChange={(e) => setForm({ ...form, opening_time: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Giờ đóng cửa</label>
                    <input
                      type="text"
                      placeholder="22:00"
                      value={form.closing_time}
                      onChange={(e) => setForm({ ...form, closing_time: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Đang kích hoạt...' : 'Kích Hoạt Gian Hàng'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Đổi trạng thái nhà hàng */}
      {statusModalRes && (
        <div className="modal-overlay" onClick={() => setStatusModalRes(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 460 }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>Đổi Trạng Thái Quán "{statusModalRes.name}"</h3>
              <button className="btn-icon" onClick={() => setStatusModalRes(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '0.82rem', color: '#64748b' }}>
                Quản trị viên có quyền đặt trạng thái <strong>SUSPENDED</strong> để đình chỉ nhà hàng vi phạm vệ sinh an toàn thực phẩm hoặc bị khiếu nại nhiều lần. Quán bị đình chỉ sẽ không thể nhận đơn.
              </p>

              <div className="form-group" style={{ marginTop: 8 }}>
                <label>Trạng thái kinh doanh:</label>
                <select
                  className="select-styled"
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as RestaurantStatus)}
                >
                  <option value="OPEN">OPEN (Đang mở cửa nhận đơn)</option>
                  <option value="CLOSED">CLOSED (Đóng cửa tạm thời)</option>
                  <option value="BUSY">BUSY (Đang bận / Quá tải đơn)</option>
                  <option value="SUSPENDED">SUSPENDED (Đình chỉ vi phạm)</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setStatusModalRes(null)}>
                Hủy
              </button>
              <button className="btn btn-primary" onClick={handleSaveStatus} disabled={savingStatus}>
                {savingStatus ? 'Đang lưu...' : 'Lưu Thay Đổi'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
