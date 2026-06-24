import React from 'react';
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
  delta?: 'up' | 'down' | 'neutral';
}

export function MetricCard({ label, value, baseline, status, progress, delta }: Props) {
  let statusColor: string = Colors.textMuted;
  let statusIcon: React.ComponentProps<typeof Feather>['name'] = 'minus';

  if (status === 'High') {
    statusColor = Colors.danger;
    statusIcon = 'alert-triangle';
  } else if (status === 'Normal') {
    statusColor = Colors.success;
    statusIcon = 'check';
  } else if (status === 'Low') {
    statusColor = Colors.warning;
    statusIcon = 'arrow-down';
  } else if (status === 'Info') {
    statusColor = Colors.textMuted;
    statusIcon = 'info';
  }

  const deltaIcon =
    delta === 'up' ? 'arrow-up-right' :
    delta === 'down' ? 'arrow-down-right' : null;

  return (
    <View style={styles.cardContainer}>
      <View style={styles.card}>
        <View style={styles.topRow}>
          <Text style={styles.label}>{label}</Text>
          {status ? (
            <View style={[styles.statusDot, { backgroundColor: statusColor }]}>
              <Feather name={statusIcon} size={12} color="#FFFFFF" />
            </View>
          ) : null}
        </View>

        <View style={styles.valueRow}>
          <Text style={styles.value} numberOfLines={1}>{value}</Text>
          {deltaIcon ? (
            <Feather
              name={deltaIcon}
              size={16}
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
                  backgroundColor: status ? statusColor : Colors.accent,
                },
              ]}
            />
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    flex: 1,
    minWidth: '45%',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F5',
    flex: 1,
    shadowColor: '#3B5DE7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    fontFamily: Font.bold,
    color: Colors.textMuted,
    textTransform: 'uppercase',
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
    gap: 6,
  },
  value: {
    fontSize: 26,
    fontFamily: Font.extrabold,
    color: Colors.text,
    letterSpacing: -0.3,
  },
  deltaIcon: {
    marginBottom: 6,
    opacity: 0.9,
  },
  baseline: {
    fontSize: 12,
    fontFamily: Font.regular,
    color: Colors.textSubtle,
    marginTop: 6,
  },
  barTrack: {
    height: 3,
    backgroundColor: Colors.borderLight,
    borderRadius: 1.5,
    marginTop: 14,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 1.5,
  },
});
