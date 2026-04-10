import json
import os
from datetime import datetime
from pathlib import Path
from typing import Optional

import joblib
import numpy as np
import psycopg2
import psycopg2.extras
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from bridge import FEATURE_NAMES, smartphone_to_actigraphy_proxy

load_dotenv()

# ---------------------------------------------------------------------------
# App setup
# ---------------------------------------------------------------------------
app = FastAPI(title="Cognify Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Model loading
# ---------------------------------------------------------------------------
MODEL_DIR = Path(__file__).parent / "model"
model = joblib.load(MODEL_DIR / "cognify_model.pkl")
scaler = joblib.load(MODEL_DIR / "scaler.pkl")
explainer = joblib.load(MODEL_DIR / "shap_explainer.pkl")
with open(MODEL_DIR / "training_report.json") as f:
    training_report = json.load(f)
feature_stats = training_report["feature_stats"]

# ---------------------------------------------------------------------------
# CBT templates
# ---------------------------------------------------------------------------
CBT_TEMPLATES = {
    "app_switches_per_hour": {
        "type": "focus_reset",
        "title": "2-Minute Focus Reset",
        "content": "Your app switching is elevated above baseline. Try this quick reset.",
        "steps": ["Close all open apps", "3 deep breaths (4-4-6)", "Pick ONE task", "Set 25min timer"],
        "priority": "urgent",
    },
    "sleep_duration_min": {
        "type": "sleep_hygiene",
        "title": "Sleep Wind-Down",
        "content": "Your sleep duration is below baseline. Establish a wind-down routine.",
        "steps": [
            "No screens 30min before bed",
            "Dim lights",
            "Read or meditate",
            "Set consistent wake time",
        ],
        "priority": "high",
    },
    "avg_session_duration_sec": {
        "type": "sustained_focus",
        "title": "Sustained Focus Session",
        "content": "Your session duration is fragmented. Build sustained attention.",
        "steps": [
            "Choose one app/task",
            "Set 20min focused timer",
            "No switching until done",
            "Take 5min break",
        ],
        "priority": "medium",
    },
    "screen_time_min": {
        "type": "screen_break",
        "title": "Screen Break",
        "content": "Your screen time is above baseline. Schedule regular breaks.",
        "steps": [
            "Every 45min, take a 10min break",
            "Stand up and stretch",
            "Look at something far away",
            "Drink water",
        ],
        "priority": "medium",
    },
    "screen_time_variance": {
        "type": "routine_anchor",
        "title": "Routine Anchor Point",
        "content": "Your screen time pattern is highly variable. Anchor your routine.",
        "steps": [
            "Set 3 fixed daily times for checking phone",
            "Use app timers",
            "Batch notifications",
            "Morning routine without phone",
        ],
        "priority": "low",
    },
}

# ---------------------------------------------------------------------------
# DB helper
# ---------------------------------------------------------------------------

def get_db():
    conn = psycopg2.connect(os.getenv("DATABASE_URL"))
    conn.autocommit = False
    return conn


def serialize_row(row: dict) -> dict:
    """Convert date/datetime objects and numpy types to JSON-safe Python types."""
    result = {}
    for k, v in row.items():
        if isinstance(v, datetime):
            result[k] = v.isoformat()
        elif hasattr(v, "date") and callable(v.date) and not isinstance(v, datetime):
            # date object
            result[k] = v.isoformat()
        elif isinstance(v, (np.integer,)):
            result[k] = int(v)
        elif isinstance(v, (np.floating,)):
            result[k] = float(v)
        elif isinstance(v, (np.bool_,)):
            result[k] = bool(v)
        else:
            result[k] = v
    return result


# ---------------------------------------------------------------------------
# Pydantic models
# ---------------------------------------------------------------------------

class LoginRequest(BaseModel):
    email: str


class BehavioralLogRequest(BaseModel):
    user_id: int
    date: str
    sleep_duration_min: Optional[float] = None
    sleep_onset_hour: Optional[float] = None
    wake_hour: Optional[float] = None
    screen_time_min: Optional[float] = None
    screen_time_variance: Optional[float] = None
    app_switches_per_hour: Optional[float] = None
    avg_session_duration_sec: Optional[float] = None
    fragmentation_score: Optional[float] = None
    notif_response_time_sec: Optional[float] = None
    notifications_per_day: Optional[float] = None


class AcknowledgeRequest(BaseModel):
    notes: Optional[str] = None


class AnalyzeRequest(BaseModel):
    user_id: int
    date: str
    sleep_duration_min: float
    screen_time_min: float
    screen_time_variance: float
    app_switches_per_hour: float
    avg_session_duration_sec: float


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/login")
def login(body: LoginRequest):
    conn = get_db()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute("SELECT id, name, role FROM users WHERE email = %s", (body.email,))
            row = cur.fetchone()
        if row is None:
            raise HTTPException(status_code=404, detail="User not found")
        return {"user_id": row["id"], "name": row["name"], "role": row["role"]}
    finally:
        conn.close()


@app.get("/dashboard/{user_id}")
def dashboard(user_id: int):
    conn = get_db()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            # User info
            cur.execute("SELECT id, name, role FROM users WHERE id = %s", (user_id,))
            user = cur.fetchone()
            if user is None:
                raise HTTPException(status_code=404, detail="User not found")

            # Latest behavioral data
            cur.execute(
                "SELECT * FROM behavioral_data WHERE user_id = %s ORDER BY date DESC LIMIT 1",
                (user_id,),
            )
            latest_data_row = cur.fetchone()
            latest_data = serialize_row(dict(latest_data_row)) if latest_data_row else None

            # Baseline metrics
            cur.execute("SELECT metrics FROM baselines WHERE user_id = %s", (user_id,))
            baseline_row = cur.fetchone()
            baseline = baseline_row["metrics"] if baseline_row else None

            # Latest anomaly
            cur.execute(
                "SELECT * FROM anomaly_logs WHERE user_id = %s ORDER BY date DESC LIMIT 1",
                (user_id,),
            )
            anomaly_row = cur.fetchone()
            if anomaly_row and anomaly_row.get("risk_level") != "stable":
                latest_anomaly = serialize_row(dict(anomaly_row))
                # shap_contributions is already stored as JSONB — psycopg2 returns it as a Python object
                if "shap_contributions" in latest_anomaly and isinstance(
                    latest_anomaly["shap_contributions"], str
                ):
                    latest_anomaly["shap_contributions"] = json.loads(
                        latest_anomaly["shap_contributions"]
                    )
            else:
                latest_anomaly = None

            # Active interventions count
            cur.execute(
                "SELECT COUNT(*) AS cnt FROM interventions WHERE user_id = %s AND completed = false AND dismissed = false",
                (user_id,),
            )
            active_interventions = cur.fetchone()["cnt"]

            # Trends 7d (last 7 rows, ascending)
            cur.execute(
                "SELECT * FROM behavioral_data WHERE user_id = %s ORDER BY date DESC LIMIT 7",
                (user_id,),
            )
            trends_rows = cur.fetchall()
            trends_7d = [serialize_row(dict(r)) for r in reversed(trends_rows)]

        return {
            "user": serialize_row(dict(user)),
            "latest_data": latest_data,
            "baseline": baseline,
            "latest_anomaly": latest_anomaly,
            "active_interventions": int(active_interventions),
            "trends_7d": trends_7d,
        }
    finally:
        conn.close()


@app.get("/behavioral-trends/{user_id}")
def behavioral_trends(user_id: int, days: int = 7):
    if days < 1:
        days = 1
    if days > 30:
        days = 30
    conn = get_db()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                "SELECT * FROM behavioral_data WHERE user_id = %s ORDER BY date DESC LIMIT %s",
                (user_id, days),
            )
            rows = cur.fetchall()
        return [serialize_row(dict(r)) for r in reversed(rows)]
    finally:
        conn.close()


@app.post("/behavioral-logs")
def behavioral_logs(body: BehavioralLogRequest):
    conn = get_db()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                """
                INSERT INTO behavioral_data (
                    user_id, date, sleep_duration_min, sleep_onset_hour, wake_hour,
                    screen_time_min, screen_time_variance, app_switches_per_hour,
                    avg_session_duration_sec, fragmentation_score,
                    notif_response_time_sec, notifications_per_day
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (user_id, date) DO UPDATE SET
                    sleep_duration_min = EXCLUDED.sleep_duration_min,
                    sleep_onset_hour = EXCLUDED.sleep_onset_hour,
                    wake_hour = EXCLUDED.wake_hour,
                    screen_time_min = EXCLUDED.screen_time_min,
                    screen_time_variance = EXCLUDED.screen_time_variance,
                    app_switches_per_hour = EXCLUDED.app_switches_per_hour,
                    avg_session_duration_sec = EXCLUDED.avg_session_duration_sec,
                    fragmentation_score = EXCLUDED.fragmentation_score,
                    notif_response_time_sec = EXCLUDED.notif_response_time_sec,
                    notifications_per_day = EXCLUDED.notifications_per_day
                RETURNING id, user_id, date
                """,
                (
                    body.user_id,
                    body.date,
                    body.sleep_duration_min,
                    body.sleep_onset_hour,
                    body.wake_hour,
                    body.screen_time_min,
                    body.screen_time_variance,
                    body.app_switches_per_hour,
                    body.avg_session_duration_sec,
                    body.fragmentation_score,
                    body.notif_response_time_sec,
                    body.notifications_per_day,
                ),
            )
            row = cur.fetchone()
            conn.commit()
        return {"id": row["id"], "user_id": row["user_id"], "date": row["date"].isoformat()}
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


@app.get("/anomalies/{user_id}")
def get_anomalies(user_id: int):
    conn = get_db()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                """
                SELECT id, date, risk_level, alert_severity, wcs, flagged_signals,
                       anomalous_signals, z_scores, if_anomaly_score, shap_contributions,
                       created_at
                FROM anomaly_logs
                WHERE user_id = %s
                ORDER BY date DESC
                LIMIT 30
                """,
                (user_id,),
            )
            rows = cur.fetchall()
        return [serialize_row(dict(r)) for r in rows]
    finally:
        conn.close()


@app.get("/interventions/{user_id}")
def get_interventions(user_id: int):
    conn = get_db()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                """
                SELECT id, type, title, content, steps, priority, triggered_by,
                       trigger_reason, completed, completed_at, dismissed, triggered_at
                FROM interventions
                WHERE user_id = %s
                ORDER BY triggered_at DESC
                LIMIT 50
                """,
                (user_id,),
            )
            rows = cur.fetchall()
        return [serialize_row(dict(r)) for r in rows]
    finally:
        conn.close()


@app.post("/interventions/{id}/complete")
def complete_intervention(id: int):
    conn = get_db()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                """
                UPDATE interventions
                SET completed = true, completed_at = NOW()
                WHERE id = %s
                RETURNING id, completed, completed_at
                """,
                (id,),
            )
            row = cur.fetchone()
            if row is None:
                raise HTTPException(status_code=404, detail="Intervention not found")
            conn.commit()
        return {
            "id": row["id"],
            "completed": row["completed"],
            "completed_at": row["completed_at"].isoformat() if row["completed_at"] else None,
        }
    except HTTPException:
        conn.rollback()
        raise
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


@app.post("/interventions/{id}/dismiss")
def dismiss_intervention(id: int):
    conn = get_db()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                """
                UPDATE interventions
                SET dismissed = true
                WHERE id = %s
                RETURNING id, dismissed
                """,
                (id,),
            )
            row = cur.fetchone()
            if row is None:
                raise HTTPException(status_code=404, detail="Intervention not found")
            conn.commit()
        return {"id": row["id"], "dismissed": row["dismissed"]}
    except HTTPException:
        conn.rollback()
        raise
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


@app.get("/psychologist/patients/{psych_id}")
def get_patients(psych_id: int):
    conn = get_db()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                """
                SELECT
                    u.id,
                    u.name,
                    u.age,
                    u.severity,
                    COALESCE(la.wcs, 0) AS latest_wcs,
                    COALESCE(la.risk_level, 'stable') AS latest_risk_level,
                    (
                        SELECT COUNT(*)
                        FROM anomaly_logs al2
                        WHERE al2.user_id = u.id AND al2.risk_level != 'stable'
                    ) AS active_anomalies,
                    (
                        SELECT MAX(bd.date)
                        FROM behavioral_data bd
                        WHERE bd.user_id = u.id
                    ) AS last_active
                FROM users u
                LEFT JOIN LATERAL (
                    SELECT wcs, risk_level
                    FROM anomaly_logs al
                    WHERE al.user_id = u.id
                    ORDER BY date DESC
                    LIMIT 1
                ) la ON true
                WHERE u.doctor_id = %s AND u.role = 'patient'
                ORDER BY latest_wcs DESC
                """,
                (psych_id,),
            )
            rows = cur.fetchall()

        result = []
        for r in rows:
            result.append(
                {
                    "id": r["id"],
                    "name": r["name"],
                    "age": r["age"],
                    "severity": r["severity"],
                    "latest_wcs": float(r["latest_wcs"]) if r["latest_wcs"] is not None else 0.0,
                    "latest_risk_level": r["latest_risk_level"],
                    "active_anomalies": int(r["active_anomalies"]),
                    "last_active": r["last_active"].isoformat() if r["last_active"] else None,
                }
            )
        return result
    finally:
        conn.close()


@app.get("/alerts/{psych_id}")
def get_alerts(psych_id: int):
    conn = get_db()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                """
                SELECT
                    a.id,
                    a.patient_id,
                    u.name AS patient_name,
                    a.severity,
                    a.risk_level,
                    a.summary,
                    a.anomaly_data,
                    a.acknowledged,
                    a.acknowledged_at,
                    a.notes,
                    a.created_at
                FROM alerts a
                JOIN users u ON u.id = a.patient_id
                WHERE a.psychologist_id = %s
                ORDER BY a.created_at DESC
                """,
                (psych_id,),
            )
            rows = cur.fetchall()
        return [serialize_row(dict(r)) for r in rows]
    finally:
        conn.close()


@app.post("/alerts/{id}/acknowledge")
def acknowledge_alert(id: int, body: AcknowledgeRequest):
    conn = get_db()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                """
                UPDATE alerts
                SET acknowledged = true, acknowledged_at = NOW(), notes = %s
                WHERE id = %s
                RETURNING id, acknowledged, acknowledged_at
                """,
                (body.notes, id),
            )
            row = cur.fetchone()
            if row is None:
                raise HTTPException(status_code=404, detail="Alert not found")
            conn.commit()
        return {
            "id": row["id"],
            "acknowledged": row["acknowledged"],
            "acknowledged_at": row["acknowledged_at"].isoformat() if row["acknowledged_at"] else None,
        }
    except HTTPException:
        conn.rollback()
        raise
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


@app.post("/analyze")
def analyze(body: AnalyzeRequest):
    conn = get_db()
    try:
        # ------------------------------------------------------------------
        # 1. Proxy features
        # ------------------------------------------------------------------
        proxy = smartphone_to_actigraphy_proxy(
            body.screen_time_min,
            body.screen_time_variance,
            body.sleep_duration_min,
            body.app_switches_per_hour,
            body.avg_session_duration_sec,
            feature_stats,
        )

        # ------------------------------------------------------------------
        # 2-5. Scale & predict
        # ------------------------------------------------------------------
        x_scaled = scaler.transform([proxy])
        if_score = float(-model.score_samples(x_scaled)[0])
        is_if_anomaly = bool(model.predict(x_scaled)[0] == -1)
        shap_vals = explainer.shap_values(x_scaled)[0]

        # ------------------------------------------------------------------
        # 6. SHAP contributions
        # ------------------------------------------------------------------
        shap_contributions = sorted(
            [
                {
                    "feature": name,
                    "shap_value": float(v),
                    "direction": "toward_anomaly" if v < 0 else "toward_normal",
                    "strength": abs(float(v)),
                }
                for name, v in zip(FEATURE_NAMES, shap_vals)
            ],
            key=lambda x: x["strength"],
            reverse=True,
        )

        # ------------------------------------------------------------------
        # 7. Load baseline
        # ------------------------------------------------------------------
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute("SELECT metrics FROM baselines WHERE user_id = %s", (body.user_id,))
            baseline_row = cur.fetchone()
        if baseline_row is None:
            raise HTTPException(status_code=404, detail="Baseline not found for user")
        baseline = baseline_row["metrics"]

        # ------------------------------------------------------------------
        # 8. Z-scores for 5 signals
        # ------------------------------------------------------------------
        signals = {
            "sleep_duration_min": body.sleep_duration_min,
            "screen_time_min": body.screen_time_min,
            "screen_time_variance": body.screen_time_variance,
            "app_switches_per_hour": body.app_switches_per_hour,
            "avg_session_duration_sec": body.avg_session_duration_sec,
        }

        z_scores = {}
        for signal, value in signals.items():
            mean = baseline[signal]["mean"]
            std = max(baseline[signal]["std"], 0.001)
            z_scores[signal] = (value - mean) / std

        # ------------------------------------------------------------------
        # 9-11. WCS, flagged, anomalous
        # ------------------------------------------------------------------
        signal_weights = {
            "app_switches_per_hour": 1.0,
            "avg_session_duration_sec": 0.9,
            "sleep_duration_min": 0.8,
            "screen_time_variance": 0.7,
            "screen_time_min": 0.6,
        }

        weighted_sum = 0.0
        weight_total = sum(signal_weights.values())
        for signal, weight in signal_weights.items():
            z = z_scores[signal]
            flag = 1.0 if abs(z) > 2 else 0.3
            weighted_sum += abs(z) * weight * flag

        wcs = weighted_sum / weight_total
        flagged_signals = sum(1 for z in z_scores.values() if abs(z) > 2)
        anomalous_signals = [s for s, z in z_scores.items() if abs(z) > 2]

        # ------------------------------------------------------------------
        # 12. wcs_slope_3d — fetch last 2 anomaly_logs to compute rolling slope
        # ------------------------------------------------------------------
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as _cur:
            _cur.execute(
                """
                SELECT wcs FROM anomaly_logs
                WHERE user_id = %s AND date < %s
                ORDER BY date DESC LIMIT 2
                """,
                (body.user_id, body.date),
            )
            prev_rows = _cur.fetchall()

        prev_wcs = [float(r["wcs"]) for r in reversed(prev_rows)]  # ascending order
        wcs_window = prev_wcs + [float(wcs)]  # up to 3 values
        if len(wcs_window) < 2:
            wcs_slope_3d = 0.0
        else:
            xs = list(range(len(wcs_window)))
            wcs_slope_3d = float(np.polyfit(xs, wcs_window, 1)[0])

        # ------------------------------------------------------------------
        # 13. Risk level (includes slope condition, matches notebook compute_labels)
        # ------------------------------------------------------------------
        if wcs > 2.5 and flagged_signals >= 2:
            risk_level = "attention_needed"
        elif wcs > 1.5 and flagged_signals >= 2:
            risk_level = "mild_drift"
        elif wcs_slope_3d > 0.3 and flagged_signals >= 2:
            risk_level = "mild_drift"
        else:
            risk_level = "stable"

        # Alert severity matches notebook: SEVERE if wcs>3.5, MODERATE if wcs>2.5, MILD otherwise
        if risk_level == "stable":
            alert_severity = None
        elif wcs > 3.5:
            alert_severity = "SEVERE"
        elif wcs > 2.5:
            alert_severity = "MODERATE"
        else:
            alert_severity = "MILD"

        # ------------------------------------------------------------------
        # 13. Interventions: top 2 signals by |z| that have templates
        # ------------------------------------------------------------------
        sorted_signals = sorted(
            [(s, abs(z)) for s, z in z_scores.items() if s in CBT_TEMPLATES],
            key=lambda x: x[1],
            reverse=True,
        )
        top_signals = [s for s, _ in sorted_signals[:2]]

        # ------------------------------------------------------------------
        # 14. DB writes
        # ------------------------------------------------------------------
        interventions_created = []

        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            # Fetch user info
            cur.execute("SELECT name, doctor_id FROM users WHERE id = %s", (body.user_id,))
            user_row = cur.fetchone()
            if user_row is None:
                raise HTTPException(status_code=404, detail="User not found")
            user_name = user_row["name"]
            doctor_id = user_row["doctor_id"]

            # UPSERT anomaly_logs
            cur.execute(
                """
                INSERT INTO anomaly_logs (
                    user_id, date, risk_level, alert_severity, wcs,
                    flagged_signals, anomalous_signals, z_scores,
                    wcs_slope_3d, if_anomaly_score, shap_contributions
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (user_id, date) DO UPDATE SET
                    risk_level = EXCLUDED.risk_level,
                    alert_severity = EXCLUDED.alert_severity,
                    wcs = EXCLUDED.wcs,
                    flagged_signals = EXCLUDED.flagged_signals,
                    anomalous_signals = EXCLUDED.anomalous_signals,
                    z_scores = EXCLUDED.z_scores,
                    wcs_slope_3d = EXCLUDED.wcs_slope_3d,
                    if_anomaly_score = EXCLUDED.if_anomaly_score,
                    shap_contributions = EXCLUDED.shap_contributions
                RETURNING id
                """,
                (
                    body.user_id,
                    body.date,
                    risk_level,
                    alert_severity,
                    wcs,
                    flagged_signals,
                    json.dumps(anomalous_signals),
                    json.dumps(z_scores),
                    wcs_slope_3d,
                    if_score,
                    json.dumps(shap_contributions),
                ),
            )
            anomaly_id = cur.fetchone()["id"]

            # Insert interventions if not stable
            if risk_level != "stable":
                for signal in top_signals:
                    if signal not in CBT_TEMPLATES:
                        continue
                    tmpl = CBT_TEMPLATES[signal]
                    cur.execute(
                        """
                        INSERT INTO interventions (
                            user_id, type, title, content, steps, priority,
                            triggered_by, trigger_reason
                        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                        RETURNING id, type, title
                        """,
                        (
                            body.user_id,
                            tmpl["type"],
                            tmpl["title"],
                            tmpl["content"],
                            json.dumps(tmpl["steps"]),
                            tmpl["priority"],
                            [signal],
                            f"z_score={z_scores[signal]:.2f}",
                        ),
                    )
                    row = cur.fetchone()
                    interventions_created.append(
                        {"id": row["id"], "type": row["type"], "title": row["title"]}
                    )

            # Insert alert if attention_needed
            alert_created = False
            if risk_level == "attention_needed":
                top_signal = anomalous_signals[0] if anomalous_signals else None
                summary = (
                    f"{user_name} has {flagged_signals} anomalous signals. "
                    f"WCS={wcs:.2f}. Immediate review recommended."
                )
                anomaly_data = {
                    "wcs": wcs,
                    "flagged_signals": flagged_signals,
                    "top_signal": top_signal,
                }
                behavioral_snapshot = {
                    "user_id": body.user_id,
                    "date": body.date,
                    "sleep_duration_min": body.sleep_duration_min,
                    "screen_time_min": body.screen_time_min,
                    "screen_time_variance": body.screen_time_variance,
                    "app_switches_per_hour": body.app_switches_per_hour,
                    "avg_session_duration_sec": body.avg_session_duration_sec,
                }
                cur.execute(
                    """
                    INSERT INTO alerts (
                        patient_id, psychologist_id, severity, risk_level,
                        summary, anomaly_data, behavioral_snapshot
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s)
                    """,
                    (
                        body.user_id,
                        doctor_id,
                        alert_severity,
                        risk_level,
                        summary,
                        json.dumps(anomaly_data),
                        json.dumps(behavioral_snapshot),
                    ),
                )
                alert_created = True

            conn.commit()

        return {
            "risk_level": risk_level,
            "alert_severity": alert_severity,
            "wcs": float(wcs),
            "wcs_slope_3d": float(wcs_slope_3d),
            "flagged_signals": int(flagged_signals),
            "anomalous_signals": anomalous_signals,
            "z_scores": {k: float(v) for k, v in z_scores.items()},
            "if_anomaly_score": float(if_score),
            "is_if_anomaly": bool(is_if_anomaly),
            "shap_contributions": shap_contributions,
            "interventions_created": interventions_created,
            "alert_created": alert_created,
        }

    except HTTPException:
        conn.rollback()
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()
