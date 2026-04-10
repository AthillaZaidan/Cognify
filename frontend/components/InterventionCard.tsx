import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { Font } from '../constants/typography';
import type { Intervention } from '../types/api';

// ─── Per-type visual config ───────────────────────────────────────────────────
interface TypeConfig {
  icon: React.ComponentProps<typeof Feather>['name'];
  color: string;
  bg: string;
  chipLabel: string;
  duration: string;
}

const TYPE_CONFIG: Record<string, TypeConfig> = {
  focus_reset: {
    icon: 'target',
    color: Colors.interventionFocus,
    bg: '#FFFBEB',
    chipLabel: 'FOCUS RESET',
    duration: '~2 min',
  },
  sleep_hygiene: {
    icon: 'moon',
    color: Colors.interventionSleep,
    bg: '#F5F3FF',
    chipLabel: 'SLEEP HYGIENE',
    duration: '~10 min',
  },
  sustained_focus: {
    icon: 'clock',
    color: Colors.interventionDeep,
    bg: '#EFF6FF',
    chipLabel: 'SUSTAINED FOCUS',
    duration: '~20 min',
  },
  screen_break: {
    icon: 'smartphone',
    color: Colors.interventionScreen,
    bg: '#F0FDFA',
    chipLabel: 'SCREEN BREAK',
    duration: '~10 min',
  },
  routine_anchor: {
    icon: 'list',
    color: Colors.interventionRoutine,
    bg: '#F0FDF4',
    chipLabel: 'ROUTINE ANCHOR',
    duration: '~5 min',
  },
};

const FALLBACK_CONFIG: TypeConfig = {
  icon: 'zap',
  color: Colors.accent,
  bg: Colors.accentLight,
  chipLabel: 'ACTION',
  duration: '~5 min',
};

// ─── Component ────────────────────────────────────────────────────────────────
interface Props {
  item: Intervention;
  onComplete: (id: number) => void;
  onDismiss: (id: number) => void;
  muted?: boolean;
}

export function InterventionCard({ item, onComplete, onDismiss, muted }: Props) {
  const [stepsOpen, setStepsOpen] = useState(!muted);
  const cfg = TYPE_CONFIG[item.type] ?? FALLBACK_CONFIG;

  return (
    <View
      style={[
        styles.card,
        { borderLeftColor: muted ? Colors.border : cfg.color },
        muted && styles.cardMuted,
      ]}
    >
      {/* ── Top meta row ── */}
      <View style={styles.metaRow}>
        <View style={[styles.chip, { backgroundColor: muted ? Colors.surfaceMuted : cfg.bg }]}>
          <Text style={[styles.chipText, { color: muted ? Colors.textMuted : cfg.color }]}>
            {cfg.chipLabel}
          </Text>
        </View>
        <View style={styles.durationBadge}>
          <Feather name="clock" size={10} color={Colors.textSubtle} />
          <Text style={styles.durationText}>{cfg.duration}</Text>
        </View>
      </View>

      {/* ── Icon + Title ── */}
      <View style={styles.titleRow}>
        <View
          style={[
            styles.iconCircle,
            { backgroundColor: muted ? Colors.surfaceMuted : cfg.bg },
          ]}
        >
          <Feather
            name={cfg.icon}
            size={18}
            color={muted ? Colors.textMuted : cfg.color}
          />
        </View>
        <Text style={[styles.title, muted && styles.titleMuted]} numberOfLines={2}>
          {item.title}
        </Text>
      </View>

      {/* ── Description ── */}
      <Text style={styles.description}>{item.content}</Text>

      {/* ── Steps toggle ── */}
      <Pressable style={styles.toggleRow} onPress={() => setStepsOpen(!stepsOpen)}>
        <View style={[styles.toggleLine, { backgroundColor: muted ? Colors.border : cfg.color + '30' }]} />
        <Text style={[styles.toggleLabel, { color: muted ? Colors.textMuted : cfg.color }]}>
          {stepsOpen ? 'Hide steps  ▲' : `${item.steps.length} steps  ▼`}
        </Text>
        <View style={[styles.toggleLine, { backgroundColor: muted ? Colors.border : cfg.color + '30' }]} />
      </Pressable>

      {/* ── Step timeline ── */}
      {stepsOpen && (
        <View style={styles.stepsContainer}>
          {item.steps.map((step, i) => (
            <View key={i} style={styles.stepRow}>
              {/* Left: number + connector line */}
              <View style={styles.stepLeft}>
                <View
                  style={[
                    styles.stepBubble,
                    {
                      backgroundColor: muted ? Colors.surfaceMuted : cfg.bg,
                      borderColor: muted ? Colors.border : cfg.color,
                    },
                  ]}
                >
                  <Text style={[styles.stepNum, { color: muted ? Colors.textMuted : cfg.color }]}>
                    {i + 1}
                  </Text>
                </View>
                {i < item.steps.length - 1 && (
                  <View
                    style={[
                      styles.stepConnector,
                      { backgroundColor: muted ? Colors.border : cfg.color + '28' },
                    ]}
                  />
                )}
              </View>
              {/* Right: step text */}
              <Text style={[styles.stepText, muted && styles.stepTextMuted]}>{step}</Text>
            </View>
          ))}
        </View>
      )}

      {/* ── Actions / completion ── */}
      {!muted ? (
        <View style={styles.actions}>
          <Pressable
            style={[styles.completeBtn, { backgroundColor: cfg.color }]}
            onPress={() => onComplete(item.id)}
          >
            <Feather name="check" size={13} color="#fff" />
            <Text style={styles.completeBtnText}>Mark Complete</Text>
          </Pressable>
          <Pressable style={styles.dismissBtn} onPress={() => onDismiss(item.id)}>
            <Text style={styles.dismissText}>Dismiss</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.doneRow}>
          <Feather name="check-circle" size={13} color={Colors.success} />
          <Text style={styles.doneText}>
            Completed{item.completed_at ? ` · ${new Date(item.completed_at).toLocaleDateString()}` : ''}
          </Text>
        </View>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderLeftWidth: 3,
    // shadow
    shadowColor: '#1A1D2E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardMuted: {
    backgroundColor: Colors.surfaceMuted,
    shadowOpacity: 0,
    elevation: 0,
  },

  // Meta row
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  chip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  chipText: {
    fontSize: 10,
    fontFamily: Font.bold,
    letterSpacing: 0.8,
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  durationText: {
    fontSize: 11,
    fontFamily: Font.medium,
    color: Colors.textSubtle,
  },

  // Title
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontFamily: Font.bold,
    color: Colors.text,
    letterSpacing: -0.3,
    lineHeight: 22,
  },
  titleMuted: { color: Colors.textMuted },

  // Description
  description: {
    fontSize: 13,
    fontFamily: Font.regular,
    color: Colors.textMuted,
    lineHeight: 19,
    marginBottom: 12,
    paddingLeft: 48,
  },

  // Steps toggle
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  toggleLine: { flex: 1, height: 1 },
  toggleLabel: {
    fontSize: 11,
    fontFamily: Font.bold,
    letterSpacing: 0.4,
  },

  // Step timeline
  stepsContainer: { paddingLeft: 4, marginBottom: 12 },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  stepLeft: {
    alignItems: 'center',
    width: 28,
  },
  stepBubble: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNum: {
    fontSize: 12,
    fontFamily: Font.bold,
  },
  stepConnector: {
    width: 2,
    height: 20,
    borderRadius: 1,
    marginVertical: 2,
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    fontFamily: Font.regular,
    color: Colors.text,
    lineHeight: 20,
    paddingTop: 4,
    paddingBottom: 22,
  },
  stepTextMuted: { color: Colors.textMuted },

  // Actions
  actions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  completeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: 10,
  },
  completeBtnText: {
    color: '#fff',
    fontFamily: Font.semibold,
    fontSize: 14,
  },
  dismissBtn: {
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dismissText: {
    color: Colors.textMuted,
    fontFamily: Font.medium,
    fontSize: 14,
  },

  // Done state
  doneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  doneText: {
    fontSize: 12,
    fontFamily: Font.medium,
    color: Colors.success,
  },
});
