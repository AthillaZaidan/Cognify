import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';
import { Font } from '../constants/typography';

interface Row {
  label: string;
  value: number;
  max: number;
}

export function BarChartWeekly({ rows, unit }: { rows: Row[]; unit: string }) {
  const maxVal = Math.max(...rows.map((r) => r.value), 0.01);

  return (
    <View style={styles.wrap}>
      {rows.map((r) => {
        const pct = (r.value / maxVal) * 100;
        return (
          <View key={r.label} style={styles.row}>
            <Text style={styles.label}>{r.label}</Text>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${pct}%` }]} />
            </View>
            <Text style={styles.val}>
              {r.value.toFixed(1)}
              {unit}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10, width: '100%' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label: { width: 36, fontSize: 12, fontFamily: Font.medium, color: Colors.textMuted },
  track: {
    flex: 1,
    height: 10,
    backgroundColor: Colors.border,
    borderRadius: 5,
    overflow: 'hidden',
  },
  fill: { height: '100%', backgroundColor: Colors.accent, borderRadius: 5 },
  val: { width: 52, fontSize: 12, fontFamily: Font.semibold, color: Colors.text, textAlign: 'right' },
});
