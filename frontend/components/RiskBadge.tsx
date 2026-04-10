import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';
import { Font } from '../constants/typography';

type Risk = 'stable' | 'mild_drift' | 'attention_needed' | string;

export function RiskBadge({ level }: { level: Risk }) {
  const normalized = (level || 'stable').toLowerCase();

  let bg     = Colors.successLight;
  let color  = Colors.success;
  let label  = 'Stable';
  let dot    = false;

  if (normalized === 'attention_needed') {
    bg    = Colors.dangerLight;
    color = Colors.danger;
    label = 'Attention Needed';
    dot   = true;
  } else if (normalized === 'mild_drift') {
    bg    = Colors.warningLight;
    color = Colors.warning;
    label = 'Mild Drift';
  }

  return (
    <View style={[styles.pill, { backgroundColor: bg }]}>
      {dot && <View style={[styles.dot, { backgroundColor: color }]} />}
      <Text style={[styles.text, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    fontSize: 11,
    fontFamily: Font.bold,
    letterSpacing: 0.3,
  },
});
