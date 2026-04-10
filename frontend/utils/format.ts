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
    app_switches_per_hour:    'App-Switching',
    sleep_duration_min:       'Sleep Duration',
    avg_session_duration_sec: 'Session Length',
    screen_time_min:          'Screen Time',
    screen_time_variance:     'Screen Variability',
    fragmentation_score:      'Attention Fragmentation',
  };
  return map[signal] ?? signal.replace(/_/g, ' ');
}

function zToAdverb(z: number): string {
  const abs = Math.abs(z);
  if (abs >= 2.5) return 'much';
  if (abs >= 1.5) return 'noticeably';
  return 'a bit';
}

export function describeAnomalyBody(
  signal: string,
  z: number | undefined
): string {
  if (z === undefined) return 'Several of your habits look different from your usual patterns today.';
  const adv = zToAdverb(z);
  const dir = z > 0 ? 'more than' : 'less than';
  if (signal === 'sleep_duration_min')
    return `You slept ${adv} ${dir} usual last night — rest has a big impact on focus and mood.`;
  if (signal === 'app_switches_per_hour')
    return `You're switching apps ${adv} ${dir} usual — this often makes it harder to concentrate.`;
  if (signal === 'avg_session_duration_sec')
    return `Your focus sessions are ${adv} shorter than usual — that can be a sign of mental fatigue.`;
  if (signal === 'screen_time_min')
    return `Your screen time today is ${adv} ${dir} your usual amount.`;
  if (signal === 'screen_time_variance')
    return `Your screen habits today are ${adv} more scattered than your usual routine.`;
  return `${signalToTitle(signal)} looks ${adv} different from your usual pattern today.`;
}
