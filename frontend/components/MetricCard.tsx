import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';
import { Font } from '../constants/typography';

interface Props {
  label: string;
  value: string;
  baseline?: string;
  status?: 'High' | 'Normal' | 'Low' | 'Info';
  progress?: number;
}

export function MetricCard({ label, value, baseline, status, progress }: Props) {
  let statusBg = Colors.border + '88';
  let statusColor = Colors.textMuted;
  if (status === 'High') {
    statusBg = Colors.dangerLight;
    statusColor = Colors.danger;
  } else if (status === 'Normal') {
    statusBg = Colors.successLight;
    statusColor = Colors.success;
  } else if (status === 'Low') {
    statusBg = Colors.warningLight;
    statusColor = Colors.warning;
  }

  return (
    <View style={styles.card}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value} numberOfLines={1}>
        {value}
      </Text>
      {baseline ? <Text style={styles.baseline}>{baseline}</Text> : null}
      {progress !== undefined ? (
        <View style={styles.barTrack}>
          <View style={[styles.barFill, { width: `${Math.min(100, progress * 100)}%` }]} />
        </View>
      ) : null}
      {status ? (
        <View style={[styles.pill, { backgroundColor: statusBg }]}>
          <Text style={[styles.pillText, { color: statusColor }]}>{status}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surfaceMuted,
    borderRadius: 10,
    padding: 14,
    flex: 1,
    minWidth: '45%',
  },
  label: {
    fontSize: 12,
    fontFamily: Font.medium,
    color: Colors.textMuted,
    marginBottom: 4,
    letterSpacing: 0.1,
  },
  value: {
    fontSize: 22,
    fontFamily: Font.bold,
    color: Colors.text,
    letterSpacing: -0.4,
  },
  baseline: {
    fontSize: 11,
    fontFamily: Font.regular,
    color: Colors.textMuted,
    marginTop: 4,
  },
  barTrack: {
    height: 3,
    backgroundColor: Colors.border,
    borderRadius: 2,
    marginTop: 8,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: Colors.accent,
    borderRadius: 2,
  },
  pill: {
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  pillText: {
    fontSize: 11,
    fontFamily: Font.medium,
  },
});
