import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
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

import { useApp } from '@/context/AppContext';
import { ApiError, orderApi, reviewApi } from '@/services/api';
import type { ApiOrder, OrderStatus } from '@/services/types';

const money = (v: number | string) => Number(v ?? 0).toLocaleString('vi-VN');

/** 5 bước theo đúng luồng trạng thái Backend (orders.status). */
const STEPS: { status: OrderStatus; title: string; desc: string; icon: string }[] = [
  {
    status: 'PENDING',
    title: 'Đặt đơn hàng',
    desc: 'Đơn đã được gửi tới quán, đang chờ quán xác nhận',
    icon: 'receipt-outline',
  },
  {
    status: 'CONFIRMED',
    title: 'Quán đã xác nhận',
    desc: 'Quán đã nhận đơn và chuẩn bị vào bếp',
    icon: 'checkmark-circle-outline',
  },
  {
    status: 'PREPARING',
    title: 'Bếp đang chuẩn bị món',
    desc: 'Món ăn của bạn đang được chế biến',
    icon: 'flame-outline',
  },
  {
    status: 'DELIVERING',
    title: 'Đang giao hàng',
    desc: 'Đơn đã rời quán và đang trên đường tới bạn',
    icon: 'bicycle-outline',
  },
  {
    status: 'DELIVERED',
    title: 'Giao hàng thành công',
    desc: 'Chúc bạn ngon miệng!',
    icon: 'home-outline',
  },
];

const HERO: Record<OrderStatus, { badge: string; title: string; sub: string; colors: [string, string]; icon: string }> =
  {
    PENDING: {
      badge: 'CHỜ XÁC NHẬN',
      title: 'Đang gửi đơn tới quán',
      sub: 'Bạn vẫn có thể huỷ đơn khi quán chưa xác nhận',
      colors: ['#D97706', '#92400E'],
      icon: 'time',
    },
    CONFIRMED: {
      badge: 'ĐÃ XÁC NHẬN',
      title: 'Quán đã nhận đơn của bạn',
      sub: 'Đơn sắp được đưa vào bếp',
      colors: ['#2563EB', '#1E3A8A'],
      icon: 'checkmark-circle',
    },
    PREPARING: {
      badge: 'ĐANG CHUẨN BỊ',
      title: 'Bếp đang chế biến món',
      sub: 'Món của bạn sẽ sớm được bàn giao cho shipper',
      colors: ['#EA580C', '#9A3412'],
      icon: 'flame',
    },
    DELIVERING: {
      badge: 'ĐANG GIAO HÀNG',
      title: 'Đơn đang trên đường tới bạn',
      sub: 'Vui lòng để điện thoại ở chế độ nghe được',
      colors: ['#EA580C', '#7C2D12'],
      icon: 'bicycle',
    },
    DELIVERED: {
      badge: 'GIAO THÀNH CÔNG',
      title: 'Đơn hàng đã được giao',
      sub: 'Cảm ơn bạn đã đặt món!',
      colors: ['#16A34A', '#14532D'],
      icon: 'checkmark-done',
    },
    CANCELLED: {
      badge: 'ĐÃ HUỶ',
      title: 'Đơn hàng đã bị huỷ',
      sub: 'Nếu bạn đã thanh toán online, tiền sẽ được hoàn lại',
      colors: ['#DC2626', '#7F1D1D'],
      icon: 'close-circle',
    },
  };

export default function OrderTrackingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const orderId = Number(params.id);
  const { cancelOrder, submitReview } = useApp();

  const [order, setOrder] = useState<ApiOrder | null>(null);
  const [reviewed, setReviewed] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [showReview, setShowReview] = useState(false);
  const [stars, setStars] = useState(5);
  const [comment, setComment] = useState('');

  const load = useCallback(async () => {
    if (!orderId || Number.isNaN(orderId)) {
      setError('Thiếu mã đơn hàng.');
      return;
    }
    setError(null);
    try {
      const detail = await orderApi.getDetail(orderId);
      setOrder(detail);
      try {
        const myReviews = await reviewApi.getMine();
        const found = myReviews.find((r) => r.order_id === orderId);
        setReviewed(found ? found.rating : null);
      } catch {
        setReviewed(null);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không tải được đơn hàng');
    }
  }, [orderId]);

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

  /** Vị trí bước hiện tại trong timeline. */
  const currentStep = useMemo(() => {
    if (!order) return -1;
    return STEPS.findIndex((s) => s.status === order.status);
  }, [order]);

  const handleCancel = () => {
    if (!order) return;
    Alert.alert(
      'Huỷ đơn hàng',
      `Bạn chắc chắn muốn huỷ đơn #${order.id}?\nChỉ huỷ được khi quán chưa xác nhận.`,
      [
        { text: 'Không', style: 'cancel' },
        {
          text: 'Huỷ đơn',
          style: 'destructive',
          onPress: async () => {
            setBusy(true);
            await cancelOrder(order.id);
            await load();
            setBusy(false);
          },
        },
      ]
    );
  };

  const handleSendReview = async () => {
    if (!order) return;
    setBusy(true);
    const ok = await submitReview(order.id, stars, comment);
    setBusy(false);
    if (ok) {
      setShowReview(false);
      await load();
    }
  };

  const callPhone = (phone?: string | null) => {
    if (!phone) {
      Alert.alert('Chưa có số điện thoại', 'Quán chưa cập nhật số liên hệ.');
      return;
    }
    Linking.openURL(`tel:${phone}`);
  };

  // ── Trạng thái tải / lỗi ──────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <Header onBack={() => router.back()} />
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#EA580C" />
          <Text style={styles.centerText}>Đang tải đơn hàng...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !order) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <Header onBack={() => router.back()} />
        <View style={styles.centerBox}>
          <Ionicons name="cloud-offline-outline" size={44} color="#DC2626" />
          <Text style={styles.centerTitle}>Không mở được đơn hàng</Text>
          <Text style={styles.centerText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => void onRefresh()}>
            <Ionicons name="refresh" size={15} color="#FFFFFF" />
            <Text style={styles.retryBtnText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const hero = HERO[order.status];
  const addr = order.address;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <Header onBack={() => router.back()} orderId={order.id} />

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
        {/* HERO: trạng thái hiện tại */}
        <LinearGradient
          colors={hero.colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>{hero.badge}</Text>
          </View>
          <View style={styles.heroRow}>
            <View style={styles.heroIcon}>
              <Ionicons name={hero.icon as any} size={26} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroTitle}>{hero.title}</Text>
              <Text style={styles.heroSub}>{hero.sub}</Text>
            </View>
          </View>
          <View style={styles.heroMetaRow}>
            <View style={styles.heroChip}>
              <Ionicons name="pricetag-outline" size={12} color="#FFFFFF" />
              <Text style={styles.heroChipText}>#{order.id}</Text>
            </View>
            <View style={styles.heroChip}>
              <Ionicons name="time-outline" size={12} color="#FFFFFF" />
              <Text style={styles.heroChipText}>
                {new Date(order.created_at).toLocaleString('vi-VN', {
                  hour: '2-digit',
                  minute: '2-digit',
                  day: '2-digit',
                  month: '2-digit',
                })}
              </Text>
            </View>
            <View style={styles.heroChip}>
              <Ionicons name="wallet-outline" size={12} color="#FFFFFF" />
              <Text style={styles.heroChipText}>{money(order.total_amount)}đ</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Bản đồ: chưa có dữ liệu GPS ở Backend */}
        <View style={styles.mapPlaceholder}>
          <Ionicons name="map-outline" size={30} color="#94A3B8" />
          <Text style={styles.mapTitle}>Bản đồ theo dõi shipper</Text>
          <Text style={styles.mapText}>
            Chưa khả dụng: database chưa có bảng shipper và toạ độ GPS, nên app không thể hiển thị
            vị trí thật của tài xế.
          </Text>
        </View>

        {/* Liên hệ quán (dữ liệu thật từ bảng restaurants) */}
        <View style={styles.card}>
          <View style={styles.contactRow}>
            <View style={styles.contactAvatar}>
              <FontAwesome5 name="store" size={15} color="#C2410C" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.contactName}>{order.restaurant?.name ?? 'Nhà hàng'}</Text>
              <Text style={styles.contactSub} numberOfLines={1}>
                {order.restaurant?.address ?? ''}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.callBtn}
              onPress={() => callPhone(order.restaurant?.phone_number)}
            >
              <Ionicons name="call" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Tiến trình đơn hàng */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Tiến trình đơn hàng</Text>

          {order.status === 'CANCELLED' ? (
            <View style={styles.cancelledBox}>
              <Ionicons name="close-circle" size={20} color="#DC2626" />
              <Text style={styles.cancelledText}>
                Đơn hàng đã bị huỷ.
                {order.payment?.status === 'REFUNDED'
                  ? ' Khoản thanh toán đã được chuyển sang trạng thái hoàn tiền (REFUNDED).'
                  : ''}
              </Text>
            </View>
          ) : (
            STEPS.map((step, idx) => {
              const done = idx < currentStep;
              const active = idx === currentStep;
              const pending = idx > currentStep;
              return (
                <View key={step.status} style={styles.stepRow}>
                  <View style={styles.stepLeft}>
                    <View
                      style={[
                        styles.stepDot,
                        done && styles.stepDotDone,
                        active && styles.stepDotActive,
                      ]}
                    >
                      <Ionicons
                        name={done ? 'checkmark' : (step.icon as any)}
                        size={13}
                        color={pending ? '#CBD5E1' : '#FFFFFF'}
                      />
                    </View>
                    {idx < STEPS.length - 1 && (
                      <View style={[styles.stepLine, done && styles.stepLineDone]} />
                    )}
                  </View>

                  <View style={styles.stepBody}>
                    <Text
                      style={[
                        styles.stepTitle,
                        active && styles.stepTitleActive,
                        pending && styles.stepTitlePending,
                      ]}
                    >
                      {step.title}
                      <Text style={styles.stepCode}> ({step.status})</Text>
                    </Text>
                    <Text style={[styles.stepDesc, pending && styles.stepDescPending]}>
                      {step.desc}
                    </Text>
                    {active && (
                      <View style={styles.activeTag}>
                        <View style={styles.activeDot} />
                        <Text style={styles.activeTagText}>Đang ở bước này</Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* Địa chỉ giao */}
        {addr && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Giao đến</Text>
            <Text style={styles.addrName}>
              {addr.receiver_name} · {addr.phone_number}
            </Text>
            <Text style={styles.addrText}>
              {[addr.address_detail, addr.ward, addr.district, addr.city].filter(Boolean).join(', ')}
            </Text>
          </View>
        )}

        {/* Món ăn + hoá đơn */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{order.restaurant?.name ?? 'Chi tiết đơn'}</Text>

          {(order.items ?? []).map((it) => (
            <View key={it.id} style={styles.itemRow}>
              <View style={styles.qtyChip}>
                <Text style={styles.qtyChipText}>{it.quantity}x</Text>
              </View>
              <Text style={styles.itemName} numberOfLines={1}>
                {it.food_name}
              </Text>
              <Text style={styles.itemPrice}>{money(it.subtotal)}đ</Text>
            </View>
          ))}

          {order.note ? <Text style={styles.orderNote}>Ghi chú: {order.note}</Text> : null}

          <View style={styles.divider} />

          <BillRow label="Tạm tính" value={`${money(order.food_total)}đ`} />
          <BillRow label="Phí giao hàng" value={`${money(order.delivery_fee)}đ`} />
          {Number(order.discount) > 0 && (
            <BillRow label="Khuyến mãi" value={`-${money(order.discount)}đ`} green />
          )}

          <View style={styles.divider} />

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Tổng thanh toán</Text>
            <Text style={styles.totalValue}>{money(order.total_amount)}đ</Text>
          </View>

          <View style={styles.payRow}>
            <Ionicons
              name={order.payment?.payment_method === 'CASH' ? 'cash-outline' : 'card-outline'}
              size={14}
              color="#64748B"
            />
            <Text style={styles.payText}>
              {order.payment?.payment_method ?? 'CASH'} ·{' '}
              {order.payment?.status === 'PAID'
                ? 'Đã thanh toán'
                : order.payment?.status === 'REFUNDED'
                  ? 'Đã hoàn tiền'
                  : 'Chưa thanh toán'}
            </Text>
          </View>
        </View>

        {/* Hành động */}
        <View style={styles.actions}>
          {order.status === 'DELIVERED' && reviewed === null && (
            <TouchableOpacity
              style={styles.primaryBtn}
              activeOpacity={0.85}
              onPress={() => {
                setStars(5);
                setComment('');
                setShowReview(true);
              }}
            >
              <Ionicons name="star" size={16} color="#FFFFFF" />
              <Text style={styles.primaryBtnText}>Đánh giá quán</Text>
            </TouchableOpacity>
          )}

          {order.status === 'DELIVERED' && reviewed !== null && (
            <View style={styles.reviewedBox}>
              <Ionicons name="checkmark-circle" size={16} color="#15803D" />
              <Text style={styles.reviewedText}>Bạn đã đánh giá đơn này {reviewed}⭐</Text>
            </View>
          )}

          {order.status === 'PENDING' && (
            <TouchableOpacity
              style={[styles.dangerBtn, busy && { opacity: 0.6 }]}
              disabled={busy}
              onPress={handleCancel}
            >
              {busy ? (
                <ActivityIndicator color="#B91C1C" size="small" />
              ) : (
                <>
                  <Ionicons name="close-circle-outline" size={16} color="#B91C1C" />
                  <Text style={styles.dangerBtnText}>Huỷ đơn hàng</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.ghostBtn}
            onPress={() => callPhone(order.restaurant?.phone_number)}
          >
            <Ionicons name="headset-outline" size={16} color="#475569" />
            <Text style={styles.ghostBtnText}>Liên hệ quán</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footerNote}>
          Trạng thái đơn do quán cập nhật. Kéo xuống để làm mới.
        </Text>

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* Modal đánh giá */}
      <Modal visible={showReview} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Đánh giá bữa ăn</Text>
            <Text style={styles.modalSub}>Đơn hàng #{order.id}</Text>

            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((s) => (
                <TouchableOpacity key={s} onPress={() => setStars(s)}>
                  <Ionicons
                    name={s <= stars ? 'star' : 'star-outline'}
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
              value={comment}
              onChangeText={setComment}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setShowReview(false)}>
                <Text style={styles.modalCancelText}>Để sau</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSubmit, busy && { opacity: 0.7 }]}
                disabled={busy}
                onPress={() => void handleSendReview()}
              >
                {busy ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.modalSubmitText}>Gửi đánh giá</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function Header({ onBack, orderId }: { onBack: () => void; orderId?: number }) {
  return (
    <View style={styles.header}>
      <TouchableOpacity style={styles.headerBtn} onPress={onBack}>
        <Ionicons name="arrow-back" size={22} color="#1F2937" />
      </TouchableOpacity>
      <View style={{ flex: 1 }}>
        <Text style={styles.headerTitle}>Theo dõi đơn hàng</Text>
        {orderId ? <Text style={styles.headerSub}>Mã đơn #{orderId}</Text> : null}
      </View>
    </View>
  );
}

function BillRow({ label, value, green }: { label: string; value: string; green?: boolean }) {
  return (
    <View style={styles.billRow}>
      <Text style={[styles.billLabel, green && { color: '#059669' }]}>{label}</Text>
      <Text style={[styles.billValue, green && { color: '#059669', fontWeight: '700' }]}>
        {value}
      </Text>
    </View>
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
  headerSub: { fontSize: 11, color: '#94A3B8', marginTop: 1 },

  content: { padding: 14, gap: 12 },

  hero: { borderRadius: 16, padding: 15, gap: 11 },
  heroBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.22)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  heroBadgeText: { fontSize: 10, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.4 },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  heroIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: { fontSize: 16.5, fontWeight: '800', color: '#FFFFFF' },
  heroSub: { fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 3, lineHeight: 17 },
  heroMetaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  heroChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
  },
  heroChipText: { fontSize: 11, fontWeight: '700', color: '#FFFFFF' },

  mapPlaceholder: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    padding: 20,
    alignItems: 'center',
    gap: 6,
  },
  mapTitle: { fontSize: 13, fontWeight: '700', color: '#475569' },
  mapText: { fontSize: 11, color: '#94A3B8', textAlign: 'center', lineHeight: 16 },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    gap: 9,
  },
  cardTitle: { fontSize: 14.5, fontWeight: '800', color: '#111827' },

  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  contactAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFEDD5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactName: { fontSize: 14, fontWeight: '700', color: '#1F2937' },
  contactSub: { fontSize: 11.5, color: '#94A3B8', marginTop: 2 },
  callBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#16A34A',
    alignItems: 'center',
    justifyContent: 'center',
  },

  stepRow: { flexDirection: 'row', gap: 11 },
  stepLeft: { alignItems: 'center', width: 28 },
  stepDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotDone: { backgroundColor: '#16A34A' },
  stepDotActive: { backgroundColor: '#EA580C' },
  stepLine: { width: 2, flex: 1, minHeight: 26, backgroundColor: '#E2E8F0', marginVertical: 2 },
  stepLineDone: { backgroundColor: '#86EFAC' },
  stepBody: { flex: 1, paddingBottom: 14 },
  stepTitle: { fontSize: 13, fontWeight: '700', color: '#1F2937' },
  stepTitleActive: { color: '#C2410C' },
  stepTitlePending: { color: '#94A3B8' },
  stepCode: { fontSize: 10.5, fontWeight: '600', color: '#CBD5E1' },
  stepDesc: { fontSize: 11.5, color: '#64748B', marginTop: 2, lineHeight: 16 },
  stepDescPending: { color: '#CBD5E1' },
  activeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    marginTop: 6,
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 7,
  },
  activeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#EA580C' },
  activeTagText: { fontSize: 10, fontWeight: '800', color: '#C2410C' },

  cancelledBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#FEF2F2',
    padding: 11,
    borderRadius: 10,
  },
  cancelledText: { flex: 1, fontSize: 12, color: '#B91C1C', lineHeight: 17 },

  addrName: { fontSize: 13, fontWeight: '700', color: '#1F2937' },
  addrText: { fontSize: 12, color: '#64748B', lineHeight: 17 },

  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qtyChip: {
    minWidth: 26,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: '#FFEDD5',
    alignItems: 'center',
  },
  qtyChipText: { fontSize: 11, fontWeight: '800', color: '#C2410C' },
  itemName: { flex: 1, fontSize: 13, color: '#374151', fontWeight: '600' },
  itemPrice: { fontSize: 13, fontWeight: '700', color: '#111827' },
  orderNote: { fontSize: 11.5, color: '#92400E', fontStyle: 'italic', marginTop: 2 },

  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 3 },
  billRow: { flexDirection: 'row', justifyContent: 'space-between' },
  billLabel: { fontSize: 12.5, color: '#64748B' },
  billValue: { fontSize: 12.5, color: '#1F2937', fontWeight: '600' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 13.5, fontWeight: '800', color: '#111827' },
  totalValue: { fontSize: 18, fontWeight: '800', color: '#EA580C' },
  payRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  payText: { fontSize: 11.5, color: '#64748B' },

  actions: { gap: 9 },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: '#EA580C',
    paddingVertical: 14,
    borderRadius: 12,
  },
  primaryBtnText: { fontSize: 14, fontWeight: '800', color: '#FFFFFF' },
  dangerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: '#FEE2E2',
    paddingVertical: 13,
    borderRadius: 12,
  },
  dangerBtnText: { fontSize: 13.5, fontWeight: '800', color: '#B91C1C' },
  ghostBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 13,
    borderRadius: 12,
  },
  ghostBtnText: { fontSize: 13.5, fontWeight: '700', color: '#475569' },
  reviewedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: '#DCFCE7',
    paddingVertical: 13,
    borderRadius: 12,
  },
  reviewedText: { fontSize: 13, fontWeight: '700', color: '#15803D' },

  footerNote: { fontSize: 11, color: '#94A3B8', textAlign: 'center', lineHeight: 16 },

  centerBox: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 9 },
  centerTitle: { fontSize: 15.5, fontWeight: '700', color: '#111827' },
  centerText: { fontSize: 12.5, color: '#6B7280', textAlign: 'center', lineHeight: 18 },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    backgroundColor: '#EA580C',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    padding: 22,
  },
  modalBox: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 20, gap: 4 },
  modalTitle: { fontSize: 16.5, fontWeight: '800', color: '#111827' },
  modalSub: { fontSize: 12, color: '#94A3B8' },
  starsRow: { flexDirection: 'row', justifyContent: 'center', marginVertical: 14 },
  reviewInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 11,
    padding: 12,
    fontSize: 13,
    color: '#111827',
    backgroundColor: '#F9FAFB',
    height: 92,
    textAlignVertical: 'top',
  },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 14 },
  modalCancel: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 11,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  modalCancelText: { fontSize: 13.5, fontWeight: '700', color: '#475569' },
  modalSubmit: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 11,
    backgroundColor: '#EA580C',
    alignItems: 'center',
  },
  modalSubmitText: { fontSize: 13.5, fontWeight: '800', color: '#FFFFFF' },
});
