import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
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

import { Address, useApp } from '@/context/AppContext';
import { ApiError, authApi } from '@/services/api';

const money = (v: number) => Number(v || 0).toLocaleString('vi-VN');

export default function ProfileScreen() {
  const router = useRouter();
  const {
    user,
    isAuthenticated,
    authLoading,
    logout,
    addresses,
    addressesLoading,
    refreshAddresses,
    setDefaultAddress,
    addAddress,
    orders,
    refreshOrders,
  } = useApp();

  const [refreshing, setRefreshing] = useState(false);

  // Form đổi mật khẩu (PATCH /profile/change-password)
  const [showPassword, setShowPassword] = useState(false);
  const [pwd, setPwd] = useState({ current: '', next: '', confirm: '' });
  const [savingPwd, setSavingPwd] = useState(false);

  // Form thêm địa chỉ (POST /profile/addresses)
  const [showAddress, setShowAddress] = useState(false);
  const [savingAddr, setSavingAddr] = useState(false);
  const [newAddr, setNewAddr] = useState({
    receiverName: '',
    phone: '',
    addressDetail: '',
    ward: '',
    district: '',
    city: '',
  });

  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) {
        void refreshAddresses();
        void refreshOrders();
      }
    }, [isAuthenticated, refreshAddresses, refreshOrders])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refreshAddresses(), refreshOrders()]);
    setRefreshing(false);
  }, [refreshAddresses, refreshOrders]);

  /** Thống kê tính từ đơn hàng thật của user (GET /orders/my-orders). */
  const stats = useMemo(() => {
    const active = orders.filter((o) =>
      ['PENDING', 'CONFIRMED', 'PREPARING', 'DELIVERING'].includes(o.status)
    ).length;
    const delivered = orders.filter((o) => o.status === 'DELIVERED');
    const spent = delivered.reduce((sum, o) => sum + o.totalAmount, 0);
    return { active, completed: delivered.length, spent };
  }, [orders]);

  const memberSince = useMemo(() => {
    // created_at không có trong kiểu User của context nên hiển thị theo đơn cũ nhất nếu có
    if (orders.length === 0) return null;
    return orders[orders.length - 1].createdAt;
  }, [orders]);

  const handleChangePassword = async () => {
    if (!pwd.current || !pwd.next) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập mật khẩu hiện tại và mật khẩu mới.');
      return;
    }
    if (pwd.next.length < 6) {
      Alert.alert('Mật khẩu quá ngắn', 'Mật khẩu mới phải có ít nhất 6 ký tự.');
      return;
    }
    if (pwd.next !== pwd.confirm) {
      Alert.alert('Không khớp', 'Xác nhận mật khẩu không trùng với mật khẩu mới.');
      return;
    }

    setSavingPwd(true);
    try {
      await authApi.changePassword(pwd.current, pwd.next);
      setShowPassword(false);
      setPwd({ current: '', next: '', confirm: '' });
      Alert.alert('Đổi mật khẩu thành công', 'Lần đăng nhập sau hãy dùng mật khẩu mới.');
    } catch (err) {
      Alert.alert('Không đổi được mật khẩu', err instanceof ApiError ? err.message : String(err));
    } finally {
      setSavingPwd(false);
    }
  };

  const handleAddAddress = async () => {
    if (!newAddr.receiverName.trim() || !newAddr.phone.trim() || !newAddr.addressDetail.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập tên người nhận, số điện thoại và địa chỉ.');
      return;
    }
    setSavingAddr(true);
    const created = await addAddress({ ...newAddr, isDefault: addresses.length === 0 });
    setSavingAddr(false);
    if (created) {
      setShowAddress(false);
      setNewAddr({ receiverName: '', phone: '', addressDetail: '', ward: '', district: '', city: '' });
    }
  };

  const addressLine = (a: Address) =>
    [a.detailAddress, a.ward, a.district, a.city].filter(Boolean).join(', ');

  // ── Chưa đăng nhập ────────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#EA580C" />
        </View>
      </SafeAreaView>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Hồ sơ cá nhân</Text>
        </View>
        <View style={styles.centerBox}>
          <Ionicons name="person-circle-outline" size={58} color="#D1D5DB" />
          <Text style={styles.centerTitle}>Bạn chưa đăng nhập</Text>
          <Text style={styles.centerText}>
            Đăng nhập để xem hồ sơ, sổ địa chỉ và lịch sử đơn hàng của bạn.
          </Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push('/auth')}>
            <Ionicons name="log-in-outline" size={16} color="#FFFFFF" />
            <Text style={styles.primaryBtnText}>Đăng nhập</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Hồ sơ cá nhân</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void onRefresh()}
            colors={['#EA580C']}
            tintColor="#EA580C"
          />
        }
      >
        {/* Thẻ người dùng */}
        <View style={styles.userCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user.fullName.trim().charAt(0).toUpperCase() || '?'}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.userName}>{user.fullName}</Text>
            <View style={styles.userMetaRow}>
              <Ionicons name="call-outline" size={12} color="#94A3B8" />
              <Text style={styles.userMeta}>{user.phone}</Text>
            </View>
            {user.email ? (
              <View style={styles.userMetaRow}>
                <Ionicons name="mail-outline" size={12} color="#94A3B8" />
                <Text style={styles.userMeta} numberOfLines={1}>
                  {user.email}
                </Text>
              </View>
            ) : null}
            <View style={styles.badgeRow}>
              <View style={styles.activeBadge}>
                <View style={styles.activeDot} />
                <Text style={styles.activeBadgeText}>Đang hoạt động</Text>
              </View>
              <View style={styles.roleBadge}>
                <Text style={styles.roleBadgeText}>{user.role}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Thống kê từ đơn hàng thật */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{stats.active}</Text>
            <Text style={styles.statLabel}>Đơn đang xử lý</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{stats.completed}</Text>
            <Text style={styles.statLabel}>Đã hoàn thành</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { fontSize: 15 }]}>{money(stats.spent)}đ</Text>
            <Text style={styles.statLabel}>Tổng chi tiêu</Text>
          </View>
        </View>
        {memberSince ? (
          <Text style={styles.memberNote}>Đơn hàng đầu tiên: {memberSince}</Text>
        ) : null}

        {/* Xem tất cả đơn hàng đã đặt */}
        <TouchableOpacity
          style={styles.customerOrderCard}
          activeOpacity={0.9}
          onPress={() => router.push('/customer/orders' as any)}
        >
          <View style={styles.customerOrderIcon}>
            <Ionicons name="receipt" size={19} color="#FFFFFF" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.customerOrderTitle}>Đơn hàng của tôi</Text>
            <Text style={styles.customerOrderSub}>Xem lịch sử đơn, tiến trình & đánh giá món ăn</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#C2410C" />
        </TouchableOpacity>

        {/* Khu vực chủ quán */}
        {user.role === 'RESTAURANT_OWNER' && (
          <TouchableOpacity
            style={styles.ownerCard}
            activeOpacity={0.9}
            onPress={() => router.push('/owner/dashboard')}
          >
            <View style={styles.ownerIcon}>
              <Ionicons name="storefront" size={19} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.ownerTitle}>Khu vực chủ quán</Text>
              <Text style={styles.ownerSub}>Quản lý đơn hàng, thực đơn và doanh thu</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#C2410C" />
          </TouchableOpacity>
        )}

        {/* Khu vực Quản trị viên sàn */}
        {user.role === 'ADMIN' && (
          <TouchableOpacity
            style={styles.adminCard}
            activeOpacity={0.9}
            onPress={() => router.push('/admin/orders' as any)}
          >
            <View style={styles.adminIcon}>
              <Ionicons name="shield-checkmark" size={19} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.adminTitle}>Khu vực Quản trị viên (Admin)</Text>
              <Text style={styles.adminSub}>Giám sát đơn hàng toàn sàn & can thiệp hệ thống</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#4F46E5" />
          </TouchableOpacity>
        )}

        {/* Sổ địa chỉ */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Sổ địa chỉ giao hàng</Text>
            {addressesLoading && <ActivityIndicator size="small" color="#EA580C" />}
          </View>

          {addresses.length === 0 ? (
            <Text style={styles.mutedText}>Bạn chưa có địa chỉ nào.</Text>
          ) : (
            addresses.map((a) => (
              <TouchableOpacity
                key={a.id}
                style={styles.addressRow}
                activeOpacity={0.8}
                onPress={() => {
                  if (!a.isDefault) void setDefaultAddress(a.id);
                }}
              >
                <View style={styles.addressIcon}>
                  <Ionicons
                    name={a.isDefault ? 'home' : 'location-outline'}
                    size={15}
                    color={a.isDefault ? '#C2410C' : '#94A3B8'}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.addressTopRow}>
                    <Text style={styles.addressName}>{a.recipientName}</Text>
                    {a.isDefault && (
                      <View style={styles.defaultTag}>
                        <Text style={styles.defaultTagText}>Mặc định</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.addressPhone}>{a.phone}</Text>
                  <Text style={styles.addressDetail}>{addressLine(a)}</Text>
                </View>
              </TouchableOpacity>
            ))
          )}

          <TouchableOpacity style={styles.dashedBtn} onPress={() => setShowAddress(true)}>
            <Ionicons name="add-circle-outline" size={17} color="#EA580C" />
            <Text style={styles.dashedBtnText}>Thêm địa chỉ mới</Text>
          </TouchableOpacity>
        </View>

        {/* Bảo mật & tài khoản */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Bảo mật & Tài khoản</Text>

          <MenuRow
            icon="key-outline"
            title="Đổi mật khẩu"
            sub="Mật khẩu mới tối thiểu 6 ký tự"
            onPress={() => setShowPassword(true)}
          />
          <MenuRow
            icon="card-outline"
            title="Phương thức thanh toán"
            sub="COD, MoMo, VNPAY — chọn khi đặt hàng"
            onPress={() =>
              Alert.alert(
                'Phương thức thanh toán',
                'Bạn chọn phương thức ngay ở màn thanh toán. Database chưa có bảng lưu thẻ/ví liên kết nên chưa có mục quản lý riêng.'
              )
            }
          />
        </View>

        {/* Tiện ích & lịch sử */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Tiện ích & Lịch sử</Text>

          <MenuRow
            icon="receipt-outline"
            title="Đơn hàng của tôi"
            sub={`${orders.length} đơn · ${stats.active} đang xử lý`}
            onPress={() => router.push('/')}
          />
          <MenuRow
            icon="star-outline"
            title="Đánh giá của tôi"
            sub="Xem lại các đơn bạn đã đánh giá"
            onPress={() => {
              const reviewed = orders.filter((o) => o.reviewed);
              Alert.alert(
                'Đánh giá của tôi',
                reviewed.length === 0
                  ? 'Bạn chưa đánh giá đơn hàng nào.'
                  : reviewed
                      .map((o) => `• Đơn #${o.id} — ${o.restaurantName}: ${o.reviewRating}⭐`)
                      .join('\n')
              );
            }}
          />
          <MenuRow
            icon="help-circle-outline"
            title="Trung tâm trợ giúp"
            sub="Câu hỏi thường gặp về đặt món"
            onPress={() =>
              Alert.alert(
                'Trung tâm trợ giúp',
                '• Huỷ đơn: chỉ huỷ được khi đơn còn ở trạng thái Chờ quán xác nhận.\n' +
                  '• Đánh giá: chỉ đánh giá được đơn đã giao, mỗi đơn 1 lần.\n' +
                  '• Giỏ hàng: mỗi lần chỉ đặt món của 1 quán.\n' +
                  '• Phí giao hàng cố định 15.000đ mỗi đơn.'
              )
            }
          />
        </View>

        {/* Đăng xuất */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={() =>
            Alert.alert('Đăng xuất', 'Bạn chắc chắn muốn đăng xuất?', [
              { text: 'Huỷ', style: 'cancel' },
              {
                text: 'Đăng xuất',
                style: 'destructive',
                onPress: async () => {
                  await logout();
                  router.replace('/');
                },
              },
            ])
          }
        >
          <Ionicons name="log-out-outline" size={18} color="#B91C1C" />
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>Food v1.0 · Bài tập lớn Phát triển ứng dụng di động</Text>
        <View style={{ height: 24 }} />
      </ScrollView>

      {/* ── Modal đổi mật khẩu ─────────────────────────────────────────────── */}
      <Modal visible={showPassword} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Đổi mật khẩu</Text>
              <TouchableOpacity onPress={() => setShowPassword(false)}>
                <Ionicons name="close" size={22} color="#4B5563" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Mật khẩu hiện tại *"
              secureTextEntry
              value={pwd.current}
              onChangeText={(t) => setPwd((s) => ({ ...s, current: t }))}
            />
            <TextInput
              style={styles.input}
              placeholder="Mật khẩu mới (≥ 6 ký tự) *"
              secureTextEntry
              value={pwd.next}
              onChangeText={(t) => setPwd((s) => ({ ...s, next: t }))}
            />
            <TextInput
              style={styles.input}
              placeholder="Nhập lại mật khẩu mới *"
              secureTextEntry
              value={pwd.confirm}
              onChangeText={(t) => setPwd((s) => ({ ...s, confirm: t }))}
            />

            <TouchableOpacity
              style={[styles.saveBtn, savingPwd && { opacity: 0.7 }]}
              disabled={savingPwd}
              onPress={() => void handleChangePassword()}
            >
              {savingPwd ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.saveBtnText}>Cập nhật mật khẩu</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Modal thêm địa chỉ ─────────────────────────────────────────────── */}
      <Modal visible={showAddress} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Thêm địa chỉ mới</Text>
              <TouchableOpacity onPress={() => setShowAddress(false)}>
                <Ionicons name="close" size={22} color="#4B5563" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 380 }} keyboardShouldPersistTaps="handled">
              <TextInput
                style={styles.input}
                placeholder="Tên người nhận *"
                value={newAddr.receiverName}
                onChangeText={(t) => setNewAddr((s) => ({ ...s, receiverName: t }))}
              />
              <TextInput
                style={styles.input}
                placeholder="Số điện thoại *"
                keyboardType="phone-pad"
                value={newAddr.phone}
                onChangeText={(t) => setNewAddr((s) => ({ ...s, phone: t }))}
              />
              <TextInput
                style={styles.input}
                placeholder="Số nhà, tên đường *"
                value={newAddr.addressDetail}
                onChangeText={(t) => setNewAddr((s) => ({ ...s, addressDetail: t }))}
              />
              <TextInput
                style={styles.input}
                placeholder="Phường / Xã"
                value={newAddr.ward}
                onChangeText={(t) => setNewAddr((s) => ({ ...s, ward: t }))}
              />
              <TextInput
                style={styles.input}
                placeholder="Quận / Huyện"
                value={newAddr.district}
                onChangeText={(t) => setNewAddr((s) => ({ ...s, district: t }))}
              />
              <TextInput
                style={styles.input}
                placeholder="Tỉnh / Thành phố"
                value={newAddr.city}
                onChangeText={(t) => setNewAddr((s) => ({ ...s, city: t }))}
              />
            </ScrollView>

            <TouchableOpacity
              style={[styles.saveBtn, savingAddr && { opacity: 0.7 }]}
              disabled={savingAddr}
              onPress={() => void handleAddAddress()}
            >
              {savingAddr ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.saveBtnText}>Lưu địa chỉ</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function MenuRow({
  icon,
  title,
  sub,
  onPress,
}: {
  icon: string;
  title: string;
  sub: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.menuRow} activeOpacity={0.7} onPress={onPress}>
      <View style={styles.menuIcon}>
        <Ionicons name={icon as any} size={17} color="#475569" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.menuTitle}>{title}</Text>
        <Text style={styles.menuSub}>{sub}</Text>
      </View>
      <Ionicons name="chevron-forward" size={17} color="#CBD5E1" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFC' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerBtn: { padding: 6 },
  headerTitle: { fontSize: 15.5, fontWeight: '800', color: '#111827' },

  content: { padding: 14, gap: 12 },

  userCard: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 15,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#C2410C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 23, fontWeight: '800', color: '#FFFFFF' },
  userName: { fontSize: 16.5, fontWeight: '800', color: '#111827' },
  userMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 },
  userMeta: { fontSize: 12, color: '#64748B' },
  badgeRow: { flexDirection: 'row', gap: 6, marginTop: 8 },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
  },
  activeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#16A34A' },
  activeBadgeText: { fontSize: 10, fontWeight: '800', color: '#15803D' },
  roleBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
  },
  roleBadgeText: { fontSize: 10, fontWeight: '700', color: '#475569' },

  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  statBox: { flex: 1, alignItems: 'center', gap: 3, paddingHorizontal: 4 },
  statValue: { fontSize: 19, fontWeight: '800', color: '#EA580C' },
  statLabel: { fontSize: 10.5, color: '#94A3B8', fontWeight: '600', textAlign: 'center' },
  statDivider: { width: 1, height: 30, backgroundColor: '#F1F5F9' },
  memberNote: { fontSize: 10.5, color: '#94A3B8', textAlign: 'center', marginTop: -4 },

  customerOrderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
    borderRadius: 14,
    padding: 13,
  },
  customerOrderIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#C2410C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  customerOrderTitle: { fontSize: 14, fontWeight: '800', color: '#9A3412' },
  customerOrderSub: { fontSize: 11.5, color: '#C2410C', marginTop: 2 },

  ownerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
    borderRadius: 14,
    padding: 13,
  },
  ownerIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EA580C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ownerTitle: { fontSize: 14, fontWeight: '800', color: '#9A3412' },
  ownerSub: { fontSize: 11.5, color: '#C2410C', marginTop: 2 },

  adminCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    borderRadius: 14,
    padding: 13,
  },
  adminIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  adminTitle: { fontSize: 14, fontWeight: '800', color: '#312E81' },
  adminSub: { fontSize: 11.5, color: '#4F46E5', marginTop: 2 },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    gap: 9,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 14.5, fontWeight: '800', color: '#111827' },
  mutedText: { fontSize: 12.5, color: '#94A3B8' },

  addressRow: { flexDirection: 'row', gap: 10, paddingVertical: 8 },
  addressIcon: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addressTopRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  addressName: { fontSize: 13, fontWeight: '700', color: '#1F2937' },
  defaultTag: {
    backgroundColor: '#FFEDD5',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  defaultTagText: { fontSize: 9.5, fontWeight: '800', color: '#C2410C' },
  addressPhone: { fontSize: 11.5, color: '#94A3B8', marginTop: 1 },
  addressDetail: { fontSize: 11.5, color: '#64748B', marginTop: 2, lineHeight: 16 },

  dashedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    marginTop: 4,
    borderRadius: 11,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#FDBA74',
    backgroundColor: '#FFF7ED',
  },
  dashedBtnText: { fontSize: 12.5, fontWeight: '700', color: '#EA580C' },

  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  menuIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTitle: { fontSize: 13, fontWeight: '700', color: '#1F2937' },
  menuSub: { fontSize: 11, color: '#94A3B8', marginTop: 1 },

  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 13,
    backgroundColor: '#FEE2E2',
  },
  logoutText: { fontSize: 14, fontWeight: '800', color: '#B91C1C' },
  versionText: { fontSize: 10.5, color: '#CBD5E1', textAlign: 'center' },

  centerBox: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 9 },
  centerTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  centerText: { fontSize: 12.5, color: '#6B7280', textAlign: 'center', lineHeight: 18 },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    backgroundColor: '#EA580C',
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 11,
  },
  primaryBtnText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    padding: 20,
  },
  modalBox: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 18, gap: 9 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { fontSize: 16, fontWeight: '800', color: '#111827' },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 13,
    color: '#111827',
    backgroundColor: '#F9FAFB',
    marginTop: 8,
  },
  saveBtn: {
    marginTop: 14,
    backgroundColor: '#EA580C',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  saveBtnText: { fontSize: 14, fontWeight: '800', color: '#FFFFFF' },
});
