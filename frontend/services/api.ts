import axios from 'axios';
import Constants from 'expo-constants';
import type {
  LoginRequest,
  LoginResponse,
  DashboardResponse,
  TrendDay,
  BehavioralLogRequest,
  BehavioralLogResponse,
  AnalyzeRequest,
  AnalyzeResponse,
  AnomalyLogEntry,
  Intervention,
  PatientSummary,
  Alert,
} from '../types/api';
import { MOCK } from './mock';

function getApiBase(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv) return fromEnv;
  const extra = Constants.expoConfig?.extra as { apiUrl?: string } | undefined;
  if (extra?.apiUrl) return extra.apiUrl;
  return 'http://localhost:8000';
}

const api = axios.create({ baseURL: getApiBase(), timeout: 3000 });

async function tryApi<T>(call: () => Promise<T>, fallback: () => T): Promise<T> {
  try {
    return await call();
  } catch {
    return fallback();
  }
}

export const login = (body: LoginRequest) =>
  tryApi(
    () => api.post<LoginResponse>('/login', body).then((r) => r.data),
    () => MOCK.login(body.email),
  );

export const getDashboard = (userId: number) =>
  tryApi(
    () => api.get<DashboardResponse>(`/dashboard/${userId}`).then((r) => r.data),
    () => MOCK.dashboard(),
  );

export const getTrends = (userId: number, days = 7) =>
  tryApi(
    () => api.get<TrendDay[]>(`/behavioral-trends/${userId}`, { params: { days } }).then((r) => r.data),
    () => MOCK.trends(),
  );

export const postBehavioral = (body: BehavioralLogRequest) =>
  tryApi(
    () => api.post<BehavioralLogResponse>('/behavioral-logs', body).then((r) => r.data),
    () => ({ id: Date.now(), user_id: body.user_id, date: body.date }),
  );

export const getAnomalies = (userId: number) =>
  tryApi(
    () => api.get<AnomalyLogEntry[]>(`/anomalies/${userId}`).then((r) => r.data),
    () => [],
  );

export const getInterventions = (userId: number) =>
  tryApi(
    () => api.get<Intervention[]>(`/interventions/${userId}`).then((r) => r.data),
    () => MOCK.interventions(),
  );

export const completeIntervention = (id: number) =>
  tryApi(
    () => api.post<{ id: number; completed: boolean; completed_at: string }>(`/interventions/${id}/complete`).then((r) => r.data),
    () => ({ id, completed: true, completed_at: new Date().toISOString() }),
  );

export const dismissIntervention = (id: number) =>
  tryApi(
    () => api.post<{ id: number; dismissed: boolean }>(`/interventions/${id}/dismiss`).then((r) => r.data),
    () => ({ id, dismissed: true }),
  );

export const getPatients = (psychId: number) =>
  tryApi(
    () => api.get<PatientSummary[]>(`/psychologist/patients/${psychId}`).then((r) => r.data),
    () => MOCK.patients(),
  );

export const getAlerts = (psychId: number) =>
  tryApi(
    () => api.get<Alert[]>(`/alerts/${psychId}`).then((r) => r.data),
    () => MOCK.alerts(),
  );

export const acknowledgeAlert = (id: number, notes?: string | null) =>
  tryApi(
    () => api.post<{ id: number; acknowledged: boolean; acknowledged_at: string }>(`/alerts/${id}/acknowledge`, { notes: notes ?? null }).then((r) => r.data),
    () => ({ id, acknowledged: true, acknowledged_at: new Date().toISOString() }),
  );

export const analyze = (body: AnalyzeRequest) =>
  tryApi(
    () => api.post<AnalyzeResponse>('/analyze', body).then((r) => r.data),
    () => ({
      risk_level: 'stable',
      alert_severity: null,
      wcs: 0.3,
      flagged_signals: 0,
      anomalous_signals: [],
      z_scores: {},
      if_anomaly_score: 0.1,
      is_if_anomaly: false,
      shap_contributions: [],
      interventions_created: [],
      alert_created: false,
    }),
  );

export { getApiBase };
