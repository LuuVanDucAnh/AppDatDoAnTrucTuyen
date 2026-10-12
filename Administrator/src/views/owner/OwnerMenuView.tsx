import React, { useEffect, useState, useMemo } from 'react';
import {
  UtensilsCrossed,
  Plus,
  Search,
  Filter,
  Pencil,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  FolderPlus,
  Folder,
  X,
  Layers,
} from 'lucide-react';
import type { AdminRestaurant, OwnerCategory, OwnerFood } from '../../services/types';
import { ownerApi, uploadApi } from '../../services/api';
import {
  formatMoney,
  resolveImageUrl,
  DEFAULT_FOOD_IMAGE,
} from '../../services/utils';

interface OwnerMenuViewProps {
  restaurant: AdminRestaurant | null;
  onRefreshStats?: () => void;
}

export function OwnerMenuView({ restaurant, onRefreshStats }: OwnerMenuViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<'FOODS' | 'CATEGORIES'>('FOODS');
  const [foods, setFoods] = useState<OwnerFood[]>([]);
  const [categories, setCategories] = useState<OwnerCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<number | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'AVAILABLE' | 'UNAVAILABLE'>('ALL');

  // Food Modal (Create / Edit)
  const [showFoodModal, setShowFoodModal] = useState(false);
  const [editingFood, setEditingFood] = useState<OwnerFood | null>(null);
  const [foodForm, setFoodForm] = useState({
    name: '',
    category_id: 0,
    price: 35000,
    description: '',
    image: '',
    status: 'AVAILABLE' as 'AVAILABLE' | 'UNAVAILABLE',
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [submittingFood, setSubmittingFood] = useState(false);

  // Category Modal (Create / Edit)
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<OwnerCategory | null>(null);
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
  });
  const [submittingCategory, setSubmittingCategory] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchData = async () => {
    if (!restaurant) return;
    try {
      setLoading(true);
      setError(null);
      const [fRes, cRes] = await Promise.all([
        ownerApi.getFoods(restaurant.id, { limit: 200 }),
        ownerApi.getCategories(restaurant.id),
      ]);
      setFoods(fRes.data || []);
      setCategories(cRes || []);
    } catch (err: any) {
      setError(err?.message || 'Không thể tải thực đơn của quán.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [restaurant?.id]);

  // Lọc món ăn
  const filteredFoods = useMemo(() => {
    return foods.filter((f) => {
      if (selectedCategoryFilter !== 'ALL' && f.category_id !== selectedCategoryFilter) return false;
      if (statusFilter !== 'ALL' && f.status !== statusFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const nameMatch = f.name.toLowerCase().includes(q);
        const descMatch = f.description?.toLowerCase().includes(q) || false;
        if (!nameMatch && !descMatch) return false;
      }
      return true;
    });
  }, [foods, selectedCategoryFilter, statusFilter, search]);

  // Bật / tắt còn món
  const handleToggleFood = async (food: OwnerFood) => {
    if (!restaurant) return;
    try {
      const updated = await ownerApi.toggleFoodStatus(restaurant.id, food.id);
      setFoods((prev) => prev.map((f) => (f.id === food.id ? { ...f, status: updated.status } : f)));
      showToast('success', `Đã chuyển món "${food.name}" sang ${updated.status === 'AVAILABLE' ? 'Còn món' : 'Hết món'}`);
    } catch (err: any) {
      showToast('error', `Lỗi đổi trạng thái món: ${err?.message || 'Lỗi'}`);
    }
  };

  // Mở modal thêm món
  const handleOpenAddFood = () => {
    setEditingFood(null);
    setFoodForm({
      name: '',
      category_id: categories[0]?.id || 0,
      price: 35000,
      description: '',
      image: '',
      status: 'AVAILABLE',
    });
    setShowFoodModal(true);
  };

  // Mở modal sửa món
  const handleOpenEditFood = (food: OwnerFood) => {
    setEditingFood(food);
    setFoodForm({
      name: food.name,
      category_id: food.category_id,
      price: Number(food.price) || 0,
      description: food.description || '',
      image: food.image || '',
      status: food.status,
    });
    setShowFoodModal(true);
  };

  // Upload file ảnh món ăn
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingImage(true);
      const url = await uploadApi.uploadFood(file);
      setFoodForm((prev) => ({ ...prev, image: url }));
      showToast('success', 'Đã tải ảnh món ăn lên máy chủ!');
    } catch (err: any) {
      showToast('error', `Không tải được ảnh: ${err?.message || 'Lỗi upload'}`);
    } finally {
      setUploadingImage(false);
    }
  };

  // Lưu món ăn (Thêm hoặc Sửa)
  const handleSaveFood = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurant) return;
    if (!foodForm.name.trim()) {
      alert('Vui lòng nhập tên món ăn.');
      return;
    }
    if (!foodForm.category_id) {
      alert('Vui lòng chọn danh mục cho món ăn.');
      return;
    }

    try {
      setSubmittingFood(true);
      if (editingFood) {
        const updated = await ownerApi.updateFood(restaurant.id, editingFood.id, foodForm);
        setFoods((prev) => prev.map((f) => (f.id === editingFood.id ? { ...f, ...updated } : f)));
        showToast('success', `Đã cập nhật món "${updated.name}"`);
      } else {
        const created = await ownerApi.createFood(restaurant.id, foodForm);
        setFoods((prev) => [created, ...prev]);
        showToast('success', `Đã thêm món "${created.name}" vào thực đơn`);
      }
      setShowFoodModal(false);
      onRefreshStats?.();
    } catch (err: any) {
      alert(`Lỗi lưu món ăn: ${err?.message || 'Lỗi thao tác'}`);
    } finally {
      setSubmittingFood(false);
    }
  };

  // Xóa món ăn
  const handleDeleteFood = async (food: OwnerFood) => {
    if (!restaurant) return;
    if (!confirm(`Bạn có chắc muốn xóa món "${food.name}" khỏi thực đơn?`)) return;

    try {
      await ownerApi.deleteFood(restaurant.id, food.id);
      setFoods((prev) => prev.filter((f) => f.id !== food.id));
      showToast('success', `Đã xóa món "${food.name}"`);
      onRefreshStats?.();
    } catch (err: any) {
      showToast('error', `Không xóa được món: ${err?.message || 'Lỗi'}`);
    }
  };

  // Danh mục: Mở modal thêm
  const handleOpenAddCategory = () => {
    setEditingCategory(null);
    setCategoryForm({ name: '', description: '' });
    setShowCategoryModal(true);
  };

  // Danh mục: Mở modal sửa
  const handleOpenEditCategory = (cat: OwnerCategory) => {
    setEditingCategory(cat);
    setCategoryForm({ name: cat.name, description: cat.description || '' });
    setShowCategoryModal(true);
  };

  // Danh mục: Lưu
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurant) return;
    if (!categoryForm.name.trim()) {
      alert('Vui lòng nhập tên danh mục.');
      return;
    }

    try {
      setSubmittingCategory(true);
      if (editingCategory) {
        const updated = await ownerApi.updateCategory(restaurant.id, editingCategory.id, categoryForm);
        setCategories((prev) => prev.map((c) => (c.id === editingCategory.id ? { ...c, ...updated } : c)));
        showToast('success', `Đã cập nhật danh mục "${updated.name}"`);
      } else {
        const created = await ownerApi.createCategory(restaurant.id, categoryForm);
        setCategories((prev) => [...prev, created]);
        showToast('success', `Đã tạo danh mục mới "${created.name}"`);
      }
      setShowCategoryModal(false);
    } catch (err: any) {
      alert(`Lỗi lưu danh mục: ${err?.message || 'Lỗi thao tác'}`);
    } finally {
      setSubmittingCategory(false);
    }
  };

  // Danh mục: Xóa
  const handleDeleteCategory = async (cat: OwnerCategory) => {
    if (!restaurant) return;
    if (!confirm(`Bạn có chắc muốn xóa danh mục "${cat.name}"? Chỉ có thể xóa khi danh mục không có món nào.`)) return;

    try {
      await ownerApi.deleteCategory(restaurant.id, cat.id);
      setCategories((prev) => prev.filter((c) => c.id !== cat.id));
      showToast('success', `Đã xóa danh mục "${cat.name}"`);
    } catch (err: any) {
      alert(`Không thể xóa danh mục: ${err?.message || 'Lỗi'}`);
    }
  };

  if (!restaurant) {
    return (
      <div className="view-container">
        <div className="empty-state-card" style={{ padding: '60px 20px', textAlign: 'center' }}>
          <UtensilsCrossed size={48} color="#94a3b8" style={{ margin: '0 auto 16px auto' }} />
          <h3>Chưa chọn nhà hàng</h3>
          <p style={{ color: '#64748b' }}>Vui lòng chọn một nhà hàng từ menu bên trái để quản lý thực đơn.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="view-container" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
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

      {/* Sub-tab Navigation & Actions Bar */}
      <div className="panel" style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          {/* Main Sub-tabs: Foods / Categories */}
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => setActiveSubTab('FOODS')}
              className={`filter-pill ${activeSubTab === 'FOODS' ? 'active' : ''}`}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <UtensilsCrossed size={15} />
              <span>Danh sách Món ăn ({foods.length})</span>
            </button>

            <button
              onClick={() => setActiveSubTab('CATEGORIES')}
              className={`filter-pill ${activeSubTab === 'CATEGORIES' ? 'active' : ''}`}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Layers size={15} />
              <span>Danh mục Thực đơn ({categories.length})</span>
            </button>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {activeSubTab === 'FOODS' ? (
              <button
                onClick={handleOpenAddFood}
                className="btn btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#ea580c', borderColor: '#ea580c' }}
              >
                <Plus size={16} />
                <span>Thêm món ăn mới</span>
              </button>
            ) : (
              <button
                onClick={handleOpenAddCategory}
                className="btn btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#ea580c', borderColor: '#ea580c' }}
              >
                <FolderPlus size={16} />
                <span>Tạo danh mục mới</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter bar for Foods sub-tab */}
        {activeSubTab === 'FOODS' && (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: 12,
              marginTop: 16,
              paddingTop: 16,
              borderTop: '1px solid #f1f5f9',
            }}
          >
            {/* Search */}
            <div className="search-input-box" style={{ width: 240 }}>
              <Search size={15} className="icon" />
              <input
                type="text"
                placeholder="Tìm tên món ăn..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
              style={{
                padding: '8px 12px',
                borderRadius: 10,
                border: '1px solid #e2e8f0',
                background: '#fff',
                fontSize: '0.85rem',
                color: '#0f172a',
                outline: 'none',
              }}
            >
              <option value="ALL">Tất cả danh mục ({categories.length})</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              style={{
                padding: '8px 12px',
                borderRadius: 10,
                border: '1px solid #e2e8f0',
                background: '#fff',
                fontSize: '0.85rem',
                color: '#0f172a',
                outline: 'none',
              }}
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="AVAILABLE">Đang bán (Còn món)</option>
              <option value="UNAVAILABLE">Tạm ngưng (Hết món)</option>
            </select>
          </div>
        )}
      </div>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fee2e2', color: '#dc2626', borderRadius: 12, padding: '12px 16px' }}>
          {error}
        </div>
      )}

      {/* CONTENT TAB 1: FOODS GRID / TABLE */}
      {activeSubTab === 'FOODS' && (
        <div className="panel" style={{ padding: 20 }}>
          {loading && foods.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px 0', color: '#64748b' }}>
              <div className="spinner" style={{ margin: '0 auto 12px auto' }} />
              <p>Đang tải danh sách món ăn...</p>
            </div>
          ) : filteredFoods.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px 20px', color: '#94a3b8' }}>
              <UtensilsCrossed size={42} style={{ margin: '0 auto 12px auto', opacity: 0.5 }} />
              <div style={{ fontSize: '1rem', fontWeight: 700, color: '#475569' }}>
                Không có món ăn nào
              </div>
              <p style={{ fontSize: '0.84rem', marginTop: 4 }}>
                {foods.length === 0
                  ? 'Quán chưa có món ăn nào trong thực đơn. Nhấn nút "Thêm món ăn mới" ở trên để tạo món.'
                  : 'Không có món ăn nào phù hợp với bộ lọc tìm kiếm.'}
              </p>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: 16,
              }}
            >
              {filteredFoods.map((food) => {
                const isAvailable = food.status === 'AVAILABLE';
                const catName = categories.find((c) => c.id === food.category_id)?.name || food.category?.name || 'Khác';

                return (
                  <div
                    key={food.id}
                    style={{
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: 14,
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                      boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
                      transition: 'all 0.2s',
                    }}
                  >
                    {/* Food Image */}
                    <div style={{ height: 160, position: 'relative', background: '#f1f5f9' }}>
                      <img
                        src={resolveImageUrl(food.image)}
                        alt={food.name}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          filter: !isAvailable ? 'grayscale(80%) opacity(70%)' : 'none',
                        }}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = DEFAULT_FOOD_IMAGE;
                        }}
                      />

                      {/* Status Tag on image */}
                      <div
                        style={{
                          position: 'absolute',
                          top: 10,
                          left: 10,
                          padding: '4px 9px',
                          borderRadius: 999,
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          background: isAvailable ? 'rgba(16, 185, 129, 0.95)' : 'rgba(239, 68, 68, 0.95)',
                          color: '#fff',
                          backdropFilter: 'blur(4px)',
                        }}
                      >
                        {isAvailable ? '● Đang bán' : '○ Tạm hết'}
                      </div>

                      {/* Category Tag */}
                      <div
                        style={{
                          position: 'absolute',
                          bottom: 10,
                          left: 10,
                          padding: '3px 8px',
                          borderRadius: 6,
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          background: 'rgba(15, 23, 42, 0.75)',
                          color: '#fff',
                        }}
                      >
                        {catName}
                      </div>
                    </div>

                    {/* Food Info Body */}
                    <div style={{ padding: 14, flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <div style={{ fontSize: '0.98rem', fontWeight: 800, color: '#0f172a' }}>
                        {food.name}
                      </div>

                      <div
                        style={{
                          fontSize: '0.78rem',
                          color: '#64748b',
                          marginTop: 4,
                          lineHeight: 1.4,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          height: 34,
                        }}
                      >
                        {food.description || 'Chưa có mô tả chi tiết cho món ăn này.'}
                      </div>

                      <div style={{ marginTop: 'auto', paddingTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ea580c' }}>
                          {formatMoney(food.price)}
                        </div>

                        {/* Quick Toggle Status Switch */}
                        <button
                          onClick={() => handleToggleFood(food)}
                          style={{
                            border: 'none',
                            background: 'transparent',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            color: isAvailable ? '#10b981' : '#94a3b8',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                          }}
                          title={isAvailable ? 'Nhấn để tạm tắt (báo hết món)' : 'Nhấn để mở bán lại'}
                        >
                          {isAvailable ? <ToggleRight size={26} color="#10b981" /> : <ToggleLeft size={26} color="#94a3b8" />}
                        </button>
                      </div>
                    </div>

                    {/* Actions Footer */}
                    <div
                      style={{
                        padding: '10px 14px',
                        background: '#f8fafc',
                        borderTop: '1px solid #f1f5f9',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        gap: 8,
                      }}
                    >
                      <button
                        onClick={() => handleOpenEditFood(food)}
                        className="btn btn-secondary"
                        style={{ padding: '6px 12px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 4 }}
                      >
                        <Pencil size={13} />
                        <span>Sửa</span>
                      </button>
                      <button
                        onClick={() => handleDeleteFood(food)}
                        style={{
                          padding: '6px 10px',
                          background: '#fef2f2',
                          border: '1px solid #fee2e2',
                          color: '#dc2626',
                          borderRadius: 8,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          fontSize: '0.78rem',
                        }}
                      >
                        <Trash2 size={13} />
                        <span>Xóa</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* CONTENT TAB 2: CATEGORIES LIST */}
      {activeSubTab === 'CATEGORIES' && (
        <div className="panel" style={{ padding: 20 }}>
          {categories.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px 20px', color: '#94a3b8' }}>
              <Folder size={42} style={{ margin: '0 auto 12px auto', opacity: 0.5 }} />
              <div style={{ fontSize: '1rem', fontWeight: 700, color: '#475569' }}>
                Chưa có danh mục món nào
              </div>
              <p style={{ fontSize: '0.84rem', marginTop: 4 }}>
                Tạo các danh mục như "Cơm", "Món nước", "Trà sữa", "Khai vị" để nhóm món ăn gọn gàng.
              </p>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: 16,
              }}
            >
              {categories.map((cat) => {
                const count = foods.filter((f) => f.category_id === cat.id).length;

                return (
                  <div
                    key={cat.id}
                    style={{
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: 14,
                      padding: 16,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      boxShadow: '0 2px 6px rgba(15, 23, 42, 0.03)',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: 10,
                              background: 'rgba(234, 88, 12, 0.1)',
                              color: '#ea580c',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Folder size={18} />
                          </div>
                          <div>
                            <div style={{ fontWeight: 800, fontSize: '0.98rem', color: '#0f172a' }}>
                              {cat.name}
                            </div>
                            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                              {count} món ăn trong mục này
                            </span>
                          </div>
                        </div>
                      </div>

                      {cat.description && (
                        <p style={{ fontSize: '0.82rem', color: '#64748b', marginTop: 10, lineHeight: 1.4 }}>
                          {cat.description}
                        </p>
                      )}
                    </div>

                    <div
                      style={{
                        marginTop: 16,
                        paddingTop: 12,
                        borderTop: '1px solid #f1f5f9',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        gap: 8,
                      }}
                    >
                      <button
                        onClick={() => handleOpenEditCategory(cat)}
                        className="btn btn-secondary"
                        style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                      >
                        Sửa
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(cat)}
                        style={{
                          padding: '6px 10px',
                          background: '#fef2f2',
                          border: '1px solid #fee2e2',
                          color: '#dc2626',
                          borderRadius: 8,
                          cursor: 'pointer',
                          fontSize: '0.78rem',
                        }}
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* MODAL THÊM / SỬA MÓN ĂN */}
      {showFoodModal && (
        <div className="modal-overlay" onClick={() => setShowFoodModal(false)}>
          <div
            className="modal-card"
            style={{ maxWidth: 540, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 14, borderBottom: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
                {editingFood ? 'Chỉnh Sửa Món Ăn' : 'Thêm Món Ăn Mới Vào Menu'}
              </h3>
              <button onClick={() => setShowFoodModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveFood} style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 16 }}>
              {/* Tên món */}
              <div className="form-group">
                <label>Tên món ăn (*)</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Cơm sườn nướng mật ong"
                  value={foodForm.name}
                  onChange={(e) => setFoodForm({ ...foodForm, name: e.target.value })}
                  required
                />
              </div>

              {/* Danh mục & Đơn giá */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div className="form-group">
                  <label>Thuộc danh mục (*)</label>
                  <select
                    value={foodForm.category_id}
                    onChange={(e) => setFoodForm({ ...foodForm, category_id: Number(e.target.value) })}
                    required
                    style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #cbd5e1', background: '#fff' }}
                  >
                    <option value={0} disabled>-- Chọn danh mục --</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Giá bán (VNĐ) (*)</label>
                  <input
                    type="number"
                    min={0}
                    step={1000}
                    value={foodForm.price}
                    onChange={(e) => setFoodForm({ ...foodForm, price: Number(e.target.value) })}
                    required
                  />
                </div>
              </div>

              {/* Mô tả */}
              <div className="form-group">
                <label>Mô tả chi tiết</label>
                <textarea
                  rows={2}
                  placeholder="Mô tả nguyên liệu, hương vị món ăn..."
                  value={foodForm.description}
                  onChange={(e) => setFoodForm({ ...foodForm, description: e.target.value })}
                  style={{
                    padding: 10,
                    borderRadius: 10,
                    border: '1px solid #cbd5e1',
                    fontFamily: 'inherit',
                    fontSize: '0.88rem',
                  }}
                />
              </div>

              {/* Upload ảnh hoặc nhập URL */}
              <div className="form-group">
                <label>Hình ảnh món ăn</label>
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
                    <span>{uploadingImage ? 'Đang tải ảnh...' : 'Chọn file ảnh từ máy'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileChange}
                      disabled={uploadingImage}
                      style={{ display: 'none' }}
                    />
                  </label>
                  <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>hoặc dán đường dẫn ảnh bên dưới:</span>
                </div>

                <input
                  type="text"
                  placeholder="https://images.unsplash.com/photo-..."
                  value={foodForm.image}
                  onChange={(e) => setFoodForm({ ...foodForm, image: e.target.value })}
                />

                {foodForm.image && (
                  <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 8, overflow: 'hidden', background: '#f1f5f9', border: '1px solid #e2e8f0' }}>
                      <img
                        src={resolveImageUrl(foodForm.image)}
                        alt="Preview"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = DEFAULT_FOOD_IMAGE;
                        }}
                      />
                    </div>
                    <span style={{ fontSize: '0.76rem', color: '#10b981' }}>✓ Xem trước ảnh hiển thị tốt</span>
                  </div>
                )}
              </div>

              {/* Trạng thái mở bán */}
              <div className="form-group">
                <label>Trạng thái</label>
                <div style={{ display: 'flex', gap: 16 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: '0.88rem' }}>
                    <input
                      type="radio"
                      name="foodStatus"
                      checked={foodForm.status === 'AVAILABLE'}
                      onChange={() => setFoodForm({ ...foodForm, status: 'AVAILABLE' })}
                    />
                    <span>Còn món (Đang mở bán)</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: '0.88rem' }}>
                    <input
                      type="radio"
                      name="foodStatus"
                      checked={foodForm.status === 'UNAVAILABLE'}
                      onChange={() => setFoodForm({ ...foodForm, status: 'UNAVAILABLE' })}
                    />
                    <span>Hết món (Tạm ẩn)</span>
                  </label>
                </div>
              </div>

              {/* Modal Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12, borderTop: '1px solid #e2e8f0', paddingTop: 14 }}>
                <button type="button" onClick={() => setShowFoodModal(false)} className="btn btn-secondary">
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={submittingFood}
                  className="btn btn-primary"
                  style={{ background: '#ea580c', borderColor: '#ea580c' }}
                >
                  {submittingFood ? 'Đang lưu...' : editingFood ? 'Cập nhật món' : 'Thêm vào thực đơn'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL THÊM / SỬA DANH MỤC */}
      {showCategoryModal && (
        <div className="modal-overlay" onClick={() => setShowCategoryModal(false)}>
          <div
            className="modal-card"
            style={{ maxWidth: 440, width: '100%' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 14, borderBottom: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
                {editingCategory ? 'Chỉnh Sửa Danh Mục' : 'Tạo Danh Mục Mới'}
              </h3>
              <button onClick={() => setShowCategoryModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 16 }}>
              <div className="form-group">
                <label>Tên danh mục (*)</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Cơm phần, Trà sữa, Món tráng miệng"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Mô tả ngắn</label>
                <input
                  type="text"
                  placeholder="Mô tả nhóm món ăn..."
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
                <button type="button" onClick={() => setShowCategoryModal(false)} className="btn btn-secondary">
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submittingCategory}
                  className="btn btn-primary"
                  style={{ background: '#ea580c', borderColor: '#ea580c' }}
                >
                  {submittingCategory ? 'Đang lưu...' : editingCategory ? 'Lưu danh mục' : 'Tạo danh mục'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
