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
  const chartW = containerW > 0 ? containerW : windowW - 48;

  const chartConfig = {
    backgroundGradientFrom: '#FFFFFF',
    backgroundGradientFromOpacity: 0,
    backgroundGradientTo: '#FFFFFF',
    backgroundGradientToOpacity: 0,
    decimalPlaces: 1,
    color: (opacity = 1) => `rgba(59, 93, 231, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(107, 122, 153, ${opacity})`,
    strokeWidth: 4,
    propsForDots: { 
      r: '6', 
      strokeWidth: '3', 
      stroke: '#FFFFFF',
      fill: '#3B5DE7'
    },
    propsForBackgroundLines: {
      strokeDasharray: '6 6',
      stroke: '#E2E8F5',
    },
    fillShadowGradientFrom: '#3B5DE7',
    fillShadowGradientFromOpacity: 0.25,
    fillShadowGradientTo: '#3B5DE7',
    fillShadowGradientToOpacity: 0.0,
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
          height={240}
          yAxisSuffix={ySuffix}
          chartConfig={chartConfig}
          bezier
          style={styles.chart}
          segments={4}
          withVerticalLines={false}
          withOuterLines={false}
        />
      ) : null}
      {referenceLine !== undefined ? (
        <View style={styles.refContainer}>
          <View style={styles.refLine} />
          <Text style={styles.ref}>Baseline reference: {referenceLine.toFixed(2)}h</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E2E8F5',
    overflow: 'hidden',
    shadowColor: '#3B5DE7',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
  },
  title: { 
    fontSize: 18, 
    fontFamily: Font.extrabold, 
    color: '#0F1B2E', 
    marginBottom: 20, 
    letterSpacing: -0.3 
  },
  chart: { 
    borderRadius: 12, 
    marginLeft: -16,
    paddingRight: 20,
  },
  refContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 10,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F5',
  },
  refLine: {
    width: 20,
    height: 3,
    backgroundColor: '#6B7A99',
    borderRadius: 1.5,
  },
  ref: { 
    fontSize: 13, 
    color: '#6B7A99', 
    fontFamily: Font.bold,
    letterSpacing: 0.2,
  },
});