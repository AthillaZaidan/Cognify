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

function riskColor(level: string) {
  const l = level.toLowerCase();
  if (l === 'attention_needed') return Colors.danger;
  if (l === 'mild_drift') return Colors.warning;
  return Colors.success;
}

export function PatientRow({ patient }: { patient: PatientSummary }) {
  return (
    <View style={styles.row}>
      <View style={[styles.avatar, { backgroundColor: riskColor(patient.latest_risk_level) + '33' }]}>
        <Text style={[styles.avatarText, { color: riskColor(patient.latest_risk_level) }]}>
          {initials(patient.name)}
        </Text>
      </View>
      <View style={styles.mid}>
        <Text style={styles.name}>{patient.name}</Text>
        <Text style={styles.sub}>
          BDS: {patient.latest_wcs.toFixed(1)} — {patient.active_anomalies} anomalies
        </Text>
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
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: Font.bold, fontSize: 13 },
  mid: { flex: 1 },
  name: { fontSize: 16, fontFamily: Font.bold, color: Colors.text, letterSpacing: -0.2 },
  sub: { fontSize: 12, fontFamily: Font.regular, color: Colors.textMuted, marginTop: 2 },
});
