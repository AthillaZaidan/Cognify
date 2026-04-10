import { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { getTrends } from '../../services/api';
import type { TrendDay } from '../../types/api';
import { Colors } from '../../constants/colors';
import { Font } from '../../constants/typography';
import { TrendChart } from '../../components/TrendChart';
import { dayLabel, formatHourToClock, mean, std } from '../../utils/format';

const BASELINE_SLEEP_H = 6.65;

export default function SleepScreen() {
  const insets = useSafeAreaInsets();
  const { auth } = useAuth();
  const [trends, setTrends] = useState<TrendDay[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!auth || auth.role !== 'patient') return;
    const t = await getTrends(auth.user_id, 7);
    setTrends(t);
  }, [auth]);

  useEffect(() => {
    void load();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  };

  const hours = trends.map((d) => d.sleep_duration_min / 60);
  const labels = trends.map((d) => dayLabel(d.date));
  const avgSleepH = trends.length ? mean(trends.map((d) => d.sleep_duration_min)) / 60 : 0;
  const onsetHours = trends.map((d) => d.sleep_onset_hour).filter((v): v is number => v != null);
  const wakeHours = trends.map((d) => d.wake_hour).filter((v): v is number => v != null);
  const avgOnset = onsetHours.length ? mean(onsetHours) : 0;
  const avgWake = wakeHours.length ? mean(wakeHours) : 0;
  const durStd = trends.length ? std(trends.map((d) => d.sleep_duration_min)) : 0;
  const consistency =
    durStd < 30 ? 'Consistent' : durStd <= 60 ? 'Variable' : 'Irregular';

  const worst =
    trends.length === 0
      ? null
      : trends.reduce((a, b) => (a.sleep_duration_min < b.sleep_duration_min ? a : b));

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={{ paddingBottom: 32, paddingTop: insets.top + 12 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} colors={[Colors.accent]} />}
    >
      <View style={styles.pad}>
        <Text style={styles.title}>Sleep</Text>
        <Text style={styles.sub}>Duration, mean schedule, last 7 nights</Text>

        <TrendChart
          title="Sleep Duration (7 days)"
          labels={labels}
          values={hours}
          ySuffix="h"
          referenceLine={BASELINE_SLEEP_H}
        />

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sleep Schedule</Text>
          <View style={styles.row}>
            <Feather name="clock" size={18} color={Colors.accent} />
            <Text style={styles.rowText}>
              Average Bedtime: {onsetHours.length ? formatHourToClock(avgOnset) : '—'}
            </Text>
          </View>
          <View style={styles.row}>
            <Feather name="sunrise" size={18} color={Colors.accent} />
            <Text style={styles.rowText}>
              Average Wake: {wakeHours.length ? formatHourToClock(avgWake) : '—'}
            </Text>
          </View>
        </View>

        <View style={styles.insightRow}>
          <View style={styles.insight}>
            <Text style={styles.insightLabel}>Weekly average</Text>
            <Text style={styles.insightVal}>{avgSleepH.toFixed(1)}h</Text>
            <Text style={styles.insightSub}>vs {BASELINE_SLEEP_H}h baseline</Text>
          </View>
          <View style={styles.insight}>
            <Text style={styles.insightLabel}>Worst night</Text>
            <Text style={styles.insightVal}>
              {worst ? `${(worst.sleep_duration_min / 60).toFixed(1)}h` : '—'}
            </Text>
            <Text style={styles.insightSub}>{worst?.date ?? ''}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sleep consistency</Text>
          <Text style={styles.body}>{consistency} (σ ≈ {(durStd / 60).toFixed(2)}h)</Text>
        </View>

        <Text style={styles.cardTitle}>Recent Nights</Text>
        {trends.map((d) => {
          const mins = d.sleep_duration_min;
          const color =
            mins >= 360 ? Colors.success : mins >= 300 ? Colors.warning : Colors.danger;
          const pct = Math.min(100, (mins / 540) * 100);
          return (
            <View key={d.date} style={styles.nightRow}>
              <Text style={styles.nightDate}>{d.date}</Text>
              <View style={styles.nightBar}>
                <View style={[styles.nightFill, { width: `${pct}%`, backgroundColor: color }]} />
              </View>
              <Text style={styles.nightMeta}>
                {(mins / 60).toFixed(1)}h ·{' '}
                {d.sleep_onset_hour != null ? formatHourToClock(d.sleep_onset_hour) : '—'} →{' '}
                {d.wake_hour != null ? formatHourToClock(d.wake_hour) : '—'}
              </Text>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  pad: { paddingHorizontal: 16 },
  title: { fontSize: 26, fontFamily: Font.bold, color: Colors.text, letterSpacing: -0.4 },
  sub: { fontSize: 14, fontFamily: Font.regular, color: Colors.textMuted, marginBottom: 16, lineHeight: 20 },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
  },
  cardTitle: { fontSize: 15, fontFamily: Font.semibold, marginBottom: 8, color: Colors.text },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  rowText: { fontSize: 15, color: Colors.text },
  insightRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  insight: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  insightLabel: { fontSize: 12, fontFamily: Font.medium, color: Colors.textMuted },
  insightVal: { fontSize: 20, fontFamily: Font.extrabold, color: Colors.text, marginTop: 4 },
  insightSub: { fontSize: 11, fontFamily: Font.regular, color: Colors.textMuted, marginTop: 4 },
  body: { fontSize: 14, fontFamily: Font.regular, color: Colors.text },
  nightRow: { marginBottom: 14 },
  nightDate: { fontSize: 13, fontFamily: Font.semibold, color: Colors.text, marginBottom: 4 },
  nightBar: {
    height: 8,
    backgroundColor: Colors.border,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  nightFill: { height: '100%', borderRadius: 4 },
  nightMeta: { fontSize: 12, fontFamily: Font.regular, color: Colors.textMuted },
});
