import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Colors } from '../constants/colors';
import { Font } from '../constants/typography';

interface Props {
  title?: string;
  labels: string[];
  values: number[];
  ySuffix?: string;
  referenceLine?: number;
}

export function TrendChart({ title, labels, values, ySuffix = '', referenceLine }: Props) {
  const { width: windowW } = useWindowDimensions();
  const [containerW, setContainerW] = useState(0);

  const onLayout = useCallback((e: { nativeEvent: { layout: { width: number } } }) => {
    setContainerW(e.nativeEvent.layout.width);
  }, []);

  const dataVals = values.length ? values : [0];
  const chartW = containerW > 0 ? containerW : windowW - 32;

  const chartConfig = {
    backgroundGradientFrom: Colors.card,
    backgroundGradientTo: Colors.card,
    decimalPlaces: 1,
    color: () => Colors.accent,
    labelColor: () => Colors.textMuted,
    propsForDots: { r: '4', strokeWidth: '2', stroke: Colors.accent },
  };

  return (
    <View style={styles.wrap} onLayout={onLayout}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {chartW > 0 ? (
        <LineChart
          data={{
            labels: labels.length ? labels : ['—'],
            datasets: [{ data: dataVals }],
          }}
          width={chartW}
          height={200}
          yAxisSuffix={ySuffix}
          chartConfig={chartConfig}
          bezier
          style={styles.chart}
          segments={4}
        />
      ) : null}
      {referenceLine !== undefined ? (
        <Text style={styles.ref}>Baseline reference: {referenceLine.toFixed(2)}h</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  title: { fontSize: 15, fontFamily: Font.semibold, color: Colors.text, marginBottom: 8, letterSpacing: 0.1 },
  chart: { borderRadius: 8, marginLeft: -12 },
  ref: { fontSize: 11, color: Colors.textMuted, marginTop: 4, fontFamily: Font.regular },
});
