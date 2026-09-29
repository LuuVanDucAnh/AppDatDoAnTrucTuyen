import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { OwnerHeader, OwnerStateScreen, OwnerTabBar } from '@/components/owner-chrome';
import { useOwner } from '@/context/OwnerContext';
import { ApiError, ownerApi } from '@/services/api';
import type { ApiOwnerOrder, OrderStatus } from '@/services/types';

/** 3 nhóm tab theo đúng luồng bếp, ánh xạ sang status của Backend. */
const TABS = [
  { key: 'PENDING', label: 'Chờ xác nhận', statuses: ['PENDING'] },
  { key: 'COOKING', label: 'Đang làm', statuses: ['CONFIRMED', 'PREPARING'] },
  { key: 'DELIVERING', label: 'Đang giao', statuses: ['DELIVERING'] },
] as const;

type TabKey = (typeof TABS)[number]['key'];

const STATUS_BADGE: Record<string, { label: string; bg: string; color: string }> = {
  PENDING: { label: 'CHỜ XÁC NHẬN', bg: '#FEF3C7', color: '#B45309' },
  CONFIRMED: { label: 'ĐÃ XÁC NHẬN', bg: '#DBEAFE', color: '#1D4ED8' },
  PREPARING: { label: 'ĐANG CHUẨN BỊ', bg: '#FFEDD5', color: '#C2410C' },
  DELIVERING: { label: 'ĐANG GIAO', bg: '#EDE9FE', color: '#6D28D9' },
  DELIVERED: { label: 'HOÀN THÀNH', bg: '#DCFCE7', color: '#15803D' },
  CANCELLED: { label: 'ĐÃ HUỶ', bg: '#FEE2E2', color: '#B91C1C' },
};

/** Nút hành động chính ứng với bước tiếp theo Backend cho phép. */
const NEXT_ACTION: Partial<Record<OrderStatus, { label: string; next: OrderStatus; icon: string }>> =
  {
    PENDING: { label: 'Nhận đơn ngay', next: 'CONFIRMED', icon: 'checkmark-circle' },
    CONFIRMED: { label: 'Bắt đầu chế biến', next: 'PREPARING', icon: 'flame' },
    PREPARING: { label: 'Bàn giao cho Shipper', next: 'DELIVERING', icon: 'bicycle' },
    DELIVERING: { label: 'Đã giao thành công', next: 'DELIVERED', icon: 'checkmark-done' },
  };

const money = (v: number | string) => Number(v ?? 0).toLocaleString('vi-VN');

function timeAgo(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const mins = Math.floor((Date.now() - d.getTime()) / 60000);
  const clock = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  if (mins < 1) return `Vừa xong · ${clock}`;
  if (mins < 60) return `${mins} phút trước · ${clock}`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ trước · ${clock}`;
  return `${d.toLocaleDateString('vi-VN')} · ${clock}`;
}

export default function OwnerOrdersScreen() {
  const { restaurant, loading: ownerLoading, error: ownerError, reload } = useOwner();

  const [orders, setOrders] = useState<ApiOwnerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<TabKey>('PENDING');
  const [busyOrderId, setBusyOrderId] = useState<number | null>(null);

  const load = useCallback(async () => {
    if (!restaurant) return;
    try {
      // Lấy tất cả đơn rồi chia nhóm ở client để hiển thị được số đếm trên từng tab
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
    const map: Record<TabKey, number> = { PENDING: 0, COOKING: 0, DELIVERING: 0 };
    for (const t of TABS) {
      map[t.key] = orders.filter((o) => (t.statuses as readonly string[]).includes(o.status)).length;
    }
    return map;
  }, [orders]);

  const shown = useMemo(() => {
    const active = TABS.find((t) => t.key === tab)!;
    return orders.filter((o) => (active.statuses as readonly string[]).includes(o.status));
  }, [orders, tab]);

  const changeStatus = async (order: ApiOwnerOrder, next: OrderStatus) => {
    if (!restaurant) return;
    setBusyOrderId(order.id);
    try {
      await ownerApi.updateOrderStatus(restaurant.id, order.id, next);
      await load();
    } catch (err) {
      Alert.alert(
        'Không đổi được trạng thái',
        err instanceof ApiError ? err.message : String(err)
      );
    } finally {
      setBusyOrderId(null);
    }
  };

  const confirmReject = (order: ApiOwnerOrder) => {
    Alert.alert(
      'Từ chối đơn hàng',
      `Huỷ đơn #${order.id} của ${order.user?.full_name ?? 'khách'}?\nNếu khách đã thanh toán online, hệ thống sẽ tự chuyển sang hoàn tiền (REFUNDED).`,
      [
        { text: 'Không', style: 'cancel' },
        {
          text: 'Từ chối đơn',
          style: 'destructive',
          onPress: () => void changeStatus(order, 'CANCELLED'),
        },
      ]
    );
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

      {/* Cảnh báo đơn mới cần xác nhận */}
      {counts.PENDING > 0 && (
        <View style={styles.alertBar}>
          <View style={styles.alertIcon}>
            <Ionicons name="notifications" size={15} color="#FFFFFF" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.alertTitle}>
              {counts.PENDING} đơn mới chờ xác nhận
            </Text>
            <Text style={styles.alertSub}>
              Khách chỉ huỷ được khi đơn còn ở trạng thái chờ — xác nhận sớm để giữ đơn.
            </Text>
          </View>
        </View>
      )}

      {/* Tab lọc theo bước xử lý */}
      <View style={styles.tabsRow}>
        {TABS.map((t) => {
          const active = tab === t.key;
          return (
            <TouchableOpacity
              key={t.key}
              style={[styles.tabBtn, active && styles.tabBtnActive]}
              onPress={() => setTab(t.key)}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabBtnText, active && styles.tabBtnTextActive]}>{t.label}</Text>
              <View style={[styles.tabCount, active && styles.tabCountActive]}>
                <Text style={[styles.tabCountText, active && styles.tabCountTextActive]}>
                  {counts[t.key]}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.list}
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
        {loading ? (
          <View style={styles.empty}>
            <ActivityIndicator size="large" color="#EA580C" />
            <Text style={styles.emptyText}>Đang tải đơn hàng...</Text>
          </View>
        ) : shown.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="receipt-outline" size={46} color="#D1D5DB" />
            <Text style={styles.emptyText}>Không có đơn nào ở mục này.</Text>
            <Text style={styles.emptyHint}>Kéo xuống để tải lại.</Text>
          </View>
        ) : (
          shown.map((order) => {
            const badge = STATUS_BADGE[order.status];
            const action = NEXT_ACTION[order.status];
            const busy = busyOrderId === order.id;
            const addr = order.address;

            return (
              <View key={order.id} style={styles.card}>
                {/* Header đơn */}
                <View style={styles.cardTop}>
                  <View>
                    <Text style={styles.orderCode}>#ĐH-{order.id}</Text>
                    <Text style={styles.orderTime}>{timeAgo(order.created_at)}</Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                    <Text style={[styles.badgeText, { color: badge.color }]}>{badge.label}</Text>
                  </View>
                </View>

                {/* Khách hàng */}
                <View style={styles.customerBox}>
                  <View style={styles.customerRow}>
                    <Ionicons name="person-circle-outline" size={17} color="#EA580C" />
                    <Text style={styles.customerName}>{order.user?.full_name ?? 'Khách'}</Text>
                    {order.user?.phone_number ? (
                      <TouchableOpacity
                        style={styles.callBtn}
                        onPress={() => Linking.openURL(`tel:${order.user!.phone_number}`)}
                      >
                        <Ionicons name="call" size={11} color="#15803D" />
                        <Text style={styles.callBtnText}>{order.user.phone_number}</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                  {addr ? (
                    <View style={styles.addrRow}>
                      <Ionicons name="location-outline" size={14} color="#94A3B8" />
                      <Text style={styles.addrText} numberOfLines={2}>
                        {[addr.address_detail, addr.ward, addr.district, addr.city]
                          .filter(Boolean)
                          .join(', ')}
                      </Text>
                    </View>
                  ) : null}
                </View>

                {/* Danh sách món */}
                <View style={styles.itemsBox}>
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
                </View>

                {/* Ghi chú của khách */}
                {order.note ? (
                  <View style={styles.noteBox}>
                    <FontAwesome5 name="sticky-note" size={11} color="#B45309" />
                    <Text style={styles.noteText}>Ghi chú: {order.note}</Text>
                  </View>
                ) : null}

                {/* Tổng tiền + phương thức thanh toán */}
                <View style={styles.totalRow}>
                  <View style={styles.payChip}>
                    <Ionicons
                      name={order.payment?.payment_method === 'CASH' ? 'cash-outline' : 'card-outline'}
                      size={12}
                      color="#475569"
                    />
                    <Text style={styles.payChipText}>
                      {order.payment?.payment_method ?? 'CASH'} ·{' '}
                      {order.payment?.status === 'PAID' ? 'Đã trả' : 'Chưa trả'}
                    </Text>
                  </View>
                  <Text style={styles.totalText}>
                    Tổng thu <Text style={styles.totalMoney}>{money(order.total_amount)}đ</Text>
                  </Text>
                </View>

                {/* Hành động */}
                <View style={styles.actionRow}>
                  {(order.status === 'PENDING' || order.status === 'CONFIRMED') && (
                    <TouchableOpacity
                      style={styles.rejectBtn}
                      disabled={busy}
                      onPress={() => confirmReject(order)}
                    >
                      <Ionicons name="close" size={15} color="#B91C1C" />
                      <Text style={styles.rejectBtnText}>Từ chối</Text>
                    </TouchableOpacity>
                  )}

                  {action && (
                    <TouchableOpacity
                      style={[styles.primaryBtn, busy && { opacity: 0.6 }]}
                      disabled={busy}
                      activeOpacity={0.85}
                      onPress={() => void changeStatus(order, action.next)}
                    >
                      {busy ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                      ) : (
                        <>
                          <Ionicons name={action.icon as any} size={15} color="#FFFFFF" />
                          <Text style={styles.primaryBtnText}>{action.label}</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })
        )}

        <View style={{ height: 20 }} />
      </ScrollView>

      <OwnerTabBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFC' },

  alertBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 14,
    marginTop: 10,
    padding: 11,
    borderRadius: 12,
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  alertIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EA580C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertTitle: { fontSize: 13, fontWeight: '800', color: '#9A3412' },
  alertSub: { fontSize: 11, color: '#B45309', marginTop: 2, lineHeight: 15 },

  tabsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tabBtnActive: { backgroundColor: '#EA580C', borderColor: '#EA580C' },
  tabBtnText: { fontSize: 11.5, fontWeight: '700', color: '#64748B' },
  tabBtnTextActive: { color: '#FFFFFF' },
  tabCount: {
    minWidth: 18,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 9,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  tabCountActive: { backgroundColor: 'rgba(255,255,255,0.25)' },
  tabCountText: { fontSize: 10, fontWeight: '800', color: '#475569' },
  tabCountTextActive: { color: '#FFFFFF' },

  list: { paddingHorizontal: 14, gap: 12 },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 13,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    gap: 10,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  orderCode: { fontSize: 15, fontWeight: '800', color: '#111827' },
  orderTime: { fontSize: 11, color: '#94A3B8', marginTop: 2 },
  badge: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 7 },
  badgeText: { fontSize: 9.5, fontWeight: '800' },

  customerBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 9,
    gap: 5,
  },
  customerRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  customerName: { flex: 1, fontSize: 13, fontWeight: '700', color: '#1F2937' },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 7,
  },
  callBtnText: { fontSize: 10.5, fontWeight: '700', color: '#15803D' },
  addrRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 5 },
  addrText: { flex: 1, fontSize: 11.5, color: '#64748B', lineHeight: 16 },

  itemsBox: { gap: 7 },
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

  noteBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: '#FFFBEB',
    borderRadius: 9,
    padding: 8,
  },
  noteText: { flex: 1, fontSize: 11.5, color: '#92400E', lineHeight: 16, fontStyle: 'italic' },

  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 9,
  },
  payChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 7,
  },
  payChipText: { fontSize: 10.5, fontWeight: '600', color: '#475569' },
  totalText: { fontSize: 12, color: '#64748B' },
  totalMoney: { fontSize: 15, fontWeight: '800', color: '#EA580C' },

  actionRow: { flexDirection: 'row', gap: 9 },
  rejectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingHorizontal: 15,
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: '#FEE2E2',
  },
  rejectBtnText: { fontSize: 13, fontWeight: '700', color: '#B91C1C' },
  primaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: '#16A34A',
  },
  primaryBtnText: { fontSize: 13.5, fontWeight: '800', color: '#FFFFFF' },

  empty: { alignItems: 'center', paddingVertical: 60, gap: 8 },
  emptyText: { fontSize: 13, color: '#6B7280' },
  emptyHint: { fontSize: 11, color: '#9CA3AF' },
});
