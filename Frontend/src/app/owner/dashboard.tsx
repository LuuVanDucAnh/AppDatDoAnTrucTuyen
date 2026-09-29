import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { ownerApi } from '@/services/api';
import type { ApiOwnerDashboard, ApiRevenuePoint, ApiTopFood } from '@/services/types';

const money = (v: number) => Number(v || 0).toLocaleString('vi-VN');

/** Rút gọn tiền cho nhãn biểu đồ: 1.500.000 → 1,5tr */
function shortMoney(v: number) {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(v >= 10_000_000 ? 0 : 1)}tr`;
  if (v >= 1_000) return `${Math.round(v / 1_000)}k`;
  return String(v);
}

function dayLabel(period: string) {
  const d = new Date(period);
  if (Number.isNaN(d.getTime())) return period;
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

/** Lấp đầy 7 ngày gần nhất, kể cả ngày không có đơn (API chỉ trả ngày có doanh thu). */
function buildLast7Days(points: ApiRevenuePoint[]) {
  const byPeriod = new Map(points.map((p) => [p.period, p]));
  const out: { period: string; label: string; revenue: number; orders: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    const period = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
      d.getDate()
    ).padStart(2, '0')}`;
    const found = byPeriod.get(period);
    out.push({
      period,
      label: dayLabel(period),
      revenue: found?.revenue ?? 0,
      orders: found?.order_count ?? 0,
    });
  }
  return out;
}

export default function OwnerDashboardScreen() {
  const router = useRouter();
  const { restaurant, loading: ownerLoading, error: ownerError, reload } = useOwner();

  const [dashboard, setDashboard] = useState<ApiOwnerDashboard | null>(null);
  const [revenue, setRevenue] = useState<ApiRevenuePoint[]>([]);
  const [topFoods, setTopFoods] = useState<ApiTopFood[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!restaurant) return;
    try {
      const [d, r, t] = await Promise.all([
        ownerApi.getDashboard(restaurant.id),
        ownerApi.getRevenueStats(restaurant.id, { groupBy: 'day' }),
        ownerApi.getTopFoods(restaurant.id, 5),
      ]);
      setDashboard(d);
      setRevenue(r);
      setTopFoods(t);
    } catch (err) {
      Alert.alert('Không tải được số liệu', err instanceof Error ? err.message : String(err));
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

  const chart = useMemo(() => buildLast7Days(revenue), [revenue]);
  const chartMax = useMemo(() => Math.max(...chart.map((c) => c.revenue), 1), [chart]);
  const chartTotal = useMemo(() => chart.reduce((s, c) => s + c.revenue, 0), [chart]);
  const topMax = useMemo(() => Math.max(...topFoods.map((f) => f.total_sold), 1), [topFoods]);

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
        {loading && !dashboard ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#EA580C" />
            <Text style={styles.mutedText}>Đang tải số liệu quán...</Text>
          </View>
        ) : (
          <>
            {/* Banner đơn mới cần xử lý */}
            {(dashboard?.pending_orders ?? 0) > 0 && (
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => router.replace('/owner/orders')}
              >
                <LinearGradient
                  colors={['#EA580C', '#9A3412']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.hero}
                >
                  <View style={styles.heroIcon}>
                    <Ionicons name="notifications" size={18} color="#FFFFFF" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.heroTitle}>{dashboard!.pending_orders} đơn mới</Text>
                    <Text style={styles.heroSub}>Đang chờ bạn xác nhận</Text>
                  </View>
                  <View style={styles.heroBtn}>
                    <Text style={styles.heroBtnText}>Xử lý ngay</Text>
                    <Ionicons name="arrow-forward" size={13} color="#C2410C" />
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            )}

            {/* Hiệu suất vận hành */}
            <Text style={styles.sectionTitle}>Hiệu suất vận hành</Text>
            <View style={styles.statGrid}>
              <View style={[styles.statCard, styles.statCardWide]}>
                <Text style={styles.statLabel}>Doanh thu hôm nay</Text>
                <Text style={styles.statValue}>{money(dashboard?.today.revenue ?? 0)}đ</Text>
                <Text style={styles.statHint}>Tính trên đơn đã giao (DELIVERED)</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Đơn hôm nay</Text>
                <Text style={styles.statValue}>{dashboard?.today.orders ?? 0}</Text>
                <Text style={styles.statHint}>
                  {dashboard?.active_orders ?? 0} đơn đang xử lý
                </Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Doanh thu tháng</Text>
                <Text style={styles.statValue}>{money(dashboard?.month.revenue ?? 0)}đ</Text>
                <Text style={styles.statHint}>{dashboard?.month.orders ?? 0} đơn trong tháng</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Đánh giá</Text>
                <View style={styles.ratingRow}>
                  <Text style={styles.statValue}>{dashboard?.average_rating ?? 0}</Text>
                  <Ionicons name="star" size={15} color="#D97706" />
                </View>
                <Text style={styles.statHint}>{dashboard?.total_reviews ?? 0} lượt đánh giá</Text>
              </View>
            </View>

            {/* Biểu đồ doanh thu 7 ngày */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.cardTitle}>Biểu đồ doanh thu</Text>
                  <Text style={styles.cardSub}>7 ngày gần nhất</Text>
                </View>
                <View style={styles.totalPill}>
                  <Text style={styles.totalPillText}>{money(chartTotal)}đ</Text>
                </View>
              </View>

              {chartTotal === 0 ? (
                <View style={styles.chartEmpty}>
                  <Ionicons name="bar-chart-outline" size={34} color="#D1D5DB" />
                  <Text style={styles.mutedText}>
                    Chưa có đơn giao thành công nào trong 7 ngày qua.
                  </Text>
                </View>
              ) : (
                <View style={styles.chart}>
                  {chart.map((c) => {
                    const h = Math.max(4, Math.round((c.revenue / chartMax) * 110));
                    const isTop = c.revenue === chartMax && c.revenue > 0;
                    return (
                      <View key={c.period} style={styles.barCol}>
                        <Text style={styles.barValue}>
                          {c.revenue > 0 ? shortMoney(c.revenue) : ''}
                        </Text>
                        <View
                          style={[
                            styles.bar,
                            { height: h },
                            isTop && { backgroundColor: '#EA580C' },
                          ]}
                        />
                        <Text style={styles.barLabel}>{c.label}</Text>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>

            {/* Top món bán chạy */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.cardTitle}>Top món bán chạy</Text>
                  <Text style={styles.cardSub}>Theo số lượng đã bán (đơn đã giao)</Text>
                </View>
                <TouchableOpacity onPress={() => router.replace('/owner/menu')}>
                  <Text style={styles.linkText}>Xem thực đơn</Text>
                </TouchableOpacity>
              </View>

              {topFoods.length === 0 ? (
                <View style={styles.chartEmpty}>
                  <Ionicons name="fast-food-outline" size={34} color="#D1D5DB" />
                  <Text style={styles.mutedText}>Chưa có dữ liệu bán hàng.</Text>
                </View>
              ) : (
                topFoods.map((f, idx) => (
                  <View key={f.food_id} style={styles.topRow}>
                    <View style={[styles.rankBadge, idx === 0 && styles.rankBadgeFirst]}>
                      <Text style={[styles.rankText, idx === 0 && styles.rankTextFirst]}>
                        {idx + 1}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.topName} numberOfLines={1}>
                        {f.food_name}
                      </Text>
                      <Text style={styles.topMeta}>
                        Đã bán {f.total_sold} phần · {money(f.total_revenue)}đ
                      </Text>
                      <View style={styles.progressTrack}>
                        <View
                          style={[
                            styles.progressFill,
                            { width: `${Math.round((f.total_sold / topMax) * 100)}%` },
                          ]}
                        />
                      </View>
                    </View>
                  </View>
                ))
              )}
            </View>

            {/* Quản lý nhanh */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Quản lý & Thiết lập nhanh</Text>

              <TouchableOpacity
                style={styles.quickRow}
                onPress={() => router.replace('/owner/orders')}
              >
                <View style={[styles.quickIcon, { backgroundColor: '#FFEDD5' }]}>
                  <Ionicons name="receipt-outline" size={16} color="#C2410C" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.quickTitle}>Xử lý đơn hàng</Text>
                  <Text style={styles.quickSub}>
                    {dashboard?.pending_orders ?? 0} chờ xác nhận · {dashboard?.active_orders ?? 0}{' '}
                    đang làm
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={17} color="#CBD5E1" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickRow}
                onPress={() => router.replace('/owner/menu')}
              >
                <View style={[styles.quickIcon, { backgroundColor: '#DCFCE7' }]}>
                  <Ionicons name="restaurant-outline" size={16} color="#15803D" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.quickTitle}>Quản lý thực đơn</Text>
                  <Text style={styles.quickSub}>{dashboard?.total_foods ?? 0} món trong quán</Text>
                </View>
                <Ionicons name="chevron-forward" size={17} color="#CBD5E1" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickRow}
                onPress={() => router.replace('/owner/settings')}
              >
                <View style={[styles.quickIcon, { backgroundColor: '#E0E7FF' }]}>
                  <Ionicons name="time-outline" size={16} color="#4338CA" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.quickTitle}>Thông tin & giờ hoạt động</Text>
                  <Text style={styles.quickSub}>
                    {restaurant.opening_time?.slice(0, 5) ?? '--'} -{' '}
                    {restaurant.closing_time?.slice(0, 5) ?? '--'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={17} color="#CBD5E1" />
              </TouchableOpacity>
            </View>
          </>
        )}

        <View style={{ height: 16 }} />
      </ScrollView>

      <OwnerTabBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 14, gap: 12 },

  loadingBox: { alignItems: 'center', paddingVertical: 70, gap: 10 },
  mutedText: { fontSize: 12.5, color: '#6B7280', textAlign: 'center', lineHeight: 18 },

  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 14,
  },
  heroIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },
  heroSub: { fontSize: 11.5, color: '#FFE4D3', marginTop: 2 },
  heroBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 9,
  },
  heroBtnText: { fontSize: 12, fontWeight: '800', color: '#C2410C' },

  sectionTitle: { fontSize: 15, fontWeight: '800', color: '#111827', marginTop: 2 },

  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: {
    flexGrow: 1,
    flexBasis: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: 13,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    gap: 3,
  },
  statCardWide: { flexBasis: '100%' },
  statLabel: { fontSize: 11, color: '#94A3B8', fontWeight: '600' },
  statValue: { fontSize: 19, fontWeight: '800', color: '#111827' },
  statHint: { fontSize: 10.5, color: '#94A3B8' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    gap: 10,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardTitle: { fontSize: 14.5, fontWeight: '800', color: '#111827' },
  cardSub: { fontSize: 11, color: '#94A3B8', marginTop: 2 },
  linkText: { fontSize: 12, fontWeight: '700', color: '#EA580C' },
  totalPill: {
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  totalPillText: { fontSize: 12.5, fontWeight: '800', color: '#C2410C' },

  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 165,
    paddingTop: 6,
  },
  barCol: { flex: 1, alignItems: 'center', gap: 5 },
  barValue: { fontSize: 8.5, color: '#94A3B8', fontWeight: '700', height: 12 },
  bar: {
    width: '62%',
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
    backgroundColor: '#FDBA74',
  },
  barLabel: { fontSize: 9.5, color: '#94A3B8', fontWeight: '600' },
  chartEmpty: { alignItems: 'center', paddingVertical: 26, gap: 8 },

  topRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingTop: 4 },
  rankBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  rankBadgeFirst: { backgroundColor: '#FEF3C7' },
  rankText: { fontSize: 11, fontWeight: '800', color: '#64748B' },
  rankTextFirst: { color: '#B45309' },
  topName: { fontSize: 13, fontWeight: '700', color: '#1F2937' },
  topMeta: { fontSize: 11, color: '#94A3B8', marginTop: 2 },
  progressTrack: {
    height: 5,
    borderRadius: 3,
    backgroundColor: '#F1F5F9',
    marginTop: 6,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 3, backgroundColor: '#FB923C' },

  quickRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 9,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  quickIcon: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickTitle: { fontSize: 13, fontWeight: '700', color: '#1F2937' },
  quickSub: { fontSize: 11, color: '#94A3B8', marginTop: 1 },
});
