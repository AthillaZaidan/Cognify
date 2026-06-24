import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Colors } from '../constants/colors';
import { Font } from '../constants/typography';

export function RiskBadge({ level }: { level: string }) {
  const normalized = (level || 'stable').toLowerCase();
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (normalized === 'attention_needed') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(0);
    }
  }, [normalized, pulseAnim]);

  let bg = '#E8FBF0';
  let color = '#22C55E';
  let label = 'STABLE';
  let dot = false;

  if (normalized === 'attention_needed') {
    bg = '#FEF0F0';
    color = '#EF4444';
    label = 'ATTENTION NEEDED';
    dot = true;
  } else if (normalized === 'mild_drift') {
    bg = '#FEF6E7';
    color = '#F59E0B';
    label = 'MILD DRIFT';
  }

  const scale = pulseAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 1.4, 1],
  });

  const opacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.8, 0],
  });

  return (
    <View style={[styles.pill, { backgroundColor: bg }]}>
      {dot && (
        <View style={styles.dotContainer}>
          <Animated.View
            style={[
              styles.pulseDot,
              {
                backgroundColor: color,
                transform: [{ scale }],
                opacity,
              },
            ]}
          />
          <View style={[styles.dot, { backgroundColor: color }]} />
        </View>
      )}
      <Text style={[styles.text, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 9999,
    gap: 6,
  },
  dotContainer: {
    width: 8,
    height: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulseDot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    fontFamily: Font.bold,
    fontSize: 11,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});