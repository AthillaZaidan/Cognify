import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import type { AuthState } from '../context/AuthContext';

const KEY = 'cognify.auth.v1';

function canUseLocalStorage(): boolean {
  return Platform.OS === 'web' && typeof window !== 'undefined' && !!window.localStorage;
}

export async function saveAuth(auth: AuthState | null): Promise<void> {
  const json = auth ? JSON.stringify(auth) : '';

  if (canUseLocalStorage()) {
    if (auth) window.localStorage.setItem(KEY, json);
    else window.localStorage.removeItem(KEY);
    return;
  }

  if (auth) await SecureStore.setItemAsync(KEY, json);
  else await SecureStore.deleteItemAsync(KEY);
}

export async function loadAuth(): Promise<AuthState | null> {
  try {
    if (canUseLocalStorage()) {
      const json = window.localStorage.getItem(KEY);
      if (!json) return null;
      return JSON.parse(json) as AuthState;
    }

    const json = await SecureStore.getItemAsync(KEY);
    if (!json) return null;
    return JSON.parse(json) as AuthState;
  } catch {
    return null;
  }
}

