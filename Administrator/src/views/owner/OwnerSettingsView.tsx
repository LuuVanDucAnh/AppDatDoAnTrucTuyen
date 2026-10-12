import React, { useEffect, useState } from 'react';
import {
  Store,
  MapPin,
  Phone,
  Clock,
  Edit3,
  PlusCircle,
  CheckCircle2,
  PauseCircle,
  Star,
  User,
  Mail,
  LogOut,
  ChevronRight,
  Upload,
  ArrowLeft,
  X,
  Building2,
} from 'lucide-react';
import type { AdminRestaurant, AdminUser, OwnerReview } from '../../services/types';
import { ownerApi, uploadApi } from '../../services/api';
import { resolveImageUrl, DEFAULT_RESTAURANT_IMAGE } from '../../services/utils';
import './owner-mobile-ui.css';
import './owner-web.css';

interface OwnerSettingsViewProps {
  restaurant: AdminRestaurant | null;
  restaurants: AdminRestaurant[];
  currentUser: AdminUser | null;
  onSelectRestaurant: (res: AdminRestaurant) => void;
  onRestaurantUpdated: (updated: AdminRestaurant) => void;
  onRestaurantCreated: (newRes: AdminRestaurant) => void;
  onViewAllReviews: () => void;
  onLogout: () => void;
  onSwitchToAdminPortal?: () => void;
}

export function OwnerSettingsView({
  restaurant,
  restaurants,
  currentUser,
  onSelectRestaurant,
  onRestaurantUpdated,
  onRestaurantCreated,
  onViewAllReviews,
  onLogout,
  onSwitchToAdminPortal,
}: OwnerSettingsViewProps) {
  // Reviews preview
  const [reviews, setReviews] = useState<OwnerReview[] | null>(null);
  const [loadingReviews, setLoadingReviews] = useState(false);

  // Status toggling
  const [togglingStatus, setTogglingStatus] = useState(false);

  // Modals
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Edit form state
  const [editName, setEditName] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editOpeningTime, setEditOpeningTime] = useState('07:00');
  const [editClosingTime, setEditClosingTime] = useState('22:00');
  const [editDescription, setEditDescription] = useState('');
  const [editImage, setEditImage] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [uploadingEditImage, setUploadingEditImage] = useState(false);

  // Create form state
  const [createName, setCreateName] = useState('');
  const [createAddress, setCreateAddress] = useState('');
  const [createPhone, setCreatePhone] = useState(currentUser?.phone_number || '');
  const [createOpeningTime, setCreateOpeningTime] = useState('07:00');
  const [createClosingTime, setCreateClosingTime] = useState('22:00');
  const [createDescription, setCreateDescription] = useState('');
  const [createImage, setCreateImage] = useState('');
  const [submittingCreate, setSubmittingCreate] = useState(false);
  const [uploadingCreateImage, setUploadingCreateImage] = useState(false);

  // Load reviews preview on restaurant change
  useEffect(() => {
    if (!restaurant) return;
    setLoadingReviews(true);
    ownerApi
      .getReviews(restaurant.id, { limit: 3 })
      .then((res) => {
        const list = Array.isArray(res) ? res : (Array.isArray((res as any)?.data) ? (res as any).data : []);
        setReviews(list);
      })
      .catch(() => setReviews([]))
      .finally(() => setLoadingReviews(false));
  }, [restaurant?.id]);

  // Open edit modal with current restaurant data
  const handleOpenEdit = () => {
    if (!restaurant) return;
    setEditName(restaurant.name || '');
    setEditAddress(restaurant.address || '');
    setEditPhone(restaurant.phone_number || '');
    setEditOpeningTime(restaurant.opening_time ? restaurant.opening_time.slice(0, 5) : '07:00');
    setEditClosingTime(restaurant.closing_time ? restaurant.closing_time.slice(0, 5) : '22:00');
    setEditDescription(restaurant.description || '');
    setEditImage(restaurant.image || '');
    setShowEditModal(true);
  };

  // Save edited restaurant
  const handleSaveEdit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!restaurant) return;
    if (!editName.trim()) {
      alert('Vui lòng nhập tên nhà hàng.');
      return;
    }
    if (!editAddress.trim()) {
      alert('Vui lòng nhập địa chỉ quán.');
      return;
    }
    if (!editPhone.trim()) {
      alert('Vui lòng nhập số điện thoại liên hệ.');
      return;
    }

    setSavingEdit(true);
    try {
      const updated = await ownerApi.updateRestaurantInfo(restaurant.id, {
        name: editName.trim(),
        address: editAddress.trim(),
        phone_number: editPhone.trim(),
        opening_time: editOpeningTime.trim() || undefined,
        closing_time: editClosingTime.trim() || undefined,
        description: editDescription.trim() || undefined,
        image: editImage.trim() || undefined,
      });

      onRestaurantUpdated(updated);
      setShowEditModal(false);
      alert('Thông tin nhà hàng đã được cập nhật thành công!');
    } catch (err: any) {
      alert(`Không thể lưu: ${err?.message || 'Lỗi cập nhật quán'}`);
    } finally {
      setSavingEdit(false);
    }
  };

  // Submit new restaurant
  const handleCreateRestaurant = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!createName.trim()) {
      alert('Vui lòng nhập tên nhà hàng / quán ăn.');
      return;
    }
    if (!createAddress.trim()) {
      alert('Vui lòng nhập địa chỉ kinh doanh của quán.');
      return;
    }
    if (!createPhone.trim()) {
      alert('Vui lòng nhập số điện thoại hotline.');
      return;
    }

    setSubmittingCreate(true);
    try {
      const created = await ownerApi.createRestaurant({
        name: createName.trim(),
        address: createAddress.trim(),
        phone_number: createPhone.trim(),
        opening_time: createOpeningTime.trim() || '07:00',
        closing_time: createClosingTime.trim() || '22:00',
        description: createDescription.trim() || undefined,
        image: createImage.trim() || undefined,
      });

      onRestaurantCreated(created);
      setShowCreateModal(false);
      setCreateName('');
      setCreateAddress('');
      setCreatePhone(currentUser?.phone_number || '');
      setCreateDescription('');
      setCreateImage('');
      alert(`Đăng ký thành công! Quán "${created.name}" đã sẵn sàng.`);
    } catch (err: any) {
      alert(`Không thể tạo quán: ${err?.message || 'Lỗi tạo nhà hàng'}`);
    } finally {
      setSubmittingCreate(false);
    }
  };

  // Toggle restaurant open/closed
  const handleToggleOpen = async () => {
    if (!restaurant || togglingStatus) return;
    const nextStatus = restaurant.status === 'OPEN' ? 'CLOSED' : 'OPEN';
    setTogglingStatus(true);
    try {
      const updated = await ownerApi.setRestaurantStatus(restaurant.id, nextStatus);
      onRestaurantUpdated(updated);
    } catch (err: any) {
      alert(`Không thể đổi trạng thái quán: ${err?.message || 'Lỗi'}`);
    } finally {
      setTogglingStatus(false);
    }
  };

  const isOpen = restaurant?.status === 'OPEN';

  if (!restaurant) {
    return (
      <div className="owner-web-view">
        <div className="owner-web-panel" style={{ textAlign: 'center', padding: '50px 20px' }}>
          <Store size={44} color="#94A3B8" style={{ margin: '0 auto 12px auto' }} />
          <h3>Chưa có nhà hàng nào</h3>
          <p style={{ color: '#64748B' }}>Đăng ký mở quán mới để bắt đầu kinh doanh trên sàn.</p>
          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              margin: '16px auto 0 auto',
              padding: '10px 20px',
              borderRadius: 10,
              backgroundColor: '#EA580C',
              color: '#FFFFFF',
              fontWeight: 800,
              border: 'none',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <PlusCircle size={16} />
            <span>Mở quán mới ngay</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="owner-web-view">
      {/* Bố cục 2 cột màn hình máy tính: Cột trái (Thông tin & Trạng thái) | Cột phải (Chi nhánh & Đánh giá & Tài khoản) */}
      <div className="owner-web-settings-layout">
        {/* CỘT TRÁI */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* 1. THÔNG TIN QUÁN */}
          <div className="owner-web-panel">
            <div className="owner-web-panel-header">
              <div>
                <div className="owner-web-panel-title">Thông tin quán ăn</div>
                <div className="owner-web-panel-sub">Địa chỉ & giờ phục vụ hiển thị cho khách hàng</div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={handleOpenEdit}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 14px',
                    borderRadius: 8,
                    backgroundColor: '#FFF7ED',
                    border: '1px solid #FED7AA',
                    color: '#EA580C',
                    fontSize: '0.84rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  <Edit3 size={15} />
                  <span>Sửa thông tin</span>
                </button>
                <button
                  onClick={() => setShowCreateModal(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 14px',
                    borderRadius: 8,
                    backgroundColor: '#EFF6FF',
                    border: '1px solid #BFDBFE',
                    color: '#2563EB',
                    fontSize: '0.84rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  <PlusCircle size={15} />
                  <span>+ Mở quán mới</span>
                </button>
              </div>
            </div>

            {/* Ảnh bìa & Logo thương hiệu của quán */}
            <div style={{ position: 'relative', marginBottom: 24 }}>
              <div
                style={{
                  width: '100%',
                  height: 140,
                  borderRadius: 12,
                  overflow: 'hidden',
                  backgroundColor: '#F1F5F9',
                  border: '1px solid #E2E8F0',
                }}
              >
                <img
                  src={resolveImageUrl(restaurant.image, DEFAULT_RESTAURANT_IMAGE)}
                  alt={restaurant.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>

              {/* Logo / Avatar nổi góc trái */}
              <div
                style={{
                  position: 'absolute',
                  bottom: -18,
                  left: 18,
                  width: 54,
                  height: 54,
                  borderRadius: 14,
                  overflow: 'hidden',
                  backgroundColor: '#FFFFFF',
                  border: '3px solid #FFFFFF',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {restaurant.image ? (
                  <img
                    src={resolveImageUrl(restaurant.image, DEFAULT_RESTAURANT_IMAGE)}
                    alt={restaurant.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <span style={{ fontWeight: 900, color: '#EA580C', fontSize: '1.15rem' }}>
                    {(restaurant.name || 'QA').slice(0, 2).toUpperCase()}
                  </span>
                )}
              </div>
            </div>

            {/* Các hàng thông tin */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <Store size={18} color="#94A3B8" style={{ flexShrink: 0, marginTop: 2 }} />
                <span style={{ fontSize: '0.86rem', color: '#64748B', width: 110 }}>Tên nhà hàng:</span>
                <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0F172A', flex: 1 }}>
                  {restaurant.name}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <MapPin size={18} color="#94A3B8" style={{ flexShrink: 0, marginTop: 2 }} />
                <span style={{ fontSize: '0.86rem', color: '#64748B', width: 110 }}>Địa chỉ quán:</span>
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155', flex: 1 }}>
                  {restaurant.address}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <Phone size={18} color="#94A3B8" style={{ flexShrink: 0, marginTop: 2 }} />
                <span style={{ fontSize: '0.86rem', color: '#64748B', width: 110 }}>Hotline liên hệ:</span>
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#C2410C', flex: 1 }}>
                  {restaurant.phone_number || '—'}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <Clock size={18} color="#94A3B8" style={{ flexShrink: 0, marginTop: 2 }} />
                <span style={{ fontSize: '0.86rem', color: '#64748B', width: 110 }}>Giờ mở cửa:</span>
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#1E293B', flex: 1 }}>
                  {restaurant.opening_time?.slice(0, 5) ?? '07:00'} -{' '}
                  {restaurant.closing_time?.slice(0, 5) ?? '22:00'} hàng ngày
                </span>
              </div>

              {restaurant.description && (
                <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: 10, fontSize: '0.85rem', color: '#64748B', lineHeight: 1.5 }}>
                  "{restaurant.description}"
                </div>
              )}
            </div>
          </div>

          {/* 2. TRẠNG THÁI NHẬN ĐƠN */}
          <div className="owner-web-panel">
            <div className="owner-web-panel-title">Trạng thái nhận đơn của quán</div>

            <button
              onClick={handleToggleOpen}
              disabled={togglingStatus}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                padding: '16px 20px',
                borderRadius: 14,
                backgroundColor: isOpen ? '#F0FDF4' : '#FEF2F2',
                border: isOpen ? '2px solid #BBF7D0' : '2px solid #FECACA',
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%',
                transition: 'all 0.2s',
              }}
            >
              {isOpen ? (
                <CheckCircle2 size={28} color="#15803D" style={{ flexShrink: 0 }} />
              ) : (
                <PauseCircle size={28} color="#B91C1C" style={{ flexShrink: 0 }} />
              )}

              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.98rem', fontWeight: 800, color: isOpen ? '#15803D' : '#B91C1C' }}>
                  {isOpen ? 'Đang mở cửa — Nhận đơn bình thường' : 'Đang đóng cửa — Không nhận đơn mới'}
                </div>
                <div style={{ fontSize: '0.82rem', color: '#64748B', marginTop: 3 }}>
                  {isOpen
                    ? 'Bấm vào đây để tạm đóng cửa, quán sẽ bị ẩn khỏi danh sách tìm kiếm của khách hàng.'
                    : 'Bấm vào đây để mở cửa trở lại và tiếp tục nhận đơn đặt món.'}
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* CỘT PHẢI */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* 3. QUÁN BẠN SỞ HỮU (NẾU CÓ NHIỀU QUÁN) */}
          {restaurants.length > 1 && (
            <div className="owner-web-panel">
              <div className="owner-web-panel-title">
                Quán bạn sở hữu ({restaurants.length} chi nhánh)
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {restaurants.map((r) => {
                  const active = r.id === restaurant.id;
                  const rOpen = r.status === 'OPEN';
                  return (
                    <div
                      key={r.id}
                      onClick={() => onSelectRestaurant(r)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '12px 14px',
                        borderRadius: 10,
                        backgroundColor: active ? '#FFF7ED' : '#F8FAFC',
                        border: active ? '1.5px solid #FED7AA' : '1px solid #E2E8F0',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                    >
                      <div
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: 9,
                          border: active ? '5px solid #EA580C' : '2px solid #94A3B8',
                          backgroundColor: '#FFFFFF',
                          flexShrink: 0,
                        }}
                      />

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#1E293B' }}>
                          {r.name}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#94A3B8', marginTop: 2 }}>
                          {r.address}
                        </div>
                      </div>

                      <span
                        style={{
                          padding: '3px 8px',
                          borderRadius: 6,
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          backgroundColor: rOpen ? '#DCFCE7' : '#F1F5F9',
                          color: rOpen ? '#15803D' : '#64748B',
                        }}
                      >
                        {rOpen ? 'Mở cửa' : 'Đóng cửa'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 4. ĐÁNH GIÁ CỦA KHÁCH PREVIEW */}
          <div className="owner-web-panel">
            <div className="owner-web-panel-header">
              <div className="owner-web-panel-title">Đánh giá của khách hàng</div>
              <button
                onClick={onViewAllReviews}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#EA580C',
                  fontWeight: 700,
                  fontSize: '0.84rem',
                  cursor: 'pointer',
                }}
              >
                Xem tất cả ›
              </button>
            </div>

            {loadingReviews ? (
              <div style={{ color: '#EA580C', fontSize: '0.85rem' }}>Đang tải đánh giá...</div>
            ) : !reviews || reviews.length === 0 ? (
              <div style={{ fontSize: '0.85rem', color: '#94A3B8' }}>
                Quán chưa có đánh giá nào từ khách hàng.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {reviews.map((rv) => (
                  <div
                    key={rv.id}
                    style={{
                      borderTop: '1px solid #F1F5F9',
                      paddingTop: 10,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          size={13}
                          fill={s <= rv.rating ? '#F59E0B' : '#E2E8F0'}
                          color={s <= rv.rating ? '#F59E0B' : '#CBD5E1'}
                        />
                      ))}
                      {rv.order_id && (
                        <span style={{ fontSize: '0.76rem', color: '#94A3B8', marginLeft: 6 }}>
                          · Đơn #{rv.order_id}
                        </span>
                      )}
                    </div>
                    {rv.comment && (
                      <div style={{ fontSize: '0.85rem', color: '#475569', lineHeight: 1.4 }}>
                        "{rv.comment}"
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 5. TÀI KHOẢN CHỦ QUÁN */}
          <div className="owner-web-panel">
            <div className="owner-web-panel-title">Tài khoản chủ quán</div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <User size={18} color="#94A3B8" />
                <span style={{ fontSize: '0.86rem', color: '#64748B', width: 90 }}>Chủ quán:</span>
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0F172A' }}>
                  {currentUser?.full_name || 'Đối tác quán ăn'}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Mail size={18} color="#94A3B8" />
                <span style={{ fontSize: '0.86rem', color: '#64748B', width: 90 }}>Email:</span>
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>
                  {currentUser?.email || '—'}
                </span>
              </div>

              {currentUser?.role === 'ADMIN' && onSwitchToAdminPortal && (
                <button
                  onClick={onSwitchToAdminPortal}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: 10,
                    backgroundColor: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    color: '#334155',
                    fontSize: '0.86rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    marginTop: 6,
                  }}
                >
                  <span>Chuyển sang Cổng Quản Trị Sàn (Super Admin)</span>
                  <ChevronRight size={16} />
                </button>
              )}

              <button
                onClick={() => {
                  if (confirm('Bạn chắc chắn muốn đăng xuất tài khoản?')) {
                    onLogout();
                  }
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  backgroundColor: '#FEE2E2',
                  border: '1px solid #FECACA',
                  borderRadius: 10,
                  padding: '12px',
                  color: '#DC2626',
                  fontSize: '0.9rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  marginTop: 8,
                }}
              >
                <LogOut size={16} />
                <span>Đăng xuất tài khoản</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          MODAL SỬA THÔNG TIN QUÁN
          ═══════════════════════════════════════════════════════════════════════ */}
      {showEditModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            zIndex: 999,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
          }}
          onClick={() => setShowEditModal(false)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 540,
              backgroundColor: '#FFFFFF',
              borderRadius: 16,
              overflow: 'hidden',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 20px',
                borderBottom: '1px solid #E2E8F0',
              }}
            >
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A' }}>
                Sửa Thông Tin Quán Ăn
              </h3>
              <button
                onClick={() => setShowEditModal(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94A3B8' }}
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={handleSaveEdit}
              style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155' }}>
                  Tên nhà hàng <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                  style={{
                    height: 42,
                    border: '1px solid #CBD5E1',
                    borderRadius: 8,
                    padding: '0 12px',
                    fontSize: '0.9rem',
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155' }}>
                  Địa chỉ kinh doanh <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <input
                  type="text"
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  required
                  style={{
                    height: 42,
                    border: '1px solid #CBD5E1',
                    borderRadius: 8,
                    padding: '0 12px',
                    fontSize: '0.9rem',
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155' }}>
                  Số điện thoại liên hệ <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  required
                  style={{
                    height: 42,
                    border: '1px solid #CBD5E1',
                    borderRadius: 8,
                    padding: '0 12px',
                    fontSize: '0.9rem',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155' }}>
                    Giờ mở cửa
                  </label>
                  <input
                    type="text"
                    value={editOpeningTime}
                    onChange={(e) => setEditOpeningTime(e.target.value)}
                    style={{
                      height: 42,
                      border: '1px solid #CBD5E1',
                      borderRadius: 8,
                      padding: '0 12px',
                      fontSize: '0.9rem',
                    }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155' }}>
                    Giờ đóng cửa
                  </label>
                  <input
                    type="text"
                    value={editClosingTime}
                    onChange={(e) => setEditClosingTime(e.target.value)}
                    style={{
                      height: 42,
                      border: '1px solid #CBD5E1',
                      borderRadius: 8,
                      padding: '0 12px',
                      fontSize: '0.9rem',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155' }}>
                  Logo / Ảnh đại diện quán ăn (URL hoặc Tải ảnh từ máy)
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="text"
                    value={editImage}
                    onChange={(e) => setEditImage(e.target.value)}
                    placeholder="https://... hoặc tải ảnh trực tiếp"
                    style={{
                      flex: 1,
                      height: 40,
                      border: '1px solid #CBD5E1',
                      borderRadius: 8,
                      padding: '0 10px',
                      fontSize: '0.85rem',
                    }}
                  />
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '0 12px',
                      background: '#FFF7ED',
                      border: '1px solid #FED7AA',
                      borderRadius: 8,
                      color: '#EA580C',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    <Upload size={14} />
                    <span>{uploadingEditImage ? '...' : 'Tải ảnh'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        try {
                          setUploadingEditImage(true);
                          const url = await uploadApi.uploadRestaurant(file);
                          setEditImage(url);
                        } catch (err: any) {
                          alert(`Lỗi upload: ${err?.message || 'Lỗi'}`);
                        } finally {
                          setUploadingEditImage(false);
                        }
                      }}
                    />
                  </label>
                </div>
                {editImage && (
                  <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 8,
                        overflow: 'hidden',
                        border: '1px solid #CBD5E1',
                        flexShrink: 0,
                      }}
                    >
                      <img
                        src={resolveImageUrl(editImage, DEFAULT_RESTAURANT_IMAGE)}
                        alt="Xem trước Logo"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>
                    <span style={{ fontSize: '0.78rem', color: '#64748B' }}>
                      Xem trước Logo / Ảnh đại diện quán ăn
                    </span>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155' }}>
                  Mô tả quán
                </label>
                <textarea
                  rows={2}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  style={{
                    border: '1px solid #CBD5E1',
                    borderRadius: 8,
                    padding: '8px 12px',
                    fontSize: '0.88rem',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  style={{
                    padding: '9px 16px',
                    borderRadius: 8,
                    backgroundColor: '#F1F5F9',
                    border: '1px solid #CBD5E1',
                    color: '#475569',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  style={{
                    padding: '9px 20px',
                    borderRadius: 8,
                    backgroundColor: '#EA580C',
                    border: 'none',
                    color: '#FFFFFF',
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  {savingEdit ? 'Đang lưu...' : 'Lưu Thay Đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          MODAL ĐĂNG KÝ MỞ QUÁN MỚI
          ═══════════════════════════════════════════════════════════════════════ */}
      {showCreateModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            zIndex: 999,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
          }}
          onClick={() => setShowCreateModal(false)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 540,
              backgroundColor: '#FFFFFF',
              borderRadius: 16,
              overflow: 'hidden',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 20px',
                borderBottom: '1px solid #E2E8F0',
              }}
            >
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A' }}>
                Đăng Ký Mở Quán Ăn Mới
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94A3B8' }}
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={handleCreateRestaurant}
              style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155' }}>
                  Tên quán ăn / Thương hiệu <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="VD: Cơm Tấm Ba Ghiền - Chi Nhánh 2"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  required
                  style={{
                    height: 42,
                    border: '1px solid #CBD5E1',
                    borderRadius: 8,
                    padding: '0 12px',
                    fontSize: '0.9rem',
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155' }}>
                  Địa chỉ kinh doanh <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="Số nhà, tên đường, phường, quận..."
                  value={createAddress}
                  onChange={(e) => setCreateAddress(e.target.value)}
                  required
                  style={{
                    height: 42,
                    border: '1px solid #CBD5E1',
                    borderRadius: 8,
                    padding: '0 12px',
                    fontSize: '0.9rem',
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155' }}>
                  Số điện thoại liên hệ <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="VD: 0901234567"
                  value={createPhone}
                  onChange={(e) => setCreatePhone(e.target.value)}
                  required
                  style={{
                    height: 42,
                    border: '1px solid #CBD5E1',
                    borderRadius: 8,
                    padding: '0 12px',
                    fontSize: '0.9rem',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155' }}>
                    Giờ mở cửa
                  </label>
                  <input
                    type="text"
                    placeholder="07:00"
                    value={createOpeningTime}
                    onChange={(e) => setCreateOpeningTime(e.target.value)}
                    style={{
                      height: 42,
                      border: '1px solid #CBD5E1',
                      borderRadius: 8,
                      padding: '0 12px',
                      fontSize: '0.9rem',
                    }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155' }}>
                    Giờ đóng cửa
                  </label>
                  <input
                    type="text"
                    placeholder="22:00"
                    value={createClosingTime}
                    onChange={(e) => setCreateClosingTime(e.target.value)}
                    style={{
                      height: 42,
                      border: '1px solid #CBD5E1',
                      borderRadius: 8,
                      padding: '0 12px',
                      fontSize: '0.9rem',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155' }}>
                  Logo / Ảnh đại diện quán ăn (URL hoặc Tải ảnh từ máy)
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="text"
                    placeholder="https://... hoặc tải ảnh trực tiếp"
                    value={createImage}
                    onChange={(e) => setCreateImage(e.target.value)}
                    style={{
                      flex: 1,
                      height: 40,
                      border: '1px solid #CBD5E1',
                      borderRadius: 8,
                      padding: '0 10px',
                      fontSize: '0.85rem',
                    }}
                  />
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '0 12px',
                      background: '#FFF7ED',
                      border: '1px solid #FED7AA',
                      borderRadius: 8,
                      color: '#EA580C',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    <Upload size={14} />
                    <span>{uploadingCreateImage ? '...' : 'Tải ảnh'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        try {
                          setUploadingCreateImage(true);
                          const url = await uploadApi.uploadRestaurant(file);
                          setCreateImage(url);
                        } catch (err: any) {
                          alert(`Lỗi upload: ${err?.message || 'Lỗi'}`);
                        } finally {
                          setUploadingCreateImage(false);
                        }
                      }}
                    />
                  </label>
                </div>
                {createImage && (
                  <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 8,
                        overflow: 'hidden',
                        border: '1px solid #CBD5E1',
                        flexShrink: 0,
                      }}
                    >
                      <img
                        src={resolveImageUrl(createImage, DEFAULT_RESTAURANT_IMAGE)}
                        alt="Xem trước Logo"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>
                    <span style={{ fontSize: '0.78rem', color: '#64748B' }}>
                      Xem trước Logo quán ăn
                    </span>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{
                    padding: '9px 16px',
                    borderRadius: 8,
                    backgroundColor: '#F1F5F9',
                    border: '1px solid #CBD5E1',
                    color: '#475569',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submittingCreate}
                  style={{
                    padding: '9px 20px',
                    borderRadius: 8,
                    backgroundColor: '#EA580C',
                    border: 'none',
                    color: '#FFFFFF',
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  {submittingCreate ? 'Đang gửi...' : 'Xác Nhận Mở Quán'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
