import '../global.css';
import React from 'react';
import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { Platform, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Toast from 'react-native-toast-message';
import { useSocket } from '@/hooks/useSocket';

// On web, GestureHandlerRootView intercepts pointer events — use a plain View instead
const RootWrapper = Platform.OS === 'web'
  ? ({ children, style }: { children: React.ReactNode; style: object }) => <View style={style}>{children}</View>
  : GestureHandlerRootView;

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
    <RootWrapper style={{ flex: 1 }}>
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
    </RootWrapper>
  );
}
