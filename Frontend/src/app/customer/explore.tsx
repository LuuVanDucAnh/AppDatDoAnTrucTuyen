import { FontAwesome5, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { useApp } from '@/context/AppContext';
import { foodApi, restaurantApi, searchApi } from '@/services/api';
import { resolveImageUrl, DEFAULT_FOOD_IMAGE, DEFAULT_RESTAURANT_IMAGE } from '@/services/config';
import type { ApiFood, ApiRestaurant } from '@/services/types';

const { width } = Dimensions.get('window');

const CATEGORIES = [
  { id: 'all', name: 'Tất cả', icon: 'utensils', type: 'fa5' },
  { id: 'com', name: 'Cơm', icon: 'bowl-rice', type: 'fa5', keywords: ['cơm'] },
  { id: 'bun_pho', name: 'Bún / Phở', icon: 'noodles', type: 'mci', keywords: ['bún', 'phở', 'mì', 'quẩy'] },
  { id: 'tra_sua', name: 'Trà Sữa', icon: 'coffee', type: 'fa5', keywords: ['trà', 'sữa', 'trân châu', 'macchiato'] },
  { id: 'ga_ran', name: 'Gà rán / Burger', icon: 'drumstick-bite', type: 'fa5', keywords: ['gà', 'burger'] },
  { id: 'pizza', name: 'Pizza / Mì Ý', icon: 'pizza-slice', type: 'fa5', keywords: ['pizza', 'mì ý', 'spaghetti'] },
  { id: 'an_vat', name: 'Ăn vặt', icon: 'cookie-bite', type: 'fa5', keywords: ['chả', 'bì', 'khoai', 'quẩy', 'trứng'] },
  { id: 'trang_mieng', name: 'Tráng miệng', icon: 'ice-cream', type: 'fa5', keywords: ['kem', 'chè', 'bánh'] },
];

type PriceFilter = 'all' | 'under30' | '30to70' | 'above70';
type SortOption = 'default' | 'rating' | 'priceAsc';

export default function ExploreScreen() {
  const router = useRouter();
  const { addToCart, cartCount, totalAmount } = useApp();

  const [activeTab, setActiveTab] = useState<'foods' | 'restaurants'>('foods');
  const [keyword, setKeyword] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [priceFilter, setPriceFilter] = useState<PriceFilter>('all');
  const [sortOption, setSortOption] = useState<SortOption>('default');

  const [foods, setFoods] = useState<ApiFood[]>([]);
  const [restaurants, setRestaurants] = useState<ApiRestaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [addingFoodId, setAddingFoodId] = useState<number | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [resResult, foodResult] = await Promise.all([
        restaurantApi.getActive({ limit: 50 }),
        foodApi.getFeatured(50),
      ]);
      setRestaurants(resResult.data);
      setFoods(foodResult);
    } catch {
      // Silently keep existing
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void loadData();
  }, [loadData]);

  // Lọc món ăn
  const filteredFoods = useMemo(() => {
    let result = [...foods];
    const kw = keyword.trim().toLowerCase();

    if (kw) {
      result = result.filter(
        (f) =>
          f.name.toLowerCase().includes(kw) ||
          f.description?.toLowerCase().includes(kw)
      );
    }

    if (selectedCategory !== 'all') {
      const cat = CATEGORIES.find((c) => c.id === selectedCategory);
      if (cat?.keywords) {
        result = result.filter((f) => {
          const text = `${f.name} ${f.description || ''}`.toLowerCase();
          return cat.keywords!.some((k) => text.includes(k));
        });
      }
    }

    if (priceFilter === 'under30') {
      result = result.filter((f) => Number(f.price) < 30000);
    } else if (priceFilter === '30to70') {
      result = result.filter((f) => Number(f.price) >= 30000 && Number(f.price) <= 70000);
    } else if (priceFilter === 'above70') {
      result = result.filter((f) => Number(f.price) > 70000);
    }

    if (sortOption === 'priceAsc') {
      result.sort((a, b) => Number(a.price) - Number(b.price));
    }

    return result;
  }, [foods, keyword, selectedCategory, priceFilter, sortOption]);

  // Lọc quán ăn
  const filteredRestaurants = useMemo(() => {
    let result = [...restaurants];
    const kw = keyword.trim().toLowerCase();

    if (kw) {
      result = result.filter(
        (r) =>
          r.name.toLowerCase().includes(kw) ||
          r.address.toLowerCase().includes(kw) ||
          r.description?.toLowerCase().includes(kw)
      );
    }

    if (selectedCategory !== 'all') {
      const cat = CATEGORIES.find((c) => c.id === selectedCategory);
      if (cat?.keywords) {
        result = result.filter((r) => {
          const text = `${r.name} ${r.description || ''}`.toLowerCase();
          return cat.keywords!.some((k) => text.includes(k));
        });
      }
    }

    if (sortOption === 'rating') {
      result.sort((a, b) => Number(b.average_rating || 0) - Number(a.average_rating || 0));
    }

    return result;
  }, [restaurants, keyword, selectedCategory, sortOption]);

  const handleQuickAdd = async (food: ApiFood) => {
    const parentRes = restaurants.find((r) => r.id === (food as any).restaurant_id) || {
      id: (food as any).restaurant_id || 1,
      name: (food as any).restaurant_name || 'Quán ăn',
      isOpen: true,
    };

    setAddingFoodId(food.id);
    await addToCart(
      { id: food.id, name: food.name, price: Number(food.price), image: food.image || undefined },
      parentRes
    );
    setAddingFoodId(null);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Thanh tìm kiếm */}
      <View style={styles.header}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm món ăn, quán ngon, trà sữa..."
            placeholderTextColor="#9CA3AF"
            value={keyword}
            onChangeText={setKeyword}
            returnKeyType="search"
          />
          {keyword.length > 0 && (
            <TouchableOpacity onPress={() => setKeyword('')}>
              <Ionicons name="close-circle" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Chuyển đổi tab: Món ăn / Quán ăn */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'foods' && styles.tabButtonActive]}
          onPress={() => setActiveTab('foods')}
        >
          <Ionicons
            name="fast-food-outline"
            size={16}
            color={activeTab === 'foods' ? '#EA580C' : '#6B7280'}
          />
          <Text style={[styles.tabText, activeTab === 'foods' && styles.tabTextActive]}>
            Món ăn ({filteredFoods.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'restaurants' && styles.tabButtonActive]}
          onPress={() => setActiveTab('restaurants')}
        >
          <Ionicons
            name="storefront-outline"
            size={16}
            color={activeTab === 'restaurants' ? '#EA580C' : '#6B7280'}
          />
          <Text style={[styles.tabText, activeTab === 'restaurants' && styles.tabTextActive]}>
            Quán ăn ({filteredRestaurants.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#EA580C']} />}
      >
        {/* Danh mục ngang */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.categoryChip, isSelected && styles.categoryChipActive]}
                onPress={() => setSelectedCategory(cat.id)}
              >
                {cat.type === 'fa5' ? (
                  <FontAwesome5
                    name={cat.icon as any}
                    size={13}
                    color={isSelected ? '#FFFFFF' : '#4B5563'}
                  />
                ) : (
                  <MaterialCommunityIcons
                    name={cat.icon as any}
                    size={15}
                    color={isSelected ? '#FFFFFF' : '#4B5563'}
                  />
                )}
                <Text style={[styles.categoryChipText, isSelected && styles.categoryChipTextActive]}>
                  {cat.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Bộ lọc khoảng giá (chỉ hiện khi xem Món ăn) */}
        {activeTab === 'foods' && (
          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>Mức giá:</Text>
            {(
              [
                { id: 'all', label: 'Tất cả' },
                { id: 'under30', label: '< 30k' },
                { id: '30to70', label: '30k - 70k' },
                { id: 'above70', label: '> 70k' },
              ] as const
            ).map((p) => (
              <TouchableOpacity
                key={p.id}
                style={[styles.pill, priceFilter === p.id && styles.pillActive]}
                onPress={() => setPriceFilter(p.id)}
              >
                <Text style={[styles.pillText, priceFilter === p.id && styles.pillTextActive]}>
                  {p.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Sắp xếp */}
        <View style={styles.filterRow}>
          <Text style={styles.filterLabel}>Sắp xếp:</Text>
          <TouchableOpacity
            style={[styles.pill, sortOption === 'default' && styles.pillActive]}
            onPress={() => setSortOption('default')}
          >
            <Text style={[styles.pillText, sortOption === 'default' && styles.pillTextActive]}>
              Mặc định
            </Text>
          </TouchableOpacity>
          {activeTab === 'restaurants' && (
            <TouchableOpacity
              style={[styles.pill, sortOption === 'rating' && styles.pillActive]}
              onPress={() => setSortOption('rating')}
            >
              <Text style={[styles.pillText, sortOption === 'rating' && styles.pillTextActive]}>
                Đánh giá cao ★
              </Text>
            </TouchableOpacity>
          )}
          {activeTab === 'foods' && (
            <TouchableOpacity
              style={[styles.pill, sortOption === 'priceAsc' && styles.pillActive]}
              onPress={() => setSortOption('priceAsc')}
            >
              <Text style={[styles.pillText, sortOption === 'priceAsc' && styles.pillTextActive]}>
                Giá rẻ nhất
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color="#EA580C" />
            <Text style={styles.loadingText}>Đang tải dữ liệu khám phá...</Text>
          </View>
        ) : activeTab === 'foods' ? (
          /* Danh sách Món ăn */
          filteredFoods.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="fast-food-outline" size={48} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>Không tìm thấy món ăn phù hợp</Text>
              <Text style={styles.emptySub}>Thử tìm từ khóa khác hoặc điều chỉnh bộ lọc giá</Text>
            </View>
          ) : (
            <View style={styles.foodGrid}>
              {filteredFoods.map((f) => (
                <View key={f.id} style={styles.foodCard}>
                  <Image
                    source={{
                      uri: resolveImageUrl(f.image, DEFAULT_FOOD_IMAGE),
                    }}
                    style={styles.foodImage}
                  />
                  <View style={styles.foodInfo}>
                    <Text style={styles.foodName} numberOfLines={1}>
                      {f.name}
                    </Text>
                    {f.description ? (
                      <Text style={styles.foodDesc} numberOfLines={1}>
                        {f.description}
                      </Text>
                    ) : null}
                    <View style={styles.foodBottomRow}>
                      <Text style={styles.foodPrice}>
                        {Number(f.price).toLocaleString('vi-VN')}đ
                      </Text>
                      <TouchableOpacity
                        style={styles.addBtn}
                        onPress={() => handleQuickAdd(f)}
                        disabled={addingFoodId === f.id}
                      >
                        {addingFoodId === f.id ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <Ionicons name="add" size={18} color="#FFFFFF" />
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )
        ) : (
          /* Danh sách Quán ăn */
          filteredRestaurants.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="storefront-outline" size={48} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>Không tìm thấy quán ăn nào</Text>
              <Text style={styles.emptySub}>Thử thay đổi từ khóa tìm kiếm</Text>
            </View>
          ) : (
            <View style={styles.restaurantList}>
              {filteredRestaurants.map((res) => (
                <TouchableOpacity
                  key={res.id}
                  style={styles.resCard}
                  activeOpacity={0.88}
                  onPress={() =>
                    router.push({
                      pathname: '/customer/restaurant' as any,
                      params: { id: String(res.id) },
                    })
                  }
                >
                  <Image
                    source={{
                      uri: resolveImageUrl(res.image) || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=500',
                    }}
                    style={styles.resImage}
                  />
                  <View style={styles.resInfo}>
                    <View style={styles.resHeaderRow}>
                      <Text style={styles.resName} numberOfLines={1}>
                        {res.name}
                      </Text>
                      <View style={styles.resRatingBadge}>
                        <Ionicons name="star" size={12} color="#F59E0B" />
                        <Text style={styles.resRatingText}>
                          {Number(res.average_rating || 5.0).toFixed(1)}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.resAddress} numberOfLines={1}>
                      <Ionicons name="location-outline" size={12} color="#6B7280" /> {res.address}
                    </Text>

                    <View style={styles.resMetaRow}>
                      <View
                        style={[
                          styles.resStatusBadge,
                          res.status === 'OPEN' ? styles.statusOpen : styles.statusClosed,
                        ]}
                      >
                        <Text
                          style={[
                            styles.resStatusText,
                            res.status === 'OPEN' ? styles.statusOpenText : styles.statusClosedText,
                          ]}
                        >
                          {res.status === 'OPEN' ? 'ĐANG MỞ CỬA' : 'TẠM ĐÓNG CỬA'}
                        </Text>
                      </View>
                      <Text style={styles.resHours}>
                        {res.opening_time?.slice(0, 5) ?? '07:00'} -{' '}
                        {res.closing_time?.slice(0, 5) ?? '22:00'}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )
        )}
      </ScrollView>

      {/* Thanh giỏ hàng nổi */}
      {cartCount > 0 && (
        <TouchableOpacity
          style={styles.cartFloat}
          activeOpacity={0.9}
          onPress={() => router.push('/customer/cart' as any)}
        >
          <View style={styles.cartFloatLeft}>
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cartCount}</Text>
            </View>
            <Text style={styles.cartFloatText}>Xem giỏ hàng</Text>
          </View>
          <Text style={styles.cartFloatTotal}>{totalAmount.toLocaleString('vi-VN')}đ ›</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1F2937',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  tabButtonActive: {
    backgroundColor: '#FFF7ED',
    borderColor: '#FDBA74',
  },
  tabText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#EA580C',
    fontWeight: '700',
  },
  scrollContent: {
    paddingBottom: 80,
  },
  categoryScroll: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  categoryChipActive: {
    backgroundColor: '#EA580C',
    borderColor: '#EA580C',
  },
  categoryChipText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#4B5563',
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
    gap: 8,
    flexWrap: 'wrap',
  },
  filterLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#374151',
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  pillActive: {
    backgroundColor: '#1E293B',
    borderColor: '#1E293B',
  },
  pillText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#4B5563',
  },
  pillTextActive: {
    color: '#FFFFFF',
  },
  centerBox: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 10,
  },
  emptyBox: {
    paddingVertical: 60,
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
    marginTop: 12,
  },
  emptySub: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 6,
  },
  foodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    paddingTop: 8,
    gap: 10,
  },
  foodCard: {
    width: (width - 34) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  foodImage: {
    width: '100%',
    height: 120,
    backgroundColor: '#F3F4F6',
  },
  foodInfo: {
    padding: 10,
  },
  foodName: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#1F2937',
  },
  foodDesc: {
    fontSize: 11.5,
    color: '#6B7280',
    marginTop: 2,
  },
  foodBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  foodPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: '#EA580C',
  },
  addBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EA580C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  restaurantList: {
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 12,
  },
  resCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    elevation: 1,
  },
  resImage: {
    width: '100%',
    height: 130,
    backgroundColor: '#F3F4F6',
  },
  resInfo: {
    padding: 12,
  },
  resHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  resName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
  },
  resRatingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  resRatingText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B45309',
  },
  resAddress: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  resMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  resStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusOpen: {
    backgroundColor: '#DCFCE7',
  },
  statusClosed: {
    backgroundColor: '#FEE2E2',
  },
  resStatusText: {
    fontSize: 10.5,
    fontWeight: '800',
  },
  statusOpenText: {
    color: '#15803D',
  },
  statusClosedText: {
    color: '#B91C1C',
  },
  resHours: {
    fontSize: 11.5,
    color: '#6B7280',
  },
  cartFloat: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    height: 52,
    backgroundColor: '#EA580C',
    borderRadius: 26,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    elevation: 6,
    shadowColor: '#EA580C',
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  cartFloatLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cartBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBadgeText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#EA580C',
  },
  cartFloatText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cartFloatTotal: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
