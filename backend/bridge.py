FEATURE_NAMES = [
    "daily_mean_activity", "daily_std_activity", "pct_zeros",
    "night_mean_activity", "day_mean_activity", "activity_entropy",
    "burst_rate", "mean_inactive_bout_length", "circadian_quotient",
]

NORMAL_SLEEP    = 450.0   # minutes
NORMAL_SCREEN   = 312.0   # minutes
NORMAL_SWITCHES = 4.2     # per hour
NORMAL_SESSION  = 185.0   # seconds
NORMAL_VARIANCE = 0.15    # ratio


def smartphone_to_actigraphy_proxy(
    screen_time_min, screen_time_variance, sleep_duration_min,
    app_switches_per_hour, avg_session_duration_sec, fs,
) -> list:
    st  = max(screen_time_min, 1.0)
    stv = max(screen_time_variance, 1e-4)
    sl  = max(sleep_duration_min, 1.0)
    sw  = max(app_switches_per_hour, 0.0)
    sd  = max(avg_session_duration_sec, 1.0)

    daily_mean  = (st / NORMAL_SCREEN) * fs["daily_mean_activity"]["mean"]
    daily_std   = (stv / NORMAL_VARIANCE) * fs["daily_std_activity"]["mean"]
    pct_zeros   = min(0.99, max(0.01, fs["pct_zeros"]["mean"] * (NORMAL_SCREEN / st)))
    sleep_def   = max(0.0, (NORMAL_SLEEP - sl) / NORMAL_SLEEP)
    night_mean  = fs["night_mean_activity"]["mean"] * (1.0 + 2.5 * sleep_def)
    day_mean    = (st / NORMAL_SCREEN) * fs["day_mean_activity"]["mean"]
    entropy     = fs["activity_entropy"]["mean"] * (0.6 + 0.4 * (sw / NORMAL_SWITCHES))
    burst_rate  = (sw / NORMAL_SWITCHES) * fs["burst_rate"]["mean"]
    inactive    = (sd / NORMAL_SESSION) * fs["mean_inactive_bout_length"]["mean"]
    circadian_q = (sl / NORMAL_SLEEP) * fs["circadian_quotient"]["mean"]

    return [daily_mean, daily_std, pct_zeros, night_mean, day_mean,
            entropy, burst_rate, inactive, circadian_q]
