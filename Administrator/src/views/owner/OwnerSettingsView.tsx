import React, { useEffect, useState } from 'react';
import {
  Store,
  MapPin,
  Phone,
  Clock,
  FileText,
  Upload,
  CheckCircle2,
  AlertCircle,
  Save,
  Plus,
  LogOut,
  Building2,
  ShieldCheck,
  User,
  Power,
  X,
} from 'lucide-react';
import type { AdminRestaurant, AdminUser, RestaurantStatus } from '../../services/types';
import { ownerApi, uploadApi } from '../../services/api';
import {
  resolveImageUrl,
  DEFAULT_RESTAURANT_IMAGE,
} from '../../services/utils';

interface OwnerSettingsViewProps {
  restaurant: AdminRestaurant | null;
  currentUser: AdminUser | null;
  onRestaurantUpdated: (updated: AdminRestaurant) => void;
  onRestaurantCreated: (newRes: AdminRestaurant) => void;
  onLogout: () => void;
}

export function OwnerSettingsView({
  restaurant,
  currentUser,
  onRestaurantUpdated,
  onRestaurantCreated,
  onLogout,
}: OwnerSettingsViewProps) {
  // Form State
  const [form, setForm] = useState({
    name: '',
    phone_number: '',
    address: '',
    opening_time: '08:00',
    closing_time: '22:00',
    description: '',
    image: '',
    status: 'OPEN' as RestaurantStatus,
  });

  const [uploadingImage, setUploadingImage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modal Tạo quán mới
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newStoreForm, setNewStoreForm] = useState({
    name: '',
    phone_number: '',
    address: '',
    opening_time: '08:00',
    closing_time: '22:00',
    description: '',
    image: '',
  });
  const [creatingStore, setCreatingStore] = useState(false);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    if (restaurant) {
      setForm({
        name: restaurant.name || '',
        phone_number: restaurant.phone_number || '',
        address: restaurant.address || '',
        opening_time: restaurant.opening_time || '08:00',
        closing_time: restaurant.closing_time || '22:00',
        description: restaurant.description || '',
        image: restaurant.image || '',
        status: restaurant.status || 'OPEN',
      });
    }
  }, [restaurant]);

  // Upload ảnh nhà hàng
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingImage(true);
      const url = await uploadApi.uploadRestaurant(file);
      setForm((prev) => ({ ...prev, image: url }));
      showToast('success', 'Đã tải ảnh nhà hàng lên thành công!');
    } catch (err: any) {
      showToast('error', `Không thể tải ảnh: ${err?.message || 'Lỗi upload'}`);
    } finally {
      setUploadingImage(false);
    }
  };

  // Lưu thông tin nhà hàng
  const handleSaveInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurant) return;
    if (!form.name.trim() || !form.address.trim()) {
      alert('Vui lòng nhập đầy đủ Tên quán và Địa chỉ quán.');
      return;
    }

    try {
      setSaving(true);
      // Cập nhật thông tin
      const updated = await ownerApi.updateRestaurantInfo(restaurant.id, {
        name: form.name.trim(),
        phone_number: form.phone_number.trim(),
        address: form.address.trim(),
        opening_time: form.opening_time,
        closing_time: form.closing_time,
        description: form.description.trim(),
        image: form.image.trim(),
      });

      // Nếu trạng thái đổi, gọi API cập nhật trạng thái
      if (form.status !== restaurant.status) {
        await ownerApi.setRestaurantStatus(restaurant.id, form.status);
        updated.status = form.status;
      }

      onRestaurantUpdated(updated);
      showToast('success', 'Đã lưu thông tin nhà hàng thành công!');
    } catch (err: any) {
      showToast('error', `Lỗi lưu thông tin: ${err?.message || 'Lỗi thao tác'}`);
    } finally {
      setSaving(false);
    }
  };

  // Tạo quán ăn mới
  const handleCreateStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStoreForm.name.trim() || !newStoreForm.address.trim()) {
      alert('Vui lòng nhập Tên quán và Địa chỉ quán mới.');
      return;
    }

    try {
      setCreatingStore(true);
      const created = await ownerApi.createRestaurant(newStoreForm);
      onRestaurantCreated(created);
      setShowCreateModal(false);
      showToast('success', `Đã tạo quán ăn mới "${created.name}" thành công!`);
    } catch (err: any) {
      alert(`Không thể tạo quán ăn: ${err?.message || 'Lỗi'}`);
    } finally {
      setCreatingStore(false);
    }
  };

  return (
    <div className="view-container" style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 960 }}>
      {/* Toast Notification */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            top: 24,
            right: 24,
            background: toast.type === 'success' ? '#059669' : '#dc2626',
            color: '#fff',
            padding: '12px 20px',
            borderRadius: 10,
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontWeight: 600,
            fontSize: '0.9rem',
          }}
        >
          {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Main Settings Form Panel */}
      <div className="panel" style={{ padding: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 20, borderBottom: '1px solid #e2e8f0', marginBottom: 24 }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
              Hồ Sơ & Cài Đặt Quán Ăn
            </h2>
            <p style={{ fontSize: '0.84rem', color: '#64748b', marginTop: 2 }}>
              Thông tin hiển thị cho khách hàng trên ứng dụng đặt đồ ăn
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem' }}
          >
            <Plus size={15} />
            <span>Mở thêm quán ăn mới</span>
          </button>
        </div>

        {restaurant ? (
          <form onSubmit={handleSaveInfo} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Trạng thái tiếp nhận đơn */}
            <div style={{ background: '#f8fafc', padding: '16px 20px', borderRadius: 12, border: '1px solid #e2e8f0' }}>
              <label style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a', marginBottom: 10, display: 'block' }}>
                Trạng thái nhận đơn của quán
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '12px 14px',
                    borderRadius: 10,
                    border: form.status === 'OPEN' ? '2px solid #10b981' : '1px solid #e2e8f0',
                    background: form.status === 'OPEN' ? '#ecfdf5' : '#ffffff',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="radio"
                    name="storeStatus"
                    checked={form.status === 'OPEN'}
                    onChange={() => setForm({ ...form, status: 'OPEN' })}
                  />
                  <div>
                    <div style={{ fontWeight: 700, color: '#065f46', fontSize: '0.88rem' }}>
                      🟢 Đang mở cửa
                    </div>
                    <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                      Nhận đơn bình thường
                    </div>
                  </div>
                </label>

                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '12px 14px',
                    borderRadius: 10,
                    border: form.status === 'BUSY' ? '2px solid #f59e0b' : '1px solid #e2e8f0',
                    background: form.status === 'BUSY' ? '#fffbeb' : '#ffffff',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="radio"
                    name="storeStatus"
                    checked={form.status === 'BUSY'}
                    onChange={() => setForm({ ...form, status: 'BUSY' })}
                  />
                  <div>
                    <div style={{ fontWeight: 700, color: '#92400e', fontSize: '0.88rem' }}>
                      🟡 Đang quá tải
                    </div>
                    <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                      Báo quán bận
                    </div>
                  </div>
                </label>

                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '12px 14px',
                    borderRadius: 10,
                    border: form.status === 'CLOSED' ? '2px solid #ef4444' : '1px solid #e2e8f0',
                    background: form.status === 'CLOSED' ? '#fef2f2' : '#ffffff',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="radio"
                    name="storeStatus"
                    checked={form.status === 'CLOSED'}
                    onChange={() => setForm({ ...form, status: 'CLOSED' })}
                  />
                  <div>
                    <div style={{ fontWeight: 700, color: '#991b1b', fontSize: '0.88rem' }}>
                      🔴 Tạm đóng cửa
                    </div>
                    <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                      Ngừng nhận đơn mới
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Tên quán & Hotline */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label>Tên nhà hàng / quán ăn (*)</label>
                <div style={{ position: 'relative' }}>
                  <Store size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    style={{ paddingLeft: 38 }}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Số điện thoại liên hệ (*)</label>
                <div style={{ position: 'relative' }}>
                  <Phone size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input
                    type="text"
                    value={form.phone_number}
                    onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
                    style={{ paddingLeft: 38 }}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Địa chỉ quán */}
            <div className="form-group">
              <label>Địa chỉ cửa hàng (*)</label>
              <div style={{ position: 'relative' }}>
                <MapPin size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  style={{ paddingLeft: 38 }}
                  required
                />
              </div>
            </div>

            {/* Giờ mở cửa & Giờ đóng cửa */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label>Giờ mở cửa hàng ngày</label>
                <div style={{ position: 'relative' }}>
                  <Clock size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input
                    type="text"
                    placeholder="08:00"
                    value={form.opening_time}
                    onChange={(e) => setForm({ ...form, opening_time: e.target.value })}
                    style={{ paddingLeft: 38 }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Giờ đóng cửa</label>
                <div style={{ position: 'relative' }}>
                  <Clock size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input
                    type="text"
                    placeholder="22:00"
                    value={form.closing_time}
                    onChange={(e) => setForm({ ...form, closing_time: e.target.value })}
                    style={{ paddingLeft: 38 }}
                  />
                </div>
              </div>
            </div>

            {/* Mô tả / Giới thiệu */}
            <div className="form-group">
              <label>Giới thiệu về quán ăn</label>
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Giới thiệu phong cách ẩm thực, đặc sản của quán..."
                style={{
                  padding: '10px 14px',
                  borderRadius: 10,
                  border: '1px solid #cbd5e1',
                  fontFamily: 'inherit',
                  fontSize: '0.88rem',
                }}
              />
            </div>

            {/* Hình ảnh đại diện / Ảnh bìa quán */}
            <div className="form-group">
              <label>Ảnh đại diện / Ảnh bìa quán ăn</label>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 8 }}>
                <label
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 14px',
                    borderRadius: 10,
                    background: '#f1f5f9',
                    border: '1px solid #cbd5e1',
                    cursor: 'pointer',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    color: '#0f172a',
                  }}
                >
                  <Upload size={14} />
                  <span>{uploadingImage ? 'Đang tải ảnh...' : 'Chọn ảnh từ máy'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileChange}
                    disabled={uploadingImage}
                    style={{ display: 'none' }}
                  />
                </label>
                <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>hoặc dán đường dẫn ảnh web:</span>
              </div>

              <input
                type="text"
                value={form.image}
                onChange={(e) => setForm({ ...form, image: e.target.value })}
                placeholder="https://..."
              />

              {form.image && (
                <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 100, height: 60, borderRadius: 10, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                    <img
                      src={resolveImageUrl(form.image, DEFAULT_RESTAURANT_IMAGE)}
                      alt="Restaurant"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                  <span style={{ fontSize: '0.76rem', color: '#10b981' }}>✓ Ảnh hiển thị tốt</span>
                </div>
              )}
            </div>

            {/* Save Button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
              <button
                type="submit"
                disabled={saving}
                className="btn btn-primary"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '12px 24px',
                  fontSize: '0.92rem',
                  background: '#ea580c',
                  borderColor: '#ea580c',
                }}
              >
                <Save size={16} />
                <span>{saving ? 'Đang lưu...' : 'Lưu Thay Đổi'}</span>
              </button>
            </div>
          </form>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>
            <p>Tài khoản chưa có nhà hàng nào được liên kết.</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn btn-primary"
              style={{ marginTop: 12, background: '#ea580c' }}
            >
              Tạo nhà hàng đầu tiên ngay
            </button>
          </div>
        )}
      </div>

      {/* Account Info & Logout Card */}
      <div className="panel" style={{ padding: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: '#f1f5f9',
              color: '#0f172a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <User size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.98rem', fontWeight: 800, color: '#0f172a' }}>
              {currentUser?.full_name || 'Đối tác quán ăn'}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 2 }}>
              Email: {currentUser?.email || '—'} • SĐT: {currentUser?.phone_number || '—'}
            </div>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="btn btn-secondary"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            color: '#dc2626',
            borderColor: '#fecaca',
            background: '#fef2f2',
          }}
        >
          <LogOut size={16} />
          <span>Đăng xuất tài khoản</span>
        </button>
      </div>

      {/* Modal Tạo Quán Ăn Mới */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div
            className="modal-card"
            style={{ maxWidth: 520, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 14, borderBottom: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
                Đăng Ký Thêm Quán Ăn Mới
              </h3>
              <button onClick={() => setShowCreateModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateStore} style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 16 }}>
              <div className="form-group">
                <label>Tên quán ăn / chi nhánh (*)</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Cơm Tấm Ba Ghiền - Chi nhánh 2"
                  value={newStoreForm.name}
                  onChange={(e) => setNewStoreForm({ ...newStoreForm, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Địa chỉ cửa hàng (*)</label>
                <input
                  type="text"
                  placeholder="Số nhà, tên đường, phường, quận..."
                  value={newStoreForm.address}
                  onChange={(e) => setNewStoreForm({ ...newStoreForm, address: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Số điện thoại liên hệ</label>
                <input
                  type="text"
                  placeholder="0901234567"
                  value={newStoreForm.phone_number}
                  onChange={(e) => setNewStoreForm({ ...newStoreForm, phone_number: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label>Giờ mở cửa</label>
                  <input
                    type="text"
                    value={newStoreForm.opening_time}
                    onChange={(e) => setNewStoreForm({ ...newStoreForm, opening_time: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Giờ đóng cửa</label>
                  <input
                    type="text"
                    value={newStoreForm.closing_time}
                    onChange={(e) => setNewStoreForm({ ...newStoreForm, closing_time: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Mô tả quán</label>
                <textarea
                  rows={2}
                  placeholder="Giới thiệu phong cách quán..."
                  value={newStoreForm.description}
                  onChange={(e) => setNewStoreForm({ ...newStoreForm, description: e.target.value })}
                  style={{ padding: 10, borderRadius: 10, border: '1px solid #cbd5e1', fontFamily: 'inherit' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-secondary">
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={creatingStore}
                  className="btn btn-primary"
                  style={{ background: '#ea580c', borderColor: '#ea580c' }}
                >
                  {creatingStore ? 'Đang tạo...' : 'Tạo Quán Mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
