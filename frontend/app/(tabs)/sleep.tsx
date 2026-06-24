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
      contentContainerStyle={{ paddingBottom: 40, paddingTop: insets.top + 20 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} colors={[Colors.accent]} />}
    >
      <View style={styles.pad}>
        <View style={styles.header}>
          <Text style={styles.title}>Sleep</Text>
          <Text style={styles.sub}>Duration, schedule, last 7 nights</Text>
        </View>

        <View style={styles.section}>
          <TrendChart
            title="Sleep Duration (7 days)"
            labels={labels}
            values={hours}
            ySuffix="h"
            referenceLine={BASELINE_SLEEP_H}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.cardTitle}>Sleep Schedule</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={styles.iconBox}>
                <Feather name="moon" size={18} color={Colors.accent} />
              </View>
              <View>
                <Text style={styles.rowLabel}>Average Bedtime</Text>
                <Text style={styles.rowText}>
                  {onsetHours.length ? formatHourToClock(avgOnset) : '—'}
                </Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.row}>
              <View style={styles.iconBox}>
                <Feather name="sunrise" size={18} color={Colors.accent} />
              </View>
              <View>
                <Text style={styles.rowLabel}>Average Wake</Text>
                <Text style={styles.rowText}>
                  {wakeHours.length ? formatHourToClock(avgWake) : '—'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.insightRow}>
            <View style={styles.insight}>
              <Text style={styles.insightLabel}>Weekly average</Text>
              <Text style={styles.insightVal}>{avgSleepH.toFixed(1)}<Text style={styles.insightUnit}>h</Text></Text>
              <Text style={styles.insightSub}>vs {BASELINE_SLEEP_H}h baseline</Text>
            </View>
            <View style={styles.insight}>
              <Text style={styles.insightLabel}>Worst night</Text>
              <Text style={styles.insightVal}>
                {worst ? (worst.sleep_duration_min / 60).toFixed(1) : '—'}<Text style={styles.insightUnit}>{worst ? 'h' : ''}</Text>
              </Text>
              <Text style={styles.insightSub}>{worst?.date ?? 'No data'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.cardTitle}>Sleep consistency</Text>
          <View style={styles.card}>
            <Text style={styles.body}>{consistency} <Text style={styles.sigma}>(σ ≈ {(durStd / 60).toFixed(2)}h)</Text></Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.cardTitle}>Recent Nights</Text>
          <View style={styles.card}>
            {trends.map((d, i) => {
              const mins = d.sleep_duration_min;
              const color =
                mins >= 360 ? Colors.success : mins >= 300 ? Colors.warning : Colors.danger;
              const pct = Math.min(100, (mins / 540) * 100);
              return (
                <View key={d.date} style={[styles.nightRow, i === trends.length - 1 && { marginBottom: 0 }]}>
                  <View style={styles.nightHeader}>
                    <Text style={styles.nightDate}>{d.date}</Text>
                    <Text style={styles.nightMeta}>
                      {d.sleep_onset_hour != null ? formatHourToClock(d.sleep_onset_hour) : '—'} →{' '}
                      {d.wake_hour != null ? formatHourToClock(d.wake_hour) : '—'}
                    </Text>
                  </View>
                  <View style={styles.nightBar}>
                    <View style={[styles.nightFill, { width: `${pct}%`, backgroundColor: color }]} />
                  </View>
                  <Text style={[styles.nightDuration, { color }]}>
                    {(mins / 60).toFixed(1)}h
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  pad: { paddingHorizontal: 20 },
  header: { marginBottom: 24 },
  title: { fontSize: 30, fontFamily: Font.bold, color: Colors.text, letterSpacing: -0.8, marginBottom: 4 },
  sub: { fontSize: 15, fontFamily: Font.regular, color: Colors.textMuted, lineHeight: 22 },
  section: { marginBottom: 24 },
  cardTitle: { fontSize: 13, fontFamily: Font.bold, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 12 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#3B5DE7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  iconBox: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(59, 93, 231, 0.1)', alignItems: 'center', justifyContent: 'center' },
  rowLabel: { fontSize: 13, fontFamily: Font.medium, color: Colors.textMuted, marginBottom: 2 },
  rowText: { fontSize: 18, fontFamily: Font.bold, color: Colors.text },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 16 },
  insightRow: { flexDirection: 'row', gap: 12 },
  insight: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#3B5DE7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  insightLabel: { fontSize: 13, fontFamily: Font.medium, color: Colors.textMuted, marginBottom: 8 },
  insightVal: { fontSize: 32, fontFamily: Font.extrabold, color: Colors.text, letterSpacing: -1 },
  insightUnit: { fontSize: 18, fontFamily: Font.bold, color: Colors.textMuted },
  insightSub: { fontSize: 12, fontFamily: Font.regular, color: Colors.textSubtle, marginTop: 8 },
  body: { fontSize: 18, fontFamily: Font.semibold, color: Colors.text },
  sigma: { fontSize: 14, fontFamily: Font.regular, color: Colors.textMuted },
  nightRow: { marginBottom: 20 },
  nightHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 8 },
  nightDate: { fontSize: 14, fontFamily: Font.semibold, color: Colors.text },
  nightMeta: { fontSize: 13, fontFamily: Font.medium, color: Colors.textSubtle },
  nightBar: {
    height: 6,
    backgroundColor: Colors.border,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  nightFill: { height: '100%', borderRadius: 3 },
  nightDuration: { fontSize: 13, fontFamily: Font.bold, textAlign: 'right' },
});
