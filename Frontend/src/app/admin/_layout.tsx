import { Stack } from 'expo-router';
import React from 'react';

/**
 * Layout cho phân hệ Quản trị viên (Admin).
 */
export default function AdminLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
      <Stack.Screen name="orders" />
    </Stack>
  );
}
