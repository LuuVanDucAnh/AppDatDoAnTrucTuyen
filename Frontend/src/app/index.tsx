import React, { useState } from 'react';
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
  Platform,
  Alert,
} from 'react-native';
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

// Mock dữ liệu danh mục
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

// Mock banners khuyến mãi
const BANNERS = [
  {
    id: 'b1',
    tag: 'Ưu đãi độc quyền',
    title: 'Giảm 30% Đơn Đầu Tiên',
    code: 'FREESHIP',
    expire: 'Hôm nay',
    btnText: 'Dùng ngay',
    colors: ['#B45309', '#78350F'], // Cam đất / Hổ phách ấm
  },
  {
    id: 'b2',
    tag: 'Tiệc Trà Sữa',
    title: 'Trà Sữa Mua 1 Tặng 1',
    code: 'MILKTEA',
    expire: 'Hôm nay',
    btnText: 'Áp dụng',
    colors: ['#065F46', '#022C22'], // Xanh ngọc lục bảo
  },
  {
    id: 'b3',
    tag: 'Flash Deal Cuối Tuần',
    title: 'Giảm 50.000đ Toàn Sàn',
    code: 'FOOD50K',
    expire: 'Chỉ còn 3 giờ',
    btnText: 'Săn deal',
    colors: ['#9D174D', '#500724'], // Hồng mận đậm
  },
];

// Mock món ngon bán chạy hôm nay
const BEST_SELLERS = [
  {
    id: 'f1',
    name: 'Cơm Tấm Sườn Bì Chả',
    restaurant: 'Cơm Tấm Ba Ghiền',
    price: 55000,
    priceFormatted: '55.000đ',
    tag: 'Bán chạy',
    tagColor: '#D97706',
    image:
      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'f2',
    name: 'Phở Bò Tái Nạm Gầu',
    restaurant: 'Phở Bò Gia Truyền 1986',
    price: 65000,
    priceFormatted: '65.000đ',
    tag: 'Yêu thích',
    tagColor: '#DC2626',
    image:
      'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'f3',
    name: 'Trà Sữa KOI Macchiato',
    restaurant: 'Trà Sữa KOI Thé - Pasteur',
    price: 45000,
    priceFormatted: '45.000đ',
    tag: 'Best Boba',
    tagColor: '#059669',
    image:
      'https://images.unsplash.com/photo-1558857563-b37cf5a5b515?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'f4',
    name: 'Gà Rán Giòn Cay Giòn Rụm',
    restaurant: 'Gà Rán Popeyes',
    price: 49000,
    priceFormatted: '49.000đ',
    tag: 'Hot Deal',
    tagColor: '#EA580C',
    image:
      'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=600&auto=format&fit=crop&q=80',
  },
];

// Mock quán ăn gần bạn
const NEARBY_RESTAURANTS = [
  {
    id: 'r1',
    name: 'Cơm Tấm Ba Ghiền',
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
    id: 'r2',
    name: 'Phở Bò Gia Truyền 1986',
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
    id: 'r3',
    name: 'Trà Sữa KOI Thé - Pasteur',
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
    id: 'r4',
    name: 'Bánh Mì Huỳnh Hoa - Lê Thị Riêng',
    rating: '4.9',
    reviews: '1.2k+',
    cuisine: 'Bánh mì đặc biệt, Pate bơ',
    deliveryTime: '15 - 25 phút',
    distance: '2.1 km',
    shippingFee: '18.000đ',
    promoTag: 'Giảm 15k đơn từ 99k ⚡',
    promoType: 'orange',
    isOpen: true,
    badges: ['MỞ CỬA', 'Top 1'],
    image:
      'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=800&auto=format&fit=crop&q=80',
  },
];

export default function HomeScreen() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [cartCount, setCartCount] = useState(2);
  const [cartTotal, setCartTotal] = useState(90000);
  const [activeTab, setActiveTab] = useState<'home' | 'orders' | 'notif' | 'account'>('home');

  // Xử lý thêm món vào giỏ
  const handleAddToCart = (dishName: string, price: number) => {
    setCartCount((prev) => prev + 1);
    setCartTotal((prev) => prev + price);
    Alert.alert('Đã thêm vào giỏ', `Đã thêm "${dishName}" vào giỏ hàng thành công!`);
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
        {/* Vị trí giao hàng */}
        <TouchableOpacity style={styles.locationContainer} activeOpacity={0.7}>
          <View style={styles.locationIconCircle}>
            <Ionicons name="navigate-sharp" size={18} color="#EA580C" />
          </View>
          <View style={styles.locationTextContainer}>
            <View style={styles.locationSubRow}>
              <Text style={styles.locationSubText}>Giao đến</Text>
              <Ionicons name="chevron-down" size={14} color="#6B7280" />
            </View>
            <Text style={styles.locationTitle} numberOfLines={1}>
              Trang Chủ
            </Text>
          </View>
        </TouchableOpacity>

        {/* Nút Thông báo & Avatar */}
        <View style={styles.headerRightActions}>
          <TouchableOpacity
            style={styles.headerIconButton}
            activeOpacity={0.7}
            onPress={() => Alert.alert('Thông báo', 'Bạn có 3 thông báo khuyến mãi mới!')}
          >
            <Ionicons name="bag-handle-outline" size={22} color="#374151" />
            <View style={styles.badge}>
              <Text style={styles.badgeText}>3</Text>
            </View>
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
            onPress={() => Alert.alert('Bộ lọc', 'Lọc theo khoảng cách, đánh giá, giá cả...')}
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
              {/* Badge ưu đãi */}
              <View style={styles.bannerTagRow}>
                <View style={styles.bannerTagPill}>
                  <Ionicons name="star" size={11} color="#FEF08A" />
                  <Text style={styles.bannerTagText}>{banner.tag}</Text>
                </View>
              </View>

              {/* Tiêu đề & Mã giảm */}
              <Text style={styles.bannerTitle}>{banner.title}</Text>

              <View style={styles.bannerCodeRow}>
                <Text style={styles.bannerCodePrefix}>Nhập mã: </Text>
                <View style={styles.bannerCodeBadge}>
                  <Text style={styles.bannerCodeText}>{banner.code}</Text>
                </View>
              </View>

              {/* Hạn & Nút Dùng ngay */}
              <View style={styles.bannerFooter}>
                <Text style={styles.bannerExpireText}>Hết: {banner.expire}</Text>
                <TouchableOpacity
                  style={styles.bannerActionBtn}
                  activeOpacity={0.85}
                  onPress={() =>
                    Alert.alert('Áp dụng mã', `Mã ${banner.code} đã được lưu vào ví voucher!`)
                  }
                >
                  <Text style={styles.bannerActionBtnText}>{banner.btnText}</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          ))}
        </ScrollView>

        {/* CATEGORIES */}
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
          <TouchableOpacity activeOpacity={0.7} style={styles.seeAllButton}>
            <Text style={styles.seeAllText}>Xem hết</Text>
            <Ionicons name="chevron-forward" size={14} color="#EA580C" />
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.bestSellersList}
        >
          {BEST_SELLERS.map((dish) => (
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
                  {dish.restaurant}
                </Text>

                <View style={styles.dishPriceRow}>
                  <Text style={styles.dishPrice}>{dish.priceFormatted}</Text>
                  <TouchableOpacity
                    style={styles.addDishButton}
                    activeOpacity={0.8}
                    onPress={() => handleAddToCart(dish.name, dish.price)}
                  >
                    <Ionicons name="add" size={18} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* SECTION: QUÁN ĂN ĐANG MỞ GẦN BẠN */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="storefront" size={20} color="#059669" style={{ marginRight: 6 }} />
            <Text style={styles.sectionTitle}>Quán ăn đang mở gần bạn</Text>
          </View>
          <View style={styles.nearPill}>
            <Text style={styles.nearPillText}>Gần nhất</Text>
          </View>
        </View>

        {/* DANH SÁCH QUÁN ĂN */}
        <View style={styles.restaurantsList}>
          {NEARBY_RESTAURANTS.map((res) => (
            <TouchableOpacity
              key={res.id}
              style={styles.restaurantCard}
              activeOpacity={0.9}
              onPress={() => Alert.alert('Nhà hàng', `Mở thực đơn của ${res.name}`)}
            >
              {/* Ảnh bìa & Thông tin trên ảnh */}
              <View style={styles.restaurantCoverWrapper}>
                <Image source={{ uri: res.image }} style={styles.restaurantCover} />

                {/* Badges góc trên */}
                <View style={styles.restaurantTopBadges}>
                  <View style={styles.statusBadgeOpen}>
                    <View style={styles.greenDot} />
                    <Text style={styles.statusBadgeText}>MỞ CỬA</Text>
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

                {/* Thanh thời gian & khoảng cách phía dưới ảnh */}
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

              {/* Thông tin nhà hàng */}
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

                {/* Phí ship và khuyến mãi */}
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

        {/* Khoảng cách cuối để không bị che bởi Giỏ hàng & Bottom Bar */}
        <View style={{ height: 110 }} />
      </ScrollView>

      {/* THANH GIỎ HÀNG NỔI (FLOATING CART) */}
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
              <Text style={styles.floatingCartLabel}>Giỏ hàng của bạn</Text>
              <Text style={styles.floatingCartPrice}>{cartTotal.toLocaleString('vi-VN')}đ</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.viewCartButton}
            activeOpacity={0.85}
            onPress={() =>
              Alert.alert(
                'Giỏ hàng',
                `Bạn đang có ${cartCount} món. Tổng tiền: ${cartTotal.toLocaleString('vi-VN')}đ`
              )
            }
          >
            <Text style={styles.viewCartButtonText}>Xem giỏ</Text>
            <Ionicons name="arrow-forward" size={14} color="#FFFFFF" style={{ marginLeft: 4 }} />
          </TouchableOpacity>
        </View>
      </View>

      {/* BOTTOM NAVIGATION BAR */}
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
            Alert.alert('Đơn hàng', 'Danh sách các đơn hàng đã đặt của bạn.');
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
            Alert.alert('Thông báo', 'Hộp thư khuyến mãi và cập nhật đơn hàng.');
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
    fontSize: 16,
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
});
