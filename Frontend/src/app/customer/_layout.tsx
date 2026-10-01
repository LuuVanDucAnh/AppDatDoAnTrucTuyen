import { Stack } from 'expo-router';
import React from 'react';

/**
 * Layout cho phân hệ Khách hàng (Customer).
 */
export default function CustomerLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="explore" />
      <Stack.Screen name="restaurant" />
      <Stack.Screen name="cart" />
      <Stack.Screen name="order-tracking" />
      <Stack.Screen name="orders" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="addresses" />
    </Stack>
  );
}
