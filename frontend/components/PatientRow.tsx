import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useState } from 'react';
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
  if (l === 'attention_needed') return '#EF4444';
  if (l === 'mild_drift') return '#F59E0B';
  return '#22C55E';
}

function relativeDate(iso: string | null): string {
  if (!iso) return '—';
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return `${diff}d ago`;
}

export function PatientRow({ patient }: { patient: PatientSummary }) {
  const [isHovered, setIsHovered] = useState(false);
  const accent = riskAccent(patient.latest_risk_level);
  
  return (
    <Pressable 
      style={[styles.row, isHovered && styles.rowHovered]}
      onHoverIn={() => setIsHovered(true)}
      onHoverOut={() => setIsHovered(false)}
    >
      <View style={[styles.strip, { backgroundColor: accent }]} />

      <View style={[styles.avatar, { backgroundColor: accent + '15', borderColor: accent + '30' }]}>
        <Text style={[styles.avatarText, { color: accent }]}>
          {initials(patient.name)}
        </Text>
      </View>

      <View style={styles.info}>
        <Text style={styles.name}>{patient.name}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.meta}>WCS <Text style={styles.metaHighlight}>{patient.latest_wcs.toFixed(1)}</Text></Text>
          <View style={styles.dot} />
          <Text style={styles.meta}><Text style={styles.metaHighlight}>{patient.active_anomalies}</Text> anomalies</Text>
          <View style={styles.dot} />
          <Text style={styles.meta}>{relativeDate(patient.last_active)}</Text>
        </View>
      </View>

      <RiskBadge level={patient.latest_risk_level} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E2E8F5',
    gap: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#3B5DE7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 12,
  },
  rowHovered: {
    backgroundColor: '#F5F8FF',
    borderColor: '#3B5DE7',
  },
  strip: {
    position: 'absolute',
    left: 0,
    top: 16,
    bottom: 16,
    width: 4,
    borderRadius: 2,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  avatarText: { 
    fontFamily: Font.extrabold, 
    fontSize: 16,
    letterSpacing: 0.5,
  },
  info: { flex: 1 },
  name: {
    fontSize: 17,
    fontFamily: Font.bold,
    color: '#0F1B2E',
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  meta: { 
    fontSize: 13, 
    fontFamily: Font.medium, 
    color: '#6B7A99' 
  },
  metaHighlight: {
    color: '#0F1B2E',
    fontFamily: Font.bold,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E2E8F5',
  },
});