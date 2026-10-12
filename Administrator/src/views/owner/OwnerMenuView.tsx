import React, { useEffect, useState, useMemo } from 'react';
import {
  Plus,
  Search,
  X,
  EyeOff,
  Upload,
  CheckCircle2,
  FolderPlus,
  UtensilsCrossed,
} from 'lucide-react';
import type { AdminRestaurant, OwnerCategory, OwnerFood } from '../../services/types';
import { ownerApi, uploadApi } from '../../services/api';
import { resolveImageUrl, DEFAULT_FOOD_IMAGE } from '../../services/utils';
import './owner-mobile-ui.css';

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

  const openAddFood = () => {
    if (categories.length === 0) {
      alert('Bạn cần tạo ít nhất 1 nhóm món trước khi thêm món ăn.');
      setShowAddCategory(true);
      return;
    }
    setNewFood({
      name: '',
      price: '',
      description: '',
      image: '',
      categoryId: categories[0]?.id || null,
    });
    setShowAddFood(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
  };

  const saveFood = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurant) return;
    const priceNum = Number(newFood.price.replace(/[^\d]/g, ''));
    if (!newFood.name.trim() || !priceNum) {
      alert('Vui lòng nhập tên món và giá bán hợp lệ.');
      return;
    }
    if (!newFood.categoryId) {
      alert('Vui lòng chọn nhóm món cho món ăn.');
      return;
    }

    try {
      setSavingFood(true);
      await ownerApi.createFood(restaurant.id, {
        category_id: newFood.categoryId,
        name: newFood.name.trim(),
        price: priceNum,
        description: newFood.description.trim() || undefined,
        image: newFood.image.trim() || undefined,
        status: 'AVAILABLE',
      });
      setShowAddFood(false);
      await loadData();
      onRefreshStats?.();
    } catch (err: any) {
      alert(`Không thêm được món: ${err?.message || 'Lỗi'}`);
    } finally {
      setSavingFood(false);
    }
  };

  const saveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurant || !newCategoryName.trim()) {
      alert('Vui lòng nhập tên nhóm món.');
      return;
    }
    try {
      setSavingCategory(true);
      await ownerApi.createCategory(restaurant.id, { name: newCategoryName.trim() });
      setNewCategoryName('');
      setShowAddCategory(false);
      await loadData();
    } catch (err: any) {
      alert(`Không tạo được nhóm món: ${err?.message || 'Lỗi'}`);
    } finally {
      setSavingCategory(false);
    }
  };

  return (
    <div className="owner-m-content">
      {/* 1. Tiêu đề + Nút thêm món */}
      <div className="owner-m-title-row">
        <div>
          <div className="owner-m-main-title">Thực đơn quán</div>
          <div className="owner-m-main-sub">Kiểm soát món ăn & tình trạng còn hàng</div>
        </div>
        <button className="owner-m-add-btn" onClick={openAddFood}>
          <Plus size={16} color="#FFFFFF" />
          <span>Thêm món</span>
        </button>
      </div>

      {/* 2. Thống kê nhanh 2 ô (Đang mở bán / Tạm hết hàng) */}
      <div className="owner-m-menu-stat-row">
        <div className="owner-m-menu-stat-box green">
          <div className="owner-m-menu-stat-top">
            <span style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: '#16A34A' }} />
            <span>Đang mở bán</span>
          </div>
          <div className="owner-m-menu-stat-val">{availableCount} món</div>
        </div>

        <div className="owner-m-menu-stat-box red">
          <div className="owner-m-menu-stat-top">
            <span style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: '#DC2626' }} />
            <span>Tạm hết hàng</span>
          </div>
          <div className="owner-m-menu-stat-val">{outOfStockCount} món</div>
        </div>
      </div>

      {/* 3. Tìm kiếm món */}
      <div className="owner-m-search-bar">
        <Search size={17} color="#9CA3AF" />
        <input
          type="text"
          className="owner-m-search-input"
          placeholder="Tìm món trong thực đơn..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search.length > 0 && (
          <button
            onClick={() => setSearch('')}
            style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#9CA3AF' }}
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* 4. Lọc theo nhóm món (Dải Chips cuộn ngang) */}
      <div className="owner-m-tabs-scroll">
        <button
          className={`owner-m-chip ${categoryFilter === 'all' ? 'active' : ''}`}
          onClick={() => setCategoryFilter('all')}
        >
          Tất cả ({foods.length})
        </button>
        {categories.map((c) => {
          const active = categoryFilter === c.id;
          return (
            <button
              key={c.id}
              className={`owner-m-chip ${active ? 'active' : ''}`}
              onClick={() => setCategoryFilter(c.id)}
            >
              {c.name} ({countByCategory(c.id)})
            </button>
          );
        })}
      </div>

      {/* 5. Danh sách món ăn */}
      <div style={{ fontSize: '13px', fontWeight: 800, color: '#334155', marginTop: 4 }}>
        Danh sách món ăn
      </div>

      {loading && foods.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#6B7280' }}>
          Đang tải thực đơn...
        </div>
      ) : shownFoods.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94A3B8' }}>
          <UtensilsCrossed size={40} color="#D1D5DB" style={{ margin: '0 auto 8px auto' }} />
          <div style={{ fontSize: '14px', color: '#4B5563' }}>Không có món nào khớp bộ lọc.</div>
        </div>
      ) : (
        shownFoods.map((food) => {
          const isAvailable = food.status === 'AVAILABLE';
          const catName = categories.find((c) => c.id === food.category_id)?.name || food.category?.name || 'Chưa phân nhóm';

          return (
            <div key={food.id} className={`owner-m-food-card ${!isAvailable ? 'off' : ''}`}>
              <img
                src={resolveImageUrl(food.image)}
                alt=""
                className="owner-m-food-img"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = DEFAULT_FOOD_IMAGE;
                }}
              />

              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="owner-m-food-name">{food.name}</div>
                <div className="owner-m-food-price">{money(food.price)}đ</div>
                <div className="owner-m-food-cat">{catName}</div>

                {!isAvailable && (
                  <div className="owner-m-off-banner">
                    <EyeOff size={11} color="#B91C1C" />
                    <span>Tạm hết hàng · Đang ẩn khỏi menu khách</span>
                  </div>
                )}
              </div>

              {/* iOS Style Switch: Toggle Còn món / Hết món */}
              <label className="owner-m-switch">
                <input
                  type="checkbox"
                  checked={isAvailable}
                  disabled={togglingId === food.id}
                  onChange={() => void toggleFood(food)}
                />
                <span className="owner-m-slider" />
              </label>
            </div>
          );
        })
      )}

      {/* 6. Quản lý nhóm món */}
      <div className="owner-m-card">
        <div className="owner-m-card-header">
          <div className="owner-m-card-title">Quản lý nhóm món</div>
          <button className="owner-m-link-text" onClick={() => setShowAddCategory(true)}>
            + Tạo nhóm
          </button>
        </div>
        <div className="owner-m-card-sub">
          Nhóm món quyết định cách khách nhìn thấy thực đơn theo từng mục.
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
          {categories.length === 0 ? (
            <div style={{ fontSize: '12px', color: '#94A3B8' }}>Quán chưa có nhóm món nào.</div>
          ) : (
            categories.map((c) => (
              <div
                key={c.id}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '5px 10px',
                  borderRadius: 8,
                  backgroundColor: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  fontSize: '12px',
                  color: '#334155',
                  fontWeight: 600,
                }}
              >
                <span>{c.name}</span>
                <span
                  style={{
                    backgroundColor: '#E2E8F0',
                    borderRadius: 6,
                    padding: '1px 6px',
                    fontSize: '10px',
                    fontWeight: 800,
                  }}
                >
                  {countByCategory(c.id)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* MODAL: THÊM MÓN MỚI (PHONG CÁCH DI ĐỘNG) */}
      {showAddFood && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: 16,
          }}
          onClick={() => setShowAddFood(false)}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 16,
              width: '100%',
              maxWidth: 440,
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: 20,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ fontSize: '16px', fontWeight: 800, color: '#111827' }}>
                Thêm món mới
              </div>
              <button
                onClick={() => setShowAddFood(false)}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748B' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={saveFood} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Nhóm món */}
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: 6 }}>
                  Nhóm món *
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {categories.map((c) => {
                    const active = newFood.categoryId === c.id;
                    return (
                      <button
                        type="button"
                        key={c.id}
                        className={`owner-m-chip ${active ? 'active' : ''}`}
                        onClick={() => setNewFood((s) => ({ ...s, categoryId: c.id }))}
                      >
                        {c.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tên món */}
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                  Tên món *
                </label>
                <input
                  type="text"
                  placeholder="VD: Cơm tấm sườn nướng"
                  value={newFood.name}
                  onChange={(e) => setNewFood((s) => ({ ...s, name: e.target.value }))}
                  required
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 10,
                    border: '1px solid #CBD5E1',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Giá bán */}
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                  Giá bán (đ) *
                </label>
                <input
                  type="text"
                  placeholder="VD: 55000"
                  value={newFood.price}
                  onChange={(e) => setNewFood((s) => ({ ...s, price: e.target.value }))}
                  required
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 10,
                    border: '1px solid #CBD5E1',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Mô tả */}
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                  Mô tả
                </label>
                <textarea
                  rows={2}
                  placeholder="Thêm mô tả về hương vị, thành phần món..."
                  value={newFood.description}
                  onChange={(e) => setNewFood((s) => ({ ...s, description: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 10,
                    border: '1px solid #CBD5E1',
                    fontSize: '13px',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Ảnh món */}
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                  Ảnh món ăn
                </label>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 6 }}>
                  <label
                    style={{
                      padding: '7px 12px',
                      backgroundColor: '#F1F5F9',
                      border: '1px solid #CBD5E1',
                      borderRadius: 8,
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <Upload size={13} />
                    <span>{uploadingImage ? 'Đang tải...' : 'Tải ảnh từ máy'}</span>
                    <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                  </label>
                  <span style={{ fontSize: '11px', color: '#94A3B8' }}>hoặc dán URL</span>
                </div>
                <input
                  type="text"
                  placeholder="https://..."
                  value={newFood.image}
                  onChange={(e) => setNewFood((s) => ({ ...s, image: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 10,
                    border: '1px solid #CBD5E1',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Nút lưu */}
              <button
                type="submit"
                disabled={savingFood}
                style={{
                  width: '100%',
                  padding: 12,
                  borderRadius: 10,
                  backgroundColor: '#EA580C',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 800,
                  border: 'none',
                  cursor: 'pointer',
                  marginTop: 6,
                }}
              >
                {savingFood ? 'Đang lưu...' : 'Thêm vào thực đơn'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: TẠO NHÓM MÓN */}
      {showAddCategory && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: 16,
          }}
          onClick={() => setShowAddCategory(false)}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 16,
              width: '100%',
              maxWidth: 380,
              padding: 20,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ fontSize: '16px', fontWeight: 800, color: '#111827' }}>
                Tạo nhóm món mới
              </div>
              <button
                onClick={() => setShowAddCategory(false)}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748B' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={saveCategory} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                  Tên nhóm *
                </label>
                <input
                  type="text"
                  placeholder="VD: Món cơm, Khai vị, Trà sữa"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 10,
                    border: '1px solid #CBD5E1',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={savingCategory}
                style={{
                  width: '100%',
                  padding: 12,
                  borderRadius: 10,
                  backgroundColor: '#EA580C',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 800,
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                {savingCategory ? 'Đang tạo...' : 'Tạo nhóm'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
