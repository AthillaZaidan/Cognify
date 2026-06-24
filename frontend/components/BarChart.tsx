import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
              <LinearGradient
                colors={['#3B5DE7', '#2A47C7']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.fill, { width: `${pct}%` }]}
              />
            </View>
            <Text style={styles.val}>
              {r.value.toFixed(1)}
              <Text style={styles.unit}>{unit}</Text>
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { 
    gap: 16, 
    width: '100%',
    paddingVertical: 12,
  },
  row: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 16 
  },
  label: { 
    width: 44, 
    fontSize: 14, 
    fontFamily: Font.bold, 
    color: '#6B7A99',
    letterSpacing: 0.5,
  },
  track: {
    flex: 1,
    height: 16,
    backgroundColor: '#F5F8FF',
    borderRadius: 8,
    overflow: 'hidden',
  },
  fill: { 
    height: '100%', 
    borderRadius: 8,
  },
  val: { 
    width: 64, 
    fontSize: 15, 
    fontFamily: Font.extrabold, 
    color: '#0F1B2E', 
    textAlign: 'right',
    letterSpacing: 0.2,
  },
  unit: {
    fontFamily: Font.bold,
    color: '#6B7A99',
    fontSize: 12,
  }
});