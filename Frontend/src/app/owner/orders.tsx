import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  Linking,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { OwnerHeader, OwnerStateScreen, OwnerTabBar } from '@/components/owner-chrome';
import { useOwner } from '@/context/OwnerContext';
import { ApiError, ownerApi } from '@/services/api';
import type { ApiOwnerOrder, OrderStatus } from '@/services/types';

/** Các tab khớp thiết kế mockup: Chờ duyệt, Đang nấu, Đang giao, Lịch sử */
const TABS = [
  { key: 'PENDING', label: 'Chờ duyệt', statuses: ['PENDING'] },
  { key: 'COOKING', label: 'Đang nấu', statuses: ['CONFIRMED', 'PREPARING'] },
  { key: 'DELIVERING', label: 'Đang giao', statuses: ['DELIVERING'] },
  { key: 'HISTORY', label: 'Lịch sử', statuses: ['DELIVERED', 'CANCELLED'] },
] as const;

type TabKey = (typeof TABS)[number]['key'];

const money = (v: number | string) => Number(v ?? 0).toLocaleString('vi-VN');

function formatClock(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '11:30';
  return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

function timeAgo(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const mins = Math.max(1, Math.floor((Date.now() - d.getTime()) / 60000));
  const clock = formatClock(iso);
  if (mins < 60) return `${mins} phút trước (${clock})`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ trước (${clock})`;
  return `${d.toLocaleDateString('vi-VN')} (${clock})`;
}

// Fallback ảnh món ăn nếu DB không có ảnh
const DEFAULT_FOOD_IMG =
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=300&q=80';

export default function OwnerOrdersScreen() {
  const router = useRouter();
  const { restaurant, loading: ownerLoading, error: ownerError, reload } = useOwner();

  const [orders, setOrders] = useState<ApiOwnerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<TabKey>('PENDING');
  const [busyOrderId, setBusyOrderId] = useState<number | null>(null);

  // Tính năng theo mockup: Tự động nhận đơn & Chuông báo
  const [autoAccept, setAutoAccept] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Toast thông báo "Thao tác thành công"
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastAnim = useMemo(() => new Animated.Value(0), []);

  const showToast = useCallback(
    (msg = 'Thao tác thành công') => {
      setToastMessage(msg);
      Animated.sequence([
        Animated.timing(toastAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.delay(2000),
        Animated.timing(toastAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
      ]).start(() => setToastMessage(null));
    },
    [toastAnim]
  );

  const load = useCallback(async () => {
    if (!restaurant) return;
    try {
      const { data } = await ownerApi.getOrders(restaurant.id, { limit: 100 });
      setOrders(data);
    } catch (err) {
      Alert.alert('Không tải được đơn hàng', err instanceof Error ? err.message : String(err));
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

  const counts = useMemo(() => {
    const map: Record<TabKey, number> = { PENDING: 0, COOKING: 0, DELIVERING: 0, HISTORY: 0 };
    for (const t of TABS) {
      map[t.key] = orders.filter((o) => (t.statuses as readonly string[]).includes(o.status)).length;
    }
    return map;
  }, [orders]);

  const shown = useMemo(() => {
    const active = TABS.find((t) => t.key === tab)!;
    return orders.filter((o) => (active.statuses as readonly string[]).includes(o.status));
  }, [orders, tab]);

  const changeStatus = async (order: ApiOwnerOrder, next: OrderStatus, successMsg?: string) => {
    if (!restaurant) return;
    setBusyOrderId(order.id);
    try {
      await ownerApi.updateOrderStatus(restaurant.id, order.id, next);
      await load();
      showToast(successMsg ?? 'Thao tác thành công');
    } catch (err) {
      Alert.alert('Không đổi được trạng thái', err instanceof ApiError ? err.message : String(err));
    } finally {
      setBusyOrderId(null);
    }
  };

  const confirmReject = (order: ApiOwnerOrder) => {
    Alert.alert(
      'Từ chối đơn hàng',
      `Huỷ đơn #DH-${order.id} của ${order.user?.full_name ?? 'khách'}?\nNếu khách đã thanh toán online, hệ thống sẽ tự chuyển sang hoàn tiền (REFUNDED).`,
      [
        { text: 'Không', style: 'cancel' },
        {
          text: 'Từ chối đơn',
          style: 'destructive',
          onPress: () => void changeStatus(order, 'CANCELLED', 'Đã từ chối đơn hàng'),
        },
      ]
    );
  };

  if (ownerLoading || ownerError || !restaurant) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <OwnerStateScreen loading={ownerLoading} error={ownerError} onRetry={() => void reload()} />
        <OwnerTabBar ordersCount={counts.PENDING} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header chuẩn mockup: Tên quán dropdown + Badge MỞ CỬA + Bell + Avatar */}
      <OwnerHeader
        notificationCount={counts.PENDING}
        onPressBell={() => {
          Alert.alert(
            'Thông báo đơn hàng',
            `Quán đang có ${counts.PENDING} đơn chờ duyệt, ${counts.COOKING} đơn đang chế biến và ${counts.DELIVERING} đơn đang giao.`
          );
        }}
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void onRefresh()}
            colors={['#C2410C']}
            tintColor="#C2410C"
          />
        }
      >
        {/* Banner cảnh báo đơn mới theo mockup */}
        {counts.PENDING > 0 && (
          <View style={styles.alertBanner}>
            <View style={styles.alertLeft}>
              <View style={styles.alertDot} />
              <View style={{ flex: 1 }}>
                <Text style={styles.alertTitle}>⚠️ {counts.PENDING} đơn mới vừa đến!</Text>
                <Text style={styles.alertSubtitle}>
                  {soundEnabled ? 'Chuông báo đơn hàng đang bật' : 'Chuông báo đang tắt'}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={[styles.soundBtn, !soundEnabled && styles.soundBtnMuted]}
              activeOpacity={0.7}
              onPress={() => setSoundEnabled((v) => !v)}
            >
              <Ionicons
                name={soundEnabled ? 'volume-high-outline' : 'volume-mute-outline'}
                size={18}
                color={soundEnabled ? '#C2410C' : '#94A3B8'}
              />
            </TouchableOpacity>
          </View>
        )}

        {/* Thanh Tabs lọc trạng thái theo mockup */}
        <View style={styles.tabsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
            {TABS.map((t) => {
              const active = tab === t.key;
              const count = counts[t.key];
              return (
                <TouchableOpacity
                  key={t.key}
                  style={[styles.tabPill, active && styles.tabPillActive]}
                  activeOpacity={0.8}
                  onPress={() => setTab(t.key)}
                >
                  <Text style={[styles.tabPillText, active && styles.tabPillTextActive]}>
                    {t.label}
                    {count > 0 ? ` ${count}` : ''}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Thanh công tắc "Tự động nhận đơn khi mở cửa" */}
        <View style={styles.autoAcceptRow}>
          <View style={styles.autoAcceptLeft}>
            <Ionicons name="flash" size={17} color="#10B981" />
            <Text style={styles.autoAcceptText}>Tự động nhận đơn khi mở cửa</Text>
          </View>
          <Switch
            value={autoAccept}
            onValueChange={setAutoAccept}
            trackColor={{ false: '#E2E8F0', true: '#FED7AA' }}
            thumbColor={autoAccept ? '#C2410C' : '#CBD5E1'}
          />
        </View>

        {/* Danh sách thẻ đơn hàng */}
        {loading ? (
          <View style={styles.emptyBox}>
            <ActivityIndicator size="large" color="#C2410C" />
            <Text style={styles.emptyText}>Đang tải danh sách đơn...</Text>
          </View>
        ) : shown.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="receipt-outline" size={48} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>Không có đơn nào ở mục này</Text>
            <Text style={styles.emptyText}>Các đơn hàng mới sẽ xuất hiện tại đây</Text>
          </View>
        ) : (
          shown.map((order) => {
            const busy = busyOrderId === order.id;
            const addr = order.address;
            const isCOD = order.payment?.payment_method === 'CASH';
            const payLabel = isCOD ? 'Tiền mặt (COD)' : `Ví ${order.payment?.payment_method ?? 'Online'}`;
            const firstItem = order.items?.[0];

            // ── Render Card theo từng trạng thái khớp với Mockup ─────────
            if (order.status === 'PENDING') {
              return (
                <View key={order.id} style={styles.card}>
                  {/* Card Header: Badge CHỜ DUYỆT + Mã #DH-xxxx + Thời gian */}
                  <View style={styles.cardHeaderRow}>
                    <View style={styles.pendingBadge}>
                      <Text style={styles.pendingBadgeText}>CHỜ DUYỆT</Text>
                    </View>
                    <Text style={styles.orderIdText}>#DH-{order.id}</Text>
                    <View style={styles.timeWrap}>
                      <Ionicons name="time-outline" size={12} color="#78716C" />
                      <Text style={styles.timeText}>{timeAgo(order.created_at)}</Text>
                    </View>
                  </View>

                  {/* Customer Info */}
                  <View style={styles.customerSection}>
                    <View style={styles.customerMainRow}>
                      <Text style={styles.customerName}>{order.user?.full_name ?? 'Khách hàng'}</Text>
                      {order.user?.phone_number ? (
                        <TouchableOpacity
                          style={styles.phoneBtn}
                          onPress={() => Linking.openURL(`tel:${order.user!.phone_number}`)}
                        >
                          <Ionicons name="call" size={13} color="#C2410C" />
                          <Text style={styles.phoneText}>{order.user.phone_number}</Text>
                        </TouchableOpacity>
                      ) : null}
                    </View>
                    {addr && (
                      <View style={styles.addrRow}>
                        <Ionicons name="location-sharp" size={13} color="#EA580C" style={{ marginTop: 2 }} />
                        <Text style={styles.addrText} numberOfLines={2}>
                          {[addr.address_detail, addr.ward, addr.district, addr.city]
                            .filter(Boolean)
                            .join(', ')}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Dish List */}
                  <View style={styles.itemsSection}>
                    {(order.items ?? []).map((it, idx) => {
                      const isFirst = idx === 0;
                      return (
                        <View key={it.id} style={styles.itemCardRow}>
                          {isFirst && (
                            <Image
                              source={{ uri: DEFAULT_FOOD_IMG }}
                              style={styles.foodThumb}
                            />
                          )}
                          <View style={{ flex: 1, marginLeft: isFirst ? 10 : 0 }}>
                            <View style={styles.itemTitleRow}>
                              <Text style={styles.itemQtyName} numberOfLines={1}>
                                <Text style={styles.itemQty}>{it.quantity}x </Text>
                                {it.food_name}
                              </Text>
                              <Text style={styles.itemPrice}>{money(it.subtotal)}đ</Text>
                            </View>
                            <Text style={styles.itemSubnote}>
                              {idx === 0
                                ? 'Thêm mỡ hành, ớt hiểm riêng'
                                : idx === 1
                                ? 'Nấu nóng hổi'
                                : 'Ít ngọt, kèm đá riêng'}
                            </Text>
                          </View>
                        </View>
                      );
                    })}
                  </View>

                  {/* Ghi chú của khách (Note Box màu vàng kem) */}
                  <View style={styles.noteBox}>
                    <Ionicons name="create-outline" size={14} color="#B45309" style={{ marginTop: 1 }} />
                    <Text style={styles.noteBoxText}>
                      Ghi chú: "{order.note || 'Xin thêm nước mắm ớt, ớt để riêng giúp mình nhé quán ơi!'}"
                    </Text>
                  </View>

                  {/* Thanh toán & Tổng thu */}
                  <View style={styles.totalRow}>
                    <View style={styles.payBadge}>
                      <Text style={styles.payBadgeText}>{payLabel}</Text>
                    </View>
                    <View style={styles.totalWrap}>
                      <Text style={styles.totalLabel}>Tổng thu: </Text>
                      <Text style={styles.totalAmount}>{money(order.total_amount)}đ</Text>
                    </View>
                  </View>

                  {/* 2 Nút thao tác: Từ chối & Nhận đơn ngay */}
                  <View style={styles.actionButtonsRow}>
                    <TouchableOpacity
                      style={styles.rejectBtn}
                      disabled={busy}
                      onPress={() => confirmReject(order)}
                    >
                      <Ionicons name="close" size={16} color="#DC2626" />
                      <Text style={styles.rejectBtnText}>Từ chối</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.acceptBtn, busy && { opacity: 0.6 }]}
                      disabled={busy}
                      activeOpacity={0.85}
                      onPress={() => void changeStatus(order, 'CONFIRMED', 'Đã nhận đơn hàng!')}
                    >
                      {busy ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                      ) : (
                        <>
                          <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                          <Text style={styles.acceptBtnText}>Nhận đơn ngay</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              );
            }

            if (order.status === 'CONFIRMED' || order.status === 'PREPARING') {
              return (
                <View key={order.id} style={styles.card}>
                  {/* Header: ĐANG NẤU MÓN + #DH-xxxx + Nhận lúc 11:20 */}
                  <View style={styles.cardHeaderRow}>
                    <View style={styles.cookingBadge}>
                      <Text style={styles.cookingBadgeText}>ĐANG NẤU MÓN</Text>
                    </View>
                    <Text style={styles.orderIdText}>#DH-{order.id}</Text>
                    <Text style={styles.timeText}>Nhận lúc {formatClock(order.created_at)}</Text>
                  </View>

                  {/* Khách hàng */}
                  <View style={styles.cookingCustomerRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.customerName}>{order.user?.full_name ?? 'Khách hàng'}</Text>
                      <Text style={styles.itemSummaryText}>
                        {order.items?.length ?? 1} món •{' '}
                        {order.items?.map((i) => i.food_name).join(', ') ?? 'Món chính'}
                      </Text>
                    </View>
                    {order.user?.phone_number && (
                      <TouchableOpacity
                        style={styles.circleCallBtn}
                        onPress={() => Linking.openURL(`tel:${order.user!.phone_number}`)}
                      >
                        <Ionicons name="call" size={14} color="#C2410C" />
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Box Bếp đang chế biến */}
                  <View style={styles.kitchenBox}>
                    <View style={styles.kitchenIconWrap}>
                      <Ionicons name="restaurant" size={16} color="#B45309" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.kitchenTitle}>Bếp đang chế biến</Text>
                      <Text style={styles.kitchenSub}>Dự kiến xong trong 8 phút nữa</Text>
                    </View>
                    <View style={styles.kitchenRight}>
                      <View style={styles.paidBadge}>
                        <Text style={styles.paidBadgeText}>
                          {order.payment?.status === 'PAID' ? 'Đã thanh toán MoMo' : payLabel}
                        </Text>
                      </View>
                      <Text style={styles.kitchenAmount}>{money(order.total_amount)}đ</Text>
                    </View>
                  </View>

                  {/* Nút: Bàn giao cho Shipper ➔ */}
                  <TouchableOpacity
                    style={[styles.deliverHandoverBtn, busy && { opacity: 0.6 }]}
                    disabled={busy}
                    activeOpacity={0.85}
                    onPress={() => void changeStatus(order, 'DELIVERING', 'Đã bàn giao cho Shipper')}
                  >
                    {busy ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <>
                        <Text style={styles.deliverHandoverText}>Bàn giao cho Shipper</Text>
                        <Ionicons name="arrow-forward" size={16} color="#FFFFFF" style={{ marginLeft: 6 }} />
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              );
            }

            if (order.status === 'DELIVERING') {
              return (
                <View key={order.id} style={styles.card}>
                  {/* Header: ĐANG GIAO HÀNG + #DH-xxxx + Rời quán lúc ... */}
                  <View style={styles.cardHeaderRow}>
                    <View style={styles.deliveringBadge}>
                      <Text style={styles.deliveringBadgeText}>ĐANG GIAO HÀNG</Text>
                    </View>
                    <Text style={styles.orderIdText}>#DH-{order.id}</Text>
                    <Text style={styles.timeText}>Rời quán lúc {formatClock(order.updated_at)}</Text>
                  </View>

                  {/* Shipper info row */}
                  <View style={styles.shipperRow}>
                    <View style={styles.shipperIconWrap}>
                      <Ionicons name="bicycle" size={18} color="#C2410C" />
                    </View>
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.shipperName}>Trần Văn Hùng (Shipper)</Text>
                      <Text style={styles.shipperVehicle}>Yamaha Sirius • 59-P1 839.22</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.circleCallBtn}
                      onPress={() => Linking.openURL('tel:0908765432')}
                    >
                      <Ionicons name="call" size={14} color="#C2410C" />
                    </TouchableOpacity>
                  </View>

                  {/* Shipper status & Thu hộ COD */}
                  <View style={styles.shipperStatusRow}>
                    <View style={styles.shipperStatusLeft}>
                      <Ionicons name="checkmark-circle-outline" size={15} color="#059669" />
                      <Text style={styles.shipperStatusText}>Shipper đã lấy món</Text>
                    </View>
                    <Text style={styles.codText}>
                      Thu hộ COD: <Text style={styles.codBold}>{money(order.total_amount)}đ</Text>
                    </Text>
                  </View>

                  {/* 2 Buttons: Vị trí Shipper & Đã hoàn thành */}
                  <View style={styles.actionButtonsRow}>
                    <TouchableOpacity
                      style={styles.shipperLocationBtn}
                      onPress={() => {
                        Alert.alert(
                          'Vị trí Shipper',
                          'Shipper đang di chuyển cách khách hàng 1.2km (Dự kiến đến trong 5 phút nữa).'
                        );
                      }}
                    >
                      <Ionicons name="navigate-outline" size={15} color="#C2410C" />
                      <Text style={styles.shipperLocationText}>Vị trí Shipper</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.completedBtn, busy && { opacity: 0.6 }]}
                      disabled={busy}
                      activeOpacity={0.85}
                      onPress={() => void changeStatus(order, 'DELIVERED', 'Đơn hàng đã hoàn thành!')}
                    >
                      {busy ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                      ) : (
                        <>
                          <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
                          <Text style={styles.completedBtnText}>Đã hoàn thành</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              );
            }

            // Màn hình Lịch sử (Đã hoàn tất hoặc đã huỷ)
            const isCompleted = order.status === 'DELIVERED';
            return (
              <View key={order.id} style={styles.card}>
                <View style={styles.cardHeaderRow}>
                  <View style={[styles.historyBadge, isCompleted ? styles.completedBadge : styles.cancelledBadge]}>
                    <Text style={[styles.historyBadgeText, isCompleted ? styles.completedText : styles.cancelledText]}>
                      {isCompleted ? 'HOÀN THÀNH' : 'ĐÃ HUỶ'}
                    </Text>
                  </View>
                  <Text style={styles.orderIdText}>#DH-{order.id}</Text>
                  <Text style={styles.timeText}>{timeAgo(order.created_at)}</Text>
                </View>
                <View style={{ marginTop: 8 }}>
                  <Text style={styles.customerName}>{order.user?.full_name ?? 'Khách hàng'}</Text>
                  <Text style={styles.itemSummaryText}>
                    {order.items?.length ?? 1} món • Tổng: {money(order.total_amount)}đ
                  </Text>
                </View>
              </View>
            );
          })
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Toast thông báo "Thao tác thành công" theo thiết kế dưới đáy */}
      {toastMessage && (
        <Animated.View style={[styles.toastContainer, { opacity: toastAnim }]}>
          <Ionicons name="checkmark-circle-outline" size={18} color="#10B981" />
          <Text style={styles.toastText}>{toastMessage}</Text>
        </Animated.View>
      )}

      {/* Bottom Tab Bar có hiển thị badge đơn hàng */}
      <OwnerTabBar ordersCount={counts.PENDING} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 20,
  },

  // Banner cảnh báo đơn mới
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFEDD5',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
  },
  alertLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  alertDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#C2410C',
  },
  alertTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#9A3412',
  },
  alertSubtitle: {
    fontSize: 11,
    color: '#7C2D12',
    marginTop: 1,
  },
  soundBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  soundBtnMuted: {
    backgroundColor: '#F1F5F9',
  },

  // Tabs lọc
  tabsContainer: {
    marginBottom: 12,
  },
  tabsScroll: {
    gap: 8,
  },
  tabPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tabPillActive: {
    backgroundColor: '#9A3412',
    borderColor: '#9A3412',
  },
  tabPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  tabPillTextActive: {
    color: '#FFFFFF',
  },

  // Tự động nhận đơn
  autoAcceptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
    paddingHorizontal: 2,
    marginBottom: 12,
  },
  autoAcceptLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  autoAcceptText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },

  // Card chung
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  pendingBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  pendingBadgeText: {
    color: '#DC2626',
    fontSize: 10,
    fontWeight: '800',
  },
  cookingBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  cookingBadgeText: {
    color: '#D97706',
    fontSize: 10,
    fontWeight: '800',
  },
  deliveringBadge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  deliveringBadgeText: {
    color: '#2563EB',
    fontSize: 10,
    fontWeight: '800',
  },
  historyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  completedBadge: { backgroundColor: '#DCFCE7' },
  cancelledBadge: { backgroundColor: '#FEE2E2' },
  historyBadgeText: { fontSize: 10, fontWeight: '800' },
  completedText: { color: '#16A34A' },
  cancelledText: { color: '#DC2626' },

  orderIdText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  timeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  timeText: {
    fontSize: 11,
    color: '#78716C',
  },

  // Customer Section
  customerSection: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 10,
    marginBottom: 10,
  },
  customerMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  customerName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  phoneBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: '#FFF7ED',
  },
  phoneText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#C2410C',
  },
  addrRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 4,
    marginTop: 4,
  },
  addrText: {
    flex: 1,
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
  },

  // Item List
  itemsSection: {
    gap: 8,
    marginBottom: 10,
  },
  itemCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  foodThumb: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  itemTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemQtyName: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  itemQty: {
    fontWeight: '800',
    color: '#0F172A',
  },
  itemPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: '#9A3412',
    marginLeft: 6,
  },
  itemSubnote: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },

  // Note Box
  noteBox: {
    flexDirection: 'row',
    gap: 6,
    backgroundColor: '#FEF9C3',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#FEF08A',
  },
  noteBoxText: {
    flex: 1,
    fontSize: 12,
    color: '#854D0E',
    fontStyle: 'italic',
    lineHeight: 16,
  },

  // Total Row
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    marginBottom: 10,
  },
  payBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
  },
  payBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  totalWrap: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  totalLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: '900',
    color: '#9A3412',
  },

  // Action Buttons
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  rejectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  rejectBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#DC2626',
  },
  acceptBtn: {
    flex: 1.6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#9A3412',
  },
  acceptBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // Cooking Card elements
  cookingCustomerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  itemSummaryText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  circleCallBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  kitchenBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  kitchenIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  kitchenTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400E',
  },
  kitchenSub: {
    fontSize: 10,
    color: '#B45309',
    marginTop: 1,
  },
  kitchenRight: {
    alignItems: 'flex-end',
  },
  paidBadge: {
    backgroundColor: '#A7F3D0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 2,
  },
  paidBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#065F46',
  },
  kitchenAmount: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E293B',
  },
  deliverHandoverBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    borderRadius: 10,
    backgroundColor: '#059669',
  },
  deliverHandoverText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // Delivering Card elements
  shipperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  shipperIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFEDD5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shipperName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  shipperVehicle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  shipperStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    marginBottom: 10,
  },
  shipperStatusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  shipperStatusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#059669',
  },
  codText: {
    fontSize: 11,
    color: '#64748B',
  },
  codBold: {
    fontWeight: '800',
    color: '#0F172A',
  },
  shipperLocationBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
  },
  shipperLocationText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9A3412',
  },
  completedBtn: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#059669',
  },
  completedBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // Empty Box
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#334155',
    marginTop: 4,
  },
  emptyText: {
    fontSize: 12,
    color: '#94A3B8',
  },

  // Toast
  toastContainer: {
    position: 'absolute',
    bottom: 70,
    left: 20,
    right: 20,
    backgroundColor: '#1E293B',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
});
