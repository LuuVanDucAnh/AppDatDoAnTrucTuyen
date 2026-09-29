import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Dimensions,
  StatusBar,
  Alert,
  Modal,
  FlatList,
} from 'react-native';
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useApp, Order, Address } from '@/context/AppContext';

const { width, height } = Dimensions.get('window');

// Danh mục chuẩn theo DB & Nghiệp vụ
const CATEGORIES = [
  { id: 'all', name: 'Tất cả', icon: 'utensils', type: 'fa5' },
  { id: 'com', name: 'Cơm', icon: 'bowl-rice', type: 'fa5' },
  { id: 'bun_pho', name: 'Bún/Phở', icon: 'noodles', type: 'mci' },
  { id: 'tra_sua', name: 'Trà Sữa', icon: 'coffee', type: 'fa5' },
  { id: 'ga_ran', name: 'Gà rán', icon: 'drumstick-bite', type: 'fa5' },
  { id: 'pizza', name: 'Pizza', icon: 'pizza-slice', type: 'fa5' },
  { id: 'an_vat', name: 'Ăn vặt', icon: 'cookie-bite', type: 'fa5' },
  { id: 'trang_mieng', name: 'Tráng miệng', icon: 'ice-cream', type: 'fa5' },
];

// Banner ưu đãi
const BANNERS = [
  {
    id: 'b1',
    tag: 'Ưu đãi độc quyền',
    title: 'Giảm 30% Đơn Đầu Tiên',
    code: 'GIAM30',
    expire: 'Hôm nay',
    btnText: 'Dùng ngay',
    colors: ['#B45309', '#78350F'],
  },
  {
    id: 'b2',
    tag: 'Miễn Phí Vận Chuyển',
    title: 'Freeship 15k Mọi Đơn',
    code: 'FREESHIP',
    expire: 'Hôm nay',
    btnText: 'Áp dụng',
    colors: ['#065F46', '#022C22'],
  },
  {
    id: 'b3',
    tag: 'Flash Deal Cuối Tuần',
    title: 'Giảm 50.000đ Toàn Sàn',
    code: 'FOOD50K',
    expire: 'Chỉ còn 3 giờ',
    btnText: 'Săn deal',
    colors: ['#9D174D', '#500724'],
  },
];

// Món ngon bán chạy
const BEST_SELLERS = [
  {
    id: 1,
    name: 'Cơm Tấm Sườn Bì Chả',
    category: 'com',
    restaurantId: 1,
    restaurantName: 'Cơm Tấm Ba Ghiền',
    price: 55000,
    priceFormatted: '55.000đ',
    tag: 'Bán chạy',
    tagColor: '#D97706',
    image:
      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80',
    isOpen: true,
  },
  {
    id: 2,
    name: 'Phở Bò Tái Nạm Gầu',
    category: 'bun_pho',
    restaurantId: 2,
    restaurantName: 'Phở Bò Gia Truyền 1986',
    price: 65000,
    priceFormatted: '65.000đ',
    tag: 'Yêu thích',
    tagColor: '#DC2626',
    image:
      'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=600&auto=format&fit=crop&q=80',
    isOpen: true,
  },
  {
    id: 3,
    name: 'Trà Sữa KOI Macchiato',
    category: 'tra_sua',
    restaurantId: 3,
    restaurantName: 'Trà Sữa KOI Thé - Pasteur',
    price: 45000,
    priceFormatted: '45.000đ',
    tag: 'Best Boba',
    tagColor: '#059669',
    image:
      'https://images.unsplash.com/photo-1558857563-b37cf5a5b515?w=600&auto=format&fit=crop&q=80',
    isOpen: true,
  },
  {
    id: 4,
    name: 'Gà Rán Giòn Cay Giòn Rụm',
    category: 'ga_ran',
    restaurantId: 4,
    restaurantName: 'Gà Rán Popeyes - Nguyễn Trãi',
    price: 49000,
    priceFormatted: '49.000đ',
    tag: 'Hot Deal',
    tagColor: '#EA580C',
    image:
      'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=600&auto=format&fit=crop&q=80',
    isOpen: true,
  },
];

// Danh sách quán ăn
const RESTAURANTS = [
  {
    id: 1,
    name: 'Cơm Tấm Ba Ghiền',
    category: 'com',
    rating: '4.8',
    reviews: '250+',
    cuisine: 'Cơm tấm, Ẩm thực miền Nam',
    deliveryTime: '15 - 20 phút',
    distance: '1.2 km',
    shippingFee: '15.000đ',
    promoTag: 'Freeship từ 90k ⚡',
    promoType: 'blue',
    isOpen: true,
    badges: ['MỞ CỬA', 'FS -20k'],
    image:
      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 2,
    name: 'Phở Bò Gia Truyền 1986',
    category: 'bun_pho',
    rating: '4.7',
    reviews: '420+',
    cuisine: 'Phở bò, Bánh quẩy',
    deliveryTime: '20 - 30 phút',
    distance: '1.8 km',
    shippingFee: '15.000đ',
    promoTag: 'Tặng quẩy giòn 🥖',
    promoType: 'orange',
    isOpen: true,
    badges: ['MỞ CỬA'],
    image:
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 3,
    name: 'Trà Sữa KOI Thé - Pasteur',
    category: 'tra_sua',
    rating: '4.7',
    reviews: '890+',
    cuisine: 'Trà sữa Đài Loan, Macchiato',
    deliveryTime: '10 - 20 phút',
    distance: '0.9 km',
    shippingFee: '15.000đ',
    promoTag: 'Giao siêu tốc ⚡',
    promoType: 'teal',
    isOpen: true,
    badges: ['MỞ CỬA', 'Flash Sale'],
    image:
      'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 4,
    name: 'Gà Rán Popeyes - Nguyễn Trãi',
    category: 'ga_ran',
    rating: '4.6',
    reviews: '310+',
    cuisine: 'Gà rán Cajun, Burger',
    deliveryTime: '20 - 30 phút',
    distance: '2.5 km',
    shippingFee: '15.000đ',
    promoTag: 'Combo tiết kiệm ⚡',
    promoType: 'orange',
    isOpen: true,
    badges: ['MỞ CỬA'],
    image:
      'https://images.unsplash.com/photo-1513639776629-7b61b0ac49cb?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 5,
    name: 'Pizza Hut - Trần Hưng Đạo',
    category: 'pizza',
    rating: '4.5',
    reviews: '180+',
    cuisine: 'Pizza viền phô mai, Mì Ý',
    deliveryTime: '25 - 35 phút',
    distance: '3.0 km',
    shippingFee: '18.000đ',
    promoTag: 'Mua 1 Tặng 1 🍕',
    promoType: 'blue',
    isOpen: false, // Quán đóng cửa để test nghiệp vụ
    badges: ['ĐÓNG CỬA'],
    image:
      'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=80',
  },
];

export default function HomeScreen() {
  const router = useRouter();
  const {
    user,
    addresses,
    defaultAddress,
    setDefaultAddress,
    cartRestaurantName,
    cartItems,
    cartCount,
    foodTotal,
    deliveryFee,
    discount,
    voucherCode,
    totalAmount,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    applyVoucher,
    checkout,
    orders,
    cancelOrder,
    submitReview,
  } = useApp();

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'home' | 'orders' | 'notif' | 'account'>('home');

  // Modals
  const [showCartModal, setShowCartModal] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showOrdersModal, setShowOrdersModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);

  // Checkout inputs
  const [selectedAddress, setSelectedAddress] = useState<Address>(defaultAddress);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'MOMO' | 'VNPAY'>('CASH');
  const [orderNote, setOrderNote] = useState('');
  const [inputVoucher, setInputVoucher] = useState('');

  // Review inputs
  const [reviewOrderId, setReviewOrderId] = useState<string>('');
  const [reviewStars, setReviewStars] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState<string>('');

  // Orders tab filter (ACTIVE | COMPLETED | CANCELLED)
  const [orderFilter, setOrderFilter] = useState<'ACTIVE' | 'COMPLETED' | 'CANCELLED'>('ACTIVE');

  // Lọc món và quán theo tìm kiếm & category
  const filteredBestSellers = useMemo(() => {
    return BEST_SELLERS.filter((dish) => {
      const matchCat = selectedCategory === 'all' || dish.category === selectedCategory;
      const matchSearch =
        dish.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dish.restaurantName.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [selectedCategory, searchQuery]);

  const filteredRestaurants = useMemo(() => {
    return RESTAURANTS.filter((res) => {
      const matchCat = selectedCategory === 'all' || res.category === selectedCategory;
      const matchSearch =
        res.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        res.cuisine.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [selectedCategory, searchQuery]);

  // Lọc đơn hàng theo tab
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (orderFilter === 'ACTIVE') {
        return ['PENDING', 'CONFIRMED', 'PREPARING', 'DELIVERING'].includes(o.status);
      }
      if (orderFilter === 'COMPLETED') {
        return o.status === 'DELIVERED';
      }
      return o.status === 'CANCELLED';
    });
  }, [orders, orderFilter]);

  // Xử lý thanh toán đơn hàng
  const handleConfirmOrder = () => {
    const newOrder = checkout(selectedAddress, paymentMethod, orderNote);
    if (newOrder) {
      setShowCartModal(false);
      setOrderNote('');
      Alert.alert(
        'Đặt đơn thành công! 🎉',
        `Mã đơn: #${newOrder.id}\nNhà hàng: ${newOrder.restaurantName}\nTổng tiền: ${newOrder.totalAmount.toLocaleString('vi-VN')}đ\n\nQuán đang tiếp nhận đơn hàng của bạn!`,
        [
          { text: 'Đóng', style: 'cancel' },
          {
            text: 'Xem đơn hàng',
            onPress: () => {
              setActiveTab('orders');
              setShowOrdersModal(true);
            },
          },
        ]
      );
    }
  };

  // Mở modal đánh giá
  const handleOpenReview = (orderId: string) => {
    setReviewOrderId(orderId);
    setReviewStars(5);
    setReviewComment('');
    setShowReviewModal(true);
  };

  const handleSendReview = () => {
    if (reviewOrderId) {
      submitReview(reviewOrderId, reviewStars, reviewComment);
      setShowReviewModal(false);
    }
  };

  const renderCategoryIcon = (item: (typeof CATEGORIES)[0], isSelected: boolean) => {
    const iconColor = isSelected ? '#FFFFFF' : '#854D0E';
    if (item.type === 'mci') {
      return <MaterialCommunityIcons name="noodles" size={20} color={iconColor} />;
    }
    return <FontAwesome5 name={item.icon as any} size={18} color={iconColor} />;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.locationContainer}
          activeOpacity={0.7}
          onPress={() => setShowAddressModal(true)}
        >
          <View style={styles.locationIconCircle}>
            <Ionicons name="navigate-sharp" size={18} color="#EA580C" />
          </View>
          <View style={styles.locationTextContainer}>
            <View style={styles.locationSubRow}>
              <Text style={styles.locationSubText}>Giao đến</Text>
              <Ionicons name="chevron-down" size={14} color="#6B7280" />
            </View>
            <Text style={styles.locationTitle} numberOfLines={1}>
              {defaultAddress.detailAddress}
            </Text>
          </View>
        </TouchableOpacity>

        <View style={styles.headerRightActions}>
          <TouchableOpacity
            style={styles.headerIconButton}
            activeOpacity={0.7}
            onPress={() => {
              setActiveTab('orders');
              setShowOrdersModal(true);
            }}
          >
            <Ionicons name="bag-handle-outline" size={22} color="#374151" />
            {cartCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{cartCount}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.avatarButton}
            activeOpacity={0.7}
            onPress={() => router.push('/auth')}
          >
            <View style={styles.avatarCircle}>
              <Ionicons name="person" size={18} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* THANH TÌM KIẾM & BỘ LỌC */}
        <View style={styles.searchRow}>
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={20} color="#9CA3AF" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Tìm quán ăn, món ăn yêu thích..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={styles.filterButton}
            activeOpacity={0.8}
            onPress={() =>
              Alert.alert('Bộ lọc thông minh', 'Lọc món theo: Giá tăng dần, Đánh giá cao nhất, Gần tôi nhất.')
            }
          >
            <Ionicons name="options-outline" size={20} color="#64748B" />
          </TouchableOpacity>
        </View>

        {/* PROMO BANNERS CAROUSEL */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.bannerContainer}
          decelerationRate="fast"
          snapToInterval={width * 0.82 + 12}
        >
          {BANNERS.map((banner) => (
            <LinearGradient
              key={banner.id}
              colors={banner.colors as [string, string, ...string[]]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.bannerCard}
            >
              <View style={styles.bannerTagRow}>
                <View style={styles.bannerTagPill}>
                  <Ionicons name="star" size={11} color="#FEF08A" />
                  <Text style={styles.bannerTagText}>{banner.tag}</Text>
                </View>
              </View>

              <Text style={styles.bannerTitle}>{banner.title}</Text>

              <View style={styles.bannerCodeRow}>
                <Text style={styles.bannerCodePrefix}>Nhập mã: </Text>
                <View style={styles.bannerCodeBadge}>
                  <Text style={styles.bannerCodeText}>{banner.code}</Text>
                </View>
              </View>

              <View style={styles.bannerFooter}>
                <Text style={styles.bannerExpireText}>Hết: {banner.expire}</Text>
                <TouchableOpacity
                  style={styles.bannerActionBtn}
                  activeOpacity={0.85}
                  onPress={() => applyVoucher(banner.code)}
                >
                  <Text style={styles.bannerActionBtnText}>{banner.btnText}</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          ))}
        </ScrollView>

        {/* DANH MỤC */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContainer}
        >
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={styles.categoryItem}
                activeOpacity={0.7}
                onPress={() => setSelectedCategory(cat.id)}
              >
                <View
                  style={[
                    styles.categoryIconCircle,
                    isSelected && styles.categoryIconCircleActive,
                  ]}
                >
                  {renderCategoryIcon(cat, isSelected)}
                </View>
                <Text
                  style={[
                    styles.categoryLabel,
                    isSelected && styles.categoryLabelActive,
                  ]}
                >
                  {cat.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* SECTION: MÓN NGON BÁN CHẠY HÔM NAY */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitleIcon}>👍</Text>
            <Text style={styles.sectionTitle}>Món ngon bán chạy hôm nay</Text>
          </View>
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.seeAllButton}
            onPress={() => setSelectedCategory('all')}
          >
            <Text style={styles.seeAllText}>Xem hết</Text>
            <Ionicons name="chevron-forward" size={14} color="#EA580C" />
          </TouchableOpacity>
        </View>

        {filteredBestSellers.length === 0 ? (
          <View style={styles.emptySearchBox}>
            <Text style={styles.emptySearchText}>Không tìm thấy món ăn phù hợp.</Text>
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.bestSellersList}
          >
            {filteredBestSellers.map((dish) => (
              <View key={dish.id} style={styles.dishCard}>
                <View style={styles.dishImageWrapper}>
                  <Image source={{ uri: dish.image }} style={styles.dishImage} resizeMode="cover" />
                  <View style={[styles.dishBadge, { backgroundColor: dish.tagColor }]}>
                    <Text style={styles.dishBadgeText}>{dish.tag}</Text>
                  </View>
                </View>

                <View style={styles.dishInfo}>
                  <Text style={styles.dishTitle} numberOfLines={1}>
                    {dish.name}
                  </Text>
                  <Text style={styles.dishRestaurant} numberOfLines={1}>
                    {dish.restaurantName}
                  </Text>

                  <View style={styles.dishPriceRow}>
                    <Text style={styles.dishPrice}>{dish.priceFormatted}</Text>
                    <TouchableOpacity
                      style={styles.addDishButton}
                      activeOpacity={0.8}
                      onPress={() =>
                        addToCart(
                          {
                            id: dish.id,
                            name: dish.name,
                            price: dish.price,
                            image: dish.image,
                          },
                          {
                            id: dish.restaurantId,
                            name: dish.restaurantName,
                            isOpen: dish.isOpen,
                          }
                        )
                      }
                    >
                      <Ionicons name="add" size={18} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>
        )}

        {/* SECTION: QUÁN ĂN ĐANG MỞ GẦN BẠN */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="storefront" size={20} color="#059669" style={{ marginRight: 6 }} />
            <Text style={styles.sectionTitle}>Quán ăn gần bạn</Text>
          </View>
          <View style={styles.nearPill}>
            <Text style={styles.nearPillText}>Gần nhất</Text>
          </View>
        </View>

        {/* DANH SÁCH QUÁN ĂN */}
        <View style={styles.restaurantsList}>
          {filteredRestaurants.map((res) => (
            <TouchableOpacity
              key={res.id}
              style={[styles.restaurantCard, !res.isOpen && { opacity: 0.75 }]}
              activeOpacity={0.9}
              onPress={() => {
                if (!res.isOpen) {
                  Alert.alert('Quán đóng cửa', `"${res.name}" hiện đang đóng cửa.`);
                } else {
                  Alert.alert(
                    res.name,
                    `Địa chỉ: 123 Đường Mẫu, Q.5\nGiờ mở cửa: 07:00 - 22:00\nĐánh giá: ${res.rating}★ (${res.reviews} lượt)\nPhí ship cố định: 15.000đ`
                  );
                }
              }}
            >
              <View style={styles.restaurantCoverWrapper}>
                <Image source={{ uri: res.image }} style={styles.restaurantCover} />

                <View style={styles.restaurantTopBadges}>
                  <View
                    style={[
                      styles.statusBadgeOpen,
                      !res.isOpen && { backgroundColor: 'rgba(100, 116, 139, 0.92)' },
                    ]}
                  >
                    <View
                      style={[
                        styles.greenDot,
                        !res.isOpen && { backgroundColor: '#CBD5E1' },
                      ]}
                    />
                    <Text style={styles.statusBadgeText}>
                      {res.isOpen ? 'MỞ CỬA' : 'ĐÓNG CỬA'}
                    </Text>
                  </View>
                  {res.badges.includes('FS -20k') && (
                    <View style={styles.statusBadgePromo}>
                      <Text style={styles.statusBadgePromoText}>FS -20k</Text>
                    </View>
                  )}
                  {res.badges.includes('Flash Sale') && (
                    <View style={styles.statusBadgeFlash}>
                      <Text style={styles.statusBadgeFlashText}>Flash Sale</Text>
                    </View>
                  )}
                </View>

                <View style={styles.restaurantImageBottomOverlay}>
                  <View style={styles.overlayItem}>
                    <Ionicons name="time-outline" size={13} color="#FFFFFF" />
                    <Text style={styles.overlayText}>{res.deliveryTime}</Text>
                  </View>
                  <View style={styles.overlayItem}>
                    <Ionicons name="location-outline" size={13} color="#FFFFFF" />
                    <Text style={styles.overlayText}>{res.distance}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.restaurantDetails}>
                <View style={styles.restaurantHeaderRow}>
                  <Text style={styles.restaurantName} numberOfLines={1}>
                    {res.name}
                  </Text>
                  <View style={styles.ratingBadge}>
                    <Ionicons name="star" size={12} color="#D97706" />
                    <Text style={styles.ratingText}>{res.rating}</Text>
                  </View>
                </View>

                <Text style={styles.restaurantCuisine} numberOfLines={1}>
                  {res.cuisine} • {res.reviews} đánh giá
                </Text>

                <View style={styles.restaurantDivider} />

                <View style={styles.restaurantFooterRow}>
                  <View style={styles.shippingRow}>
                    <Ionicons name="bicycle-outline" size={16} color="#059669" />
                    <Text style={styles.shippingFeeText}>
                      Phí ship: <Text style={styles.shippingFeeBold}>{res.shippingFee}</Text>
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.promoTagBadge,
                      res.promoType === 'blue' && styles.promoTagBadgeBlue,
                      res.promoType === 'orange' && styles.promoTagBadgeOrange,
                      res.promoType === 'teal' && styles.promoTagBadgeTeal,
                    ]}
                  >
                    <Text
                      style={[
                        styles.promoTagText,
                        res.promoType === 'blue' && styles.promoTagTextBlue,
                        res.promoType === 'orange' && styles.promoTagTextOrange,
                        res.promoType === 'teal' && styles.promoTagTextTeal,
                      ]}
                    >
                      {res.promoTag}
                    </Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* THANH GIỎ HÀNG NỔI (Kèm đầy đủ số liệu nghiệp vụ) */}
      {cartCount > 0 && (
        <View style={styles.floatingCartContainer}>
          <View style={styles.floatingCartBar}>
            <View style={styles.floatingCartLeft}>
              <View style={styles.floatingCartIconWrapper}>
                <Ionicons name="bag-handle" size={20} color="#EA580C" />
                <View style={styles.floatingCartBadge}>
                  <Text style={styles.floatingCartBadgeText}>{cartCount}</Text>
                </View>
              </View>
              <View style={styles.floatingCartTextGroup}>
                <Text style={styles.floatingCartLabel}>
                  {cartRestaurantName || 'Giỏ hàng của bạn'}
                </Text>
                <Text style={styles.floatingCartPrice}>
                  {totalAmount.toLocaleString('vi-VN')}đ
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.viewCartButton}
              activeOpacity={0.85}
              onPress={() => setShowCartModal(true)}
            >
              <Text style={styles.viewCartButtonText}>Xem giỏ</Text>
              <Ionicons name="arrow-forward" size={14} color="#FFFFFF" style={{ marginLeft: 4 }} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* BOTTOM TAB BAR */}
      <View style={styles.bottomTabBar}>
        <TouchableOpacity
          style={styles.tabItem}
          activeOpacity={0.7}
          onPress={() => setActiveTab('home')}
        >
          <Ionicons
            name={activeTab === 'home' ? 'restaurant' : 'restaurant-outline'}
            size={22}
            color={activeTab === 'home' ? '#EA580C' : '#9CA3AF'}
          />
          <Text
            style={[styles.tabItemLabel, activeTab === 'home' && styles.tabItemLabelActive]}
          >
            Trang chủ
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          activeOpacity={0.7}
          onPress={() => {
            setActiveTab('orders');
            setShowOrdersModal(true);
          }}
        >
          <Ionicons
            name={activeTab === 'orders' ? 'receipt' : 'receipt-outline'}
            size={22}
            color={activeTab === 'orders' ? '#EA580C' : '#9CA3AF'}
          />
          <Text
            style={[styles.tabItemLabel, activeTab === 'orders' && styles.tabItemLabelActive]}
          >
            Đơn hàng
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          activeOpacity={0.7}
          onPress={() => {
            setActiveTab('notif');
            Alert.alert(
              'Thông báo',
              '• Đơn hàng #ORD-98215 đang được shipper giao đến bạn!\n• Mã FREESHIP giảm 15k sắp hết hạn hôm nay!'
            );
          }}
        >
          <View>
            <Ionicons
              name={activeTab === 'notif' ? 'notifications' : 'notifications-outline'}
              size={22}
              color={activeTab === 'notif' ? '#EA580C' : '#9CA3AF'}
            />
            <View style={styles.tabDotBadge} />
          </View>
          <Text
            style={[styles.tabItemLabel, activeTab === 'notif' && styles.tabItemLabelActive]}
          >
            Thông báo
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          activeOpacity={0.7}
          onPress={() => {
            setActiveTab('account');
            router.push('/auth');
          }}
        >
          <Ionicons
            name={activeTab === 'account' ? 'person' : 'person-outline'}
            size={22}
            color={activeTab === 'account' ? '#EA580C' : '#9CA3AF'}
          />
          <Text
            style={[styles.tabItemLabel, activeTab === 'account' && styles.tabItemLabelActive]}
          >
            Tài khoản
          </Text>
        </TouchableOpacity>
      </View>

      {/* ========================================================================= */}
      {/* MODAL 1: GIỎ HÀNG & THANH TOÁN (CHECKOUT TRANSACTION)                     */}
      {/* ========================================================================= */}
      <Modal visible={showCartModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.cartModalContainer}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Chi tiết giỏ hàng</Text>
                <Text style={styles.modalSubtitle}>Quán: {cartRestaurantName}</Text>
              </View>
              <TouchableOpacity onPress={() => setShowCartModal(false)}>
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
              {/* Danh sách món trong giỏ */}
              <View style={styles.cartItemsList}>
                {cartItems.map((item) => (
                  <View key={item.id} style={styles.cartItemRow}>
                    <Image source={{ uri: item.image }} style={styles.cartItemThumb} />
                    <View style={styles.cartItemCenter}>
                      <Text style={styles.cartItemName} numberOfLines={1}>
                        {item.name}
                      </Text>
                      <Text style={styles.cartItemPrice}>
                        {(item.price * item.quantity).toLocaleString('vi-VN')}đ
                      </Text>
                    </View>

                    <View style={styles.qtyControlRow}>
                      <TouchableOpacity
                        style={styles.qtyBtn}
                        onPress={() => updateQuantity(item.foodId, item.quantity - 1)}
                      >
                        <Ionicons
                          name={item.quantity === 1 ? 'trash-outline' : 'remove'}
                          size={14}
                          color="#EF4444"
                        />
                      </TouchableOpacity>
                      <Text style={styles.qtyText}>{item.quantity}</Text>
                      <TouchableOpacity
                        style={styles.qtyBtn}
                        onPress={() => updateQuantity(item.foodId, item.quantity + 1)}
                      >
                        <Ionicons name="add" size={14} color="#10B981" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>

              {/* Địa chỉ nhận hàng */}
              <View style={styles.checkoutSection}>
                <Text style={styles.checkoutSectionTitle}>📍 Địa chỉ giao hàng</Text>
                <TouchableOpacity
                  style={styles.addressSelectCard}
                  onPress={() => setShowAddressModal(true)}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.addressName}>
                      {selectedAddress.recipientName} ({selectedAddress.phone})
                    </Text>
                    <Text style={styles.addressDetail}>
                      {selectedAddress.detailAddress}, {selectedAddress.ward},{' '}
                      {selectedAddress.district}, {selectedAddress.city}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
                </TouchableOpacity>
              </View>

              {/* Mã khuyến mãi Voucher */}
              <View style={styles.checkoutSection}>
                <Text style={styles.checkoutSectionTitle}>🎟️ Mã ưu đãi</Text>
                <View style={styles.voucherInputRow}>
                  <TextInput
                    style={styles.voucherInput}
                    placeholder="Nhập mã (FREESHIP, GIAM30, FOOD50K)"
                    value={inputVoucher}
                    onChangeText={setInputVoucher}
                    autoCapitalize="characters"
                  />
                  <TouchableOpacity
                    style={styles.voucherApplyBtn}
                    onPress={() => {
                      if (applyVoucher(inputVoucher)) {
                        setInputVoucher('');
                      }
                    }}
                  >
                    <Text style={styles.voucherApplyBtnText}>Áp dụng</Text>
                  </TouchableOpacity>
                </View>
                {voucherCode && (
                  <Text style={styles.appliedVoucherNote}>
                    ✓ Đã áp dụng mã: <Text style={{ fontWeight: '700' }}>{voucherCode}</Text> (-
                    {discount.toLocaleString('vi-VN')}đ)
                  </Text>
                )}
              </View>

              {/* Phương thức thanh toán */}
              <View style={styles.checkoutSection}>
                <Text style={styles.checkoutSectionTitle}>💳 Phương thức thanh toán</Text>
                <View style={styles.paymentMethodsRow}>
                  <TouchableOpacity
                    style={[
                      styles.paymentOption,
                      paymentMethod === 'CASH' && styles.paymentOptionActive,
                    ]}
                    onPress={() => setPaymentMethod('CASH')}
                  >
                    <FontAwesome5
                      name="money-bill-wave"
                      size={16}
                      color={paymentMethod === 'CASH' ? '#EA580C' : '#64748B'}
                    />
                    <Text
                      style={[
                        styles.paymentOptionText,
                        paymentMethod === 'CASH' && styles.paymentOptionTextActive,
                      ]}
                    >
                      Tiền mặt (COD)
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.paymentOption,
                      paymentMethod === 'MOMO' && styles.paymentOptionActive,
                    ]}
                    onPress={() => setPaymentMethod('MOMO')}
                  >
                    <FontAwesome5
                      name="wallet"
                      size={16}
                      color={paymentMethod === 'MOMO' ? '#EA580C' : '#64748B'}
                    />
                    <Text
                      style={[
                        styles.paymentOptionText,
                        paymentMethod === 'MOMO' && styles.paymentOptionTextActive,
                      ]}
                    >
                      Ví MoMo
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.paymentOption,
                      paymentMethod === 'VNPAY' && styles.paymentOptionActive,
                    ]}
                    onPress={() => setPaymentMethod('VNPAY')}
                  >
                    <FontAwesome5
                      name="credit-card"
                      size={16}
                      color={paymentMethod === 'VNPAY' ? '#EA580C' : '#64748B'}
                    />
                    <Text
                      style={[
                        styles.paymentOptionText,
                        paymentMethod === 'VNPAY' && styles.paymentOptionTextActive,
                      ]}
                    >
                      VNPAY / QR
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Ghi chú đơn hàng */}
              <View style={styles.checkoutSection}>
                <Text style={styles.checkoutSectionTitle}>📝 Ghi chú đơn hàng</Text>
                <TextInput
                  style={styles.noteInput}
                  placeholder="Ghi chú cho quán (ví dụ: ít ngọt, không hành...)"
                  value={orderNote}
                  onChangeText={setOrderNote}
                />
              </View>

              {/* Bảng tính chi phí */}
              <View style={styles.summaryCard}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Tiền món ăn</Text>
                  <Text style={styles.summaryVal}>{foodTotal.toLocaleString('vi-VN')}đ</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Phí giao hàng (cố định)</Text>
                  <Text style={styles.summaryVal}>{deliveryFee.toLocaleString('vi-VN')}đ</Text>
                </View>
                {discount > 0 && (
                  <View style={styles.summaryRow}>
                    <Text style={[styles.summaryLabel, { color: '#059669' }]}>Giảm giá voucher</Text>
                    <Text style={[styles.summaryVal, { color: '#059669' }]}>
                      -{discount.toLocaleString('vi-VN')}đ
                    </Text>
                  </View>
                )}
                <View style={styles.summaryDivider} />
                <View style={styles.summaryRowTotal}>
                  <Text style={styles.summaryLabelTotal}>Tổng thanh toán</Text>
                  <Text style={styles.summaryValTotal}>{totalAmount.toLocaleString('vi-VN')}đ</Text>
                </View>
              </View>
            </ScrollView>

            {/* Nút Xác nhận đặt đơn */}
            <TouchableOpacity
              style={styles.confirmOrderBtn}
              activeOpacity={0.85}
              onPress={handleConfirmOrder}
            >
              <Text style={styles.confirmOrderBtnText}>
                Xác nhận đặt hàng • {totalAmount.toLocaleString('vi-VN')}đ
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 2: QUẢN LÝ ĐƠN HÀNG (THEO ĐÚNG 3 TAB NGHIỆP VỤ)                      */}
      {/* ========================================================================= */}
      <Modal visible={showOrdersModal} animationType="slide">
        <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Đơn hàng của bạn</Text>
            <TouchableOpacity onPress={() => setShowOrdersModal(false)}>
              <Ionicons name="close" size={24} color="#374151" />
            </TouchableOpacity>
          </View>

          {/* 3 Tab Nghiệp vụ: Đang xử lý | Đã giao | Đã hủy */}
          <View style={styles.orderFilterTabs}>
            <TouchableOpacity
              style={[
                styles.orderFilterTab,
                orderFilter === 'ACTIVE' && styles.orderFilterTabActive,
              ]}
              onPress={() => setOrderFilter('ACTIVE')}
            >
              <Text
                style={[
                  styles.orderFilterTabText,
                  orderFilter === 'ACTIVE' && styles.orderFilterTabTextActive,
                ]}
              >
                Đang xử lý
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.orderFilterTab,
                orderFilter === 'COMPLETED' && styles.orderFilterTabActive,
              ]}
              onPress={() => setOrderFilter('COMPLETED')}
            >
              <Text
                style={[
                  styles.orderFilterTabText,
                  orderFilter === 'COMPLETED' && styles.orderFilterTabTextActive,
                ]}
              >
                Đã giao
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.orderFilterTab,
                orderFilter === 'CANCELLED' && styles.orderFilterTabActive,
              ]}
              onPress={() => setOrderFilter('CANCELLED')}
            >
              <Text
                style={[
                  styles.orderFilterTabText,
                  orderFilter === 'CANCELLED' && styles.orderFilterTabTextActive,
                ]}
              >
                Đã hủy
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={{ flex: 1, padding: 16 }} showsVerticalScrollIndicator={false}>
            {filteredOrders.length === 0 ? (
              <View style={styles.emptyOrdersBox}>
                <Ionicons name="receipt-outline" size={48} color="#D1D5DB" />
                <Text style={styles.emptyOrdersText}>Không có đơn hàng nào trong mục này.</Text>
              </View>
            ) : (
              filteredOrders.map((ord) => (
                <View key={ord.id} style={styles.orderCard}>
                  <View style={styles.orderCardHeader}>
                    <View>
                      <Text style={styles.orderCardId}>#{ord.id}</Text>
                      <Text style={styles.orderCardTime}>{ord.createdAt}</Text>
                    </View>
                    <View
                      style={[
                        styles.orderStatusBadge,
                        ord.status === 'PENDING' && { backgroundColor: '#FEF3C7' },
                        ord.status === 'DELIVERING' && { backgroundColor: '#EFF6FF' },
                        ord.status === 'DELIVERED' && { backgroundColor: '#ECFDF5' },
                        ord.status === 'CANCELLED' && { backgroundColor: '#FEE2E2' },
                      ]}
                    >
                      <Text
                        style={[
                          styles.orderStatusText,
                          ord.status === 'PENDING' && { color: '#B45309' },
                          ord.status === 'DELIVERING' && { color: '#2563EB' },
                          ord.status === 'DELIVERED' && { color: '#059669' },
                          ord.status === 'CANCELLED' && { color: '#DC2626' },
                        ]}
                      >
                        {ord.status === 'PENDING' && 'Chờ quán xác nhận'}
                        {ord.status === 'CONFIRMED' && 'Đã xác nhận'}
                        {ord.status === 'PREPARING' && 'Đang chuẩn bị'}
                        {ord.status === 'DELIVERING' && 'Đang giao hàng 🛵'}
                        {ord.status === 'DELIVERED' && 'Giao thành công ✓'}
                        {ord.status === 'CANCELLED' && 'Đã hủy'}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.orderRestaurantName}>{ord.restaurantName}</Text>

                  {/* Danh sách món */}
                  <View style={styles.orderItemsPreview}>
                    {ord.items.map((it) => (
                      <View key={it.id} style={styles.orderItemLine}>
                        <Text style={styles.orderItemLineName}>
                          {it.quantity}x {it.name}
                        </Text>
                        <Text style={styles.orderItemLinePrice}>
                          {(it.price * it.quantity).toLocaleString('vi-VN')}đ
                        </Text>
                      </View>
                    ))}
                  </View>

                  {ord.note ? <Text style={styles.orderNoteText}>Ghi chú: {ord.note}</Text> : null}

                  <View style={styles.orderDivider} />

                  <View style={styles.orderCardFooter}>
                    <Text style={styles.orderTotalText}>
                      Tổng tiền: <Text style={styles.orderTotalBold}>{ord.totalAmount.toLocaleString('vi-VN')}đ</Text>
                    </Text>

                    {/* Nghiệp vụ: Chỉ cho phép Huỷ khi đơn PENDING */}
                    {ord.status === 'PENDING' && (
                      <TouchableOpacity
                        style={styles.cancelOrderBtn}
                        onPress={() => cancelOrder(ord.id)}
                      >
                        <Text style={styles.cancelOrderBtnText}>Huỷ đơn</Text>
                      </TouchableOpacity>
                    )}

                    {/* Nghiệp vụ: Đánh giá chỉ dành cho DELIVERED và 1 lần */}
                    {ord.status === 'DELIVERED' && !ord.reviewed && (
                      <TouchableOpacity
                        style={styles.reviewBtn}
                        onPress={() => handleOpenReview(ord.id)}
                      >
                        <Text style={styles.reviewBtnText}>Đánh giá quán ⭐</Text>
                      </TouchableOpacity>
                    )}

                    {ord.status === 'DELIVERED' && ord.reviewed && (
                      <View style={styles.reviewedBadge}>
                        <Text style={styles.reviewedText}>✓ Đã đánh giá {ord.reviewRating}⭐</Text>
                      </View>
                    )}
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 3: ĐÁNH GIÁ ĐƠN HÀNG (REVIEW MODAL)                                 */}
      {/* ========================================================================= */}
      <Modal visible={showReviewModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.reviewModalContainer}>
            <Text style={styles.modalTitle}>Đánh giá bữa ăn</Text>
            <Text style={styles.modalSubtitle}>Đơn hàng #{reviewOrderId}</Text>

            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => setReviewStars(star)}>
                  <Ionicons
                    name={star <= reviewStars ? 'star' : 'star-outline'}
                    size={32}
                    color="#D97706"
                    style={{ marginHorizontal: 4 }}
                  />
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={styles.reviewInput}
              placeholder="Chia sẻ cảm nhận về món ăn và dịch vụ của quán..."
              multiline
              numberOfLines={4}
              value={reviewComment}
              onChangeText={setReviewComment}
            />

            <View style={styles.modalActionButtons}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowReviewModal(false)}
              >
                <Text style={styles.modalCancelBtnText}>Để sau</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSubmitBtn} onPress={handleSendReview}>
                <Text style={styles.modalSubmitBtnText}>Gửi đánh giá</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 4: CHỌN ĐỊA CHỈ GIAO HÀNG                                           */}
      {/* ========================================================================= */}
      <Modal visible={showAddressModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.addressModalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn địa chỉ giao hàng</Text>
              <TouchableOpacity onPress={() => setShowAddressModal(false)}>
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>

            {addresses.map((addr) => (
              <TouchableOpacity
                key={addr.id}
                style={[
                  styles.addressItemRow,
                  defaultAddress.id === addr.id && styles.addressItemRowActive,
                ]}
                onPress={() => {
                  setDefaultAddress(addr.id);
                  setSelectedAddress(addr);
                  setShowAddressModal(false);
                }}
              >
                <Ionicons
                  name={defaultAddress.id === addr.id ? 'radio-button-on' : 'radio-button-off'}
                  size={20}
                  color={defaultAddress.id === addr.id ? '#EA580C' : '#9CA3AF'}
                  style={{ marginRight: 10 }}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.addressName}>
                    {addr.recipientName} ({addr.phone})
                  </Text>
                  <Text style={styles.addressDetail}>
                    {addr.detailAddress}, {addr.ward}, {addr.district}, {addr.city}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
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
  scrollView: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingBottom: 20,
  },

  /* HEADER */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  locationIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFEDE8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  locationTextContainer: {
    flex: 1,
  },
  locationSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  locationSubText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  locationTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginTop: 1,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#EA580C',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  avatarButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    overflow: 'hidden',
  },
  avatarCircle: {
    width: '100%',
    height: '100%',
    backgroundColor: '#9A3412',
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* SEARCH ROW */
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    gap: 10,
    backgroundColor: '#FFFFFF',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
    paddingVertical: 0,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* BANNERS */
  bannerContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  bannerCard: {
    width: width * 0.82,
    borderRadius: 20,
    padding: 16,
    justifyContent: 'space-between',
    minHeight: 150,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  bannerTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bannerTagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 4,
  },
  bannerTagText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  bannerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    marginTop: 8,
    lineHeight: 26,
  },
  bannerCodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  bannerCodePrefix: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 12,
  },
  bannerCodeBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.28)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  bannerCodeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  bannerFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  bannerExpireText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    fontWeight: '500',
  },
  bannerActionBtn: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  bannerActionBtnText: {
    color: '#9A3412',
    fontWeight: '700',
    fontSize: 13,
  },

  /* CATEGORIES */
  categoriesContainer: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 16,
    backgroundColor: '#FFFFFF',
  },
  categoryItem: {
    alignItems: 'center',
    width: 60,
  },
  categoryIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  categoryIconCircleActive: {
    backgroundColor: '#EA580C',
  },
  categoryLabel: {
    fontSize: 12,
    color: '#4B5563',
    fontWeight: '500',
    textAlign: 'center',
  },
  categoryLabelActive: {
    color: '#EA580C',
    fontWeight: '700',
  },

  /* SECTION HEADERS */
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 10,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitleIcon: {
    fontSize: 18,
    marginRight: 6,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  seeAllText: {
    fontSize: 13,
    color: '#EA580C',
    fontWeight: '600',
  },
  nearPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  nearPillText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  emptySearchBox: {
    padding: 24,
    alignItems: 'center',
  },
  emptySearchText: {
    color: '#9CA3AF',
    fontSize: 14,
  },

  /* BEST SELLERS */
  bestSellersList: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    gap: 14,
  },
  dishCard: {
    width: 175,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  dishImageWrapper: {
    width: '100%',
    height: 120,
    position: 'relative',
  },
  dishImage: {
    width: '100%',
    height: '100%',
  },
  dishBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  dishBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  dishInfo: {
    padding: 10,
  },
  dishTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 2,
  },
  dishRestaurant: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 8,
  },
  dishPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dishPrice: {
    fontSize: 15,
    fontWeight: '800',
    color: '#EA580C',
  },
  addDishButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#EA580C',
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* NEARBY RESTAURANTS */
  restaurantsList: {
    paddingHorizontal: 16,
    gap: 16,
  },
  restaurantCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  restaurantCoverWrapper: {
    width: '100%',
    height: 165,
    position: 'relative',
    backgroundColor: '#E2E8F0',
  },
  restaurantCover: {
    width: '100%',
    height: '100%',
  },
  restaurantTopBadges: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    gap: 6,
  },
  statusBadgeOpen: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(5, 150, 105, 0.92)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#A7F3D0',
  },
  statusBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  statusBadgePromo: {
    backgroundColor: 'rgba(217, 119, 6, 0.92)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgePromoText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  statusBadgeFlash: {
    backgroundColor: 'rgba(225, 29, 72, 0.92)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeFlashText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  restaurantImageBottomOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  overlayItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  overlayText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  restaurantDetails: {
    padding: 12,
  },
  restaurantHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
    marginRight: 8,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B45309',
  },
  restaurantCuisine: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  restaurantDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 10,
  },
  restaurantFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  shippingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  shippingFeeText: {
    fontSize: 12,
    color: '#4B5563',
  },
  shippingFeeBold: {
    fontWeight: '700',
    color: '#1F2937',
  },
  promoTagBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  promoTagBadgeBlue: {
    backgroundColor: '#EFF6FF',
  },
  promoTagBadgeOrange: {
    backgroundColor: '#FFF7ED',
  },
  promoTagBadgeTeal: {
    backgroundColor: '#ECFDF5',
  },
  promoTagText: {
    fontSize: 11,
    fontWeight: '700',
  },
  promoTagTextBlue: {
    color: '#2563EB',
  },
  promoTagTextOrange: {
    color: '#EA580C',
  },
  promoTagTextTeal: {
    color: '#059669',
  },

  /* FLOATING CART BAR */
  floatingCartContainer: {
    position: 'absolute',
    bottom: 65,
    left: 16,
    right: 16,
    zIndex: 99,
  },
  floatingCartBar: {
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
  floatingCartLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  floatingCartIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  floatingCartBadge: {
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
  floatingCartBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  floatingCartTextGroup: {},
  floatingCartLabel: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '500',
  },
  floatingCartPrice: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  viewCartButton: {
    backgroundColor: '#EA580C',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  viewCartButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },

  /* BOTTOM TAB BAR */
  bottomTabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    elevation: 10,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    flex: 1,
  },
  tabItemLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '500',
    marginTop: 2,
  },
  tabItemLabelActive: {
    color: '#EA580C',
    fontWeight: '700',
  },
  tabDotBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EA580C',
  },

  /* MODALS CHUNG */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  cartModalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    maxHeight: height * 0.85,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#EA580C',
    fontWeight: '600',
    marginTop: 2,
  },

  /* CART ITEMS */
  cartItemsList: {
    marginVertical: 12,
  },
  cartItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  cartItemThumb: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginRight: 10,
  },
  cartItemCenter: {
    flex: 1,
  },
  cartItemName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  cartItemPrice: {
    fontSize: 13,
    color: '#EA580C',
    fontWeight: '600',
    marginTop: 2,
  },
  qtyControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  qtyBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },

  /* CHECKOUT SECTIONS */
  checkoutSection: {
    marginVertical: 10,
  },
  checkoutSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 8,
  },
  addressSelectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  addressName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  addressDetail: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  voucherInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  voucherInput: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    fontSize: 13,
  },
  voucherApplyBtn: {
    backgroundColor: '#EA580C',
    borderRadius: 10,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  voucherApplyBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  appliedVoucherNote: {
    fontSize: 12,
    color: '#059669',
    marginTop: 6,
  },
  paymentMethodsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  paymentOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  paymentOptionActive: {
    borderColor: '#EA580C',
    backgroundColor: '#FFF7ED',
  },
  paymentOptionText: {
    fontSize: 12,
    color: '#4B5563',
    fontWeight: '600',
  },
  paymentOptionTextActive: {
    color: '#EA580C',
    fontWeight: '700',
  },
  noteInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    fontSize: 13,
  },

  /* SUMMARY */
  summaryCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginVertical: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  summaryLabel: {
    fontSize: 13,
    color: '#6B7280',
  },
  summaryVal: {
    fontSize: 13,
    color: '#111827',
    fontWeight: '600',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 8,
  },
  summaryRowTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabelTotal: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  summaryValTotal: {
    fontSize: 18,
    fontWeight: '800',
    color: '#EA580C',
  },
  confirmOrderBtn: {
    backgroundColor: '#EA580C',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  confirmOrderBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },

  /* ORDERS MODAL */
  orderFilterTabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
  },
  orderFilterTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  orderFilterTabActive: {
    borderBottomColor: '#EA580C',
  },
  orderFilterTabText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  orderFilterTabTextActive: {
    color: '#EA580C',
    fontWeight: '700',
  },
  emptyOrdersBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyOrdersText: {
    color: '#9CA3AF',
    fontSize: 14,
    marginTop: 10,
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
    elevation: 1,
  },
  orderCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderCardId: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
  },
  orderCardTime: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 1,
  },
  orderStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  orderStatusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  orderRestaurantName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#EA580C',
    marginTop: 8,
  },
  orderItemsPreview: {
    marginVertical: 8,
    gap: 4,
  },
  orderItemLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  orderItemLineName: {
    fontSize: 13,
    color: '#374151',
  },
  orderItemLinePrice: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
  },
  orderNoteText: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
    marginTop: 4,
  },
  orderDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 10,
  },
  orderCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderTotalText: {
    fontSize: 13,
    color: '#4B5563',
  },
  orderTotalBold: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
  },
  cancelOrderBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  cancelOrderBtnText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '700',
  },
  reviewBtn: {
    backgroundColor: '#D97706',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  reviewBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  reviewedBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  reviewedText: {
    color: '#059669',
    fontSize: 12,
    fontWeight: '700',
  },

  /* REVIEW MODAL */
  reviewModalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginHorizontal: 24,
    marginBottom: height * 0.25,
    padding: 20,
    elevation: 10,
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 16,
  },
  reviewInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    fontSize: 13,
    textAlignVertical: 'top',
    height: 90,
  },
  modalActionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
  },
  modalCancelBtnText: {
    color: '#4B5563',
    fontWeight: '600',
  },
  modalSubmitBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: '#EA580C',
  },
  modalSubmitBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  /* ADDRESS MODAL */
  addressModalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginHorizontal: 20,
    marginBottom: height * 0.2,
    padding: 20,
  },
  addressItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  addressItemRowActive: {
    backgroundColor: '#FFF7ED',
    borderRadius: 10,
    paddingHorizontal: 8,
  },
});
