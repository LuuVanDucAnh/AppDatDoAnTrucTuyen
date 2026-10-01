import { Stack } from 'expo-router';
import React from 'react';

import { OwnerProvider } from '@/context/OwnerContext';

/**
 * Khu vực dành cho CHỦ QUÁN.
 * OwnerProvider giữ nhà hàng đang được quản lý để 3 màn con dùng chung.
 */
export default function OwnerLayout() {
  return (
    <OwnerProvider>
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
        <Stack.Screen name="dashboard" />
        <Stack.Screen name="orders" />
        <Stack.Screen name="menu" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="edit-restaurant" />
        <Stack.Screen name="create-restaurant" />
        <Stack.Screen name="reviews" />
      </Stack>
    </OwnerProvider>
  );
}
