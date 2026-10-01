import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useOwner } from '@/context/OwnerContext';

/**
 * Header dùng chung cho 3 màn chủ quán:
 * tên quán đang quản lý + công tắc MỞ CỬA / ĐÓNG CỬA + chuông thông báo + avatar.
 */
export function OwnerHeader({
  notificationCount = 3,
  onPressBell,
}: {
  notificationCount?: number;
  onPressBell?: () => void;
}) {
  const router = useRouter();
  const { restaurant, restaurants, isOpen, toggleOpen, selectRestaurant } = useOwner();

  return (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.headerLeft}
        activeOpacity={0.7}
        onPress={() => {
          if (restaurants.length > 1) {
            const idx = restaurants.findIndex((r) => r.id === restaurant?.id);
            const next = restaurants[(idx + 1) % restaurants.length];
            if (next) selectRestaurant(next.id);
          }
        }}
      >
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerLabel}>Quán đang quản lý</Text>
          <View style={styles.storeNameRow}>
            <Text style={styles.headerStoreName} numberOfLines={1}>
              {restaurant?.name ?? 'Đang tải...'}
            </Text>
            <Ionicons name="chevron-down" size={14} color="#64748B" style={{ marginLeft: 3 }} />
          </View>
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

      <TouchableOpacity
        style={styles.bellBtn}
        activeOpacity={0.7}
        onPress={onPressBell ?? (() => {})}
      >
        <Ionicons name="notifications-outline" size={20} color="#334155" />
        {notificationCount > 0 && (
          <View style={styles.bellBadge}>
            <View style={styles.bellDot} />
          </View>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.avatar}
        activeOpacity={0.8}
        onPress={() => router.push('/profile')}
      >
        <Ionicons name="person" size={15} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}

const TABS = [
  { href: '/owner/dashboard', label: 'Tổng quan', icon: 'grid-outline', activeIcon: 'grid' },
  { href: '/owner/orders', label: 'Đơn hàng', icon: 'receipt-outline', activeIcon: 'receipt', hasBadge: true },
  { href: '/owner/menu', label: 'Thực đơn', icon: 'restaurant-outline', activeIcon: 'restaurant' },
  { href: '/owner/settings', label: 'Cài đặt', icon: 'storefront-outline', activeIcon: 'storefront' },
] as const;

/** Thanh tab dưới cùng, dùng chung cho các màn chủ quán. */
export function OwnerTabBar({ ordersCount = 0 }: { ordersCount?: number }) {
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
            <View style={styles.tabIconWrap}>
              <Ionicons
                name={(active ? tab.activeIcon : tab.icon) as any}
                size={22}
                color={active ? '#A04000' : '#64748B'}
              />
              {Boolean((tab as any).hasBadge && ordersCount > 0) && (
                <View style={styles.tabItemBadge}>
                  <Text style={styles.tabItemBadgeText}>{ordersCount}</Text>
                </View>
              )}
            </View>
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
  headerTitleWrap: {
    justifyContent: 'center',
  },
  storeNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '500',
    marginBottom: 1,
  },
  headerStoreName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  bellBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  bellBadge: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bellDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
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
    fontSize: 11,
    fontWeight: '800',
    color: '#15803D',
  },
  statusTextClosed: {
    color: '#64748B',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
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
  tabIconWrap: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabItemBadge: {
    position: 'absolute',
    top: -4,
    right: -10,
    backgroundColor: '#A04000',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabItemBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  tabLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
  },
  tabLabelActive: {
    color: '#A04000',
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
