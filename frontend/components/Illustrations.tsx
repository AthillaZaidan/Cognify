import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Defs, RadialGradient, LinearGradient, Stop, Circle, Ellipse, Path, Rect } from 'react-native-svg';
import { Colors } from '../constants/colors';

interface IllustrationProps {
  size?: number;
}

/* ────────────────────────────────────────────────────────────
   Brain Sphere — soft 3D brain/neural sphere with gradient
   Used on: Dashboard header, empty states
─────────────────────────────────────────────────────────────── */
export function BrainSphere({ size = 120 }: IllustrationProps) {
  return (
    <View style={[styles.center, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox="0 0 120 120">
        <Defs>
          <RadialGradient id="brainGrad" cx="42%" cy="32%" r="68%">
            <Stop offset="0%" stopColor={Colors.illustrationBlueLight} />
            <Stop offset="60%" stopColor={Colors.accent} />
            <Stop offset="100%" stopColor={Colors.accentDark} />
          </RadialGradient>
          <RadialGradient id="brainShine" cx="38%" cy="28%" r="30%">
            <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.5" />
            <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Circle cx="60" cy="60" r="50" fill="url(#brainGrad)" />
        <Path
          d="M60 28 C44 28 34 40 34 54 C34 60 37 64 42 66 C42 74 48 80 56 82 C60 84 64 84 68 82 C76 80 82 74 82 66 C87 64 90 60 90 54 C90 40 78 28 62 28 Z"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="1.5"
          strokeOpacity="0.3"
        />
        <Path
          d="M50 40 Q54 36 60 38 Q56 42 58 48 Q54 46 50 40 Z M60 38 Q66 36 70 40 Q66 44 68 50 Q64 46 60 38 Z M56 50 Q62 48 68 52 Q64 54 66 60 Q60 56 56 50 Z M48 60 Q54 58 60 62 Q56 64 58 70 Q52 66 48 60 Z M62 56 Q68 54 74 58 Q70 58 72 64 Q66 60 62 56 Z"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="1.2"
          strokeOpacity="0.22"
        />
        <Circle cx="60" cy="60" r="50" fill="url(#brainShine)" />
      </Svg>
    </View>
  );
}

/* ────────────────────────────────────────────────────────────
   Moon 3D — soft 3D crescent with shadow gradient
   Used on: Sleep screen, empty states
─────────────────────────────────────────────────────────────── */
export function Moon3D({ size = 120 }: IllustrationProps) {
  return (
    <View style={[styles.center, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox="0 0 120 120">
        <Defs>
          <RadialGradient id="moonMain" cx="40%" cy="35%" r="65%">
            <Stop offset="0%" stopColor="#F4F1FC" />
            <Stop offset="50%" stopColor={Colors.illustrationLavender} />
            <Stop offset="100%" stopColor="#7C6FBC" />
          </RadialGradient>
          <RadialGradient id="moonShadow" cx="65%" cy="60%" r="50%">
            <Stop offset="0%" stopColor="#7C6FBC" stopOpacity="0.25" />
            <Stop offset="100%" stopColor="#7C6FBC" stopOpacity="0" />
          </RadialGradient>
          <LinearGradient id="starGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={Colors.illustrationGold} />
            <Stop offset="100%" stopColor="#E0A840" />
          </LinearGradient>
        </Defs>
        <Circle cx="60" cy="60" r="48" fill="url(#moonMain)" />
        <Circle cx="70" cy="66" r="45" fill={Colors.background} />
        <Circle cx="48" cy="50" r="3" fill="url(#starGrad)" opacity="0.8" />
        <Circle cx="82" cy="38" r="2" fill="url(#starGrad)" opacity="0.6" />
        <Circle cx="92" cy="58" r="2.5" fill="url(#starGrad)" opacity="0.7" />
      </Svg>
    </View>
  );
}

/* ────────────────────────────────────────────────────────────
   Focus Rings — concentric 3D rings (represents attention/focus)
   Used on: Interventions screen empty state
─────────────────────────────────────────────────────────────── */
export function FocusRings({ size = 120 }: IllustrationProps) {
  return (
    <View style={[styles.center, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox="0 0 120 120">
        <Defs>
          <RadialGradient id="ringCore" cx="40%" cy="35%" r="60%">
            <Stop offset="0%" stopColor={Colors.illustrationBlueLight} />
            <Stop offset="100%" stopColor={Colors.accent} />
          </RadialGradient>
          <LinearGradient id="ringStroke1" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor={Colors.accent} />
            <Stop offset="100%" stopColor={Colors.accentDark} />
          </LinearGradient>
        </Defs>
        <Circle cx="60" cy="60" r="54" fill="none" stroke="url(#ringStroke1)" strokeWidth="2" strokeOpacity="0.12" />
        <Circle cx="60" cy="60" r="42" fill="none" stroke="url(#ringStroke1)" strokeWidth="2.5" strokeOpacity="0.22" />
        <Circle cx="60" cy="60" r="30" fill="none" stroke="url(#ringStroke1)" strokeWidth="3" strokeOpacity="0.35" />
        <Circle cx="60" cy="60" r="20" fill="url(#ringCore)" />
      </Svg>
    </View>
  );
}

/* ────────────────────────────────────────────────────────────
   Calm Sphere — floating 3D sphere with soft ripples
   Used on: Stable state illustration
─────────────────────────────────────────────────────────────── */
export function CalmSphere({ size = 120 }: IllustrationProps) {
  return (
    <View style={[styles.center, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox="0 0 120 120">
        <Defs>
          <RadialGradient id="calmGrad" cx="38%" cy="30%" r="70%">
            <Stop offset="0%" stopColor="#E0F5F0" />
            <Stop offset="50%" stopColor={Colors.illustrationTeal} />
            <Stop offset="100%" stopColor="#3B9A96" />
          </RadialGradient>
          <RadialGradient id="calmShine" cx="36%" cy="26%" r="28%">
            <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.55" />
            <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Circle cx="60" cy="60" r="50" fill="none" stroke={Colors.illustrationTeal} strokeWidth="1.5" strokeOpacity="0.12" />
        <Circle cx="60" cy="60" r="42" fill="url(#calmGrad)" />
        <Circle cx="60" cy="60" r="42" fill="url(#calmShine)" />
        <Ellipse cx="60" cy="92" rx="28" ry="4" fill={Colors.illustrationTeal} opacity="0.1" />
      </Svg>
    </View>
  );
}

/* ────────────────────────────────────────────────────────────
   Wave Bars — 3D-style data bars illustration
   Used on: Digital Habits, chart backgrounds
─────────────────────────────────────────────────────────────── */
export function WaveBars({ size = 120 }: IllustrationProps) {
  const heights = [35, 55, 75, 60, 90, 50, 40];
  const barW = 8;
  const gap = 6;
  const startX = 26;
  return (
    <View style={[styles.center, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox="0 0 120 120">
        <Defs>
          <LinearGradient id="barGrad1" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={Colors.illustrationBlueLight} />
            <Stop offset="100%" stopColor={Colors.accent} />
          </LinearGradient>
          <LinearGradient id="barGrad2" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={Colors.accent} />
            <Stop offset="100%" stopColor={Colors.accentDark} />
          </LinearGradient>
        </Defs>
        {heights.map((h, i) => (
          <Rect
            key={i}
            x={startX + i * (barW + gap)}
            y={100 - h}
            width={barW}
            height={h}
            rx={barW / 2}
            fill={i % 2 === 0 ? 'url(#barGrad1)' : 'url(#barGrad2)'}
            opacity={0.6 + (i / heights.length) * 0.4}
          />
        ))}
      </Svg>
    </View>
  );
}

/* ────────────────────────────────────────────────────────────
   Globe Heart — 3D heart-shaped signal (clinical care)
   Used on: Anomaly card background decoration
─────────────────────────────────────────────────────────────── */
export function PulseOrb({ size = 80 }: IllustrationProps) {
  return (
    <View style={[styles.center, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox="0 0 80 80">
        <Defs>
          <RadialGradient id="pulseGrad" cx="40%" cy="35%" r="65%">
            <Stop offset="0%" stopColor={Colors.illustrationCoral} />
            <Stop offset="60%" stopColor={Colors.danger} />
            <Stop offset="100%" stopColor="#C53030" />
          </RadialGradient>
          <RadialGradient id="pulseRipple" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={Colors.danger} stopOpacity="0.2" />
            <Stop offset="80%" stopColor={Colors.danger} stopOpacity="0.05" />
            <Stop offset="100%" stopColor={Colors.danger} stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Circle cx="40" cy="40" r="38" fill="url(#pulseRipple)" />
        <Circle cx="40" cy="40" r="28" fill="none" stroke={Colors.danger} strokeWidth="1" strokeOpacity="0.15" />
        <Circle cx="40" cy="40" r="20" fill="url(#pulseGrad)" />
        <Path d="M30 40 Q35 34 40 40 L40 36 Q42 32 44 36 L44 40 Q42 46 40 44 Z" fill="#FFFFFF" opacity="0.25" />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});