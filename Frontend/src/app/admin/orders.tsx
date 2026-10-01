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

import { adminApi, ApiError } from '@/services/api';
import type { ApiAdminOrder, OrderStatus } from '@/services/types';

const STATUS_FILTERS: { key: string; label: string; status?: OrderStatus }[] = [
  { key: 'ALL', label: 'Tất cả' },
  { key: 'PENDING', label: 'Chờ duyệt', status: 'PENDING' },
  { key: 'CONFIRMED', label: 'Đã nhận', status: 'CONFIRMED' },
  { key: 'PREPARING', label: 'Đang nấu', status: 'PREPARING' },
  { key: 'DELIVERING', label: 'Đang giao', status: 'DELIVERING' },
  { key: 'DELIVERED', label: 'Hoàn thành', status: 'DELIVERED' },
  { key: 'CANCELLED', label: 'Đã huỷ', status: 'CANCELLED' },
];

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; bg: string; color: string; icon: string }
> = {
  PENDING: { label: 'CHỜ DUYỆT', bg: '#FEE2E2', color: '#DC2626', icon: 'time-outline' },
  CONFIRMED: { label: 'ĐÃ XÁC NHẬN', bg: '#DBEAFE', color: '#1D4ED8', icon: 'checkmark-circle-outline' },
  PREPARING: { label: 'ĐANG NẤU', bg: '#FEF3C7', color: '#D97706', icon: 'flame-outline' },
  DELIVERING: { label: 'ĐANG GIAO', bg: '#EDE9FE', color: '#6D28D9', icon: 'bicycle-outline' },
  DELIVERED: { label: 'HOÀN THÀNH', bg: '#DCFCE7', color: '#15803D', icon: 'checkmark-done-outline' },
  CANCELLED: { label: 'ĐÃ HUỶ', bg: '#F1F5F9', color: '#64748B', icon: 'close-circle-outline' },
};

const ALL_STATUSES: OrderStatus[] = [
  'PENDING',
  'CONFIRMED',
  'PREPARING',
  'DELIVERING',
  'DELIVERED',
  'CANCELLED',
];

const money = (v: number | string) => Number(v ?? 0).toLocaleString('vi-VN');

export default function AdminOrdersScreen() {
  const router = useRouter();

  const [orders, setOrders] = useState<ApiAdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Can thiệp đổi trạng thái (Force Update Modal)
  const [targetOrder, setTargetOrder] = useState<ApiAdminOrder | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus>('PENDING');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const loadOrders = useCallback(async () => {
    try {
      const { data } = await adminApi.getAllOrders({ limit: 100 });
      setOrders(data);
    } catch (err) {
      Alert.alert('Không tải được đơn hàng', err instanceof Error ? err.message : String(err));
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      (async () => {
        setLoading(true);
        await loadOrders();
        if (alive) setLoading(false);
      })();
      return () => {
        alive = false;
      };
    }, [loadOrders])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  }, [loadOrders]);

  // Bộ lọc danh sách
  const filteredOrders = useMemo(() => {
    return orders.filter((ord) => {
      if (activeFilter !== 'ALL' && ord.status !== activeFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchId = String(ord.id).includes(q);
        const matchCust = ord.user?.full_name?.toLowerCase().includes(q);
        const matchPhone = ord.user?.phone_number?.includes(q);
        const matchRes = ord.restaurant?.name?.toLowerCase().includes(q);
        return matchId || matchCust || matchPhone || matchRes;
      }
      return true;
    });
  }, [orders, activeFilter, searchQuery]);

  // Thống kê nhanh
  const stats = useMemo(() => {
    const total = orders.length;
    const pending = orders.filter((o) => o.status === 'PENDING').length;
    const delivering = orders.filter((o) => o.status === 'DELIVERING').length;
    const delivered = orders.filter((o) => o.status === 'DELIVERED').length;
    return { total, pending, delivering, delivered };
  }, [orders]);

  // Thực thi ép cập nhật trạng thái đơn hàng
  const handleForceUpdate = async () => {
    if (!targetOrder) return;
    setUpdatingStatus(true);
    try {
      await adminApi.forceUpdateOrderStatus(targetOrder.id, selectedStatus);
      Alert.alert(
        'Cập nhật thành công',
        `Đã can thiệp đổi trạng thái đơn #DH-${targetOrder.id} thành "${STATUS_CONFIG[selectedStatus].label}"`
      );
      setTargetOrder(null);
      await loadOrders();
    } catch (err) {
      Alert.alert('Không thể cập nhật', err instanceof ApiError ? err.message : String(err));
    } finally {
      setUpdatingStatus(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#1E1B4B" />

      {/* Header Admin */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.adminBadge}>
            <Ionicons name="shield-checkmark" size={13} color="#A5B4FC" />
            <Text style={styles.adminBadgeText}>HỆ THỐNG QUẢN TRỊ</Text>
          </View>
          <TouchableOpacity style={styles.homeBtn} onPress={() => router.replace('/')}>
            <Ionicons name="home-outline" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <Text style={styles.headerTitle}>Quản lý Đơn hàng Toàn sàn</Text>
        <Text style={styles.headerSubtitle}>
          Giám sát dòng đơn & can thiệp trạng thái xử lý khi có khiếu nại
        </Text>

        {/* Thanh KPI 4 số liệu */}
        <View style={styles.kpiRow}>
          <View style={styles.kpiBox}>
            <Text style={styles.kpiNum}>{stats.total}</Text>
            <Text style={styles.kpiLabel}>Tổng đơn</Text>
          </View>
          <View style={styles.kpiDivider} />
          <View style={styles.kpiBox}>
            <Text style={[styles.kpiNum, { color: '#F87171' }]}>{stats.pending}</Text>
            <Text style={styles.kpiLabel}>Chờ duyệt</Text>
          </View>
          <View style={styles.kpiDivider} />
          <View style={styles.kpiBox}>
            <Text style={[styles.kpiNum, { color: '#C084FC' }]}>{stats.delivering}</Text>
            <Text style={styles.kpiLabel}>Đang giao</Text>
          </View>
          <View style={styles.kpiDivider} />
          <View style={styles.kpiBox}>
            <Text style={[styles.kpiNum, { color: '#4ADE80' }]}>{stats.delivered}</Text>
            <Text style={styles.kpiLabel}>Đã giao</Text>
          </View>
        </View>
      </View>

      {/* Ô tìm kiếm */}
      <View style={styles.searchWrap}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color="#64748B" />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm theo mã đơn, khách, quán, SĐT..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Thanh tabs lọc trạng thái */}
      <View style={styles.filterScrollWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterList}>
          {STATUS_FILTERS.map((f) => {
            const active = activeFilter === f.key;
            return (
              <TouchableOpacity
                key={f.key}
                style={[styles.filterPill, active && styles.filterPillActive]}
                onPress={() => setActiveFilter(f.key)}
              >
                <Text style={[styles.filterText, active && styles.filterTextActive]}>{f.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Danh sách đơn hàng */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void onRefresh()}
            colors={['#4F46E5']}
            tintColor="#4F46E5"
          />
        }
      >
        {loading ? (
          <View style={styles.emptyBox}>
            <ActivityIndicator size="large" color="#4F46E5" />
            <Text style={styles.emptyText}>Đang tải dữ liệu đơn hàng...</Text>
          </View>
        ) : filteredOrders.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="receipt-outline" size={48} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>Không tìm thấy đơn nào</Text>
            <Text style={styles.emptyText}>Thử thay đổi từ khoá tìm kiếm hoặc bộ lọc</Text>
          </View>
        ) : (
          filteredOrders.map((ord) => {
            const st = STATUS_CONFIG[ord.status] ?? STATUS_CONFIG.PENDING;
            const addr = ord.address;
            const isPaid = ord.payment?.status === 'PAID';

            return (
              <View key={ord.id} style={styles.orderCard}>
                {/* Header card: Mã đơn + Trạng thái */}
                <View style={styles.cardTopRow}>
                  <View style={styles.codeWrap}>
                    <Text style={styles.cardCode}>#DH-{ord.id}</Text>
                    <Text style={styles.cardDate}>
                      {new Date(ord.created_at).toLocaleString('vi-VN')}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: st.bg }]}>
                    <Ionicons name={st.icon as any} size={12} color={st.color} style={{ marginRight: 3 }} />
                    <Text style={[styles.statusText, { color: st.color }]}>{st.label}</Text>
                  </View>
                </View>

                {/* Quán ăn & Khách hàng */}
                <View style={styles.infoSection}>
                  <View style={styles.resRow}>
                    <View style={styles.resIconWrap}>
                      <Ionicons name="storefront" size={14} color="#C2410C" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.resName}>{ord.restaurant?.name ?? 'Nhà hàng'}</Text>
                      <Text style={styles.resAddr} numberOfLines={1}>
                        {ord.restaurant?.address ?? 'Địa chỉ quán'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.custRow}>
                    <View style={styles.custIconWrap}>
                      <Ionicons name="person" size={14} color="#2563EB" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.custName}>
                        {ord.user?.full_name ?? 'Khách đặt'} •{' '}
                        <Text style={{ fontWeight: 'normal', color: '#64748B' }}>
                          {ord.user?.phone_number ?? 'Không có SĐT'}
                        </Text>
                      </Text>
                      {addr && (
                        <Text style={styles.custAddr} numberOfLines={1}>
                          {[addr.address_detail, addr.ward, addr.district, addr.city]
                            .filter(Boolean)
                            .join(', ')}
                        </Text>
                      )}
                    </View>
                  </View>
                </View>

                {/* Danh sách món tóm tắt */}
                <View style={styles.itemsBox}>
                  {(ord.items ?? []).map((it) => (
                    <View key={it.id} style={styles.itemRow}>
                      <Text style={styles.itemQty}>{it.quantity}x</Text>
                      <Text style={styles.itemName} numberOfLines={1}>
                        {it.food_name}
                      </Text>
                      <Text style={styles.itemPrice}>{money(it.subtotal)}đ</Text>
                    </View>
                  ))}
                </View>

                {/* Thanh toán & Tổng tiền */}
                <View style={styles.payRow}>
                  <View style={styles.payWrap}>
                    <Ionicons
                      name={ord.payment?.payment_method === 'CASH' ? 'cash-outline' : 'card-outline'}
                      size={14}
                      color="#475569"
                    />
                    <Text style={styles.payMethod}>{ord.payment?.payment_method ?? 'CASH'}</Text>
                    <View style={[styles.payStatusChip, isPaid ? styles.paidChip : styles.unpaidChip]}>
                      <Text style={[styles.payStatusText, isPaid ? styles.paidText : styles.unpaidText]}>
                        {isPaid ? 'ĐÃ TRẢ' : 'CHƯA TRẢ'}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.totalMoney}>{money(ord.total_amount)}đ</Text>
                </View>

                {/* Hàng nút Admin */}
                <View style={styles.adminActionRow}>
                  <TouchableOpacity
                    style={styles.trackBtn}
                    onPress={() =>
                      router.push({
                        pathname: '/order-tracking',
                        params: { id: String(ord.id) },
                      })
                    }
                  >
                    <Ionicons name="eye-outline" size={15} color="#4F46E5" />
                    <Text style={styles.trackBtnText}>Xem chi tiết</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.overrideBtn}
                    onPress={() => {
                      setTargetOrder(ord);
                      setSelectedStatus(ord.status);
                    }}
                  >
                    <Ionicons name="flash-outline" size={15} color="#FFFFFF" />
                    <Text style={styles.overrideBtnText}>Can thiệp trạng thái</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* Modal Can thiệp Trạng thái Đơn hàng dành cho Admin */}
      <Modal visible={Boolean(targetOrder)} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalIconWrap}>
                <Ionicons name="shield" size={20} color="#4F46E5" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Can thiệp Trạng thái Đơn hàng</Text>
                <Text style={styles.modalSub}>Đơn #{targetOrder?.id} • Quyền hạn Quản trị viên</Text>
              </View>
              <TouchableOpacity onPress={() => setTargetOrder(null)}>
                <Ionicons name="close" size={22} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <View style={styles.warningBox}>
              <Ionicons name="alert-circle" size={16} color="#B45309" />
              <Text style={styles.warningText}>
                Admin có quyền ép chuyển đơn sang bất kỳ trạng thái nào để xử lý sự cố. Hãy chắc chắn trước khi xác nhận.
              </Text>
            </View>

            <Text style={styles.selectLabel}>Chọn trạng thái mới:</Text>

            <View style={styles.statusOptions}>
              {ALL_STATUSES.map((st) => {
                const conf = STATUS_CONFIG[st];
                const isSelected = selectedStatus === st;
                return (
                  <TouchableOpacity
                    key={st}
                    style={[styles.statusOptionBtn, isSelected && styles.statusOptionActive]}
                    onPress={() => setSelectedStatus(st)}
                  >
                    <View style={[styles.statusOptionDot, { backgroundColor: conf.color }]} />
                    <Text style={[styles.statusOptionText, isSelected && styles.statusOptionTextActive]}>
                      {conf.label}
                    </Text>
                    {isSelected && (
                      <Ionicons name="checkmark" size={16} color="#4F46E5" style={{ marginLeft: 'auto' }} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                disabled={updatingStatus}
                onPress={() => setTargetOrder(null)}
              >
                <Text style={styles.cancelBtnText}>Đóng</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.confirmBtn, updatingStatus && { opacity: 0.6 }]}
                disabled={updatingStatus}
                onPress={handleForceUpdate}
              >
                {updatingStatus ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.confirmBtnText}>Xác nhận đổi</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#1E1B4B',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  homeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(99, 102, 241, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  adminBadgeText: {
    color: '#C7D2FE',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#A5B4FC',
    marginTop: 3,
    marginBottom: 14,
  },
  kpiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 6,
  },
  kpiBox: {
    flex: 1,
    alignItems: 'center',
  },
  kpiNum: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  kpiLabel: {
    fontSize: 10,
    color: '#C7D2FE',
    marginTop: 2,
  },
  kpiDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },

  // Search
  searchWrap: {
    paddingHorizontal: 14,
    marginTop: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
  },

  // Filters
  filterScrollWrap: {
    marginTop: 10,
    marginBottom: 8,
  },
  filterList: {
    paddingHorizontal: 14,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterPillActive: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  filterText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },

  listContent: {
    paddingHorizontal: 14,
    paddingTop: 4,
    paddingBottom: 30,
  },

  // Order Card
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 10,
  },
  codeWrap: {
    flex: 1,
  },
  cardCode: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  cardDate: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
  },

  // Info section
  infoSection: {
    gap: 8,
    marginBottom: 10,
  },
  resRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  resIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFEDD5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  resAddr: {
    fontSize: 11,
    color: '#64748B',
  },
  custRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  custIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  custName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  custAddr: {
    fontSize: 11,
    color: '#64748B',
  },

  // Items
  itemsBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 8,
    gap: 4,
    marginBottom: 10,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemQty: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
    width: 24,
  },
  itemName: {
    flex: 1,
    fontSize: 12,
    color: '#334155',
  },
  itemPrice: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },

  // Pay
  payRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    marginBottom: 10,
  },
  payWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  payMethod: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  payStatusChip: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  paidChip: { backgroundColor: '#DCFCE7' },
  unpaidChip: { backgroundColor: '#FEE2E2' },
  payStatusText: { fontSize: 9, fontWeight: '800' },
  paidText: { color: '#16A34A' },
  unpaidText: { color: '#DC2626' },
  totalMoney: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
  },

  // Admin Actions
  adminActionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  trackBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    height: 38,
    borderRadius: 8,
    backgroundColor: '#EEF2FF',
  },
  trackBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4F46E5',
  },
  overrideBtn: {
    flex: 1.4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    height: 38,
    borderRadius: 8,
    backgroundColor: '#4F46E5',
  },
  overrideBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // Empty
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
  },
  emptyText: {
    fontSize: 12,
    color: '#94A3B8',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  modalIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSub: {
    fontSize: 12,
    color: '#64748B',
  },
  warningBox: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#FEF3C7',
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
  },
  warningText: {
    flex: 1,
    fontSize: 11,
    color: '#92400E',
    lineHeight: 15,
  },
  selectLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 8,
  },
  statusOptions: {
    gap: 8,
    marginBottom: 16,
  },
  statusOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  statusOptionActive: {
    borderColor: '#4F46E5',
    backgroundColor: '#EEF2FF',
  },
  statusOptionDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusOptionText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  statusOptionTextActive: {
    color: '#4F46E5',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  confirmBtn: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    borderRadius: 10,
    backgroundColor: '#4F46E5',
  },
  confirmBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
