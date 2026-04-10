import type {
  LoginResponse,
  DashboardResponse,
  TrendDay,
  BehavioralLogResponse,
  AnalyzeResponse,
  Intervention,
  PatientSummary,
  Alert,
} from '../types/api';

const TODAY = new Date().toISOString().slice(0, 10);

function dateDaysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function trend(dayOffset: number): TrendDay {
  const base = 390 + Math.round(Math.random() * 80 - 40);
  return {
    date: dateDaysAgo(dayOffset),
    sleep_duration_min: base,
    sleep_onset_hour: 23 + Math.random() * 1.5,
    wake_hour: 6.5 + Math.random(),
    screen_time_min: 180 + Math.round(Math.random() * 120),
    screen_time_variance: +(Math.random() * 0.4).toFixed(2),
    app_switches_per_hour: +(4 + Math.random() * 6).toFixed(1),
    avg_session_duration_sec: +(80 + Math.random() * 100).toFixed(0),
    fragmentation_score: +(0.2 + Math.random() * 0.4).toFixed(2),
    notif_response_time_sec: Math.round(3 + Math.random() * 12),
    notifications_per_day: Math.round(20 + Math.random() * 40),
  };
}

const TRENDS_7D: TrendDay[] = Array.from({ length: 7 }, (_, i) => trend(6 - i));
const LATEST = TRENDS_7D[TRENDS_7D.length - 1];

export const MOCK = {
  login(email: string): LoginResponse {
    if (email.startsWith('psych')) {
      return { user_id: 99, name: 'Dr. Kartika', role: 'psychologist' };
    }
    return { user_id: 1, name: 'Alex Santosa', role: 'patient' };
  },

  dashboard(): DashboardResponse {
    return {
      user: { id: 1, name: 'Alex Santosa', role: 'patient' },
      latest_data: LATEST,
      baseline: {
        sleep_duration_min: { mean: 399, std: 35 },
        app_switches_per_hour: { mean: 6, std: 1.8 },
        screen_time_min: { mean: 220, std: 40 },
      },
      latest_anomaly: {
        date: TODAY,
        risk_level: 'mild_drift',
        alert_severity: null,
        wcs: 0.58,
        flagged_signals: 2,
        anomalous_signals: ['app_switches_per_hour', 'fragmentation_score'],
        z_scores: { app_switches_per_hour: 2.1, fragmentation_score: 1.9 },
        if_anomaly_score: 0.62,
        shap_contributions: [
          { feature: 'app_switches_per_hour', shap_value: 0.18, direction: 'toward_anomaly', strength: 0.8 },
          { feature: 'fragmentation_score', shap_value: 0.12, direction: 'toward_anomaly', strength: 0.6 },
          { feature: 'sleep_duration_min', shap_value: -0.05, direction: 'toward_normal', strength: 0.3 },
        ],
      },
      active_interventions: 2,
      trends_7d: TRENDS_7D,
    };
  },

  trends(): TrendDay[] {
    return TRENDS_7D;
  },

  interventions(): Intervention[] {
    return [
      {
        id: 1,
        type: 'focus_reset',
        title: '4-7-8 Breathing Reset',
        content: 'Try a short breathing cycle when switching spikes.',
        steps: ['Inhale 4 s', 'Hold 7 s', 'Exhale 8 s', 'Repeat 3×'],
        priority: 'high',
        triggered_by: ['app_switches_per_hour'],
        trigger_reason: 'App switches 2.1σ above baseline',
        completed: false,
        completed_at: null,
        dismissed: false,
        triggered_at: TODAY,
      },
      {
        id: 2,
        type: 'digital_detox',
        title: 'Screen-free wind-down',
        content: 'No screens 30 min before bed.',
        steps: ['Set alarm 30 min before target bedtime', 'Switch to book or stretching', 'Dim lights'],
        priority: 'medium',
        triggered_by: ['fragmentation_score'],
        trigger_reason: 'High evening fragmentation',
        completed: false,
        completed_at: null,
        dismissed: false,
        triggered_at: TODAY,
      },
      {
        id: 3,
        type: 'sleep_hygiene',
        title: 'Consistent wake time',
        content: 'Wake within 30 min of target.',
        steps: ['Set alarm for 6:45', 'Get sunlight within 15 min', 'No snooze'],
        priority: 'low',
        triggered_by: ['sleep_onset_hour'],
        trigger_reason: 'Resolved — sleep schedule stabilised',
        completed: true,
        completed_at: dateDaysAgo(2),
        dismissed: false,
        triggered_at: dateDaysAgo(5),
      },
    ];
  },

  patients(): PatientSummary[] {
    return [
      { id: 1, name: 'Alex Santosa', age: 24, severity: 'moderate', latest_wcs: 0.58, latest_risk_level: 'mild_drift', active_anomalies: 1, last_active: TODAY },
      { id: 2, name: 'Maya Chen', age: 19, severity: 'mild', latest_wcs: 0.31, latest_risk_level: 'stable', active_anomalies: 0, last_active: dateDaysAgo(1) },
      { id: 3, name: 'Rafi Putra', age: 28, severity: 'severe', latest_wcs: 0.82, latest_risk_level: 'attention_needed', active_anomalies: 3, last_active: TODAY },
    ];
  },

  alerts(): Alert[] {
    return [
      {
        id: 1,
        patient_id: 3,
        patient_name: 'Rafi Putra',
        severity: 'high',
        risk_level: 'attention_needed',
        summary: 'Sleep under 5h for 3 consecutive nights; app switching 3σ above baseline.',
        anomaly_data: null,
        acknowledged: false,
        acknowledged_at: null,
        notes: null,
        created_at: TODAY,
      },
    ];
  },
};
