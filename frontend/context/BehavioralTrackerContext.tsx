import React, { createContext, useContext } from 'react';
import { useBehavioralTracker } from '../hooks/useBehavioralTracker';

const Ctx = createContext<{ flush: () => Promise<void> } | null>(null);

export function BehavioralTrackerProvider({ children }: { children: React.ReactNode }) {
  const { flush } = useBehavioralTracker();
  return <Ctx.Provider value={{ flush }}>{children}</Ctx.Provider>;
}

export function useBehavioralFlush() {
  const ctx = useContext(Ctx);
  return ctx?.flush ?? (async () => {});
}
