import '../global.css';
import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Toast from 'react-native-toast-message';
import { useSocket } from '@/hooks/useSocket';

SplashScreen.preventAutoHideAsync();

function SocketInitializer() {
  useSocket();
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
      <ThemeProvider value={DefaultTheme}>
        <SocketInitializer />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="orders/[id]"
            options={{
              headerShown: true,
              headerTitle: 'Order Details',
              headerStyle: { backgroundColor: '#f0faf4' },
              headerTintColor: '#182a1e',
            }}
          />
          <Stack.Screen
            name="wallet"
            options={{
              headerShown: true,
              headerTitle: 'Wallet',
              headerStyle: { backgroundColor: '#f0faf4' },
              headerTintColor: '#182a1e',
            }}
          />
          <Stack.Screen
            name="notifications"
            options={{
              headerShown: true,
              headerTitle: 'Notifications',
              headerStyle: { backgroundColor: '#f0faf4' },
              headerTintColor: '#182a1e',
            }}
          />
          <Stack.Screen
            name="provider"
            options={{
              headerShown: true,
              headerTitle: 'Provider Mode',
              headerStyle: { backgroundColor: '#f0faf4' },
              headerTintColor: '#182a1e',
            }}
          />
        </Stack>
        <StatusBar style="light" />
        <Toast />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
