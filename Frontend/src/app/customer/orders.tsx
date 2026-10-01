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

import { useApp } from '@/context/AppContext';
import type { OrderStatus } from '@/services/types';

const TABS: { key: string; label: string; statuses?: OrderStatus[] }[] = [
  { key: 'ALL', label: 'Tất cả' },
  { key: 'ACTIVE', label: 'Đang đến', statuses: ['PENDING', 'CONFIRMED', 'PREPARING', 'DELIVERING'] },
  { key: 'DELIVERED', label: 'Hoàn tất', statuses: ['DELIVERED'] },
  { key: 'CANCELLED', label: 'Đã huỷ', statuses: ['CANCELLED'] },
];

const STATUS_MAP: Record<
  OrderStatus,
  { label: string; bg: string; color: string; icon: string }
> = {
  PENDING: { label: 'Chờ quán xác nhận', bg: '#FEF3C7', color: '#B45309', icon: 'time-outline' },
  CONFIRMED: { label: 'Quán đã xác nhận', bg: '#DBEAFE', color: '#1D4ED8', icon: 'checkmark-circle-outline' },
  PREPARING: { label: 'Bếp đang chế biến', bg: '#FFEDD5', color: '#C2410C', icon: 'flame-outline' },
  DELIVERING: { label: 'Đang giao hàng 🛵', bg: '#EDE9FE', color: '#6D28D9', icon: 'bicycle-outline' },
  DELIVERED: { label: 'Giao thành công ✓', bg: '#DCFCE7', color: '#15803D', icon: 'checkmark-done-outline' },
  CANCELLED: { label: 'Đã huỷ', bg: '#FEE2E2', color: '#B91C1C', icon: 'close-circle-outline' },
};

const money = (v: number | string) => Number(v ?? 0).toLocaleString('vi-VN');

export default function CustomerOrdersScreen() {
  const router = useRouter();
  const {
    user,
    isAuthenticated,
    orders,
    ordersLoading,
    refreshOrders,
    cancelOrder,
    submitReview,
  } = useApp();

  const [activeTab, setActiveTab] = useState('ALL');
  const [refreshing, setRefreshing] = useState(false);

  // Review modal
  const [reviewOrder, setReviewOrder] = useState<any | null>(null);
  const [reviewStars, setReviewStars] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useFocusEffect(
    useCallback(() => {
      void refreshOrders();
    }, [refreshOrders])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshOrders();
    setRefreshing(false);
  }, [refreshOrders]);

  const filteredOrders = useMemo(() => {
    const curTab = TABS.find((t) => t.key === activeTab)!;
    if (!curTab.statuses) return orders;
    return orders.filter((o) => (curTab.statuses as string[]).includes(o.status));
  }, [orders, activeTab]);

  const handleCancel = (orderId: number) => {
    Alert.alert(
      'Xác nhận huỷ đơn',
      'Bạn có chắc chắn muốn huỷ đơn hàng này không? Tiền sẽ được hoàn lại nếu bạn đã thanh toán trực tuyến.',
      [
        { text: 'Không', style: 'cancel' },
        {
          text: 'Huỷ đơn',
          style: 'destructive',
          onPress: async () => {
            const ok = await cancelOrder(orderId);
            if (ok) {
              Alert.alert('Thành công', 'Đơn hàng của bạn đã được huỷ.');
            }
          },
        },
      ]
    );
  };

  const handleSendReview = async () => {
    if (!reviewOrder) return;
    setSubmittingReview(true);
    const ok = await submitReview(reviewOrder.id, reviewStars, reviewComment);
    setSubmittingReview(false);
    if (ok) {
      Alert.alert('Cảm ơn bạn! 🎉', 'Đánh giá của bạn đã được ghi nhận.');
      setReviewOrder(null);
      setReviewComment('');
      setReviewStars(5);
    }
  };

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color="#1E293B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Đơn hàng của tôi</Text>
        </View>
        <View style={styles.centerBox}>
          <Ionicons name="receipt-outline" size={54} color="#CBD5E1" />
          <Text style={styles.centerTitle}>Vui lòng đăng nhập</Text>
          <Text style={styles.centerSub}>Đăng nhập để xem danh sách và theo dõi các đơn hàng bạn đã đặt.</Text>
          <TouchableOpacity style={styles.loginBtn} onPress={() => router.push('/auth')}>
            <Text style={styles.loginBtnText}>Đăng nhập ngay</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#1E293B" />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 8 }}>
          <Text style={styles.headerTitle}>Quản lý Đơn hàng</Text>
          <Text style={styles.headerSub}>Theo dõi tiến trình & lịch sử món ngon</Text>
        </View>
        <TouchableOpacity style={styles.refreshIconBtn} onPress={() => void onRefresh()}>
          <Ionicons name="refresh" size={18} color="#C2410C" />
        </TouchableOpacity>
      </View>

      {/* Thanh Tabs */}
      <View style={styles.tabBar}>
        {TABS.map((t) => {
          const active = activeTab === t.key;
          return (
            <TouchableOpacity
              key={t.key}
              style={[styles.tabItem, active && styles.tabItemActive]}
              onPress={() => setActiveTab(t.key)}
            >
              <Text style={[styles.tabText, active && styles.tabTextActive]}>{t.label}</Text>
            </TouchableOpacity>
          );
        })}
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
            colors={['#C2410C']}
            tintColor="#C2410C"
          />
        }
      >
        {ordersLoading && orders.length === 0 ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color="#C2410C" />
            <Text style={styles.centerSub}>Đang tải đơn hàng của bạn...</Text>
          </View>
        ) : filteredOrders.length === 0 ? (
          <View style={styles.centerBox}>
            <Ionicons name="receipt-outline" size={50} color="#CBD5E1" />
            <Text style={styles.centerTitle}>Không có đơn nào</Text>
            <Text style={styles.centerSub}>Bạn chưa có đơn hàng nào trong danh mục này.</Text>
            <TouchableOpacity style={styles.orderNowBtn} onPress={() => router.replace('/')}>
              <Text style={styles.orderNowBtnText}>Khám phá món ngon ngay</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredOrders.map((ord) => {
            const st = STATUS_MAP[ord.status] ?? STATUS_MAP.PENDING;
            const canCancel = ord.status === 'PENDING';
            const canReview = ord.status === 'DELIVERED';
            const isActive = ['PENDING', 'CONFIRMED', 'PREPARING', 'DELIVERING'].includes(ord.status);

            return (
              <View key={ord.id} style={styles.orderCard}>
                {/* Header card: Tên quán + Trạng thái */}
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.restaurantName} numberOfLines={1}>
                      {ord.restaurantName}
                    </Text>
                    <Text style={styles.orderDate}>{ord.createdAt}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: st.bg }]}>
                    <Text style={[styles.statusBadgeText, { color: st.color }]}>{st.label}</Text>
                  </View>
                </View>

                {/* Danh sách món */}
                <View style={styles.itemsWrap}>
                  {ord.items.map((it) => (
                    <View key={it.id} style={styles.itemRow}>
                      <Text style={styles.itemQty}>{it.quantity}x</Text>
                      <Text style={styles.itemName} numberOfLines={1}>
                        {it.name}
                      </Text>
                      <Text style={styles.itemPrice}>{money(it.price * it.quantity)}đ</Text>
                    </View>
                  ))}
                </View>

                {/* Tổng tiền & Chi phí */}
                <View style={styles.totalRow}>
                  <Text style={styles.orderIdBadge}>Mã đơn: #DH-{ord.id}</Text>
                  <Text style={styles.totalText}>
                    Tổng thanh toán:{' '}
                    <Text style={styles.totalBold}>{money(ord.totalAmount)}đ</Text>
                  </Text>
                </View>

                {/* Hàng nút hành động */}
                <View style={styles.actionRow}>
                  {isActive && (
                    <TouchableOpacity
                      style={styles.trackingBtn}
                      activeOpacity={0.85}
                      onPress={() =>
                        router.push({
                          pathname: '/order-tracking',
                          params: { id: String(ord.id) },
                        })
                      }
                    >
                      <Ionicons name="location" size={14} color="#FFFFFF" />
                      <Text style={styles.trackingBtnText}>Theo dõi hành trình</Text>
                    </TouchableOpacity>
                  )}

                  {canCancel && (
                    <TouchableOpacity
                      style={styles.cancelOrderBtn}
                      onPress={() => handleCancel(ord.id)}
                    >
                      <Text style={styles.cancelOrderText}>Huỷ đơn</Text>
                    </TouchableOpacity>
                  )}

                  {canReview && (
                    <TouchableOpacity
                      style={styles.reviewBtn}
                      onPress={() => {
                        setReviewOrder(ord);
                        setReviewStars(5);
                        setReviewComment('');
                      }}
                    >
                      <Ionicons name="star" size={14} color="#D97706" />
                      <Text style={styles.reviewBtnText}>Đánh giá món</Text>
                    </TouchableOpacity>
                  )}

                  {!isActive && (
                    <TouchableOpacity
                      style={styles.reorderBtn}
                      onPress={() =>
                        router.push({
                          pathname: '/order-tracking',
                          params: { id: String(ord.id) },
                        })
                      }
                    >
                      <Ionicons name="receipt-outline" size={14} color="#C2410C" />
                      <Text style={styles.reorderBtnText}>Xem chi tiết</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })
        )}

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* Modal Viết Đánh giá */}
      <Modal visible={Boolean(reviewOrder)} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalTop}>
              <Text style={styles.modalTitle}>Đánh giá đơn hàng</Text>
              <TouchableOpacity onPress={() => setReviewOrder(null)}>
                <Ionicons name="close" size={22} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalResName}>{reviewOrder?.restaurantName}</Text>
            <Text style={styles.modalSub}>Hãy chia sẻ cảm nhận của bạn về món ăn nhé!</Text>

            {/* Chọn số sao */}
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => setReviewStars(star)}>
                  <Ionicons
                    name={star <= reviewStars ? 'star' : 'star-outline'}
                    size={32}
                    color="#F59E0B"
                    style={{ marginHorizontal: 4 }}
                  />
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={styles.commentInput}
              placeholder="Món ăn ngon, giao nhanh, đóng gói cẩn thận..."
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={3}
              value={reviewComment}
              onChangeText={setReviewComment}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                disabled={submittingReview}
                onPress={() => setReviewOrder(null)}
              >
                <Text style={styles.modalCancelText}>Để sau</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalSubmitBtn, submittingReview && { opacity: 0.6 }]}
                disabled={submittingReview}
                onPress={handleSendReview}
              >
                {submittingReview ? (
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

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  refreshIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
  },

  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  tabItem: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabItemActive: {
    backgroundColor: '#C2410C',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },

  listContent: {
    padding: 14,
  },

  orderCard: {
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 8,
  },
  restaurantName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  orderDate: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },

  itemsWrap: {
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
    width: 22,
  },
  itemName: {
    flex: 1,
    fontSize: 12,
    color: '#334155',
  },
  itemPrice: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },

  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
    marginBottom: 10,
  },
  orderIdBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  totalText: {
    fontSize: 12,
    color: '#64748B',
  },
  totalBold: {
    fontSize: 15,
    fontWeight: '900',
    color: '#C2410C',
  },

  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  trackingBtn: {
    flex: 1.4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#C2410C',
  },
  trackingBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  cancelOrderBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 38,
    borderRadius: 10,
    backgroundColor: '#FEE2E2',
  },
  cancelOrderText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
  },
  reviewBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#FEF3C7',
  },
  reviewBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B45309',
  },
  reorderBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#FFF7ED',
  },
  reorderBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#C2410C',
  },

  centerBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 24,
    gap: 10,
  },
  centerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
  },
  centerSub: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 18,
  },
  loginBtn: {
    backgroundColor: '#C2410C',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 10,
  },
  loginBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  orderNowBtn: {
    backgroundColor: '#C2410C',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 8,
  },
  orderNowBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 360,
  },
  modalTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalResName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#C2410C',
  },
  modalSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    marginBottom: 14,
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },
  commentInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    fontSize: 13,
    color: '#0F172A',
    minHeight: 70,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
  },
  modalCancelBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 42,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
  },
  modalCancelText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  modalSubmitBtn: {
    flex: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    height: 42,
    borderRadius: 10,
    backgroundColor: '#C2410C',
  },
  modalSubmitText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
