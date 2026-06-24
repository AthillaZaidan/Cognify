import { useCallback, useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Pressable,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { useBehavioralFlush } from '../../context/BehavioralTrackerContext';
import { getDashboard, getPatients, getAlerts } from '../../services/api';
import type { DashboardResponse } from '../../types/api';
import { Colors, headerColors } from '../../constants/colors';
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

  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.03,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]);

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

  if (!auth) {
    return null;
  }

  if (auth.role === 'psychologist') {
    return (
      <View style={styles.container}>
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
          <Pressable
            style={({ pressed }) => [styles.patientsLink, pressed && { opacity: 0.7 }]}
            onPress={() => router.push('/(tabs)/psychologist')}
          >
            <Text style={styles.patientsLinkText}>Open Patients for full roster</Text>
            <Feather name="arrow-right" size={16} color={Colors.accent} />
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.signOutBtn, pressed && { opacity: 0.7 }]}
            onPress={signOut}
          >
            <Feather name="log-out" size={16} color={Colors.textMuted} />
            <Text style={styles.signOutText}>Sign out</Text>
          </Pressable>
        </ScrollView>
      </View>
    );
  }

  const d = data;
  const firstName = auth.name.split(' ')[0];
  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Morning' : hour < 17 ? 'Afternoon' : 'Evening';
  const latestDate = d?.latest_data?.date;
  const risk = d?.latest_anomaly?.risk_level ?? 'stable';
  const showAnomaly = d?.latest_anomaly != null && d.latest_anomaly.risk_level !== 'stable';

  const sleepH = d?.latest_data ? d.latest_data.sleep_duration_min / 60 : 0;
  const sleepBase = d?.baseline.sleep_duration_min?.mean
    ? d.baseline.sleep_duration_min.mean / 60
    : 6.65;
  const sw = d?.latest_data?.app_switches_per_hour ?? 0;
  const swBase = d?.baseline.app_switches_per_hour?.mean ?? 6;

  const gradientColors: [string, string] = headerColors(risk) as [string, string];

  return (
    <View style={styles.container}>
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
        <LinearGradient
          colors={gradientColors}
          style={[styles.header, { paddingTop: insets.top + 16 }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        >
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.greet}>
                Good {greet}, {firstName}
              </Text>
              <Text style={styles.greetSub}>
                {latestDate ? `How today looks · ${latestDate}` : 'Loading your overview…'}
              </Text>
            </View>
            <View style={styles.headerRight}>
              <RiskBadge level={risk} />
              <Pressable
                accessibilityRole="button"
                style={({ pressed }) => [styles.signOutIcon, pressed && { opacity: 0.75 }]}
                onPress={signOut}
              >
                <Feather name="log-out" size={16} color={Colors.onPrimaryMuted || '#9BA8C0'} />
              </Pressable>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.body}>
          {showAnomaly && d?.latest_anomaly ? (
            <View style={styles.anomalyContainer}>
              <Animated.View
                style={[
                  styles.pulseRing,
                  {
                    transform: [{ scale: pulseAnim }],
                    borderColor: risk === 'attention_needed' ? Colors.danger : Colors.warning,
                  },
                ]}
              />
              <AnomalyCard
                anomaly={d.latest_anomaly}
                onStartReset={() => router.push('/(tabs)/interventions')}
              />
            </View>
          ) : null}

          <View style={styles.metricsRow}>
            <MetricCard
              label="Sleep"
              value={`${sleepH.toFixed(1)}h`}
              baseline={`Your usual: ${sleepBase.toFixed(1)}h`}
              progress={Math.min(sleepH / (sleepBase * 1.2), 1)}
            />
            <MetricCard
              label="App Switching"
              value={`${sw.toFixed(1)}/hr`}
              baseline={`Your usual: ${swBase.toFixed(1)}/hr`}
              progress={Math.min(sw / (swBase * 1.5), 1)}
            />
          </View>

          <Text style={styles.sectionTitle}>Quick Supports</Text>
          <Text style={styles.sectionSub}>
            {d?.active_interventions
              ? `${d.active_interventions} recovery action${d.active_interventions > 1 ? 's' : ''} waiting · tap to view`
              : 'CBT-based tools — tap any to open Actions'}
          </Text>

          <View style={styles.supportList}>
            {[
              { icon: 'wind' as const, t: '4-7-8 Breathing', s: 'Short exhale-focused cycle' },
              { icon: 'layers' as const, t: 'Task Split', s: 'One outcome, smallest next step' },
              { icon: 'headphones' as const, t: 'Sensory Reset', s: 'Sound or touch anchor' },
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
            onPress={signOut}
          >
            <Feather name="log-out" size={16} color={Colors.textMuted} />
            <Text style={styles.signOutText}>Sign out</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  scrollInner: { padding: 20, paddingBottom: 40 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 28,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  signOutIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  greet: { color: '#FFFFFF', fontSize: 22, fontFamily: Font.bold, letterSpacing: -0.5 },
  greetSub: { color: Colors.onPrimaryMuted || '#9BA8C0', marginTop: 4, fontSize: 14, fontFamily: Font.regular, lineHeight: 20 },
  body: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 40, backgroundColor: Colors.background },
  anomalyContainer: {
    marginBottom: 24,
    position: 'relative',
  },
  pulseRing: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16,
    borderWidth: 2,
    opacity: 0.5,
  },
  metricsRow: { flexDirection: 'row', gap: 12, marginBottom: 32 },
  sectionTitle: { fontSize: 13, fontFamily: Font.bold, color: Colors.textMuted, letterSpacing: 0.5, textTransform: 'uppercase' },
  sectionSub: { fontSize: 13, fontFamily: Font.regular, color: Colors.textSubtle, marginTop: 4, marginBottom: 16 },
  supportList: {
    gap: 12,
    marginBottom: 32,
  },
  supportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#3B5DE7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  supportRowPressed: { backgroundColor: '#F8FAFC' },
  supportIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(59, 93, 231, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  supportText: { flex: 1 },
  supportTitle: { fontSize: 15, fontFamily: Font.semibold, color: Colors.text, letterSpacing: 0.1 },
  supportSub: { fontSize: 13, fontFamily: Font.regular, color: Colors.textMuted, marginTop: 2 },
  flushBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: 'transparent',
    alignItems: 'center',
    marginBottom: 24,
  },
  flushBtnPressed: { backgroundColor: '#FFFFFF' },
  flushText: { color: Colors.textMuted, fontFamily: Font.medium, fontSize: 14 },
  pageTitle: { fontSize: 28, fontFamily: Font.bold, color: Colors.text, letterSpacing: -0.5 },
  pageSub: { fontSize: 15, fontFamily: Font.regular, color: Colors.textMuted, marginTop: 8, lineHeight: 22 },
  patientsLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    alignSelf: 'flex-start',
    shadowColor: '#3B5DE7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  patientsLinkText: { fontFamily: Font.medium, fontSize: 15, color: Colors.text },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  signOutText: { fontFamily: Font.medium, fontSize: 13, color: Colors.textMuted },
});
