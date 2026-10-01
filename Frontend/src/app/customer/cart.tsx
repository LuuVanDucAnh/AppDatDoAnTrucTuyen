import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
  StatusBar,
  Alert,
  Modal,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';

import { Address, useApp } from '@/context/AppContext';
import type { PaymentMethod } from '@/services/types';

const PAYMENT_OPTIONS: {
  key: PaymentMethod;
  title: string;
  sub: string;
  icon: string;
  iconColor: string;
  iconBg?: string;
}[] = [
  {
    key: 'CASH',
    title: 'Tiền mặt khi nhận hàng (CASH / COD)',
    sub: 'Thanh toán trực tiếp cho tài xế',
    icon: 'money-bill-alt',
    iconColor: '#EA580C',
  },
  {
    key: 'MOMO',
    title: 'Ví MoMo (MOMO)',
    sub: 'Liên kết thanh toán một chạm',
    icon: 'wallet',
    iconColor: '#A21CAF',
    iconBg: '#FDF2F8',
  },
  {
    key: 'VNPAY',
    title: 'Thẻ ATM / VNPAY (VNPAY)',
    sub: 'Quét mã QR hoặc thẻ ngân hàng',
    icon: 'credit-card',
    iconColor: '#2563EB',
    iconBg: '#EFF6FF',
  },
];

export default function CartScreen() {
  const router = useRouter();
  const {
    isAuthenticated,
    addresses,
    defaultAddress,
    setDefaultAddress,
    addAddress,
    cartRestaurantName,
    cartRestaurantAddress,
    cartItems,
    cartLoading,
    refreshCart,
    foodTotal,
    deliveryFee,
    discount,
    totalAmount,
    updateQuantity,
    removeFromCart,
    checkout,
  } = useApp();

  // Chỉ lưu id địa chỉ đang chọn, còn object thì dẫn xuất từ danh sách địa chỉ của API
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [orderNote, setOrderNote] = useState('');
  const [placingOrder, setPlacingOrder] = useState(false);

  // Form thêm địa chỉ mới (POST /profile/addresses)
  const [showAddAddressForm, setShowAddAddressForm] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [newAddr, setNewAddr] = useState({
    receiverName: '',
    phone: '',
    addressDetail: '',
    ward: '',
    district: '',
    city: '',
  });

  // Vào màn giỏ hàng thì luôn lấy giỏ mới nhất từ server
  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) void refreshCart();
    }, [isAuthenticated, refreshCart])
  );

  // Địa chỉ đang chọn: theo id đã chọn, nếu không có thì dùng địa chỉ mặc định
  const selectedAddress = useMemo(
    () => addresses.find((a) => a.id === selectedAddressId) ?? defaultAddress,
    [addresses, defaultAddress, selectedAddressId]
  );

  const handleSaveNewAddress = async () => {
    if (!newAddr.receiverName.trim() || !newAddr.phone.trim() || !newAddr.addressDetail.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập tên người nhận, số điện thoại và địa chỉ.');
      return;
    }
    setSavingAddress(true);
    const created = await addAddress({ ...newAddr, isDefault: addresses.length === 0 });
    setSavingAddress(false);
    if (created) {
      setSelectedAddressId(created.id);
      setShowAddAddressForm(false);
      setShowAddressModal(false);
      setNewAddr({ receiverName: '', phone: '', addressDetail: '', ward: '', district: '', city: '' });
      Alert.alert('Đã thêm địa chỉ', 'Địa chỉ mới đã được lưu vào tài khoản của bạn.');
    }
  };

  // ── Đặt hàng: POST /orders/checkout ───────────────────────────────────────
  const handlePlaceOrder = async () => {
    if (!isAuthenticated) {
      Alert.alert('Bạn chưa đăng nhập', 'Vui lòng đăng nhập để đặt hàng.', [
        { text: 'Để sau', style: 'cancel' },
        { text: 'Đăng nhập', onPress: () => router.push('/auth') },
      ]);
      return;
    }
    if (cartItems.length === 0) {
      Alert.alert('Giỏ hàng trống', 'Vui lòng chọn món trước khi đặt hàng!');
      return;
    }
    if (!selectedAddress) {
      Alert.alert('Chưa có địa chỉ giao hàng', 'Vui lòng thêm địa chỉ giao hàng trước khi đặt.');
      setShowAddressModal(true);
      setShowAddAddressForm(true);
      return;
    }

    setPlacingOrder(true);
    const newOrder = await checkout(selectedAddress, paymentMethod, orderNote);
    setPlacingOrder(false);

    if (newOrder) {
      setOrderNote('');
      Alert.alert(
        'Đặt hàng thành công! 🎉',
        `Mã đơn hàng: #${newOrder.id}\nNhà hàng: ${newOrder.restaurantName}\nTổng tiền: ${newOrder.totalAmount.toLocaleString('vi-VN')}đ\nPhương thức: ${
          newOrder.paymentMethod === 'CASH' ? 'Tiền mặt khi nhận hàng (COD)' : newOrder.paymentMethod
        }\n\nĐơn hàng đã được gửi đến quán và đang chờ xác nhận!`,
        [{ text: 'Về trang chủ', onPress: () => router.replace('/') }]
      );
    }
  };

  const addressLines = (addr: Address) =>
    [addr.detailAddress, addr.ward, addr.district, addr.city].filter(Boolean).join(', ');

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* TOP HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Giỏ hàng và thanh toán</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerBtn} onPress={() => void refreshCart()}>
            <Ionicons name="refresh" size={20} color="#1F2937" />
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
            refreshing={cartLoading}
            onRefresh={() => void refreshCart()}
            colors={['#EA580C']}
            tintColor="#EA580C"
          />
        }
      >
        {/* Chưa đăng nhập */}
        {!isAuthenticated ? (
          <View style={styles.centerBox}>
            <Ionicons name="person-circle-outline" size={56} color="#D1D5DB" />
            <Text style={styles.centerTitle}>Bạn chưa đăng nhập</Text>
            <Text style={styles.centerText}>
              Giỏ hàng được lưu trên server theo từng tài khoản. Hãy đăng nhập để xem giỏ hàng của
              bạn.
            </Text>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push('/auth')}>
              <Ionicons name="log-in-outline" size={16} color="#FFFFFF" />
              <Text style={styles.primaryBtnText}>Đăng nhập</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* CARD 1: ĐỊA CHỈ GIAO HÀNG */}
            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <View style={styles.cardHeaderLeft}>
                  <Ionicons name="location-sharp" size={18} color="#C2410C" />
                  <Text style={styles.cardHeaderTitle}>Địa chỉ giao hàng</Text>
                </View>
                <TouchableOpacity onPress={() => setShowAddressModal(true)}>
                  <Text style={styles.cardHeaderActionText}>
                    {selectedAddress ? 'Thay đổi' : 'Thêm địa chỉ'}
                  </Text>
                </TouchableOpacity>
              </View>

              {selectedAddress ? (
                <>
                  <View style={styles.recipientRow}>
                    <Text style={styles.recipientName}>{selectedAddress.recipientName}</Text>
                    <Text style={styles.recipientDot}>•</Text>
                    <Text style={styles.recipientPhone}>{selectedAddress.phone}</Text>
                    {selectedAddress.isDefault && (
                      <View style={styles.defaultBadge}>
                        <Text style={styles.defaultBadgeText}>Mặc định</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.addressText}>{addressLines(selectedAddress)}</Text>
                </>
              ) : (
                <Text style={styles.addressText}>
                  Chưa có địa chỉ giao hàng. Bấm “Thêm địa chỉ” để tạo mới.
                </Text>
              )}
            </View>

            {/* CARD 2: NHÀ HÀNG & MÓN ĂN TRONG GIỎ */}
            <View style={styles.card}>
              <View style={styles.resHeader}>
                <View style={styles.resIconCircle}>
                  <FontAwesome5 name="store" size={13} color="#C2410C" />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.resNameRow}>
                    <Text style={styles.resName}>{cartRestaurantName || 'Giỏ hàng trống'}</Text>
                    {cartRestaurantName && (
                      <View style={styles.resOpenBadge}>
                        <Text style={styles.resOpenBadgeText}>Đang mở cửa</Text>
                      </View>
                    )}
                  </View>
                  {cartRestaurantAddress ? (
                    <Text style={styles.resDistanceText} numberOfLines={1}>
                      {cartRestaurantAddress}
                    </Text>
                  ) : null}
                </View>
              </View>

              <View style={styles.divider} />

              {cartLoading && cartItems.length === 0 ? (
                <View style={styles.emptyCartBox}>
                  <ActivityIndicator color="#EA580C" />
                  <Text style={styles.emptyCartText}>Đang tải giỏ hàng...</Text>
                </View>
              ) : cartItems.length === 0 ? (
                <View style={styles.emptyCartBox}>
                  <Text style={styles.emptyCartText}>Chưa có món nào trong giỏ hàng</Text>
                  <TouchableOpacity
                    style={styles.primaryBtn}
                    onPress={() => router.replace('/')}
                  >
                    <Ionicons name="restaurant-outline" size={16} color="#FFFFFF" />
                    <Text style={styles.primaryBtnText}>Chọn món ngay</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                cartItems.map((item) => (
                  <View key={item.id} style={styles.itemRow}>
                    <Image source={{ uri: item.image }} style={styles.itemImage} />

                    <View style={styles.itemCenter}>
                      <Text style={styles.itemName} numberOfLines={1}>
                        {item.name}
                      </Text>
                      <Text style={styles.itemPrice}>
                        {(item.price * item.quantity).toLocaleString('vi-VN')}đ
                      </Text>
                    </View>

                    <View style={styles.itemRight}>
                      <TouchableOpacity
                        style={styles.deleteBtn}
                        onPress={() => void removeFromCart(item.foodId)}
                      >
                        <Ionicons name="trash-outline" size={16} color="#9CA3AF" />
                      </TouchableOpacity>

                      <View style={styles.stepperContainer}>
                        <TouchableOpacity
                          style={styles.stepperBtn}
                          onPress={() => void updateQuantity(item.foodId, item.quantity - 1)}
                        >
                          <Ionicons name="remove" size={13} color="#6B7280" />
                        </TouchableOpacity>
                        <Text style={styles.stepperCount}>{item.quantity}</Text>
                        <TouchableOpacity
                          style={[styles.stepperBtn, styles.stepperBtnPlus]}
                          onPress={() => void updateQuantity(item.foodId, item.quantity + 1)}
                        >
                          <Ionicons name="add" size={13} color="#EA580C" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ))
              )}
            </View>

            {/* CARD 3: GHI CHÚ CHO QUÁN & TÀI XẾ */}
            <View style={styles.card}>
              <View style={styles.noteHeader}>
                <FontAwesome5 name="pencil-alt" size={14} color="#6B7280" />
                <Text style={styles.noteTitle}>Ghi chú cho quán & tài xế</Text>
              </View>
              <TextInput
                style={styles.noteInput}
                placeholder="Ghi chú: Xin thêm nước mắm ớt, ớt để riêng..."
                placeholderTextColor="#9CA3AF"
                value={orderNote}
                onChangeText={setOrderNote}
              />
            </View>

            {/* CARD 4: PHƯƠNG THỨC THANH TOÁN */}
            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.cardHeaderTitle}>Phương thức thanh toán</Text>
                <Text style={styles.cardHeaderSub}>Chọn 1 phương thức</Text>
              </View>

              {PAYMENT_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.key}
                  style={[styles.paymentRow, paymentMethod === opt.key && styles.paymentRowActive]}
                  onPress={() => setPaymentMethod(opt.key)}
                  activeOpacity={0.8}
                >
                  <View
                    style={[
                      styles.paymentIconCircle,
                      opt.iconBg ? { backgroundColor: opt.iconBg } : null,
                    ]}
                  >
                    <FontAwesome5 name={opt.icon as any} size={18} color={opt.iconColor} />
                  </View>
                  <View style={styles.paymentTextGroup}>
                    <Text style={styles.paymentTitle}>{opt.title}</Text>
                    <Text style={styles.paymentSub}>{opt.sub}</Text>
                  </View>
                  <View
                    style={[styles.radioOuter, paymentMethod === opt.key && styles.radioOuterActive]}
                  >
                    {paymentMethod === opt.key && <View style={styles.radioInner} />}
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {/* CARD 5: CHI TIẾT HOÁ ĐƠN */}
            <View style={styles.card}>
              <Text style={styles.cardHeaderTitle}>Chi tiết hoá đơn</Text>

              <View style={styles.billRow}>
                <Text style={styles.billLabel}>Tiền món (food_total)</Text>
                <Text style={styles.billVal}>{foodTotal.toLocaleString('vi-VN')}đ</Text>
              </View>

              <View style={styles.billRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Text style={styles.billLabel}>Phí giao hàng (delivery_fee)</Text>
                  <Ionicons name="information-circle-outline" size={14} color="#9CA3AF" />
                </View>
                <Text style={styles.billVal}>{deliveryFee.toLocaleString('vi-VN')}đ</Text>
              </View>

              {discount > 0 && (
                <View style={styles.billRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Ionicons name="pricetag-outline" size={14} color="#059669" />
                    <Text style={[styles.billLabel, { color: '#059669' }]}>
                      Khuyến mãi (discount)
                    </Text>
                  </View>
                  <Text style={[styles.billVal, { color: '#059669', fontWeight: '700' }]}>
                    -{discount.toLocaleString('vi-VN')}đ
                  </Text>
                </View>
              )}

              <View style={styles.billDivider} />

              <View style={styles.totalRow}>
                <View>
                  <Text style={styles.totalLabel}>TỔNG CỘNG</Text>
                  <Text style={styles.totalSub}>(Số tiền server sẽ ghi vào total_amount)</Text>
                </View>
                <Text style={styles.totalAmountText}>{totalAmount.toLocaleString('vi-VN')}đ</Text>
              </View>
            </View>

            {/* BOTTOM ACTION BUTTON */}
            <View style={styles.checkoutActionContainer}>
              <TouchableOpacity
                style={[
                  styles.placeOrderBtn,
                  (placingOrder || cartItems.length === 0) && { opacity: 0.6 },
                ]}
                activeOpacity={0.88}
                disabled={placingOrder || cartItems.length === 0}
                onPress={() => void handlePlaceOrder()}
              >
                <View style={styles.placeOrderBtnContent}>
                  {placingOrder ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <>
                      <FontAwesome5
                        name="shopping-bag"
                        size={16}
                        color="#FFFFFF"
                        style={{ marginRight: 8 }}
                      />
                      <Text style={styles.placeOrderBtnText}>
                        ĐẶT HÀNG NGAY  {totalAmount.toLocaleString('vi-VN')}đ
                      </Text>
                    </>
                  )}
                </View>
              </TouchableOpacity>

              <View style={styles.securityRow}>
                <Ionicons name="lock-closed" size={12} color="#9CA3AF" />
                <Text style={styles.securityText}>
                  Đơn hàng được tạo bằng transaction trên server
                </Text>
              </View>
            </View>
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* MODAL ĐỊA CHỈ */}
      <Modal visible={showAddressModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.addressModalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeaderTitle}>Địa chỉ giao hàng</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowAddressModal(false);
                  setShowAddAddressForm(false);
                }}
              >
                <Ionicons name="close" size={22} color="#4B5563" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 440 }}>
              {addresses.length === 0 && !showAddAddressForm && (
                <Text style={styles.centerText}>
                  Bạn chưa có địa chỉ nào. Hãy thêm địa chỉ để đặt hàng.
                </Text>
              )}

              {addresses.map((addr) => (
                <TouchableOpacity
                  key={addr.id}
                  style={[
                    styles.addressItem,
                    selectedAddress?.id === addr.id && styles.addressItemActive,
                  ]}
                  onPress={() => {
                    setSelectedAddressId(addr.id);
                    void setDefaultAddress(addr.id);
                    setShowAddressModal(false);
                  }}
                >
                  <Ionicons
                    name={selectedAddress?.id === addr.id ? 'radio-button-on' : 'radio-button-off'}
                    size={18}
                    color={selectedAddress?.id === addr.id ? '#EA580C' : '#9CA3AF'}
                    style={{ marginRight: 10 }}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.addressItemName}>
                      {addr.recipientName} • {addr.phone}
                      {addr.isDefault ? '  (Mặc định)' : ''}
                    </Text>
                    <Text style={styles.addressItemDetail}>{addressLines(addr)}</Text>
                  </View>
                </TouchableOpacity>
              ))}

              {showAddAddressForm ? (
                <View style={styles.addAddressForm}>
                  <TextInput
                    style={styles.addAddressInput}
                    placeholder="Tên người nhận *"
                    value={newAddr.receiverName}
                    onChangeText={(t) => setNewAddr((s) => ({ ...s, receiverName: t }))}
                  />
                  <TextInput
                    style={styles.addAddressInput}
                    placeholder="Số điện thoại *"
                    keyboardType="phone-pad"
                    value={newAddr.phone}
                    onChangeText={(t) => setNewAddr((s) => ({ ...s, phone: t }))}
                  />
                  <TextInput
                    style={styles.addAddressInput}
                    placeholder="Số nhà, tên đường *"
                    value={newAddr.addressDetail}
                    onChangeText={(t) => setNewAddr((s) => ({ ...s, addressDetail: t }))}
                  />
                  <TextInput
                    style={styles.addAddressInput}
                    placeholder="Phường / Xã"
                    value={newAddr.ward}
                    onChangeText={(t) => setNewAddr((s) => ({ ...s, ward: t }))}
                  />
                  <TextInput
                    style={styles.addAddressInput}
                    placeholder="Quận / Huyện"
                    value={newAddr.district}
                    onChangeText={(t) => setNewAddr((s) => ({ ...s, district: t }))}
                  />
                  <TextInput
                    style={styles.addAddressInput}
                    placeholder="Tỉnh / Thành phố"
                    value={newAddr.city}
                    onChangeText={(t) => setNewAddr((s) => ({ ...s, city: t }))}
                  />

                  <View style={styles.addAddressActions}>
                    <TouchableOpacity
                      style={styles.secondaryBtn}
                      onPress={() => setShowAddAddressForm(false)}
                    >
                      <Text style={styles.secondaryBtnText}>Huỷ</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.primaryBtn, { flex: 1 }, savingAddress && { opacity: 0.7 }]}
                      disabled={savingAddress}
                      onPress={() => void handleSaveNewAddress()}
                    >
                      {savingAddress ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                      ) : (
                        <Text style={styles.primaryBtnText}>Lưu địa chỉ</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.addAddressBtn}
                  onPress={() => setShowAddAddressForm(true)}
                >
                  <Ionicons name="add-circle-outline" size={18} color="#EA580C" />
                  <Text style={styles.addAddressBtnText}>Thêm địa chỉ mới</Text>
                </TouchableOpacity>
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
    backgroundColor: '#F8FAFC',
  },
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
    padding: 16,
    gap: 12,
  },

  /* TOP PROMO BANNER */
  topPromoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEDD5',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  topPromoBannerText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#C2410C',
    letterSpacing: 0.3,
  },

  /* CARDS CHUNG */
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardHeaderTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  cardHeaderActionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#EA580C',
  },
  cardHeaderSub: {
    fontSize: 11,
    color: '#9CA3AF',
  },

  /* ĐỊA CHỈ GIAO HÀNG */
  recipientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  recipientName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  recipientDot: {
    color: '#9CA3AF',
  },
  recipientPhone: {
    fontSize: 13,
    color: '#4B5563',
  },
  defaultBadge: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  defaultBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  addressText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    lineHeight: 18,
  },

  /* RESTAURANT HEADER */
  resHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  resIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFEDD5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  resName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  resOpenBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  resOpenBadgeText: {
    color: '#059669',
    fontSize: 10,
    fontWeight: '700',
  },
  resDistanceText: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },

  /* CART ITEMS */
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 10,
    marginRight: 12,
  },
  itemCenter: {
    flex: 1,
    justifyContent: 'center',
  },
  itemName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: '#EA580C',
  },
  itemRight: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 54,
  },
  deleteBtn: {
    padding: 2,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  stepperBtn: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperBtnPlus: {},
  stepperCount: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111827',
    paddingHorizontal: 6,
  },
  emptyCartBox: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyCartText: {
    color: '#9CA3AF',
    fontSize: 13,
  },

  /* GHI CHÚ */
  noteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  noteTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
  },
  noteInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    fontSize: 12,
    color: '#111827',
  },

  /* PHƯƠNG THỨC THANH TOÁN */
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  paymentRowActive: {
    borderColor: '#FFEDD5',
    backgroundColor: '#FFF7ED',
  },
  paymentIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFEDD5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  paymentTextGroup: {
    flex: 1,
  },
  paymentTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F2937',
  },
  paymentSub: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 1,
  },
  radioOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioOuterActive: {
    borderColor: '#EA580C',
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EA580C',
  },

  /* HOÁ ĐƠN */
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  billLabel: {
    fontSize: 13,
    color: '#4B5563',
  },
  billVal: {
    fontSize: 13,
    color: '#111827',
    fontWeight: '600',
  },
  billDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 10,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
  },
  totalSub: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 2,
  },
  totalAmountText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#C2410C',
  },

  /* NÚT ĐẶT HÀNG */
  checkoutActionContainer: {
    marginTop: 10,
    alignItems: 'center',
  },
  placeOrderBtn: {
    width: '100%',
    backgroundColor: '#C2410C',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#C2410C',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
  },
  placeOrderBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  placeOrderBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  securityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 10,
  },
  securityText: {
    fontSize: 11,
    color: '#9CA3AF',
  },

  /* ADDRESS MODAL */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  addressModalBox: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  addressItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  addressItemActive: {
    backgroundColor: '#FFF7ED',
    borderRadius: 8,
    paddingHorizontal: 8,
  },
  addressItemName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F2937',
  },
  addressItemDetail: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },

  /* ── Style bổ sung: trạng thái rỗng / nút / form địa chỉ ─────────────── */
  centerBox: {
    paddingVertical: 48,
    paddingHorizontal: 24,
    alignItems: 'center',
    gap: 10,
  },
  centerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  centerText: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 19,
    paddingVertical: 8,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 8,
    backgroundColor: '#EA580C',
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 12,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryBtn: {
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '700',
  },
  addAddressBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    marginTop: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#FDBA74',
    backgroundColor: '#FFF7ED',
  },
  addAddressBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#EA580C',
  },
  addAddressForm: {
    marginTop: 8,
    gap: 8,
  },
  addAddressInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#111827',
    backgroundColor: '#F9FAFB',
  },
  addAddressActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
});
