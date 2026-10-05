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
  Pencil,
  X,
  FileText,
  AlertTriangle,
  History,
  FileSpreadsheet,
  RotateCw,
  AlertCircle,
} from 'lucide-react';
import { restaurantsApi, dashboardApi } from '../services/api';
import type { AdminRestaurant, RestaurantStatus, PlatformDashboard } from '../services/types';

export function RestaurantsView() {
  const [restaurants, setRestaurants] = useState<AdminRestaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState<PlatformDashboard | null>(null);
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

  // Edit restaurant form & modal
  const [editRes, setEditRes] = useState<AdminRestaurant | null>(null);
  const [editResForm, setEditResForm] = useState({
    name: '',
    address: '',
    phone_number: '',
    description: '',
    opening_time: '08:00',
    closing_time: '22:00',
    status: 'OPEN' as RestaurantStatus,
    owner_id: '',
  });
  const [updatingRes, setUpdatingRes] = useState(false);

  // Delete Restaurant Confirmation Modal State
  const [deleteTargetRes, setDeleteTargetRes] = useState<AdminRestaurant | null>(null);
  const [deletingRes, setDeletingRes] = useState(false);

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
      dashboardApi.getDashboard().then(setDashboard).catch(() => {});
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

  const handleOpenEditRes = (res: AdminRestaurant) => {
    setEditRes(res);
    setEditResForm({
      name: res.name,
      address: res.address,
      phone_number: res.phone_number || res.owner?.phone_number || '',
      description: res.description || '',
      opening_time: res.opening_time || '08:00',
      closing_time: res.closing_time || '22:00',
      status: res.status,
      owner_id: res.owner_id ? String(res.owner_id) : '',
    });
  };

  const handleSaveEditRes = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editRes) return;
    if (!editResForm.name.trim() || !editResForm.address.trim()) {
      showToast('error', 'Tên và địa chỉ quán ăn không được để trống.');
      return;
    }
    try {
      setUpdatingRes(true);
      await restaurantsApi.updateRestaurant(editRes.id, {
        name: editResForm.name.trim(),
        address: editResForm.address.trim(),
        phone_number: editResForm.phone_number.trim() || undefined,
        description: editResForm.description.trim() || undefined,
        opening_time: editResForm.opening_time || undefined,
        closing_time: editResForm.closing_time || undefined,
        status: editResForm.status,
        owner_id: editResForm.owner_id ? Number(editResForm.owner_id) : undefined,
      });
      showToast('success', `Đã cập nhật thông tin quán "${editResForm.name}" thành công!`);
      setEditRes(null);
      fetchRestaurants();
    } catch (err: any) {
      showToast('error', err?.message || 'Không thể cập nhật thông tin quán.');
    } finally {
      setUpdatingRes(false);
    }
  };

  const confirmDeleteRestaurant = async () => {
    if (!deleteTargetRes) return;
    try {
      setDeletingRes(true);
      await restaurantsApi.deleteRestaurant(deleteTargetRes.id);
      // Cập nhật giao diện tức thì (Optimistic update)
      setRestaurants((prev) => prev.filter((r) => r.id !== deleteTargetRes.id));
      setTotalCount((prev) => Math.max(0, prev - 1));
      showToast('success', `Đã xóa nhà hàng "${deleteTargetRes.name}" thành công.`);
      setDeleteTargetRes(null);
      fetchRestaurants();
    } catch (err: any) {
      showToast('error', err?.message || 'Không thể xóa nhà hàng.');
    } finally {
      setDeletingRes(false);
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
            Duyệt đơn mở quán mới, kiểm soát an toàn thực phẩm, giám sát doanh số và đình chỉ/kích hoạt trạng thái kinh doanh của các gian hàng trên toàn hệ thống Food.
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
          2. 4 METRIC CARDS ROW
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
          <div className="card-big-value">{dashboard?.restaurants?.total ?? totalCount}</div>
          <div className="card-footer-info">
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#16a34a' }}>
              <span>● 100% đối tác</span>
              <span style={{ color: '#64748b' }}>đã xác thực trên hệ thống</span>
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
            {dashboard?.restaurants?.open ?? restaurants.filter((r) => r.status === 'OPEN').length}
            <small style={{ fontSize: '1.1rem', color: '#94a3b8' }}>
              {' '}/ {dashboard?.restaurants?.total ?? totalCount}
            </small>
          </div>
          <div className="card-footer-info">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span>Tỷ lệ hoạt động</span>
              <strong>
                {dashboard?.restaurants?.total
                  ? Math.round(((dashboard?.restaurants?.open || 0) / dashboard.restaurants.total) * 100)
                  : 100}
                %
              </strong>
            </div>
            <div style={{ width: '100%', height: 4, background: '#f1f5f9', borderRadius: 99 }}>
              <div
                style={{
                  width: `${dashboard?.restaurants?.total ? ((dashboard?.restaurants?.open || 0) / dashboard.restaurants.total) * 100 : 100}%`,
                  height: '100%',
                  background: '#059669',
                  borderRadius: 99,
                }}
              />
            </div>
          </div>
        </div>

        {/* Card 3 */}
        <div className="metric-card card-restaurants">
          <div className="card-top">
            <span className="card-top-title">TẠM ĐÓNG / NGHỈ BÁN</span>
            <div className="card-top-icon" style={{ background: '#fef08a', color: '#ca8a04' }}>
              <Clock size={19} />
            </div>
          </div>
          <div className="card-big-value">
            {dashboard?.restaurants?.closed ?? restaurants.filter((r) => r.status !== 'OPEN').length}
          </div>
          <div className="card-footer-info" style={{ display: 'flex', flexDirection: 'row', gap: 8 }}>
            <span style={{ color: '#d97706', fontWeight: 700 }}>Gian hàng tạm nghỉ</span>
            <span>• Theo lịch hẹn</span>
          </div>
        </div>

        {/* Card 4 */}
        <div className="metric-card card-users">
          <div className="card-top">
            <span className="card-top-title">DOANH SỐ CAO NHẤT</span>
            <div className="card-top-icon" style={{ background: '#fee2e2', color: '#dc2626' }}>
              <AlertOctagon size={19} />
            </div>
          </div>
          <div className="card-big-value" style={{ color: '#ea580c', fontSize: '1.4rem' }}>
            {Number(
              restaurants.reduce((max, r) => Math.max(max, Number(r.total_revenue || 0)), 0)
            ).toLocaleString('vi-VN')}
            đ
          </div>
          <div className="card-footer-info" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
              {restaurants.reduce((top, r) => (Number(r.total_revenue || 0) > Number(top?.total_revenue || 0) ? r : top), restaurants[0])?.name || '—'}
            </span>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. TIÊU BIỂU & GIÁM SÁT VẬN HÀNH GIAN HÀNG
         ───────────────────────────────────────────────────────────── */}
      {restaurants.length > 0 && (
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
                <Store size={18} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>Gian hàng Tiêu biểu &amp; Giám sát Đối tác</h3>
                  <span className="alert-badge" style={{ background: '#ecfdf5', color: '#059669' }}>
                    {dashboard?.restaurants?.total ?? restaurants.length} Gian hàng hoạt động
                  </span>
                </div>
                <p style={{ fontSize: '0.78rem', color: '#64748b' }}>
                  Giám sát doanh số, thời gian hoạt động và tình trạng mở cửa của các đối tác nhà hàng.
                </p>
              </div>
            </div>

            <div style={{ fontSize: '0.78rem', color: '#059669', background: '#ecfdf5', padding: '6px 12px', borderRadius: 9999, fontWeight: 600 }}>
              🛡️ Dữ liệu nhà hàng đồng bộ trực tiếp từ Database
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))', gap: 18 }}>
            {restaurants.slice(0, 2).map((res) => (
              <div
                key={res.id}
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
                        fontSize: '1.2rem',
                      }}
                    >
                      🍲
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <h4 style={{ fontSize: '0.98rem', fontWeight: 800 }}>{res.name}</h4>
                        <span
                          style={{
                            fontSize: '0.7rem',
                            color: res.status === 'OPEN' ? '#059669' : '#dc2626',
                            background: res.status === 'OPEN' ? '#ecfdf5' : '#fee2e2',
                            padding: '2px 6px',
                            borderRadius: 4,
                            fontWeight: 700,
                          }}
                        >
                          {res.status === 'OPEN' ? 'Đang mở cửa' : 'Tạm đóng cửa'}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 2 }}>
                        Mã quán: <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>#RES-{res.id}</span>
                      </div>
                    </div>
                  </div>
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                    {res.opening_time || '08:00'} - {res.closing_time || '22:00'}
                  </span>
                </div>

                <div style={{ fontSize: '0.78rem', color: '#475569', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <MapPin size={14} color="#ea580c" />
                  <span>{res.address}</span>
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
                    <span style={{ color: '#94a3b8' }}>Chủ gian hàng / SĐT:</span>
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>{res.owner?.full_name || 'Đối tác nhà hàng'}</div>
                    <div style={{ color: '#64748b' }}>{res.phone_number || res.owner?.phone_number || '—'}</div>
                  </div>
                  <div>
                    <span style={{ color: '#94a3b8' }}>Thống kê kinh doanh:</span>
                    <div style={{ fontWeight: 700, color: '#059669' }}>
                      {Number(res.total_revenue || 0).toLocaleString('vi-VN')}đ
                    </div>
                    <div style={{ color: '#64748b' }}>{res.total_orders || 0} đơn hàng thành công</div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
                  <button
                    className="btn btn-primary"
                    style={{ flex: 1, height: 36, fontSize: '0.8rem', background: '#9a3412' }}
                    onClick={() => {
                      setStatusModalRes(res);
                      setNewStatus(res.status);
                    }}
                  >
                    <span>Cập nhật trạng thái quán</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
              Tất cả ({dashboard?.restaurants?.total ?? totalCount})
            </button>
            <button
              className={`filter-chip ${statusTab === 'OPEN' ? 'active' : ''}`}
              onClick={() => { setStatusTab('OPEN'); setPage(1); }}
            >
              Mở cửa ({dashboard?.restaurants?.open ?? 0})
            </button>
            <button
              className={`filter-chip ${statusTab === 'CLOSED' ? 'active' : ''}`}
              onClick={() => { setStatusTab('CLOSED'); setPage(1); }}
            >
              Đóng cửa ({dashboard?.restaurants?.closed ?? 0})
            </button>
            <button
              className={`filter-chip ${statusTab === 'SUSPENDED' ? 'active' : ''}`}
              onClick={() => { setStatusTab('SUSPENDED'); setPage(1); }}
            >
              Đình chỉ ({restaurants.filter((r) => r.status === 'SUSPENDED').length})
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
                        {Number(res.total_revenue || 0).toLocaleString('vi-VN')}đ
                      </strong>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{res.total_orders || 0} đơn</div>
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
                          title="Sửa thông tin quán ăn"
                          onClick={() => handleOpenEditRes(res)}
                          style={{ color: '#2563eb', background: '#eff6ff' }}
                        >
                          <Pencil size={15} />
                        </button>

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
                          onClick={() => setDeleteTargetRes(res)}
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

      {/* Modal: Chỉnh sửa thông tin nhà hàng */}
      {editRes && (
        <div className="modal-overlay" onClick={() => setEditRes(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Pencil size={18} color="#2563eb" />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Chỉnh Sửa Thông Tin Gian Hàng</h3>
              </div>
              <button className="btn-icon" onClick={() => setEditRes(null)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveEditRes}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Tên nhà hàng / quán ăn *</label>
                  <input
                    type="text"
                    value={editResForm.name}
                    onChange={(e) => setEditResForm({ ...editResForm, name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Địa chỉ cụ thể *</label>
                  <input
                    type="text"
                    value={editResForm.address}
                    onChange={(e) => setEditResForm({ ...editResForm, address: e.target.value })}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div className="form-group">
                    <label>Số điện thoại</label>
                    <input
                      type="text"
                      value={editResForm.phone_number}
                      onChange={(e) => setEditResForm({ ...editResForm, phone_number: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>ID Chủ Quán (User ID)</label>
                    <input
                      type="number"
                      value={editResForm.owner_id}
                      onChange={(e) => setEditResForm({ ...editResForm, owner_id: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
                  <div className="form-group">
                    <label>Giờ mở cửa</label>
                    <input
                      type="text"
                      placeholder="08:00"
                      value={editResForm.opening_time}
                      onChange={(e) => setEditResForm({ ...editResForm, opening_time: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Giờ đóng cửa</label>
                    <input
                      type="text"
                      placeholder="22:00"
                      value={editResForm.closing_time}
                      onChange={(e) => setEditResForm({ ...editResForm, closing_time: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Trạng thái kinh doanh</label>
                    <select
                      className="select-styled"
                      value={editResForm.status}
                      onChange={(e) => setEditResForm({ ...editResForm, status: e.target.value as RestaurantStatus })}
                    >
                      <option value="OPEN">🟢 Mở cửa (OPEN)</option>
                      <option value="CLOSED">⚪ Đóng cửa (CLOSED)</option>
                      <option value="BUSY">🟡 Đang bận (BUSY)</option>
                      <option value="SUSPENDED">🔴 Đình chỉ (SUSPENDED)</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Mô tả quán ăn</label>
                  <textarea
                    rows={2}
                    className="input-styled"
                    style={{ width: '100%', resize: 'vertical' }}
                    value={editResForm.description}
                    onChange={(e) => setEditResForm({ ...editResForm, description: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setEditRes(null)}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary" disabled={updatingRes}>
                  {updatingRes ? 'Đang lưu...' : 'Lưu Thay Đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL: XÁC NHẬN XÓA NHÀ HÀNG
         ───────────────────────────────────────────────────────────── */}
      {deleteTargetRes && (
        <div className="modal-overlay" onClick={() => !deletingRes && setDeleteTargetRes(null)}>
          <div className="modal-card" style={{ maxWidth: 460 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Trash2 size={18} color="#dc2626" />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#dc2626', margin: 0 }}>Xác Nhận Xóa Nhà Hàng</h3>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Hành động này sẽ đóng cửa và ẩn nhà hàng khỏi sàn</div>
                </div>
              </div>
              <button className="btn-icon" onClick={() => !deletingRes && setDeleteTargetRes(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body" style={{ padding: '20px 24px' }}>
              <p style={{ fontSize: '0.9rem', color: '#334155', lineHeight: 1.6, margin: 0 }}>
                Bạn có chắc chắn muốn xóa đối tác nhà hàng sau:
              </p>
              <div style={{ margin: '12px 0', padding: '12px 14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <strong style={{ fontSize: '0.95rem', color: '#0f172a' }}>{deleteTargetRes.name}</strong>
                <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                  Địa chỉ: <span style={{ color: '#0f172a' }}>{deleteTargetRes.address}</span>
                </div>
                <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                  Chủ quán: <span style={{ color: '#0f172a' }}>{deleteTargetRes.owner?.full_name || `Mã #${deleteTargetRes.owner_id}`}</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#ea580c', fontWeight: 600, marginTop: 2 }}>
                  Mã định danh: #RES-{deleteTargetRes.id} • Doanh số: {Number(deleteTargetRes.total_revenue || 0).toLocaleString('vi-VN')}đ
                </div>
              </div>
              <div style={{ padding: '10px 14px', background: '#fef2f2', borderRadius: 8, border: '1px solid #fecaca', fontSize: '0.8rem', color: '#991b1b', display: 'flex', gap: 8, alignItems: 'center' }}>
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>Hệ thống sẽ tự động hủy các đơn hàng chưa hoàn tất và ngừng hoạt động nhà hàng.</span>
              </div>
            </div>
            <div className="modal-footer" style={{ padding: '16px 24px', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setDeleteTargetRes(null)}
                disabled={deletingRes}
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
                  cursor: deletingRes ? 'not-allowed' : 'pointer',
                  opacity: deletingRes ? 0.7 : 1,
                }}
                onClick={confirmDeleteRestaurant}
                disabled={deletingRes}
              >
                <Trash2 size={15} />
                <span>{deletingRes ? 'Đang xóa...' : 'Đồng Ý Xóa'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
