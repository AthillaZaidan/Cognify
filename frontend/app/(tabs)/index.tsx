import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useBehavioralFlush } from '../../context/BehavioralTrackerContext';
import { getDashboard, getPatients, getAlerts } from '../../services/api';
import type { DashboardResponse } from '../../types/api';
import { Colors } from '../../constants/colors';
import { Font } from '../../constants/typography';
import { RiskBadge } from '../../components/RiskBadge';
import { AnomalyCard } from '../../components/AnomalyCard';
import { MetricCard } from '../../components/MetricCard';
export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const { auth, signOut } = useAuth();
  const flush = useBehavioralFlush();
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [psychSummary, setPsychSummary] = useState<{ patients: number; alerts: number } | null>(
    null
  );
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!auth) return;
    if (auth.role === 'psychologist') {
      const [patients, alerts] = await Promise.all([
        getPatients(auth.user_id),
        getAlerts(auth.user_id),
      ]);
      setPsychSummary({ patients: patients.length, alerts: alerts.filter((a) => !a.acknowledged).length });
      return;
    }
    const d = await getDashboard(auth.user_id);
    setData(d);
  }, [auth]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!auth) return null;

  if (auth.role === 'psychologist') {
    return (
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollInner, { paddingTop: insets.top + 16 }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.accent}
            colors={[Colors.accent]}
          />
        }
      >
        <Text style={styles.pageTitle}>Caseload</Text>
        <Text style={styles.pageSub}>
          {psychSummary
            ? `${psychSummary.patients} active · ${psychSummary.alerts} alerts need review`
            : 'Loading…'}
        </Text>
        <Text style={styles.hint}>Open Patients for the full roster and alert queue.</Text>
        <Pressable
          style={({ pressed }) => [styles.signOutBtn, pressed && { opacity: 0.7 }]}
          onPress={() => { signOut(); router.replace('/'); }}
        >
          <Feather name="log-out" size={16} color={Colors.textMuted} />
          <Text style={styles.signOutText}>Switch account</Text>
        </Pressable>
      </ScrollView>
    );
  }

  const d = data;
  const firstName = auth.name.split(' ')[0];
  const hour = new Date().getHours();
  const greet =
    hour < 12 ? 'Morning' : hour < 17 ? 'Afternoon' : 'Evening';
  const latestDate = d?.latest_data?.date;
  const risk = d?.latest_anomaly?.risk_level ?? 'stable';
  const showAnomaly =
    d?.latest_anomaly != null && d.latest_anomaly.risk_level !== 'stable';

  const sleepH = d ? d.latest_data.sleep_duration_min / 60 : 0;
  const sleepBase = d?.baseline.sleep_duration_min?.mean
    ? d.baseline.sleep_duration_min.mean / 60
    : 6.65;
  const sw = d?.latest_data.app_switches_per_hour ?? 0;
  const swBase = d?.baseline.app_switches_per_hour?.mean ?? 6;

  return (
    <ScrollView
      style={styles.scroll}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={Colors.accent}
          colors={[Colors.accent]}
        />
      }
    >
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greet}>
              Good {greet}, {firstName}
            </Text>
            <Text style={styles.greetSub}>
              {latestDate ? `Signals for ${latestDate} · vs your baseline` : 'Loading snapshot…'}
            </Text>
          </View>
          <RiskBadge level={risk} />
        </View>
      </View>

      <View style={styles.body}>
        {showAnomaly && d?.latest_anomaly ? (
          <AnomalyCard
            anomaly={d.latest_anomaly}
            onStartReset={() => router.push('/(tabs)/interventions')}
          />
        ) : null}

        <View style={styles.metricsRow}>
          <MetricCard
            label="Sleep Duration"
            value={`${sleepH.toFixed(1)}h`}
            baseline={`Baseline: ${sleepBase.toFixed(1)}h`}
            progress={Math.min(sleepH / (sleepBase * 1.2), 1)}
          />
          <MetricCard
            label="App Switches"
            value={`${sw.toFixed(1)}/hr`}
            baseline={`Baseline: ${swBase.toFixed(1)}/hr`}
            progress={Math.min(sw / (swBase * 1.5), 1)}
          />
        </View>

        <Text style={styles.sectionTitle}>Supports</Text>
        <Text style={styles.sectionSub}>
          {d?.active_interventions ?? 0} open in Actions · same list below
        </Text>

        <View style={styles.supportList}>
          {[
            { icon: 'wind' as const, t: '4-7-8 breathing', s: 'Short exhale-focused cycle' },
            { icon: 'layers' as const, t: 'Task split', s: 'One outcome, smallest next step' },
            { icon: 'headphones' as const, t: 'Sensory reset', s: 'Sound or touch anchor' },
            { icon: 'navigation' as const, t: 'Movement', s: 'Two minutes away from screen' },
          ].map((x) => (
            <Pressable
              key={x.t}
              style={({ pressed }) => [styles.supportRow, pressed && styles.supportRowPressed]}
              onPress={() => router.push('/(tabs)/interventions')}
            >
              <View style={styles.supportIcon}>
                <Feather name={x.icon} size={20} color={Colors.accent} />
              </View>
              <View style={styles.supportText}>
                <Text style={styles.supportTitle}>{x.t}</Text>
                <Text style={styles.supportSub}>{x.s}</Text>
              </View>
              <Feather name="chevron-right" size={18} color={Colors.textMuted} />
            </Pressable>
          ))}
        </View>

        <Pressable
          style={({ pressed }) => [styles.flushBtn, pressed && styles.flushBtnPressed]}
          onPress={() => {
            void flush();
            void load();
          }}
        >
          <Text style={styles.flushText}>Send session sample to API (demo)</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.signOutBtn, pressed && { opacity: 0.7 }]}
          onPress={() => { signOut(); router.replace('/'); }}
        >
          <Feather name="log-out" size={16} color={Colors.textMuted} />
          <Text style={styles.signOutText}>Switch account</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: Colors.background },
  scrollInner: { padding: 20, paddingBottom: 40 },
  header: {
    backgroundColor: Colors.accent,
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start' },
  greet: { color: Colors.onPrimary, fontSize: 22, fontFamily: Font.bold, letterSpacing: -0.3 },
  greetSub: { color: Colors.onPrimaryMuted, marginTop: 6, fontSize: 14, fontFamily: Font.regular, lineHeight: 20 },
  body: { padding: 16 },
  metricsRow: { flexDirection: 'row', gap: 12, marginBottom: 8 },
  sectionTitle: { fontSize: 15, fontFamily: Font.semibold, color: Colors.text, marginTop: 12, letterSpacing: 0.15 },
  sectionSub: { fontSize: 13, fontFamily: Font.regular, color: Colors.textMuted, marginBottom: 10 },
  supportList: {
    borderRadius: 0,
    overflow: 'hidden',
    marginBottom: 8,
  },
  supportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  supportRowPressed: { opacity: 0.85, backgroundColor: Colors.surfaceMuted },
  supportIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: Colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  supportText: { flex: 1 },
  supportTitle: { fontSize: 15, fontFamily: Font.medium, color: Colors.text },
  supportSub: { fontSize: 13, fontFamily: Font.regular, color: Colors.textMuted, marginTop: 2 },
  flushBtn: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    alignItems: 'center',
  },
  flushBtnPressed: { backgroundColor: Colors.surfaceMuted },
  flushText: { color: Colors.textMuted, fontFamily: Font.medium, fontSize: 13 },
  pageTitle: { fontSize: 24, fontFamily: Font.bold, color: Colors.text, letterSpacing: -0.4 },
  pageSub: { fontSize: 15, fontFamily: Font.regular, color: Colors.textMuted, marginTop: 8, lineHeight: 22 },
  hint: { marginTop: 16, fontSize: 14, fontFamily: Font.regular, color: Colors.accent },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 6,
    marginTop: 24,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  signOutText: { fontFamily: Font.medium, fontSize: 13, color: Colors.textMuted },
});
