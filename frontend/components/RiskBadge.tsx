import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';
import { Font } from '../constants/typography';

type Risk = 'stable' | 'mild_drift' | 'attention_needed' | string;

export function RiskBadge({ level }: { level: Risk }) {
  const normalized = (level || 'stable').toLowerCase();
  let bg = Colors.success + '22';
  let color = Colors.success;
  let label = 'Stable';

  if (normalized === 'attention_needed') {
    bg = Colors.dangerLight;
    color = Colors.danger;
    label = 'Attention Needed';
  } else if (normalized === 'mild_drift') {
    bg = Colors.warningLight;
    color = Colors.warning;
    label = 'Mild Drift';
  }

  return (
    <View style={[styles.pill, { backgroundColor: bg }]}>
      <Text style={[styles.text, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  text: {
    fontSize: 11,
    fontFamily: Font.bold,
    letterSpacing: 0.2,
  },
});
