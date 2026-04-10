const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function dayLabel(isoDate: string): string {
  const d = new Date(isoDate + 'T12:00:00');
  return DAYS[d.getDay()];
}

export function mean(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

export function std(nums: number[]): number {
  if (nums.length === 0) return 0;
  const m = mean(nums);
  const v = mean(nums.map((x) => (x - m) ** 2));
  return Math.sqrt(v);
}

/** Hour as 0–24 float → "11:58 PM" */
export function formatHourToClock(hour: number): string {
  let h = Math.floor(hour) % 24;
  const m = Math.round((hour - Math.floor(hour)) * 60);
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${m.toString().padStart(2, '0')} ${ampm}`;
}

export function signalToTitle(signal: string): string {
  const map: Record<string, string> = {
    app_switches_per_hour: 'High App-Switching',
    sleep_duration_min: 'Sleep Duration',
    avg_session_duration_sec: 'Session Length',
    screen_time_min: 'Screen Time',
    screen_time_variance: 'Screen Time Variance',
    fragmentation_score: 'Attention Fragmentation',
  };
  return map[signal] ?? signal.replace(/_/g, ' ');
}

export function describeAnomalyBody(
  signal: string,
  z: number | undefined
): string {
  if (z === undefined) return 'Multiple behavioral signals shifted from your baseline.';
  const absZ = Math.abs(z).toFixed(1);
  if (signal.includes('sleep')) {
    return `Your sleep duration is ${absZ} standard deviations from baseline.`;
  }
  return `Your ${signal.replace(/_/g, ' ')} is ${absZ}σ from baseline.`;
}
