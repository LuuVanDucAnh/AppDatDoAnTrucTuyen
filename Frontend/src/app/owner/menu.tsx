import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { OwnerHeader, OwnerStateScreen, OwnerTabBar } from '@/components/owner-chrome';
import { useOwner } from '@/context/OwnerContext';
import { ApiError, ownerApi } from '@/services/api';
import { resolveImageUrl } from '@/services/config';
import type { ApiCategory, ApiFood } from '@/services/types';

const money = (v: number | string) => Number(v ?? 0).toLocaleString('vi-VN');

export default function OwnerMenuScreen() {
  const { restaurant, loading: ownerLoading, error: ownerError, reload } = useOwner();

  const [foods, setFoods] = useState<ApiFood[]>([]);
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<number | 'all'>('all');
  const [togglingId, setTogglingId] = useState<number | null>(null);

  // Form thêm món
  const [showAddFood, setShowAddFood] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newFood, setNewFood] = useState({
    name: '',
    price: '',
    description: '',
    image: '',
    categoryId: null as number | null,
  });

  // Form thêm nhóm món
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const load = useCallback(async () => {
    if (!restaurant) return;
    try {
      const [f, c] = await Promise.all([
        ownerApi.getFoods(restaurant.id),
        ownerApi.getCategories(restaurant.id),
      ]);
      setFoods(f.data);
      setCategories(c);
    } catch (err) {
      Alert.alert('Không tải được thực đơn', err instanceof Error ? err.message : String(err));
    }
  }, [restaurant]);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      (async () => {
        setLoading(true);
        await load();
        if (alive) setLoading(false);
      })();
      return () => {
        alive = false;
      };
    }, [load])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

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

  const countByCategory = useCallback(
    (id: number) => foods.filter((f) => f.category_id === id).length,
    [foods]
  );

  // PATCH toggle-status: AVAILABLE ↔ OUT_OF_STOCK
  const toggleFood = async (food: ApiFood) => {
    if (!restaurant) return;
    setTogglingId(food.id);
    try {
      const updated = await ownerApi.toggleFoodStatus(restaurant.id, food.id);
      setFoods((prev) => prev.map((f) => (f.id === food.id ? { ...f, status: updated.status } : f)));
    } catch (err) {
      Alert.alert('Không đổi được trạng thái món', err instanceof ApiError ? err.message : String(err));
    } finally {
      setTogglingId(null);
    }
  };

  const openAddFood = () => {
    if (categories.length === 0) {
      Alert.alert(
        'Chưa có nhóm món',
        'Bạn cần tạo ít nhất 1 nhóm món trước khi thêm món ăn (Backend yêu cầu category_id).'
      );
      setShowAddCategory(true);
      return;
    }
    setNewFood({ name: '', price: '', description: '', image: '', categoryId: categories[0].id });
    setShowAddFood(true);
  };

  const saveFood = async () => {
    if (!restaurant) return;
    const price = Number(newFood.price.replace(/[^\d]/g, ''));
    if (!newFood.name.trim() || !price) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập tên món và giá bán.');
      return;
    }
    if (!newFood.categoryId) {
      Alert.alert('Thiếu nhóm món', 'Vui lòng chọn nhóm món cho món ăn này.');
      return;
    }

    setSaving(true);
    try {
      await ownerApi.createFood(restaurant.id, {
        category_id: newFood.categoryId,
        name: newFood.name.trim(),
        price,
        description: newFood.description.trim() || undefined,
        image: newFood.image.trim() || undefined,
      });
      setShowAddFood(false);
      await load();
      Alert.alert('Đã thêm món', `"${newFood.name.trim()}" đã được thêm vào thực đơn.`);
    } catch (err) {
      Alert.alert('Không thêm được món', err instanceof ApiError ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  const saveCategory = async () => {
    if (!restaurant || !newCategoryName.trim()) {
      Alert.alert('Thiếu tên nhóm', 'Vui lòng nhập tên nhóm món.');
      return;
    }
    setSaving(true);
    try {
      await ownerApi.createCategory(restaurant.id, { name: newCategoryName.trim() });
      setNewCategoryName('');
      setShowAddCategory(false);
      await load();
    } catch (err) {
      Alert.alert('Không tạo được nhóm món', err instanceof ApiError ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  if (ownerLoading || ownerError || !restaurant) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <OwnerStateScreen loading={ownerLoading} error={ownerError} onRetry={() => void reload()} />
        <OwnerTabBar />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <OwnerHeader />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void onRefresh()}
            colors={['#EA580C']}
            tintColor="#EA580C"
          />
        }
      >
        {/* Tiêu đề + nút thêm món */}
        <View style={styles.titleRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Thực đơn quán</Text>
            <Text style={styles.subtitle}>Kiểm soát món ăn & tình trạng còn hàng</Text>
          </View>
          <TouchableOpacity style={styles.addBtn} activeOpacity={0.85} onPress={openAddFood}>
            <Ionicons name="add" size={16} color="#FFFFFF" />
            <Text style={styles.addBtnText}>Thêm món</Text>
          </TouchableOpacity>
        </View>

        {/* Thống kê nhanh */}
        <View style={styles.statRow}>
          <View style={[styles.statBox, { backgroundColor: '#DCFCE7' }]}>
            <View style={styles.statTop}>
              <View style={[styles.dot, { backgroundColor: '#16A34A' }]} />
              <Text style={[styles.statLabel, { color: '#15803D' }]}>Đang mở bán</Text>
            </View>
            <Text style={[styles.statValue, { color: '#14532D' }]}>{availableCount} món</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: '#FEE2E2' }]}>
            <View style={styles.statTop}>
              <View style={[styles.dot, { backgroundColor: '#DC2626' }]} />
              <Text style={[styles.statLabel, { color: '#B91C1C' }]}>Tạm hết hàng</Text>
            </View>
            <Text style={[styles.statValue, { color: '#7F1D1D' }]}>{outOfStockCount} món</Text>
          </View>
        </View>

        {/* Tìm kiếm */}
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={17} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm món trong thực đơn..."
            placeholderTextColor="#9CA3AF"
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={16} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>

        {/* Lọc theo nhóm món */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          <TouchableOpacity
            style={[styles.chip, categoryFilter === 'all' && styles.chipActive]}
            onPress={() => setCategoryFilter('all')}
          >
            <Text style={[styles.chipText, categoryFilter === 'all' && styles.chipTextActive]}>
              Tất cả ({foods.length})
            </Text>
          </TouchableOpacity>
          {categories.map((c) => {
            const active = categoryFilter === c.id;
            return (
              <TouchableOpacity
                key={c.id}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => setCategoryFilter(c.id)}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {c.name} ({countByCategory(c.id)})
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Danh sách món */}
        <Text style={styles.sectionLabel}>Danh sách món ăn</Text>

        {loading && foods.length === 0 ? (
          <View style={styles.empty}>
            <ActivityIndicator size="large" color="#EA580C" />
            <Text style={styles.emptyText}>Đang tải thực đơn...</Text>
          </View>
        ) : shownFoods.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="fast-food-outline" size={44} color="#D1D5DB" />
            <Text style={styles.emptyText}>Không có món nào khớp bộ lọc.</Text>
          </View>
        ) : (
          shownFoods.map((food) => {
            const isAvailable = food.status === 'AVAILABLE';
            return (
              <View key={food.id} style={[styles.foodCard, !isAvailable && styles.foodCardOff]}>
                <Image source={{ uri: resolveImageUrl(food.image) }} style={styles.foodImage} />

                <View style={{ flex: 1 }}>
                  <Text style={styles.foodName} numberOfLines={1}>
                    {food.name}
                  </Text>
                  <Text style={styles.foodPrice}>{money(food.price)}đ</Text>
                  <Text style={styles.foodCategory} numberOfLines={1}>
                    {food.category?.name ?? 'Chưa phân nhóm'}
                  </Text>

                  {!isAvailable && (
                    <View style={styles.offBanner}>
                      <Ionicons name="eye-off-outline" size={11} color="#B91C1C" />
                      <Text style={styles.offBannerText}>
                        Tạm hết hàng · Đang ẩn khỏi menu khách
                      </Text>
                    </View>
                  )}
                </View>

                {togglingId === food.id ? (
                  <ActivityIndicator color="#EA580C" style={{ width: 44 }} />
                ) : (
                  <Switch
                    value={isAvailable}
                    onValueChange={() => void toggleFood(food)}
                    trackColor={{ false: '#FCA5A5', true: '#86EFAC' }}
                    thumbColor={isAvailable ? '#16A34A' : '#DC2626'}
                  />
                )}
              </View>
            );
          })
        )}

        {/* Quản lý nhóm món */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Quản lý nhóm món</Text>
            <TouchableOpacity onPress={() => setShowAddCategory(true)}>
              <Text style={styles.linkText}>+ Tạo nhóm</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.cardSub}>
            Nhóm món quyết định cách khách nhìn thấy thực đơn theo từng mục.
          </Text>
          <View style={styles.categoryChips}>
            {categories.length === 0 ? (
              <Text style={styles.emptyText}>Quán chưa có nhóm món nào.</Text>
            ) : (
              categories.map((c) => (
                <View key={c.id} style={styles.categoryChip}>
                  <Text style={styles.categoryChipText}>{c.name}</Text>
                  <View style={styles.categoryChipCount}>
                    <Text style={styles.categoryChipCountText}>{countByCategory(c.id)}</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </View>

        <View style={{ height: 16 }} />
      </ScrollView>

      <OwnerTabBar />

      {/* ── Modal: thêm món ─────────────────────────────────────────────── */}
      <Modal visible={showAddFood} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Thêm món mới</Text>
              <TouchableOpacity onPress={() => setShowAddFood(false)}>
                <Ionicons name="close" size={22} color="#4B5563" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 420 }} keyboardShouldPersistTaps="handled">
              <Text style={styles.fieldLabel}>Nhóm món *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
                {categories.map((c) => {
                  const active = newFood.categoryId === c.id;
                  return (
                    <TouchableOpacity
                      key={c.id}
                      style={[styles.chip, active && styles.chipActive]}
                      onPress={() => setNewFood((s) => ({ ...s, categoryId: c.id }))}
                    >
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>{c.name}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <Text style={styles.fieldLabel}>Tên món *</Text>
              <TextInput
                style={styles.input}
                placeholder="VD: Cơm tấm sườn nướng"
                value={newFood.name}
                onChangeText={(t) => setNewFood((s) => ({ ...s, name: t }))}
              />

              <Text style={styles.fieldLabel}>Giá bán (đ) *</Text>
              <TextInput
                style={styles.input}
                placeholder="VD: 55000"
                keyboardType="number-pad"
                value={newFood.price}
                onChangeText={(t) => setNewFood((s) => ({ ...s, price: t }))}
              />

              <Text style={styles.fieldLabel}>Mô tả</Text>
              <TextInput
                style={[styles.input, { height: 70, textAlignVertical: 'top' }]}
                placeholder="Mô tả ngắn về món ăn"
                multiline
                value={newFood.description}
                onChangeText={(t) => setNewFood((s) => ({ ...s, description: t }))}
              />

              <Text style={styles.fieldLabel}>Link ảnh</Text>
              <TextInput
                style={styles.input}
                placeholder="https://..."
                autoCapitalize="none"
                value={newFood.image}
                onChangeText={(t) => setNewFood((s) => ({ ...s, image: t }))}
              />
              <Text style={styles.fieldHint}>
                Dán URL ảnh đầy đủ. (Chưa nối chức năng upload ảnh từ máy.)
              </Text>
            </ScrollView>

            <TouchableOpacity
              style={[styles.saveBtn, saving && { opacity: 0.7 }]}
              disabled={saving}
              onPress={() => void saveFood()}
            >
              {saving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.saveBtnText}>Lưu món vào thực đơn</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Modal: thêm nhóm món ────────────────────────────────────────── */}
      <Modal visible={showAddCategory} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Tạo nhóm món</Text>
              <TouchableOpacity onPress={() => setShowAddCategory(false)}>
                <Ionicons name="close" size={22} color="#4B5563" />
              </TouchableOpacity>
            </View>

            <Text style={styles.fieldLabel}>Tên nhóm *</Text>
            <TextInput
              style={styles.input}
              placeholder="VD: Món chính, Đồ uống, Tráng miệng"
              value={newCategoryName}
              onChangeText={setNewCategoryName}
            />

            <TouchableOpacity
              style={[styles.saveBtn, saving && { opacity: 0.7 }]}
              disabled={saving}
              onPress={() => void saveCategory()}
            >
              {saving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.saveBtnText}>Tạo nhóm</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 14, gap: 11 },

  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  title: { fontSize: 17, fontWeight: '800', color: '#111827' },
  subtitle: { fontSize: 11.5, color: '#94A3B8', marginTop: 2 },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EA580C',
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 10,
  },
  addBtnText: { fontSize: 12.5, fontWeight: '800', color: '#FFFFFF' },

  statRow: { flexDirection: 'row', gap: 10 },
  statBox: { flex: 1, borderRadius: 12, padding: 11, gap: 5 },
  statTop: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  statLabel: { fontSize: 11, fontWeight: '700' },
  statValue: { fontSize: 17, fontWeight: '800' },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 11,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchInput: { flex: 1, fontSize: 13, color: '#111827', padding: 0 },

  chips: { gap: 7, paddingVertical: 2, paddingRight: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chipActive: { backgroundColor: '#FFEDD5', borderColor: '#FDBA74' },
  chipText: { fontSize: 11.5, fontWeight: '600', color: '#64748B' },
  chipTextActive: { color: '#C2410C', fontWeight: '800' },

  sectionLabel: { fontSize: 14, fontWeight: '800', color: '#111827', marginTop: 4 },

  foodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    backgroundColor: '#FFFFFF',
    borderRadius: 13,
    padding: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  foodCardOff: { backgroundColor: '#FEFCFC', borderColor: '#FECACA' },
  foodImage: { width: 56, height: 56, borderRadius: 10, backgroundColor: '#F1F5F9' },
  foodName: { fontSize: 13.5, fontWeight: '700', color: '#1F2937' },
  foodPrice: { fontSize: 14, fontWeight: '800', color: '#EA580C', marginTop: 2 },
  foodCategory: { fontSize: 10.5, color: '#94A3B8', marginTop: 2 },
  offBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 5,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  offBannerText: { fontSize: 9.5, fontWeight: '700', color: '#B91C1C' },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 13,
    padding: 13,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    gap: 8,
    marginTop: 4,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 14, fontWeight: '800', color: '#111827' },
  cardSub: { fontSize: 11, color: '#94A3B8', lineHeight: 16 },
  linkText: { fontSize: 12, fontWeight: '700', color: '#EA580C' },
  categoryChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 2 },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  categoryChipText: { fontSize: 11.5, fontWeight: '600', color: '#475569' },
  categoryChipCount: {
    minWidth: 17,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: '#FFEDD5',
    alignItems: 'center',
  },
  categoryChipCountText: { fontSize: 9.5, fontWeight: '800', color: '#C2410C' },

  empty: { alignItems: 'center', paddingVertical: 40, gap: 8 },
  emptyText: { fontSize: 12.5, color: '#6B7280' },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 18,
    gap: 6,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  modalTitle: { fontSize: 16, fontWeight: '800', color: '#111827' },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: '#374151', marginTop: 10, marginBottom: 5 },
  fieldHint: { fontSize: 10.5, color: '#94A3B8', marginTop: 4 },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#111827',
    backgroundColor: '#F9FAFB',
  },
  saveBtn: {
    marginTop: 16,
    backgroundColor: '#EA580C',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveBtnText: { fontSize: 14, fontWeight: '800', color: '#FFFFFF' },
});
