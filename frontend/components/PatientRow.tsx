import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';
import { Font } from '../constants/typography';
import { RiskBadge } from './RiskBadge';
import type { PatientSummary } from '../types/api';

function initials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function riskAccent(level: string) {
  const l = level.toLowerCase();
  if (l === 'attention_needed') return Colors.danger;
  if (l === 'mild_drift') return Colors.warning;
  return Colors.success;
}

function relativeDate(iso: string | null): string {
  if (!iso) return '—';
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return `${diff}d ago`;
}

export function PatientRow({ patient }: { patient: PatientSummary }) {
  const accent = riskAccent(patient.latest_risk_level);
  return (
    <View style={styles.row}>
      {/* Left accent strip */}
      <View style={[styles.strip, { backgroundColor: accent }]} />

      {/* Avatar */}
      <View style={[styles.avatar, { backgroundColor: accent + '18' }]}>
        <Text style={[styles.avatarText, { color: accent }]}>
          {initials(patient.name)}
        </Text>
      </View>

      {/* Info */}
      <View style={styles.info}>
        <Text style={styles.name}>{patient.name}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.meta}>WCS {patient.latest_wcs.toFixed(1)}</Text>
          <View style={styles.dot} />
          <Text style={styles.meta}>{patient.active_anomalies} anomalies</Text>
          <View style={styles.dot} />
          <Text style={styles.meta}>{relativeDate(patient.last_active)}</Text>
        </View>
      </View>

      <RiskBadge level={patient.latest_risk_level} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingRight: 4,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    gap: 10,
  },
  strip: {
    width: 3,
    height: 40,
    borderRadius: 2,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: Font.bold, fontSize: 13 },
  info: { flex: 1 },
  name: {
    fontSize: 15,
    fontFamily: Font.semibold,
    color: Colors.text,
    letterSpacing: -0.2,
    marginBottom: 3,
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  meta: { fontSize: 12, fontFamily: Font.regular, color: Colors.textMuted },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Colors.textSubtle,
  },
});
