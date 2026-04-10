import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { Font } from '../constants/typography';
import type { AnomalySnapshot } from '../types/api';
import { signalToTitle } from '../utils/format';

const SIGNAL_SHORT: Record<string, string> = {
  app_switches_per_hour:    'App switching',
  sleep_duration_min:       'Sleep',
  avg_session_duration_sec: 'Session length',
  screen_time_min:          'Screen time',
  screen_time_variance:     'Screen variance',
  fragmentation_score:      'Fragmentation',
  burst_rate:               'Burst rate',
  circadian_quotient:       'Circadian rhythm',
  daily_mean_activity:      'Activity level',
};

function shortName(feature: string) {
  return SIGNAL_SHORT[feature] ?? feature.replace(/_/g, ' ');
}

function zMagnitude(z: number | undefined): string {
  if (z === undefined) return '';
  const abs = Math.abs(z);
  if (abs >= 3) return 'much';
  if (abs >= 2) return 'noticeably';
  return 'a bit';
}

function friendlySeverity(s: string): string {
  if (s === 'SEVERE') return 'Needs attention';
  if (s === 'MODERATE') return 'Moderate';
  return 'Mild';
}

interface Props {
  anomaly: AnomalySnapshot;
  onStartReset: () => void;
}

export function AnomalyCard({ anomaly, onStartReset }: Props) {
  const topSignal = anomaly.anomalous_signals[0] ?? 'app_switches_per_hour';
  const z = anomaly.z_scores[topSignal];
  const severity = anomaly.alert_severity ?? 'MILD';
  const isSevere = severity === 'SEVERE';

  // Top anomalous SHAP contributions (toward_anomaly direction only)
  const badContribs = anomaly.shap_contributions
    .filter((c) => c.direction === 'toward_anomaly')
    .slice(0, 3);
  const okContribs = anomaly.shap_contributions
    .filter((c) => c.direction === 'toward_normal')
    .slice(0, 2);

  return (
    <View style={styles.card}>
      {/* ── Status bar ── */}
      <View style={styles.statusBar}>
        <View style={styles.statusLeft}>
          <View style={styles.pulseDot} />
          <Text style={styles.statusLabel}>HEADS UP</Text>
        </View>
        <View style={[styles.severityBadge, isSevere && styles.severityBadgeSevere]}>
          <Text style={[styles.severityText, isSevere && styles.severityTextSevere]}>
            {friendlySeverity(severity)}
          </Text>
        </View>
      </View>

      {/* ── Primary message ── */}
      <Text style={styles.title}>
        {shortName(topSignal)} is {zMagnitude(z)} higher than usual
      </Text>
      <Text style={styles.body}>
        Today's patterns look different from what's normal for you
        {anomaly.flagged_signals > 1 ? ` — ${anomaly.flagged_signals} habits shifted` : ''}.
      </Text>

      {/* ── Intensity bar ── */}
      <View style={styles.wcsRow}>
        <Text style={styles.wcsLabel}>How different</Text>
        <View style={styles.wcsTrack}>
          <View style={[styles.wcsFill, { width: `${Math.min(100, (anomaly.wcs / 6) * 100)}%` }]} />
        </View>
        <Text style={styles.wcsValue}>{anomaly.wcs.toFixed(1)}</Text>
      </View>

      {/* ── SHAP contributor pills ── */}
      {badContribs.length > 0 && (
        <View style={styles.shapSection}>
          <Text style={styles.shapLabel}>What we noticed</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.pillRow}>
              {badContribs.map((c) => (
                <View key={c.feature} style={styles.pillBad}>
                  <Feather name="trending-up" size={10} color={Colors.danger} />
                  <Text style={styles.pillTextBad}>{shortName(c.feature)}</Text>
                </View>
              ))}
              {okContribs.map((c) => (
                <View key={c.feature} style={styles.pillOk}>
                  <Feather name="trending-down" size={10} color={Colors.success} />
                  <Text style={styles.pillTextOk}>{shortName(c.feature)}</Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      )}

      {/* ── CTA ── */}
      <Pressable style={styles.cta} onPress={onStartReset}>
        <Feather name="zap" size={14} color="#fff" />
        <Text style={styles.ctaText}>Start Recovery Action</Text>
        <Feather name="chevron-right" size={14} color="rgba(255,255,255,0.7)" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFF5F5',
    borderWidth: 1,
    borderColor: Colors.danger + '33',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: Colors.danger,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },

  // Status bar
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  statusLeft: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.danger,
  },
  statusLabel: {
    fontSize: 10,
    fontFamily: Font.bold,
    color: Colors.danger,
    letterSpacing: 0.8,
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: Colors.warningLight,
  },
  severityBadgeSevere: { backgroundColor: Colors.dangerLight },
  severityText: {
    fontSize: 10,
    fontFamily: Font.bold,
    color: Colors.warning,
    letterSpacing: 0.5,
  },
  severityTextSevere: { color: Colors.danger },

  // Message
  title: {
    fontSize: 18,
    fontFamily: Font.bold,
    color: Colors.text,
    letterSpacing: -0.3,
    marginBottom: 4,
    lineHeight: 24,
  },
  body: {
    fontSize: 13,
    fontFamily: Font.regular,
    color: Colors.textMuted,
    lineHeight: 19,
    marginBottom: 14,
  },

  // WCS score bar
  wcsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  wcsLabel: {
    fontSize: 11,
    fontFamily: Font.medium,
    color: Colors.textMuted,
    width: 72,
  },
  wcsTrack: {
    flex: 1,
    height: 5,
    backgroundColor: Colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  wcsFill: {
    height: '100%',
    backgroundColor: Colors.danger,
    borderRadius: 3,
  },
  wcsValue: {
    fontSize: 12,
    fontFamily: Font.bold,
    color: Colors.danger,
    width: 32,
    textAlign: 'right',
  },

  // SHAP pills
  shapSection: { marginBottom: 14 },
  shapLabel: {
    fontSize: 11,
    fontFamily: Font.semibold,
    color: Colors.textMuted,
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  pillRow: { flexDirection: 'row', gap: 6 },
  pillBad: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.dangerLight,
    borderWidth: 1,
    borderColor: Colors.danger + '28',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },
  pillTextBad: {
    fontSize: 11,
    fontFamily: Font.medium,
    color: Colors.danger,
  },
  pillOk: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.successLight,
    borderWidth: 1,
    borderColor: Colors.success + '28',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },
  pillTextOk: {
    fontSize: 11,
    fontFamily: Font.medium,
    color: Colors.success,
  },

  // CTA
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: Colors.danger,
    paddingVertical: 13,
    borderRadius: 12,
  },
  ctaText: {
    flex: 1,
    color: '#fff',
    fontFamily: Font.semibold,
    fontSize: 15,
    letterSpacing: 0.1,
  },
});
