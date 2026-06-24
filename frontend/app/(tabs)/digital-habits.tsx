import { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { getTrends } from '../../services/api';
import type { TrendDay } from '../../types/api';
import { Colors } from '../../constants/colors';
import { Font } from '../../constants/typography';
import { MetricCard } from '../../components/MetricCard';
import { BarChartWeekly } from '../../components/BarChart';
import { dayLabel } from '../../utils/format';

const BASE_SWITCH = 6.0;
export default function DigitalHabitsScreen() {
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

  const last = trends[trends.length - 1];
  const switches = last?.app_switches_per_hour ?? 0;
  const sessMin = last ? (last.avg_session_duration_sec / 60).toFixed(1) : '—';
  const frag = last?.fragmentation_score ?? 0;
  const notif = last?.notif_response_time_sec?.toFixed(0) ?? 'N/A';

  const switchStatus: 'High' | 'Normal' = switches > BASE_SWITCH * 1.5 ? 'High' : 'Normal';
  const sessionStatus: 'Low' | 'Normal' =
    last && last.avg_session_duration_sec < 60 ? 'Low' : 'Normal';
  const fragStatus: 'High' | 'Normal' = frag > 0.6 ? 'High' : 'Normal';

  const rows = trends.map((d) => ({
    label: dayLabel(d.date),
    value: d.screen_time_min / 60,
    max: 12,
  }));

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={{ paddingBottom: 40, paddingTop: insets.top + 20 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} colors={[Colors.accent]} />}
    >
      <View style={styles.pad}>
        <View style={styles.header}>
          <Text style={styles.title}>Digital Habits</Text>
          <Text style={styles.sub}>Screen time, focus, and switching patterns</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.cardTitle}>Screen Time This Week</Text>
          <View style={styles.card}>
            <BarChartWeekly rows={rows} unit="h" />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.cardTitle}>Metrics</Text>
          <View style={styles.grid}>
            <MetricCard
              label="App Switching"
              value={switches.toFixed(1)}
              baseline="Your usual: 6.0/hr"
              status={switchStatus}
            />
            <MetricCard
              label="Focus Time"
              value={`${sessMin}m`}
              baseline="Your usual: 2.0m"
              status={sessionStatus}
            />
            <MetricCard
              label="Focus Rhythm"
              value={frag.toFixed(2)}
              baseline="Your usual: 0.35"
              status={fragStatus}
            />
            <MetricCard
              label="Reply Speed"
              value={`${notif}s`}
              baseline="For context"
              status="Info"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.cardTitle}>Estimated Activity Pattern</Text>
          <View style={styles.card}>
            <View style={styles.patternHead}>
              <Text style={styles.patternNote}>Time-of-day heuristic (demo)</Text>
              <Feather name="info" size={16} color={Colors.textMuted} />
            </View>
            {[
              { n: 'Morning Routine', pct: 20, range: '6–9', opacity: 0.4 },
              { n: 'Work/Productivity', pct: 45, range: '9–17', opacity: 1.0 },
              { n: 'Evening Mixed', pct: 20, range: '17–20', opacity: 0.6 },
              { n: 'Late Night', pct: 15, range: '20–24', opacity: 0.2 },
            ].map((b) => (
              <View key={b.n} style={styles.stackRow}>
                <View style={styles.stackLabelRow}>
                  <Text style={styles.stackLabel}>{b.n}</Text>
                  <Text style={styles.stackValue}>{b.pct}% <Text style={styles.stackRange}>({b.range})</Text></Text>
                </View>
                <View style={styles.stackTrack}>
                  <View style={[styles.stackFill, { width: `${b.pct}%`, backgroundColor: Colors.accent, opacity: b.opacity }]} />
                </View>
              </View>
            ))}
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
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  patternHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  patternNote: { fontSize: 13, fontFamily: Font.medium, color: Colors.textMuted },
  stackRow: { marginBottom: 16 },
  stackLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 8 },
  stackLabel: { fontSize: 14, fontFamily: Font.semibold, color: Colors.text },
  stackValue: { fontSize: 14, fontFamily: Font.bold, color: Colors.text },
  stackRange: { fontSize: 12, fontFamily: Font.regular, color: Colors.textSubtle },
  stackTrack: { height: 6, backgroundColor: Colors.border, borderRadius: 3, overflow: 'hidden' },
  stackFill: { height: '100%', borderRadius: 3 },
});
