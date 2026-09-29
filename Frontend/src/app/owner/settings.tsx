import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { OwnerHeader, OwnerStateScreen, OwnerTabBar } from '@/components/owner-chrome';
import { useApp } from '@/context/AppContext';
import { useOwner } from '@/context/OwnerContext';
import { ownerApi } from '@/services/api';
import type { ApiReview } from '@/services/types';

export default function OwnerSettingsScreen() {
  const router = useRouter();
  const { user, logout } = useApp();
  const { restaurant, restaurants, isOpen, toggleOpen, selectRestaurant, loading, error, reload } =
    useOwner();

  const [reviews, setReviews] = useState<ApiReview[] | null>(null);
  const [loadingReviews, setLoadingReviews] = useState(false);

  const loadReviews = async () => {
    if (!restaurant) return;
    setLoadingReviews(true);
    try {
      setReviews(await ownerApi.getReviews(restaurant.id));
    } catch (err) {
      Alert.alert('Không tải được đánh giá', err instanceof Error ? err.message : String(err));
    } finally {
      setLoadingReviews(false);
    }
  };

  if (loading || error || !restaurant) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <OwnerStateScreen loading={loading} error={error} onRetry={() => void reload()} />
        <OwnerTabBar />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <OwnerHeader />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Thông tin quán */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Thông tin quán</Text>
          <Row icon="storefront-outline" label="Tên quán" value={restaurant.name} />
          <Row icon="location-outline" label="Địa chỉ" value={restaurant.address} />
          <Row icon="call-outline" label="Điện thoại" value={restaurant.phone_number || '—'} />
          <Row
            icon="time-outline"
            label="Giờ hoạt động"
            value={`${restaurant.opening_time?.slice(0, 5) ?? '--'} - ${
              restaurant.closing_time?.slice(0, 5) ?? '--'
            }`}
          />
          <Text style={styles.hint}>
            Backend có API sửa thông tin quán (PUT /owner/restaurants/:id) nhưng màn sửa chưa được
            dựng trong bộ giao diện này.
          </Text>
        </View>

        {/* Trạng thái nhận đơn */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Trạng thái nhận đơn</Text>
          <TouchableOpacity
            style={[styles.statusBtn, isOpen ? styles.statusBtnOpen : styles.statusBtnClosed]}
            activeOpacity={0.85}
            onPress={() => void toggleOpen()}
          >
            <Ionicons
              name={isOpen ? 'checkmark-circle' : 'pause-circle'}
              size={19}
              color={isOpen ? '#15803D' : '#B91C1C'}
            />
            <View style={{ flex: 1 }}>
              <Text style={[styles.statusTitle, { color: isOpen ? '#15803D' : '#B91C1C' }]}>
                {isOpen ? 'Đang mở cửa — nhận đơn bình thường' : 'Đang đóng cửa — không nhận đơn'}
              </Text>
              <Text style={styles.statusSub}>
                {isOpen
                  ? 'Bấm để tạm đóng cửa, quán sẽ bị ẩn khỏi danh sách của khách.'
                  : 'Bấm để mở cửa trở lại.'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Chuyển quán */}
        {restaurants.length > 1 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Quán bạn sở hữu ({restaurants.length})</Text>
            {restaurants.map((r) => {
              const active = r.id === restaurant.id;
              return (
                <TouchableOpacity
                  key={r.id}
                  style={[styles.storeRow, active && styles.storeRowActive]}
                  onPress={() => selectRestaurant(r.id)}
                >
                  <Ionicons
                    name={active ? 'radio-button-on' : 'radio-button-off'}
                    size={18}
                    color={active ? '#EA580C' : '#9CA3AF'}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.storeName}>{r.name}</Text>
                    <Text style={styles.storeAddr} numberOfLines={1}>
                      {r.address}
                    </Text>
                  </View>
                  <View style={[styles.miniPill, r.status !== 'OPEN' && styles.miniPillOff]}>
                    <Text style={[styles.miniPillText, r.status !== 'OPEN' && styles.miniPillTextOff]}>
                      {r.status === 'OPEN' ? 'Mở' : 'Đóng'}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Đánh giá của khách */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Đánh giá của khách</Text>
            <TouchableOpacity onPress={() => void loadReviews()}>
              <Text style={styles.linkText}>{reviews ? 'Tải lại' : 'Xem đánh giá'}</Text>
            </TouchableOpacity>
          </View>

          {loadingReviews ? (
            <ActivityIndicator color="#EA580C" style={{ marginVertical: 12 }} />
          ) : reviews === null ? (
            <Text style={styles.hint}>Bấm “Xem đánh giá” để tải từ server.</Text>
          ) : reviews.length === 0 ? (
            <Text style={styles.hint}>Quán chưa có đánh giá nào.</Text>
          ) : (
            reviews.map((rv) => (
              <View key={rv.id} style={styles.reviewRow}>
                <View style={styles.starsRow}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Ionicons
                      key={s}
                      name={s <= rv.rating ? 'star' : 'star-outline'}
                      size={12}
                      color="#D97706"
                    />
                  ))}
                  <Text style={styles.reviewOrder}>· Đơn #{rv.order_id}</Text>
                </View>
                {rv.comment ? <Text style={styles.reviewComment}>{rv.comment}</Text> : null}
              </View>
            ))
          )}
        </View>

        {/* Tài khoản */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Tài khoản</Text>
          <Row icon="person-outline" label="Chủ quán" value={user?.fullName ?? '—'} />
          <Row icon="mail-outline" label="Email" value={user?.email ?? '—'} />

          <TouchableOpacity style={styles.linkRow} onPress={() => router.push('/profile')}>
            <Ionicons name="person-circle-outline" size={18} color="#475569" />
            <Text style={styles.linkRowText}>Hồ sơ cá nhân</Text>
            <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.linkRow} onPress={() => router.replace('/')}>
            <Ionicons name="swap-horizontal-outline" size={18} color="#475569" />
            <Text style={styles.linkRowText}>Chuyển sang giao diện khách hàng</Text>
            <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
          </TouchableOpacity>

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
                    router.replace('/auth');
                  },
                },
              ])
            }
          >
            <Ionicons name="log-out-outline" size={17} color="#B91C1C" />
            <Text style={styles.logoutText}>Đăng xuất</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 16 }} />
      </ScrollView>

      <OwnerTabBar />
    </SafeAreaView>
  );
}

function Row({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon as any} size={16} color="#94A3B8" />
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 14, gap: 12 },

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
  linkText: { fontSize: 12, fontWeight: '700', color: '#EA580C' },
  hint: { fontSize: 11, color: '#94A3B8', lineHeight: 16 },

  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  infoLabel: { fontSize: 12, color: '#94A3B8', width: 92 },
  infoValue: { flex: 1, fontSize: 12.5, color: '#1F2937', fontWeight: '600' },

  statusBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 11,
    borderWidth: 1,
  },
  statusBtnOpen: { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' },
  statusBtnClosed: { backgroundColor: '#FEF2F2', borderColor: '#FECACA' },
  statusTitle: { fontSize: 13, fontWeight: '800' },
  statusSub: { fontSize: 11, color: '#64748B', marginTop: 2, lineHeight: 15 },

  storeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
  },
  storeRowActive: { backgroundColor: '#FFF7ED' },
  storeName: { fontSize: 13, fontWeight: '700', color: '#1F2937' },
  storeAddr: { fontSize: 11, color: '#94A3B8', marginTop: 1 },
  miniPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: '#DCFCE7',
  },
  miniPillOff: { backgroundColor: '#F1F5F9' },
  miniPillText: { fontSize: 10, fontWeight: '800', color: '#15803D' },
  miniPillTextOff: { color: '#64748B' },

  reviewRow: { borderTopWidth: 1, borderTopColor: '#F8FAFC', paddingTop: 8, gap: 4 },
  starsRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  reviewOrder: { fontSize: 10.5, color: '#94A3B8', marginLeft: 4 },
  reviewComment: { fontSize: 12, color: '#475569', lineHeight: 17 },

  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  linkRowText: { flex: 1, fontSize: 13, color: '#374151', fontWeight: '600' },

  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    marginTop: 6,
    paddingVertical: 12,
    borderRadius: 11,
    backgroundColor: '#FEE2E2',
  },
  logoutText: { fontSize: 13.5, fontWeight: '800', color: '#B91C1C' },
});
