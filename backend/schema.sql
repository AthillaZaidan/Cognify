CREATE TABLE users (
  id        SERIAL PRIMARY KEY,
  email     VARCHAR(100) UNIQUE NOT NULL,
  name      VARCHAR(100) NOT NULL,
  role      VARCHAR(20) DEFAULT 'patient',
  age       INTEGER,
  gender    VARCHAR(20),
  severity  VARCHAR(20),
  doctor_id INTEGER REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE behavioral_data (
  id                       SERIAL PRIMARY KEY,
  user_id                  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date                     DATE NOT NULL,
  day                      INTEGER,
  period                   VARCHAR(20),
  sleep_duration_min       FLOAT,
  sleep_onset_hour         FLOAT,
  wake_hour                FLOAT,
  screen_time_min          FLOAT,
  screen_time_variance     FLOAT,
  app_switches_per_hour    FLOAT,
  avg_session_duration_sec FLOAT,
  fragmentation_score      FLOAT,
  notif_response_time_sec  FLOAT,
  notifications_per_day    INTEGER,
  deterioration_factor     FLOAT,
  UNIQUE(user_id, date)
);

CREATE TABLE baselines (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  metrics     JSONB NOT NULL,
  computed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE anomaly_logs (
  id                 SERIAL PRIMARY KEY,
  user_id            INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date               DATE NOT NULL,
  z_scores           JSONB NOT NULL,
  wcs                FLOAT DEFAULT 0,
  flagged_signals    INTEGER DEFAULT 0,
  anomalous_signals  TEXT[] DEFAULT '{}',
  wcs_slope_3d       FLOAT DEFAULT 0,
  risk_level         VARCHAR(20) DEFAULT 'stable',
  alert_severity     VARCHAR(20),
  if_anomaly_score   FLOAT,
  shap_contributions JSONB,
  created_at         TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

CREATE TABLE interventions (
  id             SERIAL PRIMARY KEY,
  user_id        INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  triggered_at   TIMESTAMPTZ DEFAULT NOW(),
  type           VARCHAR(50) NOT NULL,
  title          VARCHAR(100) NOT NULL,
  content        TEXT NOT NULL,
  steps          JSONB,
  priority       VARCHAR(20) NOT NULL,
  triggered_by   TEXT[] NOT NULL,
  trigger_reason TEXT,
  completed      BOOLEAN DEFAULT FALSE,
  completed_at   TIMESTAMPTZ,
  dismissed      BOOLEAN DEFAULT FALSE
);

CREATE TABLE alerts (
  id                  SERIAL PRIMARY KEY,
  patient_id          INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  psychologist_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  severity            VARCHAR(20) NOT NULL,
  risk_level          VARCHAR(20) NOT NULL,
  summary             TEXT NOT NULL,
  anomaly_data        JSONB,
  behavioral_snapshot JSONB,
  acknowledged        BOOLEAN DEFAULT FALSE,
  acknowledged_at     TIMESTAMPTZ,
  notes               TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);
