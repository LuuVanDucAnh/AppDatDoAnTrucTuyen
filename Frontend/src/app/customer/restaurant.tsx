import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
  TouchableOpacity,
  StatusBar,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { useApp } from '@/context/AppContext';
import { restaurantApi } from '@/services/api';
import { DELIVERY_FEE, resolveImageUrl } from '@/services/config';
import type { ApiRestaurantMenu, ApiReview } from '@/services/types';



interface MenuItemView {
  id: number;
  name: string;
  desc: string;
  price: number;
  image?: string;
}

interface MenuSectionView {
  id: number;
  title: string;
  items: MenuItemView[];
}

interface RestaurantInfoView {
  id: number;
  name: string;
  address: string;
  rating: string;
  reviews: number;
  openHours: string;
  district: string;
  status: string;
  coverImage?: string;
  isOpen: boolean;
  description: string;
  phone: string;
}

function formatHours(open?: string | null, close?: string | null): string {
  const trim = (t?: string | null) => (t ? t.slice(0, 5) : null);
  const o = trim(open);
  const c = trim(close);
  return o && c ? `${o} - ${c}` : 'Cả ngày';
}

function shortenAddress(address: string): string {
  const parts = address.split(',').map((p) => p.trim());
  const found = parts.find((p) => /^(quận|huyện|q\.|tp\.|thành phố)/i.test(p));
  return found || parts[parts.length - 1] || address;
}

function buildInfo(menu: ApiRestaurantMenu): RestaurantInfoView {
  const isOpen = menu.status === 'OPEN';
  return {
    id: menu.id,
    name: menu.name,
    address: menu.address,
    rating: Number(menu.average_rating ?? 0).toFixed(1),
    reviews: Number(menu.total_reviews ?? 0),
    openHours: formatHours(menu.opening_time, menu.closing_time),
    district: shortenAddress(menu.address),
    status: isOpen ? 'ĐANG MỞ CỬA' : 'ĐANG ĐÓNG CỬA',
    coverImage: resolveImageUrl(menu.image),
    isOpen,
    description: menu.description ?? '',
    phone: menu.phone_number ?? '',
  };
}

function buildSections(menu: ApiRestaurantMenu): MenuSectionView[] {
  return (menu.categories ?? [])
    .map((cat) => ({
      id: cat.id,
      title: cat.name,
      items: (cat.foods ?? []).map((f) => ({
        id: f.id,
        name: f.name,
        desc: f.description ?? '',
        price: Number(f.price) || 0,
        image: resolveImageUrl(f.image),
      })),
    }))
    // Backend đã lọc status = AVAILABLE, danh mục rỗng thì không cần hiện
    .filter((sec) => sec.items.length > 0);
}

export default function RestaurantDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const restaurantId = Number(params.id);

  const { addToCart, cartCount, totalAmount } = useApp();

  const [menu, setMenu] = useState<ApiRestaurantMenu | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<number | 'all'>('all');
  const [isFavorite, setIsFavorite] = useState(false);
  const [addingFoodId, setAddingFoodId] = useState<number | null>(null);
  const [reviews, setReviews] = useState<ApiReview[]>([]);
  const [showReviewsModal, setShowReviewsModal] = useState(false);

  const loadMenu = useCallback(async () => {
    if (!restaurantId || Number.isNaN(restaurantId)) {
      setError('Thiếu mã nhà hàng. Vui lòng chọn lại quán từ trang chủ.');
      return;
    }
    setError(null);
    try {
      const [menuData, reviewsData] = await Promise.all([
        restaurantApi.getMenu(restaurantId),
        restaurantApi.getReviews(restaurantId).catch(() => []),
      ]);
      setMenu(menuData);
      setReviews(reviewsData || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không tải được thực đơn');
    }
  }, [restaurantId]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await loadMenu();
      setLoading(false);
    })();
  }, [loadMenu]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadMenu();
    setRefreshing(false);
  }, [loadMenu]);

  const info = useMemo(() => (menu ? buildInfo(menu) : null), [menu]);
  const sections = useMemo(() => (menu ? buildSections(menu) : []), [menu]);
  const shownSections = useMemo(
    () => (activeTab === 'all' ? sections : sections.filter((s) => s.id === activeTab)),
    [activeTab, sections]
  );

  const handleAdd = async (item: MenuItemView) => {
    if (!info) return;
    setAddingFoodId(item.id);
    await addToCart(
      { id: item.id, name: item.name, price: item.price, image: item.image },
      { id: info.id, name: info.name, isOpen: info.isOpen }
    );
    setAddingFoodId(null);
  };

  // ── Trạng thái tải / lỗi ──────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chi Tiết Quán Ăn</Text>
          <View style={{ width: 34 }} />
        </View>
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#EA580C" />
          <Text style={styles.centerText}>Đang tải thực đơn...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !info) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chi Tiết Quán Ăn</Text>
          <View style={{ width: 34 }} />
        </View>
        <View style={styles.centerBox}>
          <Ionicons name="cloud-offline-outline" size={44} color="#DC2626" />
          <Text style={styles.centerErrorTitle}>Không tải được thực đơn</Text>
          <Text style={styles.centerText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => void onRefresh()}>
            <Ionicons name="refresh" size={16} color="#FFFFFF" />
            <Text style={styles.retryBtnText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* TOP HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          Chi Tiết Quán Ăn
        </Text>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() =>
              Alert.alert(
                'Thông tin liên hệ',
                `${info.name}\n${info.address}${info.phone ? `\nĐiện thoại: ${info.phone}` : ''}`
              )
            }
          >
            <Ionicons name="information-circle-outline" size={20} color="#1F2937" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerAvatar} onPress={() => router.push('/auth')}>
            <Ionicons name="person" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void onRefresh()}
            colors={['#EA580C']}
            tintColor="#EA580C"
          />
        }
      >
        {/* COVER PHOTO & ACTIONS */}
        <View style={styles.coverWrapper}>
          <Image source={{ uri: info.coverImage }} style={styles.coverImage} />

          <View style={styles.coverTopOverlay}>
            <TouchableOpacity style={styles.coverOverlayBtn} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={styles.coverTopRight}>
              <TouchableOpacity
                style={styles.coverOverlayBtn}
                onPress={() => setIsFavorite(!isFavorite)}
              >
                <Ionicons
                  name={isFavorite ? 'heart' : 'heart-outline'}
                  size={20}
                  color={isFavorite ? '#EF4444' : '#FFFFFF'}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Badges dưới ảnh */}
          <View style={styles.coverBottomBadges}>
            <View style={[styles.badgeOpen, !info.isOpen && { backgroundColor: 'rgba(100,116,139,0.92)' }]}>
              <View style={[styles.badgeOpenDot, !info.isOpen && { backgroundColor: '#CBD5E1' }]} />
              <Text style={styles.badgeOpenText}>• {info.status}</Text>
            </View>
            <View style={styles.badgeHours}>
              <Ionicons name="time-outline" size={12} color="#FFFFFF" />
              <Text style={styles.badgeHoursText}>{info.openHours}</Text>
            </View>
          </View>
        </View>

        {/* THÔNG TIN NHÀ HÀNG */}
        <View style={styles.restaurantCard}>
          <View style={styles.restaurantNameRow}>
            <Text style={styles.restaurantName}>{info.name}</Text>
            <TouchableOpacity
              style={styles.ratingBadge}
              onPress={() => setShowReviewsModal(true)}
            >
              <Ionicons name="star" size={13} color="#D97706" />
              <Text style={styles.ratingText}>
                {info.rating} ({info.reviews}) ›
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.restaurantAddress}>{info.address}</Text>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="location-outline" size={14} color="#EA580C" />
              <Text style={styles.metaText}>{info.district}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="bicycle-outline" size={14} color="#059669" />
              <Text style={styles.metaText}>
                Phí ship {DELIVERY_FEE.toLocaleString('vi-VN')}đ
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={14} color="#6B7280" />
              <Text style={styles.metaText}>{info.openHours}</Text>
            </View>
          </View>
        </View>

        {/* CATEGORY TABS TRƯỢT NGANG (từ bảng categories) */}
        {sections.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsContainer}
          >
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'all' && styles.tabButtonActive]}
              onPress={() => setActiveTab('all')}
            >
              <Text
                style={[styles.tabButtonText, activeTab === 'all' && styles.tabButtonTextActive]}
              >
                Tất cả
              </Text>
            </TouchableOpacity>
            {sections.map((sec) => {
              const isSelected = activeTab === sec.id;
              return (
                <TouchableOpacity
                  key={sec.id}
                  style={[styles.tabButton, isSelected && styles.tabButtonActive]}
                  onPress={() => setActiveTab(sec.id)}
                >
                  <Text style={[styles.tabButtonText, isSelected && styles.tabButtonTextActive]}>
                    {sec.title}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {/* CÁC SECTION MÓN ĂN */}
        {sections.length === 0 ? (
          <View style={styles.centerBox}>
            <Ionicons name="fast-food-outline" size={44} color="#D1D5DB" />
            <Text style={styles.centerText}>Quán chưa có món nào đang bán.</Text>
          </View>
        ) : (
          shownSections.map((sec) => (
            <View key={sec.id} style={styles.sectionContainer}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>{sec.title}</Text>
                <View style={styles.sectionBadge}>
                  <Text style={styles.sectionBadgeText}>{sec.items.length} món</Text>
                </View>
              </View>

              {sec.items.map((it) => (
                <View key={it.id} style={styles.dishRow}>
                  <View style={styles.dishLeft}>
                    <Text style={styles.dishName}>{it.name}</Text>
                    {it.desc ? (
                      <Text style={styles.dishDesc} numberOfLines={2}>
                        {it.desc}
                      </Text>
                    ) : null}
                    <View style={styles.dishPriceBadgeRow}>
                      <Text style={styles.dishPrice}>{it.price.toLocaleString('vi-VN')}đ</Text>
                      <View style={styles.dishStatusPill}>
                        <Text style={styles.dishStatusText}>Còn món</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.dishRight}>
                    <Image source={{ uri: it.image }} style={styles.dishThumb} />
                    <TouchableOpacity
                      style={styles.addCircleBtn}
                      activeOpacity={0.8}
                      disabled={addingFoodId === it.id}
                      onPress={() => void handleAdd(it)}
                    >
                      {addingFoodId === it.id ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                      ) : (
                        <Ionicons name="add" size={18} color="#FFFFFF" />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          ))
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FLOATING CART BAR DƯỚI CÙNG */}
      {cartCount > 0 && (
        <View style={styles.bottomCartBarWrapper}>
          <View style={styles.bottomCartBar}>
            <View style={styles.bottomCartLeft}>
              <View style={styles.cartIconCircle}>
                <Ionicons name="bag-handle" size={18} color="#EA580C" />
                <View style={styles.cartBadgeDot}>
                  <Text style={styles.cartBadgeDotText}>{cartCount}</Text>
                </View>
              </View>
              <View>
                <Text style={styles.bottomCartCountText}>{cartCount} món trong giỏ</Text>
                <Text style={styles.bottomCartTotalText}>
                  {totalAmount.toLocaleString('vi-VN')}đ
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.bottomCartActionBtn}
              activeOpacity={0.85}
              onPress={() => router.push('/customer/cart' as any)}
            >
              <Text style={styles.bottomCartActionBtnText}>Xem giỏ</Text>
              <Ionicons name="arrow-forward" size={14} color="#FFFFFF" style={{ marginLeft: 4 }} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* MODAL XEM ĐÁNH GIÁ CỦA QUÁN */}
      <Modal
        visible={showReviewsModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowReviewsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.reviewsModalBox}>
            <View style={styles.reviewsModalHeader}>
              <View>
                <Text style={styles.reviewsModalTitle}>Đánh giá từ khách hàng</Text>
                <Text style={styles.reviewsModalSub}>
                  {info?.rating}★ · {reviews.length} lượt đánh giá
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowReviewsModal(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
              {reviews.length === 0 ? (
                <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                  <Ionicons name="chatbubbles-outline" size={40} color="#CBD5E1" />
                  <Text style={{ marginTop: 8, color: '#94A3B8', fontSize: 13 }}>
                    Chưa có đánh giá nào cho quán này.
                  </Text>
                </View>
              ) : (
                reviews.map((r) => (
                  <View key={r.id} style={styles.customerReviewItem}>
                    <View style={styles.customerReviewTop}>
                      <Text style={styles.customerReviewUser}>
                        {(r as any).user?.full_name || 'Khách hàng'}
                      </Text>
                      <View style={{ flexDirection: 'row', gap: 2 }}>
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Ionicons
                            key={s}
                            name={s <= Number(r.rating) ? 'star' : 'star-outline'}
                            size={12}
                            color="#F59E0B"
                          />
                        ))}
                      </View>
                    </View>
                    {r.comment ? (
                      <Text style={styles.customerReviewComment}>{r.comment}</Text>
                    ) : (
                      <Text style={styles.customerReviewNoComment}>Đã chấm {r.rating} sao</Text>
                    )}
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerBtn: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#9A3412',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 20,
  },

  /* COVER PHOTO */
  coverWrapper: {
    width: '100%',
    height: 200,
    position: 'relative',
    backgroundColor: '#E2E8F0',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverTopOverlay: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  coverOverlayBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverTopRight: {
    flexDirection: 'row',
    gap: 8,
  },
  coverBottomBadges: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    flexDirection: 'row',
    gap: 8,
  },
  badgeOpen: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#059669',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  badgeOpenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#A7F3D0',
  },
  badgeOpenText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  badgeHours: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  badgeHoursText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '500',
  },

  /* RESTAURANT CARD */
  restaurantCard: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  restaurantNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  restaurantName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B45309',
  },
  restaurantAddress: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 10,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#4B5563',
    fontWeight: '500',
  },

  /* CATEGORY TABS */
  tabsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  tabButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  tabButtonActive: {
    backgroundColor: '#EA580C',
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  tabButtonTextActive: {
    color: '#FFFFFF',
  },

  /* SECTIONS */
  sectionContainer: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 6,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  sectionBadge: {
    backgroundColor: '#FFEDD5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  sectionBadgeText: {
    color: '#EA580C',
    fontSize: 11,
    fontWeight: '700',
  },

  /* DISH ROW */
  dishRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  dishLeft: {
    flex: 1,
    marginRight: 12,
  },
  dishName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  dishDesc: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 18,
    marginBottom: 8,
  },
  dishPriceBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dishPrice: {
    fontSize: 15,
    fontWeight: '800',
    color: '#EA580C',
  },
  dishStatusPill: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  dishStatusText: {
    color: '#059669',
    fontSize: 10,
    fontWeight: '700',
  },
  dishRight: {
    position: 'relative',
    width: 80,
    height: 80,
  },
  dishThumb: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  addCircleBtn: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#EA580C',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },

  /* GRID FOR SIDE DISHES */
  gridRow: {
    flexDirection: 'row',
    gap: 12,
  },
  gridCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    overflow: 'hidden',
  },
  gridCardImage: {
    width: '100%',
    height: 90,
  },
  gridCardBody: {
    padding: 10,
  },
  gridCardName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F2937',
  },
  gridCardDesc: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  gridCardPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  gridCardPrice: {
    fontSize: 13,
    fontWeight: '800',
    color: '#EA580C',
  },
  addMiniBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#EA580C',
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* FLOATING CART BAR */
  bottomCartBarWrapper: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    zIndex: 99,
  },
  bottomCartBar: {
    backgroundColor: '#1E293B',
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  bottomCartLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cartIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  cartBadgeDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#EA580C',
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeDotText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  bottomCartCountText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '500',
  },
  bottomCartTotalText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  bottomCartActionBtn: {
    backgroundColor: '#EA580C',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  bottomCartActionBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },

  /* ── Style bổ sung: trạng thái tải / lỗi ─────────────────────────────── */
  centerBox: {
    flex: 1,
    paddingVertical: 60,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  centerText: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 19,
  },
  centerErrorTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#991B1B',
  },
  retryBtn: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#DC2626',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },

  /* ── Reviews modal ─────────────────────────────────────────────────────── */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  reviewsModalBox: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '85%',
  },
  reviewsModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 8,
  },
  reviewsModalTitle: {
    fontSize: 16.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  reviewsModalSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  customerReviewItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
    gap: 4,
  },
  customerReviewTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  customerReviewUser: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#1E293B',
  },
  customerReviewComment: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 18,
  },
  customerReviewNoComment: {
    fontSize: 12,
    color: '#94A3B8',
    fontStyle: 'italic',
  },
});
