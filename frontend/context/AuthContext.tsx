import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import type { LoginResponse } from '../types/api';
import { saveAuth, loadAuth } from '../utils/authStorage';

export interface AuthState {
  user_id: number;
  name: string;
  role: 'patient' | 'psychologist';
}

const AuthContext = createContext<{
  auth: AuthState | null;
  ready: boolean;
  setAuth: (a: AuthState | null) => void;
  signOut: () => void;
} | null>(null);

export function authFromLogin(login: LoginResponse): AuthState {
  return {
    user_id: login.user_id,
    name: login.name,
    role: login.role,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [auth, setAuthState] = useState<AuthState | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    loadAuth().then((stored) => {
      if (stored) setAuthState(stored);
      setReady(true);
    });
  }, []);

  const setAuth = useCallback((a: AuthState | null) => {
    setAuthState(a);
    void saveAuth(a);
  }, []);

  const signOut = useCallback(() => {
    setAuthState(null);
    void saveAuth(null);
  }, []);

  const value = useMemo(
    () => ({ auth, ready, setAuth, signOut }),
    [auth, ready, setAuth, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
