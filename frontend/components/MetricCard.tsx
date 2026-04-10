import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { Font } from '../constants/typography';

interface Props {
  label: string;
  value: string;
  baseline?: string;
  status?: 'High' | 'Normal' | 'Low' | 'Info';
  progress?: number;
  /** Optional: show directional delta vs baseline  */
  delta?: 'up' | 'down' | 'neutral';
}

export function MetricCard({ label, value, baseline, status, progress, delta }: Props) {
  let statusBg   = Colors.surfaceMuted;
  let statusColor = Colors.textMuted;
  let statusIcon: React.ComponentProps<typeof Feather>['name'] = 'minus';

  if (status === 'High') {
    statusBg    = Colors.dangerLight;
    statusColor = Colors.danger;
    statusIcon  = 'alert-triangle';
  } else if (status === 'Normal') {
    statusBg    = Colors.successLight;
    statusColor = Colors.success;
    statusIcon  = 'check';
  } else if (status === 'Low') {
    statusBg    = Colors.warningLight;
    statusColor = Colors.warning;
    statusIcon  = 'arrow-down';
  }

  const deltaIcon =
    delta === 'up' ? 'arrow-up-right' :
    delta === 'down' ? 'arrow-down-right' : null;

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <Text style={styles.label}>{label}</Text>
        {status ? (
          <View style={[styles.statusDot, { backgroundColor: statusBg }]}>
            <Feather name={statusIcon} size={10} color={statusColor} />
          </View>
        ) : null}
      </View>

      <View style={styles.valueRow}>
        <Text style={styles.value} numberOfLines={1}>{value}</Text>
        {deltaIcon ? (
          <Feather
            name={deltaIcon}
            size={14}
            color={delta === 'up' ? Colors.danger : Colors.success}
            style={styles.deltaIcon}
          />
        ) : null}
      </View>

      {baseline ? (
        <Text style={styles.baseline}>{baseline}</Text>
      ) : null}

      {progress !== undefined ? (
        <View style={styles.barTrack}>
          <View
            style={[
              styles.barFill,
              {
                width: `${Math.min(100, progress * 100)}%`,
                backgroundColor:
                  status === 'High' ? Colors.danger :
                  status === 'Low'  ? Colors.warning : Colors.accent,
              },
            ]}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 14,
    flex: 1,
    minWidth: '45%',
    shadowColor: '#1A1D2E',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    fontSize: 11,
    fontFamily: Font.semibold,
    color: Colors.textMuted,
    letterSpacing: 0.2,
    flex: 1,
  },
  statusDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
  },
  value: {
    fontSize: 22,
    fontFamily: Font.extrabold,
    color: Colors.text,
    letterSpacing: -0.5,
  },
  deltaIcon: { marginBottom: 3 },
  baseline: {
    fontSize: 11,
    fontFamily: Font.regular,
    color: Colors.textSubtle,
    marginTop: 4,
  },
  barTrack: {
    height: 3,
    backgroundColor: Colors.borderLight,
    borderRadius: 2,
    marginTop: 10,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 2,
  },
});
