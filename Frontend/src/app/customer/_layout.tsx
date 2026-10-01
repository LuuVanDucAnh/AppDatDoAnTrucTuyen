import { Stack } from 'expo-router';
import React from 'react';

/**
 * Layout cho phân hệ Khách hàng (Customer).
 */
export default function CustomerLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
      <Stack.Screen name="orders" />
    </Stack>
  );
}
