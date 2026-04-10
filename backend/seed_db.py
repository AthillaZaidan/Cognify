"""
seed_db.py — Seed the Cognify PostgreSQL database with demo data.

Run from the backend/ directory:
    python seed_db.py
"""

import os
import sys
import json
import joblib
import datetime
from math import exp

import numpy as np
import psycopg2
import psycopg2.extras
from dotenv import load_dotenv

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, BASE_DIR)

# ---------------------------------------------------------------------------
# Reproducibility
# ---------------------------------------------------------------------------
np.random.seed(42)

# ---------------------------------------------------------------------------
# Database connection
# ---------------------------------------------------------------------------
load_dotenv(os.path.join(BASE_DIR, ".env"))
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/cognify_db")

# ---------------------------------------------------------------------------
# Load ML artefacts
# ---------------------------------------------------------------------------
print("Loading ML artefacts …")

model    = joblib.load(os.path.join(BASE_DIR, "model", "cognify_model.pkl"))
scaler   = joblib.load(os.path.join(BASE_DIR, "model", "scaler.pkl"))
explainer = joblib.load(os.path.join(BASE_DIR, "model", "shap_explainer.pkl"))

with open(os.path.join(BASE_DIR, "model", "training_report.json")) as f:
    training_report = json.load(f)

FEATURE_STATS = training_report["feature_stats"]
FEATURE_NAMES = [
    "daily_mean_activity", "daily_std_activity", "pct_zeros",
    "night_mean_activity", "day_mean_activity", "activity_entropy",
    "burst_rate", "mean_inactive_bout_length", "circadian_quotient",
]

# ---------------------------------------------------------------------------
# Import bridge
# ---------------------------------------------------------------------------
from bridge import smartphone_to_actigraphy_proxy  # noqa: E402

# ---------------------------------------------------------------------------
# Helper — connect
# ---------------------------------------------------------------------------

def get_conn():
    return psycopg2.connect(DATABASE_URL)

# ---------------------------------------------------------------------------
# Step 1: Drop & recreate tables
# ---------------------------------------------------------------------------

def recreate_tables(cur):
    print("Dropping existing tables (if any) …")
    cur.execute("""
        DROP TABLE IF EXISTS alerts CASCADE;
        DROP TABLE IF EXISTS interventions CASCADE;
        DROP TABLE IF EXISTS anomaly_logs CASCADE;
        DROP TABLE IF EXISTS baselines CASCADE;
        DROP TABLE IF EXISTS behavioral_data CASCADE;
        DROP TABLE IF EXISTS users CASCADE;
    """)

    schema_path = os.path.join(BASE_DIR, "schema.sql")
    with open(schema_path) as f:
        schema_sql = f.read()

    print("Creating tables from schema.sql …")
    cur.execute(schema_sql)

# ---------------------------------------------------------------------------
# Step 2: Insert users
# ---------------------------------------------------------------------------

PATIENTS = [
    # (email, name, age, gender, severity)
    ("patient_000@cognify.demo", "Alex Santosa",  24, "Male",   "moderate"),
    ("patient_001@cognify.demo", "Budi Pratama",  31, "Male",   "severe"),
    ("patient_002@cognify.demo", "Citra Dewi",    28, "Female", "mild"),
    ("patient_003@cognify.demo", "Dian Kusuma",   22, "Female", "moderate"),
    ("patient_004@cognify.demo", "Eko Saputra",   35, "Male",   "severe"),
]

PSYCHOLOGIST = ("psych_000@cognify.demo", "Dr. Kartika Sari", 42, "Female")


def insert_users(cur):
    print("Inserting users …")

    # Insert 5 patients first (ids 1-5 via SERIAL)
    patient_ids = []
    for email, name, age, gender, severity in PATIENTS:
        cur.execute(
            """
            INSERT INTO users (email, name, role, age, gender, severity)
            VALUES (%s, %s, 'patient', %s, %s, %s)
            RETURNING id
            """,
            (email, name, age, gender, severity),
        )
        pid = cur.fetchone()[0]
        patient_ids.append(pid)
        print(f"  Inserted patient id={pid}: {name}")

    # Insert psychologist (id=6)
    cur.execute(
        """
        INSERT INTO users (email, name, role, age, gender)
        VALUES (%s, %s, 'psychologist', %s, %s)
        RETURNING id
        """,
        PSYCHOLOGIST,
    )
    psych_id = cur.fetchone()[0]
    print(f"  Inserted psychologist id={psych_id}: {PSYCHOLOGIST[1]}")

    # Update patients to set doctor_id = psychologist id
    cur.execute(
        "UPDATE users SET doctor_id = %s WHERE role = 'patient'",
        (psych_id,),
    )
    print(f"  Set doctor_id={psych_id} for all patients")

    return patient_ids, psych_id

# ---------------------------------------------------------------------------
# Step 3: Generate behavioral_data (30 days per patient)
# ---------------------------------------------------------------------------

START_DATE = datetime.date(2024, 1, 1)
TOTAL_DAYS  = 30
BASELINE_DAYS = 21  # days 1-21 = baseline, 22-30 = deterioration

# Sigmoid deterioration parameters
K          = 1.69
INFLECTION = 26  # day 26 is the inflection point

# Signal specs — values taken directly from notebook cell 2 DEFAULT_PARAMS / gen_* functions
# (baseline_mean, deterioration_delta, noise_std)
# noise_std = baseline_std * noise_fraction as in notebook gen_* functions
SIGNAL_SPECS = {
    # sleep: baseline 6.6525h→399.15min, delta -1.4087h→-84.52min, std 1.1797h*0.4*60≈28.3
    "sleep_duration_min":       (399.15, -84.52,  28.3),
    # screen: std capped at 80, noise_fraction 0.35
    "screen_time_min":          (332.49, +99.75,  28.0),
    # switches: std 2.5*0.35
    "app_switches_per_hour":    (  6.0,   +3.5,   0.875),
    # session: std 28.9574*0.30
    "avg_session_duration_sec": (120.66, -66.36,   8.69),
    # variance: std 0.0984*0.35
    "screen_time_variance":     (0.2933, +0.132,  0.0344),
    # sleep onset: std capped at 1.0 per notebook resolve_params()
    "sleep_onset_hour":         (23.962,  +1.641,  1.0),
    # wake: std capped at 1.0
    "wake_hour":                ( 6.616,  +1.213,  1.0),
    # notifications: std 20*0.4
    "notifications_per_day":    ( 45.0,   +15.0,   8.0),
    # notif_response and fragmentation use special generators (see below)
}


def deterioration_factor(day: int) -> float:
    return 1.0 / (1.0 + exp(-K * (day - INFLECTION)))


def _gen_fragmentation(session_sec: float, switches: float) -> float:
    """Notebook gen_fragmentation: s*0.6 + w*0.4 + noise, clipped [0,1]."""
    s = 1.0 - np.clip(session_sec / 400.0, 0, 1)
    w = np.clip(switches / 15.0, 0, 1)
    return round(float(np.clip(s * 0.6 + w * 0.4 + np.random.normal(0, 0.03), 0.0, 1.0)), 3)


def _gen_notif_response(f: float) -> float:
    """Notebook gen_notif_response: lognormal(mean=4.2, sigma scaled by deterioration)."""
    sigma = 1.8 * (1 + f * (1.4 - 1))
    return round(float(np.clip(np.random.lognormal(4.2, sigma), 5, 7200)), 1)


def generate_behavioral_data(cur, patient_ids: list):
    print("Generating behavioral_data (30 days × 5 patients) …")

    all_rows: dict[tuple, dict] = {}

    for user_id in patient_ids:
        print(f"  Patient id={user_id} …", end=" ", flush=True)

        # Per-patient offsets matching notebook PatientProfile
        sleep_offset    = np.random.normal(0, 0.4)   # hours — same as notebook
        activity_offset = np.random.normal(1.0, 0.15)  # multiplier for screen/session
        switch_offset   = np.random.normal(0, 0.8)   # additive switches/hr

        for day in range(1, TOTAL_DAYS + 1):
            date   = START_DATE + datetime.timedelta(days=day - 1)
            period = "baseline" if day <= BASELINE_DAYS else "deterioration"
            f      = deterioration_factor(day)

            p = SIGNAL_SPECS

            # sleep (hours→min, clip [180, 630]) — notebook gen_sleep_duration
            b_sleep = p["sleep_duration_min"][0] + sleep_offset * 60
            d_sleep = b_sleep + p["sleep_duration_min"][1]
            sleep   = float(np.clip(b_sleep + f * (d_sleep - b_sleep) + np.random.normal(0, p["sleep_duration_min"][2]), 180, 630))

            # sleep onset (mod 24) — notebook gen_sleep_onset
            b_onset = p["sleep_onset_hour"][0] + sleep_offset * 0.3
            d_onset = b_onset + p["sleep_onset_hour"][1]
            onset   = (b_onset + f * (d_onset - b_onset) + np.random.normal(0, p["sleep_onset_hour"][2])) % 24

            # wake hour (clip [5, 11]) — notebook gen_wake_hour
            b_wake = p["wake_hour"][0]
            d_wake = b_wake + p["wake_hour"][1]
            wake   = float(np.clip(b_wake + f * (d_wake - b_wake) + np.random.normal(0, p["wake_hour"][2]), 5.0, 11.0))

            # screen time (clip [60, 720]) — notebook gen_screen_time
            b_sc = p["screen_time_min"][0] * activity_offset
            d_sc = b_sc + p["screen_time_min"][1]
            sc   = float(np.clip(b_sc + f * (d_sc - b_sc) + np.random.normal(0, p["screen_time_min"][2]), 60, 720))

            # screen variance (clip [0.02, 0.80]) — notebook gen_screen_variance
            b_var = p["screen_time_variance"][0]
            d_var = b_var + p["screen_time_variance"][1]
            var   = float(np.clip(b_var + f * (d_var - b_var) + np.random.normal(0, p["screen_time_variance"][2]), 0.02, 0.80))

            # app switches (clip [0.1, 25]) — notebook gen_app_switches
            b_sw = max(0.5, p["app_switches_per_hour"][0] + switch_offset)
            d_sw = b_sw + p["app_switches_per_hour"][1]
            sw   = float(np.clip(b_sw + f * (d_sw - b_sw) + np.random.normal(0, p["app_switches_per_hour"][2]), 0.1, 25.0))

            # session duration (clip [30, 600]) — notebook gen_session_duration
            b_sess = p["avg_session_duration_sec"][0] * activity_offset
            d_sess = b_sess + p["avg_session_duration_sec"][1]
            sess   = float(np.clip(b_sess + f * (d_sess - b_sess) + np.random.normal(0, p["avg_session_duration_sec"][2]), 30, 600))

            # fragmentation — derived formula (notebook gen_fragmentation)
            frag = _gen_fragmentation(sess, sw)

            # notif response — lognormal (notebook gen_notif_response)
            nrt = _gen_notif_response(f)

            # notifications per day (clip [5, 200])
            b_nc = p["notifications_per_day"][0]
            d_nc = b_nc + p["notifications_per_day"][1]
            nc   = int(np.clip(round(b_nc + f * (d_nc - b_nc) + np.random.normal(0, p["notifications_per_day"][2])), 5, 200))

            row = {
                "day":                       day,
                "date":                      date,
                "period":                    period,
                "deterioration_factor":      round(f, 4),
                "sleep_duration_min":        round(sleep, 1),
                "sleep_onset_hour":          round(onset, 2),
                "wake_hour":                 round(wake, 2),
                "screen_time_min":           round(sc, 1),
                "screen_time_variance":      round(var, 3),
                "app_switches_per_hour":     round(sw, 2),
                "avg_session_duration_sec":  round(sess, 1),
                "fragmentation_score":       frag,
                "notif_response_time_sec":   nrt,
                "notifications_per_day":     nc,
            }

            cur.execute(
                """
                INSERT INTO behavioral_data
                  (user_id, date, day, period,
                   sleep_duration_min, sleep_onset_hour, wake_hour,
                   screen_time_min, screen_time_variance,
                   app_switches_per_hour, avg_session_duration_sec,
                   fragmentation_score, notif_response_time_sec,
                   notifications_per_day, deterioration_factor)
                VALUES
                  (%s, %s, %s, %s,
                   %s, %s, %s,
                   %s, %s,
                   %s, %s,
                   %s, %s,
                   %s, %s)
                """,
                (
                    user_id, date, day, period,
                    row["sleep_duration_min"], row["sleep_onset_hour"], row["wake_hour"],
                    row["screen_time_min"], row["screen_time_variance"],
                    row["app_switches_per_hour"], row["avg_session_duration_sec"],
                    row["fragmentation_score"], row["notif_response_time_sec"],
                    row["notifications_per_day"], f,
                ),
            )
            all_rows[(user_id, day)] = row

        print("done")

    return all_rows

# ---------------------------------------------------------------------------
# Step 4: Compute baselines from days 1-21
# ---------------------------------------------------------------------------

BASELINE_SIGNALS = [
    "sleep_duration_min",
    "screen_time_min",
    "screen_time_variance",
    "app_switches_per_hour",
    "avg_session_duration_sec",
]


def compute_baselines(cur, patient_ids: list, all_rows: dict) -> dict:
    print("Computing baselines (days 1-21) …")
    baselines: dict[int, dict] = {}

    for user_id in patient_ids:
        metrics = {}
        for sig in BASELINE_SIGNALS:
            values = [all_rows[(user_id, d)][sig] for d in range(1, BASELINE_DAYS + 1)]
            arr = np.array(values, dtype=float)
            metrics[sig] = {"mean": float(arr.mean()), "std": float(arr.std(ddof=1))}

        cur.execute(
            "INSERT INTO baselines (user_id, metrics) VALUES (%s, %s)",
            (user_id, json.dumps(metrics)),
        )
        baselines[user_id] = metrics
        print(f"  Baseline for user_id={user_id}: sleep_mean={metrics['sleep_duration_min']['mean']:.1f}")

    return baselines

# ---------------------------------------------------------------------------
# Step 5: Run ML pipeline on days 22-30 → insert anomaly_logs
# ---------------------------------------------------------------------------

SIGNAL_WEIGHTS = {
    "app_switches_per_hour":    1.0,
    "avg_session_duration_sec": 0.9,
    "sleep_duration_min":       0.8,
    "screen_time_variance":     0.7,
    "screen_time_min":          0.6,
}


def compute_wcs(z_scores: dict) -> tuple:
    """Returns (wcs, flagged_signals, anomalous_signals)."""
    total_weight = sum(SIGNAL_WEIGHTS.values())
    weighted_sum = 0.0
    flagged = 0
    anomalous = []

    for sig, weight in SIGNAL_WEIGHTS.items():
        z = abs(z_scores.get(sig, 0.0))
        flag = 1.0 if z > 2 else 0.3
        weighted_sum += z * weight * flag
        if z > 2:
            flagged += 1
            anomalous.append(sig)

    wcs = weighted_sum / total_weight
    return wcs, flagged, anomalous


def classify_risk(wcs: float, flagged: int, wcs_slope_3d: float = 0.0) -> tuple:
    """Returns (risk_level, alert_severity). Matches notebook compute_labels() exactly."""
    # Risk — notebook logic (days 22-30 only, stable never forced here)
    if wcs > 2.5 and flagged >= 2:
        risk = "attention_needed"
    elif wcs > 1.5 and flagged >= 2:
        risk = "mild_drift"
    elif wcs_slope_3d > 0.3 and flagged >= 2:
        risk = "mild_drift"
    else:
        risk = "stable"

    # Alert severity — notebook: SEVERE if wcs>3.5, MODERATE if wcs>2.5, MILD otherwise
    if risk == "stable":
        severity = None
    elif wcs > 3.5:
        severity = "SEVERE"
    elif wcs > 2.5:
        severity = "MODERATE"
    else:
        severity = "MILD"

    return risk, severity


def run_ml_pipeline(cur, patient_ids: list, all_rows: dict, baselines: dict) -> dict:
    """Insert anomaly_logs for days 22-30; return latest log per user."""
    print("Running ML pipeline (days 22-30) …")

    latest_logs: dict[int, dict] = {}  # user_id → last anomaly_log dict

    for user_id in patient_ids:
        print(f"  Patient id={user_id} …")
        baseline = baselines[user_id]
        wcs_history: list[float] = []

        for day in range(22, TOTAL_DAYS + 1):
            row = all_rows[(user_id, day)]
            date = row["date"]

            # 1. Build proxy vector
            proxy = smartphone_to_actigraphy_proxy(
                screen_time_min=row["screen_time_min"],
                screen_time_variance=row["screen_time_variance"],
                sleep_duration_min=row["sleep_duration_min"],
                app_switches_per_hour=row["app_switches_per_hour"],
                avg_session_duration_sec=row["avg_session_duration_sec"],
                fs=FEATURE_STATS,
            )

            # 2. Scale
            x_scaled = scaler.transform([proxy])

            # 3. IF score
            if_score = float(-model.score_samples(x_scaled)[0])
            is_anomaly = bool(model.predict(x_scaled)[0] == -1)

            # 4. SHAP
            shap_vals = explainer.shap_values(x_scaled)[0]
            shap_contributions = []
            for feat, sv in zip(FEATURE_NAMES, shap_vals):
                direction = "toward_anomaly" if sv < 0 else "toward_normal"
                strength = abs(float(sv))
                shap_contributions.append({
                    "feature":    feat,
                    "shap_value": float(sv),
                    "direction":  direction,
                    "strength":   strength,
                })
            shap_contributions.sort(key=lambda x: x["strength"], reverse=True)

            # 5. Z-scores
            z_scores = {}
            for sig in BASELINE_SIGNALS:
                mean = baseline[sig]["mean"]
                std  = max(baseline[sig]["std"], 0.001)
                z_scores[sig] = float((row[sig] - mean) / std)

            # 6. WCS
            wcs, flagged, anomalous = compute_wcs(z_scores)

            # 7. WCS slope over last 3 days (computed BEFORE risk so slope can inform risk)
            wcs_history.append(wcs)
            if len(wcs_history) < 2:
                wcs_slope_3d = 0.0
            else:
                last_n = wcs_history[-3:]
                xs = list(range(len(last_n)))
                wcs_slope_3d = float(np.polyfit(xs, last_n, 1)[0])

            # 8. Risk / severity (includes slope condition, matching notebook)
            risk_level, alert_severity = classify_risk(wcs, flagged, wcs_slope_3d)

            cur.execute(
                """
                INSERT INTO anomaly_logs
                  (user_id, date, z_scores, wcs, flagged_signals, anomalous_signals,
                   wcs_slope_3d, risk_level, alert_severity, if_anomaly_score, shap_contributions)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    user_id, date,
                    json.dumps(z_scores),
                    wcs, flagged, anomalous,
                    wcs_slope_3d, risk_level, alert_severity,
                    if_score,
                    json.dumps(shap_contributions),
                ),
            )

            log_entry = {
                "user_id":           user_id,
                "date":              date,
                "z_scores":          z_scores,
                "wcs":               wcs,
                "flagged_signals":   flagged,
                "anomalous_signals": anomalous,
                "wcs_slope_3d":      wcs_slope_3d,
                "risk_level":        risk_level,
                "alert_severity":    alert_severity,
                "if_anomaly_score":  if_score,
                "shap_contributions": shap_contributions,
                "behavioral_row":    row,
            }
            latest_logs[user_id] = log_entry  # overwrite → keeps last day (day 30)

            print(
                f"    day={day} wcs={wcs:.3f} risk={risk_level} "
                f"flagged={flagged} if_score={if_score:.4f}"
            )

    return latest_logs

# ---------------------------------------------------------------------------
# Step 6: Interventions (2 per patient)
# ---------------------------------------------------------------------------

CBT_TEMPLATES = {
    "app_switches_per_hour": {
        "type":     "focus_reset",
        "title":    "2-Minute Focus Reset",
        "content":  "Your app switching is elevated above baseline. Try this quick reset.",
        "steps":    ["Close all open apps", "3 deep breaths (4-4-6)", "Pick ONE task", "Set 25min timer"],
        "priority": "urgent",
    },
    "sleep_duration_min": {
        "type":     "sleep_hygiene",
        "title":    "Sleep Wind-Down",
        "content":  "Your sleep duration is below baseline. Establish a wind-down routine.",
        "steps":    ["No screens 30min before bed", "Dim lights", "Read or meditate", "Set consistent wake time"],
        "priority": "high",
    },
    "avg_session_duration_sec": {
        "type":     "sustained_focus",
        "title":    "Sustained Focus Session",
        "content":  "Your session duration is fragmented. Build sustained attention.",
        "steps":    ["Choose one app/task", "Set 20min focused timer", "No switching until done", "Take 5min break"],
        "priority": "medium",
    },
    "screen_time_min": {
        "type":     "screen_break",
        "title":    "Screen Break",
        "content":  "Your screen time is above baseline. Schedule regular breaks.",
        "steps":    ["Every 45min, take a 10min break", "Stand up and stretch", "Look at something far away", "Drink water"],
        "priority": "medium",
    },
    "screen_time_variance": {
        "type":     "routine_anchor",
        "title":    "Routine Anchor Point",
        "content":  "Your screen time pattern is highly variable. Anchor your routine.",
        "steps":    ["Set 3 fixed daily times for checking phone", "Use app timers", "Batch notifications", "Morning routine without phone"],
        "priority": "low",
    },
}

# Fallback order when mapping a signal not directly in templates
SIGNAL_PRIORITY_ORDER = [
    "app_switches_per_hour",
    "sleep_duration_min",
    "avg_session_duration_sec",
    "screen_time_min",
    "screen_time_variance",
]


def _template_for_signal(sig: str) -> dict:
    if sig in CBT_TEMPLATES:
        return CBT_TEMPLATES[sig]
    # fallback to first available template
    return CBT_TEMPLATES[SIGNAL_PRIORITY_ORDER[0]]


def insert_interventions(cur, patient_ids: list, latest_logs: dict):
    print("Inserting interventions (2 per patient) …")

    base_triggered_at = datetime.datetime(2024, 1, 22, 9, 0, 0)
    completed_at_dt   = datetime.datetime(2024, 1, 25, 10, 30, 0)

    for user_id in patient_ids:
        log = latest_logs[user_id]
        z_scores = log["z_scores"]

        # Sort signals by absolute z-score descending
        sorted_sigs = sorted(z_scores.keys(), key=lambda s: abs(z_scores[s]), reverse=True)

        # Highest-z signal → pending
        sig1 = sorted_sigs[0] if sorted_sigs else SIGNAL_PRIORITY_ORDER[0]
        t1 = _template_for_signal(sig1)

        cur.execute(
            """
            INSERT INTO interventions
              (user_id, triggered_at, type, title, content, steps, priority,
               triggered_by, trigger_reason, completed, dismissed)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, FALSE, FALSE)
            """,
            (
                user_id, base_triggered_at,
                t1["type"], t1["title"], t1["content"],
                json.dumps(t1["steps"]), t1["priority"],
                [sig1], f"Z-score of {sig1} = {z_scores.get(sig1, 0.0):.2f}",
            ),
        )

        # Second-highest-z signal → completed
        sig2 = sorted_sigs[1] if len(sorted_sigs) > 1 else SIGNAL_PRIORITY_ORDER[1]
        t2 = _template_for_signal(sig2)

        cur.execute(
            """
            INSERT INTO interventions
              (user_id, triggered_at, type, title, content, steps, priority,
               triggered_by, trigger_reason, completed, completed_at, dismissed)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, TRUE, %s, FALSE)
            """,
            (
                user_id, base_triggered_at,
                t2["type"], t2["title"], t2["content"],
                json.dumps(t2["steps"]), t2["priority"],
                [sig2], f"Z-score of {sig2} = {z_scores.get(sig2, 0.0):.2f}",
                completed_at_dt,
            ),
        )

        print(f"  Patient id={user_id}: pending={t1['type']}, completed={t2['type']}")

# ---------------------------------------------------------------------------
# Step 7: Alerts for attention_needed patients
# ---------------------------------------------------------------------------

def insert_alerts(cur, patient_ids: list, latest_logs: dict, psych_id: int):
    print("Inserting alerts for attention_needed patients …")

    # Fetch patient names
    cur.execute("SELECT id, name FROM users WHERE role='patient'")
    name_map = {row[0]: row[1] for row in cur.fetchall()}

    alert_count = 0
    for user_id in patient_ids:
        log = latest_logs[user_id]
        if log["risk_level"] != "attention_needed":
            continue

        patient_name    = name_map.get(user_id, f"Patient {user_id}")
        flagged         = log["flagged_signals"]
        wcs             = log["wcs"]
        alert_severity  = log["alert_severity"]
        anomalous       = log["anomalous_signals"]
        top_signal      = anomalous[0] if anomalous else "unknown"

        summary = (
            f"{patient_name} has {flagged} anomalous signals. "
            f"WCS={wcs:.2f}. Immediate review recommended."
        )

        anomaly_data = {
            "wcs":           wcs,
            "flagged_signals": flagged,
            "top_signal":    top_signal,
        }

        # Build behavioral snapshot from the behavioral_data row
        brow = log["behavioral_row"]
        behavioral_snapshot = {
            "date":                   str(brow["date"]),
            "day":                    brow["day"],
            "period":                 brow["period"],
            "sleep_duration_min":     brow["sleep_duration_min"],
            "sleep_onset_hour":       brow["sleep_onset_hour"],
            "wake_hour":              brow["wake_hour"],
            "screen_time_min":        brow["screen_time_min"],
            "screen_time_variance":   brow["screen_time_variance"],
            "app_switches_per_hour":  brow["app_switches_per_hour"],
            "avg_session_duration_sec": brow["avg_session_duration_sec"],
            "fragmentation_score":    brow["fragmentation_score"],
            "notif_response_time_sec": brow["notif_response_time_sec"],
            "notifications_per_day":  brow["notifications_per_day"],
            "deterioration_factor":   brow["deterioration_factor"],
        }

        cur.execute(
            """
            INSERT INTO alerts
              (patient_id, psychologist_id, severity, risk_level, summary,
               anomaly_data, behavioral_snapshot)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            """,
            (
                user_id, psych_id, alert_severity, log["risk_level"],
                summary,
                json.dumps(anomaly_data),
                json.dumps(behavioral_snapshot),
            ),
        )
        alert_count += 1
        print(f"  Alert created for user_id={user_id} ({patient_name}): severity={alert_severity}")

    if alert_count == 0:
        print("  No attention_needed patients — no alerts created.")

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    print("=" * 60)
    print("Cognify DB Seeder")
    print("=" * 60)

    conn = get_conn()
    conn.autocommit = False
    cur  = conn.cursor()

    try:
        # Step 1
        recreate_tables(cur)
        conn.commit()

        # Step 2
        patient_ids, psych_id = insert_users(cur)
        conn.commit()

        # Step 3
        all_rows = generate_behavioral_data(cur, patient_ids)
        conn.commit()

        # Step 4
        baselines = compute_baselines(cur, patient_ids, all_rows)
        conn.commit()

        # Step 5
        latest_logs = run_ml_pipeline(cur, patient_ids, all_rows, baselines)
        conn.commit()

        # Step 6
        insert_interventions(cur, patient_ids, latest_logs)
        conn.commit()

        # Step 7
        insert_alerts(cur, patient_ids, latest_logs, psych_id)
        conn.commit()

        print("=" * 60)
        print("Seeding complete!")
        print(f"  Users:             {len(patient_ids) + 1}  (5 patients + 1 psychologist)")
        print(f"  Behavioral rows:   {len(patient_ids) * TOTAL_DAYS}")
        print(f"  Baselines:         {len(patient_ids)}")
        print(f"  Anomaly logs:      {len(patient_ids) * (TOTAL_DAYS - BASELINE_DAYS)}")
        print(f"  Interventions:     {len(patient_ids) * 2}")
        print("=" * 60)

    except Exception as exc:
        conn.rollback()
        print(f"\nERROR: {exc}")
        raise
    finally:
        cur.close()
        conn.close()


if __name__ == "__main__":
    main()
