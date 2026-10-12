import React, { useEffect, useState, useMemo } from 'react';
import {
  Plus,
  Search,
  X,
  Upload,
  CheckCircle2,
  UtensilsCrossed,
  FolderPlus,
  Edit2,
  Trash2,
} from 'lucide-react';
import type { AdminRestaurant, OwnerCategory, OwnerFood } from '../../services/types';
import { ownerApi, uploadApi } from '../../services/api';
import { resolveImageUrl, DEFAULT_FOOD_IMAGE } from '../../services/utils';
import './owner-mobile-ui.css';
import './owner-web.css';

interface OwnerMenuViewProps {
  restaurant: AdminRestaurant | null;
  onRefreshStats?: () => void;
}

const money = (v: number | string) => Number(v || 0).toLocaleString('vi-VN');

export function OwnerMenuView({ restaurant, onRefreshStats }: OwnerMenuViewProps) {
  const [foods, setFoods] = useState<OwnerFood[]>([]);
  const [categories, setCategories] = useState<OwnerCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<number | 'all'>('all');
  const [togglingId, setTogglingId] = useState<number | null>(null);

  // Form Thêm món
  const [showAddFood, setShowAddFood] = useState(false);
  const [savingFood, setSavingFood] = useState(false);
  const [newFood, setNewFood] = useState({
    name: '',
    price: '',
    description: '',
    image: '',
    categoryId: null as number | null,
  });
  const [uploadingImage, setUploadingImage] = useState(false);

  // Form Sửa món
  const [editingFood, setEditingFood] = useState<OwnerFood | null>(null);
  const [savingEditFood, setSavingEditFood] = useState(false);

  // Form Thêm nhóm món
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [savingCategory, setSavingCategory] = useState(false);

  const loadData = async () => {
    if (!restaurant) return;
    try {
      setLoading(true);
      const [fRes, cRes] = await Promise.all([
        ownerApi.getFoods(restaurant.id, { limit: 200 }),
        ownerApi.getCategories(restaurant.id),
      ]);
      setFoods(fRes.data || []);
      setCategories(cRes || []);
    } catch (err: any) {
      console.error('Lỗi tải thực đơn:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [restaurant?.id]);

  const availableCount = useMemo(
    () => foods.filter((f) => f.status === 'AVAILABLE').length,
    [foods]
  );
  const outOfStockCount = foods.length - availableCount;

  const shownFoods = useMemo(() => {
    const kw = search.trim().toLowerCase();
    return foods.filter((f) => {
      const matchCat = categoryFilter === 'all' || f.category_id === categoryFilter;
      const matchKw =
        !kw ||
        f.name.toLowerCase().includes(kw) ||
        (f.description ?? '').toLowerCase().includes(kw);
      return matchCat && matchKw;
    });
  }, [foods, search, categoryFilter]);

  const countByCategory = (id: number) => foods.filter((f) => f.category_id === id).length;

  // Toggle trạng thái món: AVAILABLE ↔ UNAVAILABLE
  const toggleFood = async (food: OwnerFood) => {
    if (!restaurant) return;
    setTogglingId(food.id);
    try {
      const updated = await ownerApi.toggleFoodStatus(restaurant.id, food.id);
      setFoods((prev) => prev.map((f) => (f.id === food.id ? { ...f, status: updated.status } : f)));
      onRefreshStats?.();
    } catch (err: any) {
      alert(`Không thể đổi trạng thái món: ${err?.message || 'Lỗi'}`);
    } finally {
      setTogglingId(null);
    }
  };

  // Thêm món mới
  const handleCreateFood = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurant) return;
    if (!newFood.name.trim() || !newFood.price.trim()) {
      alert('Vui lòng nhập tên món và giá bán.');
      return;
    }

    try {
      setSavingFood(true);
      const created = await ownerApi.createFood(restaurant.id, {
        name: newFood.name.trim(),
        price: Number(newFood.price),
        description: newFood.description.trim() || undefined,
        image: newFood.image.trim() || undefined,
        category_id: newFood.categoryId || undefined,
      });

      setFoods((prev) => [created, ...prev]);
      setShowAddFood(false);
      setNewFood({ name: '', price: '', description: '', image: '', categoryId: null });
      onRefreshStats?.();
    } catch (err: any) {
      alert(`Lỗi tạo món: ${err?.message || 'Lỗi không xác định'}`);
    } finally {
      setSavingFood(false);
    }
  };

  // Sửa món
  const handleUpdateFood = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurant || !editingFood) return;

    try {
      setSavingEditFood(true);
      const updated = await ownerApi.updateFood(restaurant.id, editingFood.id, {
        name: editingFood.name.trim(),
        price: Number(editingFood.price),
        description: editingFood.description?.trim() || undefined,
        image: editingFood.image?.trim() || undefined,
        category_id: editingFood.category_id || undefined,
      });

      setFoods((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
      setEditingFood(null);
      onRefreshStats?.();
    } catch (err: any) {
      alert(`Lỗi cập nhật món: ${err?.message || 'Lỗi'}`);
    } finally {
      setSavingEditFood(false);
    }
  };

  // Xóa món
  const handleDeleteFood = async (foodId: number) => {
    if (!restaurant || !confirm('Bạn chắc chắn muốn xóa món này khỏi thực đơn?')) return;
    try {
      await ownerApi.deleteFood(restaurant.id, foodId);
      setFoods((prev) => prev.filter((f) => f.id !== foodId));
      onRefreshStats?.();
    } catch (err: any) {
      alert(`Không thể xóa món: ${err?.message || 'Lỗi'}`);
    }
  };

  // Thêm nhóm món
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurant || !newCategoryName.trim()) return;

    try {
      setSavingCategory(true);
      const created = await ownerApi.createCategory(restaurant.id, {
        name: newCategoryName.trim(),
      });
      setCategories((prev) => [...prev, created]);
      setShowAddCategory(false);
      setNewCategoryName('');
    } catch (err: any) {
      alert(`Lỗi thêm danh mục: ${err?.message || 'Lỗi'}`);
    } finally {
      setSavingCategory(false);
    }
  };

  if (!restaurant) {
    return (
      <div className="owner-web-view">
        <div className="owner-web-panel" style={{ textAlign: 'center', padding: '50px 20px' }}>
          <UtensilsCrossed size={44} color="#94A3B8" style={{ margin: '0 auto 12px auto' }} />
          <h3>Chưa chọn quán ăn</h3>
          <p style={{ color: '#64748B' }}>Vui lòng chọn quán để quản lý danh sách món ăn.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="owner-web-view">
      {/* 1. Thanh điều khiển thực đơn trên Web */}
      <div className="owner-web-menu-controls">
        {/* Tìm kiếm */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            backgroundColor: '#F8FAFC',
            border: '1px solid #CBD5E1',
            borderRadius: 10,
            padding: '8px 14px',
            width: 320,
          }}
        >
          <Search size={16} color="#94A3B8" />
          <input
            type="text"
            placeholder="Tìm tên món, hương vị..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              border: 'none',
              outline: 'none',
              fontSize: '0.88rem',
              backgroundColor: 'transparent',
              width: '100%',
              color: '#1E293B',
            }}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94A3B8' }}
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* 2 Thẻ đếm số lượng mở bán vs tạm hết */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 14px',
              borderRadius: 8,
              backgroundColor: '#DCFCE7',
              color: '#15803D',
              fontSize: '0.84rem',
              fontWeight: 700,
            }}
          >
            <span style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#16A34A' }} />
            <span>Mở bán: {availableCount} món</span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 14px',
              borderRadius: 8,
              backgroundColor: '#FEE2E2',
              color: '#B91C1C',
              fontSize: '0.84rem',
              fontWeight: 700,
            }}
          >
            <span style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#DC2626' }} />
            <span>Tạm hết: {outOfStockCount} món</span>
          </div>
        </div>

        {/* Các nút bấm thao tác thêm món & thêm nhóm */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={() => setShowAddCategory(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 14px',
              borderRadius: 10,
              backgroundColor: '#F1F5F9',
              border: '1px solid #CBD5E1',
              color: '#334155',
              fontSize: '0.84rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <FolderPlus size={16} />
            <span>+ Nhóm món</span>
          </button>

          <button
            onClick={() => setShowAddFood(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 18px',
              borderRadius: 10,
              backgroundColor: '#EA580C',
              border: 'none',
              color: '#FFFFFF',
              fontSize: '0.88rem',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(234, 88, 12, 0.25)',
            }}
          >
            <Plus size={18} />
            <span>+ Thêm món mới</span>
          </button>
        </div>
      </div>

      {/* 2. Dải lọc danh mục món */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
        <button
          onClick={() => setCategoryFilter('all')}
          style={{
            padding: '7px 16px',
            borderRadius: 999,
            backgroundColor: categoryFilter === 'all' ? '#EA580C' : '#FFFFFF',
            border: categoryFilter === 'all' ? '1px solid #EA580C' : '1px solid #CBD5E1',
            color: categoryFilter === 'all' ? '#FFFFFF' : '#475569',
            fontSize: '0.84rem',
            fontWeight: 700,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          Tất cả ({foods.length})
        </button>

        {categories.map((c) => {
          const active = categoryFilter === c.id;
          return (
            <button
              key={c.id}
              onClick={() => setCategoryFilter(c.id)}
              style={{
                padding: '7px 16px',
                borderRadius: 999,
                backgroundColor: active ? '#EA580C' : '#FFFFFF',
                border: active ? '1px solid #EA580C' : '1px solid #CBD5E1',
                color: active ? '#FFFFFF' : '#475569',
                fontSize: '0.84rem',
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {c.name} ({countByCategory(c.id)})
            </button>
          );
        })}
      </div>

      {/* 3. Lưới các món ăn dạng thẻ trực quan trên Web */}
      {loading && foods.length === 0 ? (
        <div className="owner-web-panel" style={{ textAlign: 'center', padding: '60px 0' }}>
          <div style={{ color: '#EA580C', fontWeight: 700 }}>Đang tải danh sách món ăn...</div>
        </div>
      ) : shownFoods.length === 0 ? (
        <div className="owner-web-panel" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <UtensilsCrossed size={48} color="#CBD5E1" style={{ margin: '0 auto 12px auto' }} />
          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#334155' }}>
            Không tìm thấy món ăn nào
          </div>
          <p style={{ fontSize: '0.85rem', color: '#94A3B8', marginTop: 4 }}>
            Thử tìm kiếm với từ khóa khác hoặc bấm "+ Thêm món mới" để cập nhật thực đơn.
          </p>
        </div>
      ) : (
        <div className="owner-web-food-grid">
          {shownFoods.map((food) => {
            const isAvailable = food.status === 'AVAILABLE';
            const catName = categories.find((c) => c.id === food.category_id)?.name;

            return (
              <div
                key={food.id}
                className={`owner-web-food-card ${!isAvailable ? 'off' : ''}`}
              >
                <img
                  src={resolveImageUrl(food.image, DEFAULT_FOOD_IMAGE)}
                  alt={food.name}
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 12,
                    objectFit: 'cover',
                    backgroundColor: '#E2E8F0',
                    flexShrink: 0,
                  }}
                />

                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                  <div
                    style={{
                      fontSize: '0.98rem',
                      fontWeight: 800,
                      color: '#0F172A',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {food.name}
                  </div>

                  <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#EA580C', marginTop: 2 }}>
                    {money(food.price)}đ
                  </div>

                  {catName && (
                    <span
                      style={{
                        alignSelf: 'flex-start',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: 4,
                        backgroundColor: '#F1F5F9',
                        color: '#64748B',
                        marginTop: 4,
                      }}
                    >
                      {catName}
                    </span>
                  )}

                  {food.description && (
                    <div
                      style={{
                        fontSize: '0.78rem',
                        color: '#64748B',
                        marginTop: 4,
                        lineHeight: 1.3,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {food.description}
                    </div>
                  )}

                  {/* Thanh điều khiển dưới thẻ: Công tắc Bật/Tắt & Nút sửa/xóa */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginTop: 'auto',
                      paddingTop: 8,
                    }}
                  >
                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        color: isAvailable ? '#15803D' : '#DC2626',
                        cursor: 'pointer',
                      }}
                      title="Bật/tắt trạng thái món ăn"
                    >
                      <div className="owner-m-switch">
                        <input
                          type="checkbox"
                          checked={isAvailable}
                          disabled={togglingId === food.id}
                          onChange={() => toggleFood(food)}
                        />
                        <span className="owner-m-slider" />
                      </div>
                      <span>{isAvailable ? 'Còn món' : 'Hết hàng'}</span>
                    </label>

                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        onClick={() => setEditingFood(food)}
                        style={{
                          background: '#F1F5F9',
                          border: 'none',
                          borderRadius: 6,
                          padding: 5,
                          cursor: 'pointer',
                          color: '#475569',
                        }}
                        title="Chỉnh sửa món"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteFood(food.id)}
                        style={{
                          background: '#FEE2E2',
                          border: 'none',
                          borderRadius: 6,
                          padding: 5,
                          cursor: 'pointer',
                          color: '#DC2626',
                        }}
                        title="Xóa món"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          MODAL THÊM MÓN ĂN MỚI
          ═══════════════════════════════════════════════════════════════════════ */}
      {showAddFood && (
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
          onClick={() => setShowAddFood(false)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 520,
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
                Thêm Món Ăn Mới
              </h3>
              <button
                onClick={() => setShowAddFood(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94A3B8' }}
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={handleCreateFood}
              style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155' }}>
                  Tên món ăn <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="VD: Cơm Tấm Sườn Bì Chả Đặc Biệt"
                  value={newFood.name}
                  onChange={(e) => setNewFood({ ...newFood, name: e.target.value })}
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
                    Giá bán (VNĐ) <span style={{ color: '#DC2626' }}>*</span>
                  </label>
                  <input
                    type="number"
                    placeholder="VD: 45000"
                    value={newFood.price}
                    onChange={(e) => setNewFood({ ...newFood, price: e.target.value })}
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
                    Danh mục món
                  </label>
                  <select
                    value={newFood.categoryId || ''}
                    onChange={(e) =>
                      setNewFood({ ...newFood, categoryId: e.target.value ? Number(e.target.value) : null })
                    }
                    style={{
                      height: 42,
                      border: '1px solid #CBD5E1',
                      borderRadius: 8,
                      padding: '0 12px',
                      fontSize: '0.9rem',
                    }}
                  >
                    <option value="">-- Chọn nhóm món --</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155' }}>
                  Hình ảnh món ăn
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="text"
                    placeholder="Dán link ảnh web (https://...)"
                    value={newFood.image}
                    onChange={(e) => setNewFood({ ...newFood, image: e.target.value })}
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
                    <span>{uploadingImage ? '...' : 'Tải ảnh'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        try {
                          setUploadingImage(true);
                          const url = await uploadApi.uploadFood(file);
                          setNewFood((prev) => ({ ...prev, image: url }));
                        } catch (err: any) {
                          alert(`Lỗi upload ảnh: ${err?.message || 'Lỗi'}`);
                        } finally {
                          setUploadingImage(false);
                        }
                      }}
                    />
                  </label>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155' }}>
                  Mô tả món ăn
                </label>
                <textarea
                  rows={2}
                  placeholder="Giới thiệu nguyên liệu, đồ ăn kèm..."
                  value={newFood.description}
                  onChange={(e) => setNewFood({ ...newFood, description: e.target.value })}
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
                  onClick={() => setShowAddFood(false)}
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
                  disabled={savingFood}
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
                  {savingFood ? 'Đang lưu...' : 'Thêm Món'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          MODAL SỬA MÓN ĂN
          ═══════════════════════════════════════════════════════════════════════ */}
      {editingFood && (
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
          onClick={() => setEditingFood(null)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 520,
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
                Sửa Thông Tin Món Ăn
              </h3>
              <button
                onClick={() => setEditingFood(null)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94A3B8' }}
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={handleUpdateFood}
              style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155' }}>
                  Tên món ăn <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <input
                  type="text"
                  value={editingFood.name}
                  onChange={(e) => setEditingFood({ ...editingFood, name: e.target.value })}
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
                    Giá bán (VNĐ) <span style={{ color: '#DC2626' }}>*</span>
                  </label>
                  <input
                    type="number"
                    value={editingFood.price}
                    onChange={(e) => setEditingFood({ ...editingFood, price: Number(e.target.value) })}
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
                    Danh mục món
                  </label>
                  <select
                    value={editingFood.category_id || ''}
                    onChange={(e) =>
                      setEditingFood({
                        ...editingFood,
                        category_id: e.target.value ? Number(e.target.value) : undefined,
                      })
                    }
                    style={{
                      height: 42,
                      border: '1px solid #CBD5E1',
                      borderRadius: 8,
                      padding: '0 12px',
                      fontSize: '0.9rem',
                    }}
                  >
                    <option value="">-- Chọn nhóm món --</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155' }}>
                  Hình ảnh món ăn (URL)
                </label>
                <input
                  type="text"
                  value={editingFood.image || ''}
                  onChange={(e) => setEditingFood({ ...editingFood, image: e.target.value })}
                  style={{
                    height: 40,
                    border: '1px solid #CBD5E1',
                    borderRadius: 8,
                    padding: '0 10px',
                    fontSize: '0.85rem',
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155' }}>
                  Mô tả món ăn
                </label>
                <textarea
                  rows={2}
                  value={editingFood.description || ''}
                  onChange={(e) => setEditingFood({ ...editingFood, description: e.target.value })}
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
                  onClick={() => setEditingFood(null)}
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
                  disabled={savingEditFood}
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
                  {savingEditFood ? 'Đang lưu...' : 'Lưu Thay Đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          MODAL THÊM NHÓM MÓN
          ═══════════════════════════════════════════════════════════════════════ */}
      {showAddCategory && (
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
          onClick={() => setShowAddCategory(false)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 420,
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
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0F172A' }}>
                Thêm Nhóm / Danh Mục Món
              </h3>
              <button
                onClick={() => setShowAddCategory(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94A3B8' }}
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={handleCreateCategory}
              style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155' }}>
                  Tên nhóm món <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="VD: Cơm Tấm, Món Ăn Kèm, Đồ Uống..."
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
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

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setShowAddCategory(false)}
                  style={{
                    padding: '8px 16px',
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
                  disabled={savingCategory}
                  style={{
                    padding: '8px 18px',
                    borderRadius: 8,
                    backgroundColor: '#EA580C',
                    border: 'none',
                    color: '#FFFFFF',
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  {savingCategory ? 'Đang tạo...' : 'Tạo Nhóm Món'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
