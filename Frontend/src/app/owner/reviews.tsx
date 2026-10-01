import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { useOwner } from '@/context/OwnerContext';
import { ApiError, ownerApi } from '@/services/api';
import type { ApiReview } from '@/services/types';

export default function OwnerReviewsScreen() {
  const router = useRouter();
  const { restaurant } = useOwner();

  const [reviews, setReviews] = useState<ApiReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [starFilter, setStarFilter] = useState<number | 'all'>('all');

  const loadReviews = useCallback(async () => {
    if (!restaurant) return;
    try {
      const data = await ownerApi.getReviews(restaurant.id);
      setReviews(data || []);
    } catch (err) {
      Alert.alert(
        'Không tải được đánh giá',
        err instanceof ApiError ? err.message : 'Đã có lỗi xảy ra.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [restaurant]);

  useEffect(() => {
    void loadReviews();
  }, [loadReviews]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void loadReviews();
  }, [loadReviews]);

  // Thống kê
  const stats = useMemo(() => {
    const total = reviews.length;
    if (total === 0) return { avg: 5.0, total: 0, counts: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } };

    const counts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let sum = 0;
    reviews.forEach((r) => {
      const star = Math.min(5, Math.max(1, Math.round(Number(r.rating || 5))));
      counts[star] = (counts[star] || 0) + 1;
      sum += Number(r.rating || 5);
    });

    const avg = Number((sum / total).toFixed(1));
    return { avg, total, counts };
  }, [reviews]);

  const filteredReviews = useMemo(() => {
    if (starFilter === 'all') return reviews;
    return reviews.filter((r) => Math.round(Number(r.rating)) === starFilter);
  }, [reviews, starFilter]);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#1F2937" />
        </TouchableOpacity>
        <View style={styles.headerTitleBox}>
          <Text style={styles.headerTitle}>Đánh giá của khách</Text>
          <Text style={styles.headerSub} numberOfLines={1}>
            {restaurant?.name || 'Nhà hàng'}
          </Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#EA580C" />
          <Text style={styles.loadingText}>Đang tải danh sách đánh giá...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredReviews}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#EA580C']} />
          }
          ListHeaderComponent={
            <View style={styles.summaryContainer}>
              {/* Thẻ tổng quan điểm sao */}
              <View style={styles.scoreCard}>
                <View style={styles.scoreLeft}>
                  <Text style={styles.scoreNumber}>{stats.avg.toFixed(1)}</Text>
                  <View style={styles.starsRow}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Ionicons
                        key={s}
                        name={s <= Math.round(stats.avg) ? 'star' : 'star-outline'}
                        size={14}
                        color="#F59E0B"
                      />
                    ))}
                  </View>
                  <Text style={styles.scoreCount}>Dựa trên {stats.total} lượt đánh giá</Text>
                </View>

                {/* Thanh phân phối sao */}
                <View style={styles.scoreBars}>
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = stats.counts[star] || 0;
                    const pct = stats.total > 0 ? (count / stats.total) * 100 : 0;
                    return (
                      <View key={star} style={styles.barRow}>
                        <Text style={styles.barLabel}>{star}★</Text>
                        <View style={styles.barTrack}>
                          <View style={[styles.barFill, { width: `${pct}%` }]} />
                        </View>
                        <Text style={styles.barCount}>{count}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>

              {/* Bộ lọc sao */}
              <View style={styles.filterRow}>
                {(['all', 5, 4, 3, 2, 1] as const).map((star) => {
                  const isSelected = starFilter === star;
                  return (
                    <TouchableOpacity
                      key={String(star)}
                      style={[styles.filterChip, isSelected && styles.filterChipActive]}
                      onPress={() => setStarFilter(star)}
                    >
                      <Text style={[styles.filterChipText, isSelected && styles.filterChipTextActive]}>
                        {star === 'all' ? 'Tất cả' : `${star}★`}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Ionicons name="chatbubble-ellipses-outline" size={48} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>Chưa có đánh giá nào</Text>
              <Text style={styles.emptySub}>
                {starFilter === 'all'
                  ? 'Khi khách hàng hoàn tất đơn và chấm sao, nhận xét sẽ hiển thị tại đây.'
                  : `Không có đánh giá ${starFilter} sao nào.`}
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const userName = (item as any).user?.full_name || 'Khách hàng';
            const star = Number(item.rating || 5);
            const dateStr = item.created_at
              ? new Date(item.created_at).toLocaleDateString('vi-VN', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                })
              : 'Gần đây';

            return (
              <View style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{userName.charAt(0).toUpperCase()}</Text>
                  </View>
                  <View style={styles.reviewUserBox}>
                    <Text style={styles.reviewUserName}>{userName}</Text>
                    <View style={styles.starsRow}>
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Ionicons
                          key={s}
                          name={s <= star ? 'star' : 'star-outline'}
                          size={13}
                          color="#F59E0B"
                        />
                      ))}
                    </View>
                  </View>
                  <Text style={styles.reviewDate}>{dateStr}</Text>
                </View>

                {item.comment ? (
                  <Text style={styles.reviewComment}>{item.comment}</Text>
                ) : (
                  <Text style={styles.noCommentText}>Khách hàng chỉ chấm sao không để lại lời bình.</Text>
                )}

                {item.order_id ? (
                  <View style={styles.orderTag}>
                    <Ionicons name="receipt-outline" size={11} color="#64748B" />
                    <Text style={styles.orderTagText}>Mã đơn hàng: #{item.order_id}</Text>
                  </View>
                ) : null}
              </View>
            );
          }}
        />
      )}
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerBtn: {
    padding: 6,
  },
  headerTitleBox: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 12,
  },
  summaryContainer: {
    marginBottom: 8,
    gap: 12,
  },
  scoreCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 16,
  },
  scoreLeft: {
    alignItems: 'center',
    minWidth: 110,
    borderRightWidth: 1,
    borderRightColor: '#F1F5F9',
    paddingRight: 12,
  },
  scoreNumber: {
    fontSize: 34,
    fontWeight: '900',
    color: '#0F172A',
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
    marginVertical: 4,
  },
  scoreCount: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
  },
  scoreBars: {
    flex: 1,
    gap: 4,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  barLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    width: 20,
  },
  barTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F1F5F9',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: '#F59E0B',
    borderRadius: 3,
  },
  barCount: {
    fontSize: 11,
    color: '#64748B',
    width: 22,
    textAlign: 'right',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  filterChipActive: {
    backgroundColor: '#EA580C',
    borderColor: '#EA580C',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 10,
  },
  emptyBox: {
    paddingVertical: 50,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#334155',
    marginTop: 10,
  },
  emptySub: {
    fontSize: 12.5,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 4,
  },
  reviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFEDD5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#EA580C',
  },
  reviewUserBox: {
    flex: 1,
  },
  reviewUserName: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  reviewDate: {
    fontSize: 11.5,
    color: '#94A3B8',
  },
  reviewComment: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 18,
  },
  noCommentText: {
    fontSize: 12,
    fontStyle: 'italic',
    color: '#94A3B8',
  },
  orderTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  orderTagText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
});
