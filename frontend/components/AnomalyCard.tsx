import { View, Text, Pressable, StyleSheet, ScrollView, Animated } from 'react-native';
import { useEffect, useRef } from 'react';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { Font } from '../constants/typography';
import { PulseOrb } from './Illustrations';
import type { AnomalySnapshot } from '../types/api';

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

  const badContribs = anomaly.shap_contributions
    .filter((c) => c.direction === 'toward_anomaly')
    .slice(0, 3);
  const okContribs = anomaly.shap_contributions
    .filter((c) => c.direction === 'toward_normal')
    .slice(0, 2);

  const accentColor = isSevere ? '#EF4444' : '#F59E0B';

  return (
    <View style={[styles.card, { borderLeftColor: accentColor }]}>
      <View style={styles.statusBar}>
        <View style={styles.statusLeft}>
          <PulseOrb size={24} />
          <Text style={styles.statusLabel}>ATTENTION</Text>
        </View>
        <View style={[styles.severityBadge, { backgroundColor: isSevere ? '#FEF0F0' : '#FEF6E7' }]}>
          <Text style={[styles.severityText, { color: accentColor }]}>
            {friendlySeverity(severity)}
          </Text>
        </View>
      </View>

      <Text style={styles.title}>
        {shortName(topSignal)} is {zMagnitude(z)} higher than usual
      </Text>
      <Text style={styles.body}>
        Today's patterns look different from what's normal for you
        {anomaly.flagged_signals > 1 ? ` — ${anomaly.flagged_signals} habits shifted` : ''}.
      </Text>

      <View style={styles.wcsRow}>
        <Text style={styles.wcsLabel}>How different</Text>
        <View style={styles.wcsTrack}>
          <View
            style={[styles.wcsFill, { width: `${Math.min(100, (anomaly.wcs / 6) * 100)}%`, backgroundColor: accentColor }]}
          />
        </View>
        <Text style={[styles.wcsValue, { color: accentColor }]}>{anomaly.wcs.toFixed(1)}</Text>
      </View>

      {(badContribs.length > 0 || okContribs.length > 0) && (
        <View style={styles.shapSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillScroll}>
            <View style={styles.pillRow}>
              {badContribs.map((c) => (
                <View key={c.feature} style={styles.pillBad}>
                  <Feather name="trending-up" size={14} color="#EF4444" />
                  <Text style={styles.pillTextBad}>{shortName(c.feature)}</Text>
                </View>
              ))}
              {okContribs.map((c) => (
                <View key={c.feature} style={styles.pillOk}>
                  <Feather name="trending-down" size={14} color="#22C55E" />
                  <Text style={styles.pillTextOk}>{shortName(c.feature)}</Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      )}

      <Pressable style={styles.cta} onPress={onStartReset}>
        <Text style={styles.ctaText}>Start Recovery Action</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    marginBottom: 24,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E2E8F5',
    borderLeftWidth: 4,
    shadowColor: '#3B5DE7',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  statusLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  statusLabel: {
    fontSize: 12,
    fontFamily: Font.extrabold,
    color: '#EF4444',
    letterSpacing: 1,
  },
  severityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  severityText: {
    fontSize: 12,
    fontFamily: Font.bold,
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 20,
    fontFamily: Font.extrabold,
    color: '#0F1B2E',
    marginBottom: 10,
    letterSpacing: -0.5,
  },
  body: {
    fontSize: 15,
    fontFamily: Font.medium,
    color: '#6B7A99',
    lineHeight: 22,
    marginBottom: 24,
  },
  wcsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 24,
  },
  wcsLabel: {
    fontSize: 13,
    fontFamily: Font.bold,
    color: '#6B7A99',
  },
  wcsTrack: {
    flex: 1,
    height: 6,
    backgroundColor: '#F5F8FF',
    borderRadius: 3,
    overflow: 'hidden',
  },
  wcsFill: {
    height: '100%',
    borderRadius: 3,
  },
  wcsValue: {
    fontSize: 15,
    fontFamily: Font.extrabold,
  },
  shapSection: { marginBottom: 28 },
  pillScroll: {
    paddingRight: 24,
  },
  pillRow: { flexDirection: 'row', gap: 10 },
  pillBad: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF0F0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  pillTextBad: {
    fontSize: 13,
    fontFamily: Font.bold,
    color: '#EF4444',
  },
  pillOk: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#E8FBF0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  pillTextOk: {
    fontSize: 13,
    fontFamily: Font.bold,
    color: '#22C55E',
  },
  cta: {
    backgroundColor: '#EF4444',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  ctaText: {
    color: '#FFFFFF',
    fontFamily: Font.bold,
    fontSize: 16,
    letterSpacing: 0.5,
  },
});