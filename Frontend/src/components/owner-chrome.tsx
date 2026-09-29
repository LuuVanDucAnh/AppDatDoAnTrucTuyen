import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useOwner } from '@/context/OwnerContext';

/**
 * Header dùng chung cho 3 màn chủ quán:
 * tên quán đang quản lý + công tắc MỞ CỬA / ĐÓNG CỬA (PATCH toggle-status).
 */
export function OwnerHeader() {
  const router = useRouter();
  const { restaurant, restaurants, isOpen, toggleOpen, selectRestaurant } = useOwner();

  return (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.headerLeft}
        activeOpacity={0.7}
        disabled={restaurants.length < 2}
        onPress={() => {
          // Chủ quán có thể sở hữu nhiều quán → bấm để chuyển nhanh
          const idx = restaurants.findIndex((r) => r.id === restaurant?.id);
          const next = restaurants[(idx + 1) % restaurants.length];
          if (next) selectRestaurant(next.id);
        }}
      >
        <View style={styles.storeIcon}>
          <Ionicons name="storefront" size={16} color="#C2410C" />
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.headerLabelRow}>
            <Text style={styles.headerLabel}>Quán đang quản lý</Text>
            {restaurants.length > 1 && (
              <Ionicons name="swap-horizontal" size={12} color="#9CA3AF" />
            )}
          </View>
          <Text style={styles.headerStoreName} numberOfLines={1}>
            {restaurant?.name ?? 'Đang tải...'}
          </Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.statusPill, !isOpen && styles.statusPillClosed]}
        activeOpacity={0.85}
        onPress={() => void toggleOpen()}
      >
        <View style={[styles.statusDot, !isOpen && styles.statusDotClosed]} />
        <Text style={[styles.statusText, !isOpen && styles.statusTextClosed]}>
          {isOpen ? 'MỞ CỬA' : 'ĐÓNG CỬA'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.avatar} onPress={() => router.push('/profile')}>
        <Ionicons name="person" size={15} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}

const TABS = [
  { href: '/owner/dashboard', label: 'Tổng quan', icon: 'stats-chart' },
  { href: '/owner/orders', label: 'Đơn hàng', icon: 'receipt' },
  { href: '/owner/menu', label: 'Thực đơn', icon: 'restaurant' },
  { href: '/owner/settings', label: 'Cài đặt', icon: 'settings' },
] as const;

/** Thanh tab dưới cùng, dùng chung cho các màn chủ quán. */
export function OwnerTabBar() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <View style={styles.tabBar}>
      {TABS.map((tab) => {
        const active = pathname === tab.href;
        return (
          <TouchableOpacity
            key={tab.href}
            style={styles.tabItem}
            activeOpacity={0.7}
            onPress={() => router.replace(tab.href as any)}
          >
            <Ionicons
              name={(active ? tab.icon : `${tab.icon}-outline`) as any}
              size={21}
              color={active ? '#EA580C' : '#9CA3AF'}
            />
            <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

/** Màn hình chờ / báo lỗi dùng chung cho khu vực chủ quán. */
export function OwnerStateScreen({
  loading,
  error,
  onRetry,
}: {
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}) {
  const router = useRouter();

  if (loading) {
    return (
      <View style={styles.stateBox}>
        <ActivityIndicator size="large" color="#EA580C" />
        <Text style={styles.stateText}>Đang tải dữ liệu quán...</Text>
      </View>
    );
  }

  return (
    <View style={styles.stateBox}>
      <Ionicons name="lock-closed-outline" size={44} color="#DC2626" />
      <Text style={styles.stateTitle}>Không truy cập được</Text>
      <Text style={styles.stateText}>{error}</Text>
      <View style={styles.stateActions}>
        {onRetry && (
          <TouchableOpacity style={styles.stateBtn} onPress={onRetry}>
            <Ionicons name="refresh" size={15} color="#FFFFFF" />
            <Text style={styles.stateBtnText}>Thử lại</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.stateBtn, styles.stateBtnAlt]}
          onPress={() => router.replace('/auth')}
        >
          <Ionicons name="log-in-outline" size={15} color="#C2410C" />
          <Text style={[styles.stateBtnText, styles.stateBtnTextAlt]}>Đăng nhập chủ quán</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  storeIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFEDD5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerLabel: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '600',
  },
  headerStoreName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#DCFCE7',
  },
  statusPillClosed: {
    backgroundColor: '#F1F5F9',
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#16A34A',
  },
  statusDotClosed: {
    backgroundColor: '#94A3B8',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#15803D',
  },
  statusTextClosed: {
    color: '#64748B',
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#9A3412',
    alignItems: 'center',
    justifyContent: 'center',
  },

  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 8,
    paddingBottom: 10,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  tabLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  tabLabelActive: {
    color: '#EA580C',
    fontWeight: '700',
  },

  stateBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
    gap: 10,
  },
  stateTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  stateText: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 19,
  },
  stateActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  stateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EA580C',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  stateBtnAlt: {
    backgroundColor: '#FFEDD5',
  },
  stateBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  stateBtnTextAlt: {
    color: '#C2410C',
  },
});
