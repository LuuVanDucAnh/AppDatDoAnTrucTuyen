import { DarkTheme, DefaultTheme, ThemeProvider, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { AppProvider } from '@/context/AppContext';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <AppProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AnimatedSplashOverlay />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="auth" options={{ headerShown: false }} />
          <Stack.Screen name="restaurant" options={{ headerShown: false }} />
          <Stack.Screen name="cart" options={{ headerShown: false }} />
          <Stack.Screen name="explore" options={{ headerShown: false }} />
          <Stack.Screen name="profile" options={{ headerShown: false }} />
          <Stack.Screen name="order-tracking" options={{ headerShown: false }} />
          {/* Khu vực chủ quán: có _layout riêng bọc OwnerProvider */}
          <Stack.Screen name="owner" options={{ headerShown: false }} />
          {/* Khu vực quản trị viên sàn */}
          <Stack.Screen name="admin" options={{ headerShown: false }} />
          {/* Phân hệ khách hàng */}
          <Stack.Screen name="customer" options={{ headerShown: false }} />
        </Stack>
      </ThemeProvider>
    </AppProvider>
  );
}
