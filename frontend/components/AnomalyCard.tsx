import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { Colors } from '../constants/colors';
import { Font } from '../constants/typography';
import type { AnomalySnapshot } from '../types/api';
import { describeAnomalyBody, signalToTitle } from '../utils/format';

interface Props {
  anomaly: AnomalySnapshot;
  onStartReset: () => void;
}

export function AnomalyCard({ anomaly, onStartReset }: Props) {
  const topSignal = anomaly.anomalous_signals[0] ?? 'app_switches_per_hour';
  const z = anomaly.z_scores[topSignal];
  const title = `High ${signalToTitle(topSignal)} Detected`;

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <View style={styles.dot} />
        <Text style={styles.tag}>Outside baseline</Text>
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{describeAnomalyBody(topSignal, z)}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillRow}>
        {anomaly.shap_contributions.slice(0, 4).map((c) => (
          <View
            key={c.feature}
            style={[
              styles.pill,
              c.direction === 'toward_anomaly' ? styles.pillBad : styles.pillOk,
            ]}
          >
            <Text style={styles.pillText}>
              {c.feature.replace(/_/g, ' ')} {c.direction === 'toward_anomaly' ? '↑' : '↓'}
            </Text>
          </View>
        ))}
      </ScrollView>
      <Pressable style={styles.btn} onPress={onStartReset}>
        <Text style={styles.btnText}>View actions</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: Colors.dangerLight,
    borderWidth: 1,
    borderColor: Colors.danger + '44',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.danger,
    marginRight: 8,
  },
  tag: {
    color: Colors.danger,
    fontSize: 11,
    fontFamily: Font.bold,
    letterSpacing: 0.8,
  },
  title: { fontSize: 17, fontFamily: Font.bold, color: Colors.text, marginBottom: 6, letterSpacing: -0.2 },
  body: { fontSize: 14, fontFamily: Font.regular, color: Colors.textMuted, marginBottom: 12, lineHeight: 20 },
  pillRow: { flexGrow: 0, marginBottom: 12 },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 8,
  },
  pillBad: { backgroundColor: Colors.dangerLight },
  pillOk: { backgroundColor: Colors.accentLight },
  pillText: { fontSize: 12, fontFamily: Font.medium, color: Colors.text },
  btn: {
    backgroundColor: Colors.danger,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnText: { color: '#fff', fontFamily: Font.semibold, fontSize: 15 },
});
