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
      contentContainerStyle={{ paddingBottom: 32, paddingTop: insets.top + 12 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} colors={[Colors.accent]} />}
    >
      <View style={styles.pad}>
        <Text style={styles.title}>Digital habits</Text>
        <Text style={styles.sub}>Screen-on time, switching, fragmentation</Text>

        <Text style={styles.cardTitle}>Screen Time This Week</Text>
        <View style={styles.card}>
          <BarChartWeekly rows={rows} unit="h" />
        </View>

        <Text style={styles.cardTitle}>Metrics</Text>
        <View style={styles.grid}>
          <MetricCard
            label="App Switches/hr"
            value={switches.toFixed(1)}
            baseline="Baseline: 6.0/hr"
            status={switchStatus}
          />
          <MetricCard
            label="Avg Session"
            value={`${sessMin}m`}
            baseline="Baseline: 2.0m"
            status={sessionStatus}
          />
          <MetricCard
            label="Fragmentation"
            value={frag.toFixed(2)}
            baseline="Baseline: 0.35"
            status={fragStatus}
          />
          <MetricCard
            label="Notif Response"
            value={`${notif}s`}
            baseline="Context only"
            status="Info"
          />
        </View>

        <Text style={styles.cardTitle}>Estimated Activity Pattern</Text>
        <View style={styles.card}>
          <View style={styles.patternHead}>
            <Text style={styles.patternNote}>Time-of-day heuristic (demo)</Text>
            <Feather name="info" size={16} color={Colors.textMuted} />
          </View>
          {[
            { n: 'Morning Routine', pct: 20, range: '6–9' },
            { n: 'Work/Productivity', pct: 45, range: '9–17' },
            { n: 'Evening Mixed', pct: 20, range: '17–20' },
            { n: 'Late Night', pct: 15, range: '20–24' },
          ].map((b) => (
            <View key={b.n} style={styles.stackRow}>
              <Text style={styles.stackLabel}>
                {b.n} {b.pct}% ({b.range})
              </Text>
              <View style={styles.stackTrack}>
                <View style={[styles.stackFill, { width: `${b.pct}%`, backgroundColor: Colors.accent }]} />
              </View>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  pad: { paddingHorizontal: 16 },
  title: { fontSize: 26, fontFamily: Font.bold, color: Colors.text, letterSpacing: -0.4 },
  sub: { fontSize: 14, fontFamily: Font.regular, color: Colors.textMuted, marginBottom: 16, lineHeight: 20 },
  cardTitle: { fontSize: 15, fontFamily: Font.semibold, color: Colors.text, marginTop: 12, marginBottom: 8, letterSpacing: 0.1 },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 8,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  patternHead: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  patternNote: { fontSize: 12, fontFamily: Font.regular, color: Colors.textMuted },
  stackRow: { marginBottom: 10 },
  stackLabel: { fontSize: 13, fontFamily: Font.regular, color: Colors.text, marginBottom: 4 },
  stackTrack: { height: 8, backgroundColor: Colors.border, borderRadius: 4, overflow: 'hidden' },
  stackFill: { height: '100%', borderRadius: 4 },
});
