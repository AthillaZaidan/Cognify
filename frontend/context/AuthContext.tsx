import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { LoginResponse } from '../types/api';

export interface AuthState {
  user_id: number;
  name: string;
  role: 'patient' | 'psychologist';
}

const AuthContext = createContext<{
  auth: AuthState | null;
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
  const [auth, setAuth] = useState<AuthState | null>(null);
  const signOut = useCallback(() => setAuth(null), []);

  const value = useMemo(
    () => ({ auth, setAuth, signOut }),
    [auth, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
