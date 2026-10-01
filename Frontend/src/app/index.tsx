import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useApp } from '@/context/AppContext';

/**
 * Root Dispatcher:
 * Điều hướng tự động khi mở app:
 * - Nếu là RESTAURANT_OWNER -> chuyển sang /owner/dashboard
 * - Mặc định (Khách hàng hoặc khách vãng lai) -> chuyển sang /customer
 */
export default function RootIndex() {
  const router = useRouter();
  const { user, authLoading } = useApp();

  useEffect(() => {
    if (authLoading) return;

    if (user?.role === 'RESTAURANT_OWNER') {
      router.replace('/owner/dashboard' as any);
    } else {
      router.replace('/customer' as any);
    }
  }, [authLoading, user, router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#EA580C" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
