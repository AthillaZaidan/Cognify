import { AppState, type AppStateStatus } from 'react-native';
import { useRef, useEffect, useCallback } from 'react';
import { postBehavioral, analyze } from '../services/api';
import type { BehavioralLogRequest, AnalyzeRequest } from '../types/api';
import { useAuth } from '../context/AuthContext';

const NORMAL_SLEEP_MIN = 450;

interface Session {
  switchCount: number;
  sessionDurations: number[];
  currentSessionStartMs: number;
  lastBackgroundMs: number | null;
  inactivityWindows: Array<{ startMs: number; durationMs: number }>;
  trackingStartMs: number;
}

function mean(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function std(arr: number[]): number {
  if (arr.length === 0) return 0;
  const m = mean(arr);
  return Math.sqrt(mean(arr.map((x) => (x - m) ** 2)));
}

function sleepProxyFromWindows(windows: Session['inactivityWindows']): number | null {
  let best = 0;
  for (const w of windows) {
    const d = new Date(w.startMs);
    const h = d.getHours() + d.getMinutes() / 60;
    const night = h >= 21 || h < 9;
    if (night && w.durationMs > best) best = w.durationMs;
  }
  return best > 45 * 60 * 1000 ? best / 60000 : null;
}

export function useBehavioralTracker() {
  const { auth } = useAuth();
  const sessionRef = useRef<Session | null>(null);
  const appState = useRef<AppStateStatus>(AppState.currentState);

  const ensureSession = () => {
    const now = Date.now();
    if (!sessionRef.current) {
      sessionRef.current = {
        switchCount: 0,
        sessionDurations: [],
        currentSessionStartMs: now,
        lastBackgroundMs: null,
        inactivityWindows: [],
        trackingStartMs: now,
      };
    }
  };

  const flush = useCallback(async () => {
    const authUser = auth;
    if (!authUser || authUser.role !== 'patient') return;
    ensureSession();
    const s = sessionRef.current!;
    const now = Date.now();
    const elapsedMs = now - s.trackingStartMs;
    const elapsedH = elapsedMs / 3600000;
    if (elapsedH <= 0) return;

    const switchCount = s.switchCount;
    const durations = [...s.sessionDurations];
    if (appState.current === 'active' && s.currentSessionStartMs) {
      durations.push(now - s.currentSessionStartMs);
    }

    const sumDur = durations.reduce((a, b) => a + b, 0);
    const screen_time_min = sumDur / 60000;
    const m = mean(durations);
    const screen_time_variance = m > 0 ? std(durations) / m : 0;
    const app_switches_per_hour = switchCount / elapsedH;
    const avg_session_duration_sec = m / 1000;
    const short = durations.filter((d) => d < 90000).length;
    const fragmentation_score = durations.length ? short / durations.length : 0;

    const sleep_duration_min = sleepProxyFromWindows(s.inactivityWindows);

    const date = new Date().toISOString().slice(0, 10);

    const payload: BehavioralLogRequest = {
      user_id: authUser.user_id,
      date,
      sleep_duration_min,
      sleep_onset_hour: null,
      wake_hour: null,
      screen_time_min,
      screen_time_variance,
      app_switches_per_hour,
      avg_session_duration_sec,
      fragmentation_score,
      notif_response_time_sec: null,
      notifications_per_day: null,
    };

    await postBehavioral(payload);

    const analyzePayload: AnalyzeRequest = {
      user_id: authUser.user_id,
      date,
      sleep_duration_min: sleep_duration_min ?? NORMAL_SLEEP_MIN,
      screen_time_min: payload.screen_time_min,
      screen_time_variance: payload.screen_time_variance,
      app_switches_per_hour: payload.app_switches_per_hour,
      avg_session_duration_sec: payload.avg_session_duration_sec,
    };
    await analyze(analyzePayload);

    sessionRef.current = {
      ...s,
      switchCount: 0,
      sessionDurations: [],
      currentSessionStartMs: Date.now(),
      trackingStartMs: Date.now(),
      inactivityWindows: [],
    };
  }, [auth]);

  useEffect(() => {
    ensureSession();
    const id = setInterval(() => {
      void flush();
    }, 30 * 60 * 1000);
    return () => clearInterval(id);
  }, [flush]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      const prev = appState.current;
      appState.current = next;
      ensureSession();
      const s = sessionRef.current!;
      const now = Date.now();

      if (prev === 'active' && (next === 'background' || next === 'inactive')) {
        s.switchCount += 1;
        s.sessionDurations.push(now - s.currentSessionStartMs);
        s.lastBackgroundMs = now;
      }

      if (
        (prev === 'background' || prev === 'inactive') &&
        next === 'active'
      ) {
        if (s.lastBackgroundMs !== null) {
          const gap = now - s.lastBackgroundMs;
          if (gap > 30 * 60 * 1000) {
            s.inactivityWindows.push({ startMs: s.lastBackgroundMs, durationMs: gap });
          }
        }
        s.currentSessionStartMs = now;
        if (s.switchCount >= 5) {
          void flush();
        }
      }
    });
    return () => sub.remove();
  }, [flush]);

  return { flush };
}
