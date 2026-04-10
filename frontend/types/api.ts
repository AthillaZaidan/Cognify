// --- Auth ---
export interface LoginRequest {
  email: string;
}
export interface LoginResponse {
  user_id: number;
  name: string;
  role: 'patient' | 'psychologist';
}

// --- Dashboard ---
export interface UserInfo {
  id: number;
  name: string;
  role: string;
}

export interface BaselineMetrics {
  [signal: string]: { mean: number; std: number };
}

export interface ShapContribution {
  feature: string;
  shap_value: number;
  direction: 'toward_anomaly' | 'toward_normal';
  strength: number;
}

export interface AnomalySnapshot {
  date: string;
  risk_level: 'stable' | 'mild_drift' | 'attention_needed';
  alert_severity: string | null;
  wcs: number;
  flagged_signals: number;
  anomalous_signals: string[];
  z_scores: Record<string, number>;
  if_anomaly_score: number;
  shap_contributions: ShapContribution[];
}

export interface AnomalyLogEntry extends AnomalySnapshot {
  id: number;
  created_at: string;
}

export interface TrendDay {
  date: string;
  day?: number;
  period?: string;
  sleep_duration_min: number;
  sleep_onset_hour: number;
  wake_hour: number;
  screen_time_min: number;
  screen_time_variance: number;
  app_switches_per_hour: number;
  avg_session_duration_sec: number;
  fragmentation_score: number;
  notif_response_time_sec: number | null;
  notifications_per_day: number | null;
}

export interface DashboardResponse {
  user: UserInfo;
  latest_data: TrendDay;
  baseline: BaselineMetrics;
  latest_anomaly: AnomalySnapshot | null;
  active_interventions: number;
  trends_7d: TrendDay[];
}

// --- Behavioral logs ---
export interface BehavioralLogRequest {
  user_id: number;
  date: string;
  sleep_duration_min: number | null;
  sleep_onset_hour: number | null;
  wake_hour: number | null;
  screen_time_min: number;
  screen_time_variance: number;
  app_switches_per_hour: number;
  avg_session_duration_sec: number;
  fragmentation_score: number;
  notif_response_time_sec: number | null;
  notifications_per_day: number | null;
}
export interface BehavioralLogResponse {
  id: number;
  user_id: number;
  date: string;
}

// --- Analyze ---
export interface AnalyzeRequest {
  user_id: number;
  date: string;
  sleep_duration_min: number;
  screen_time_min: number;
  screen_time_variance: number;
  app_switches_per_hour: number;
  avg_session_duration_sec: number;
}
export interface AnalyzeResponse {
  risk_level: string;
  alert_severity: string | null;
  wcs: number;
  flagged_signals: number;
  anomalous_signals: string[];
  z_scores: Record<string, number>;
  if_anomaly_score: number;
  is_if_anomaly: boolean;
  shap_contributions: ShapContribution[];
  interventions_created: { id: number; type: string; title: string }[];
  alert_created: boolean;
}

// --- Interventions ---
export interface Intervention {
  id: number;
  type: string;
  title: string;
  content: string;
  steps: string[];
  priority: string;
  triggered_by: string[];
  trigger_reason: string;
  completed: boolean;
  completed_at: string | null;
  dismissed: boolean;
  triggered_at: string;
}

// --- Psychologist ---
export interface PatientSummary {
  id: number;
  name: string;
  age: number;
  severity: string;
  latest_wcs: number;
  latest_risk_level: string;
  active_anomalies: number;
  last_active: string;
}

export interface Alert {
  id: number;
  patient_id: number;
  patient_name: string;
  severity: string;
  risk_level: string;
  summary: string;
  anomaly_data: Record<string, unknown> | null;
  acknowledged: boolean;
  acknowledged_at: string | null;
  notes: string | null;
  created_at: string;
}
