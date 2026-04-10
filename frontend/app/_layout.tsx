import 'react-native-gesture-handler';
import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import {
  useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { Colors } from '../constants/colors';
import LoginScreen from '../components/LoginScreen';

SplashScreen.preventAutoHideAsync().catch(() => {});

/**
 * Renders the correct UI based on auth state — no router.replace, no Redirect,
 * no loops. The Stack only mounts when the user is authenticated, so every
 * screen inside it can assume auth is present.
 *
 *   not ready  →  boot spinner
 *   ready, no auth  →  <LoginScreen> (rendered directly, outside the Stack)
 *   ready, auth set  →  <Stack> starting at app/index.tsx → redirects to /(tabs)
 */
function RootApp() {
  const { auth, ready } = useAuth();

  if (!ready) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  if (!auth) {
    return <LoginScreen />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function RootLayout() {
  const [loaded, err] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });

  useEffect(() => {
    if (loaded || err) {
      void SplashScreen.hideAsync();
    }
  }, [loaded, err]);

  if (!loaded && !err) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  return (
    <AuthProvider>
      <RootApp />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  boot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
});
