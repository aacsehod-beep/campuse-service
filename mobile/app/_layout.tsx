import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Toast from 'react-native-toast-message';
import { useAuthStore } from '@/store/authStore';
import { useSocket } from '@/hooks/useSocket';

SplashScreen.preventAutoHideAsync();

function AuthGuard() {
  const { isAuthenticated } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  useSocket();

  useEffect(() => {
    const inAuthGroup = segments[0] === '(auth)';
    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)/feed');
    }
  }, [isAuthenticated, segments]);

  return null;
}

export default function RootLayout() {
  const [loaded] = useFonts({});

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={DarkTheme}>
        <AuthGuard />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="orders/[id]"
            options={{
              headerShown: true,
              headerTitle: 'Order Details',
              headerStyle: { backgroundColor: '#0d0d14' },
              headerTintColor: '#ffffff',
            }}
          />
          <Stack.Screen
            name="wallet"
            options={{
              headerShown: true,
              headerTitle: 'Wallet',
              headerStyle: { backgroundColor: '#0d0d14' },
              headerTintColor: '#ffffff',
            }}
          />
          <Stack.Screen
            name="notifications"
            options={{
              headerShown: true,
              headerTitle: 'Notifications',
              headerStyle: { backgroundColor: '#0d0d14' },
              headerTintColor: '#ffffff',
            }}
          />
          <Stack.Screen
            name="provider"
            options={{
              headerShown: true,
              headerTitle: 'Provider Mode',
              headerStyle: { backgroundColor: '#0d0d14' },
              headerTintColor: '#ffffff',
            }}
          />
        </Stack>
        <StatusBar style="light" />
        <Toast />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
