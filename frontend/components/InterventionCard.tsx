import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../constants/colors';
import { Font } from '../constants/typography';
import type { Intervention } from '../types/api';

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
    color: '#F59E0B',
    bg: 'rgba(245, 158, 11, 0.1)',
    chipLabel: 'FOCUS RESET',
    duration: '~2 min',
  },
  sleep_hygiene: {
    icon: 'moon',
    color: '#8B5CF6',
    bg: 'rgba(139, 92, 246, 0.1)',
    chipLabel: 'SLEEP HYGIENE',
    duration: '~10 min',
  },
  sustained_focus: {
    icon: 'clock',
    color: '#3B5DE7',
    bg: 'rgba(59, 93, 231, 0.1)',
    chipLabel: 'SUSTAINED FOCUS',
    duration: '~20 min',
  },
  screen_break: {
    icon: 'smartphone',
    color: '#14B8A6',
    bg: 'rgba(20, 184, 166, 0.1)',
    chipLabel: 'SCREEN BREAK',
    duration: '~10 min',
  },
  routine_anchor: {
    icon: 'list',
    color: '#22C55E',
    bg: 'rgba(34, 197, 94, 0.1)',
    chipLabel: 'ROUTINE ANCHOR',
    duration: '~5 min',
  },
};

const FALLBACK_CONFIG: TypeConfig = {
  icon: 'zap',
  color: '#3B5DE7',
  bg: 'rgba(59, 93, 231, 0.1)',
  chipLabel: 'ACTION',
  duration: '~5 min',
};

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
    <View style={styles.cardContainer}>
      <View
        style={[
          styles.card,
          { borderLeftColor: muted ? '#E2E8F5' : cfg.color },
          muted && styles.cardMuted,
        ]}
      >
          <View style={styles.metaRow}>
            <View style={[styles.chip, { backgroundColor: muted ? '#F5F8FF' : cfg.bg }]}>
              <Text style={[styles.chipText, { color: muted ? '#6B7A99' : cfg.color }]}>
                {cfg.chipLabel}
              </Text>
            </View>
            <View style={styles.durationBadge}>
              <Feather name="clock" size={14} color="#6B7A99" />
              <Text style={styles.durationText}>{cfg.duration}</Text>
            </View>
          </View>

          <View style={styles.titleRow}>
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: muted ? '#F5F8FF' : cfg.bg },
              ]}
            >
              <Feather
                name={cfg.icon}
                size={22}
                color={muted ? '#6B7A99' : cfg.color}
              />
            </View>
            <Text style={[styles.title, muted && styles.titleMuted]} numberOfLines={2}>
              {item.title}
            </Text>
          </View>

          <Text style={styles.description}>{item.content}</Text>

          <Pressable style={styles.toggleRow} onPress={() => setStepsOpen(!stepsOpen)}>
            <View style={[styles.toggleLine, { backgroundColor: muted ? '#E2E8F5' : cfg.color + '30' }]} />
            <Text style={[styles.toggleLabel, { color: muted ? '#6B7A99' : cfg.color }]}>
              {stepsOpen ? 'Hide steps  ▲' : `${item.steps.length} steps  ▼`}
            </Text>
            <View style={[styles.toggleLine, { backgroundColor: muted ? '#E2E8F5' : cfg.color + '30' }]} />
          </Pressable>

          {stepsOpen && (
            <View style={styles.stepsContainer}>
              {item.steps.map((step, i) => (
                <View key={i} style={styles.stepRow}>
                  <View style={styles.stepLeft}>
                    <View
                      style={[
                        styles.stepBubble,
                        {
                          backgroundColor: muted ? '#F5F8FF' : cfg.bg,
                          borderColor: muted ? '#E2E8F5' : cfg.color,
                        },
                      ]}
                    >
                      <Text style={[styles.stepNum, { color: muted ? '#6B7A99' : cfg.color }]}>
                        {i + 1}
                      </Text>
                    </View>
                    {i < item.steps.length - 1 && (
                      <View
                        style={[
                          styles.stepConnector,
                          { backgroundColor: muted ? '#E2E8F5' : cfg.color + '40' },
                        ]}
                      />
                    )}
                  </View>
                  <Text style={[styles.stepText, muted && styles.stepTextMuted]}>{step}</Text>
                </View>
              ))}
            </View>
          )}

          {!muted ? (
            <View style={styles.actions}>
              <Pressable
                style={styles.completeBtnContainer}
                onPress={() => onComplete(item.id)}
              >
                <LinearGradient
                  colors={[cfg.color, cfg.color + 'E6']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.completeBtn}
                >
                  <Feather name="check" size={18} color="#FFFFFF" />
                  <Text style={styles.completeBtnText}>Mark Complete</Text>
                </LinearGradient>
              </Pressable>
              <Pressable style={styles.dismissBtn} onPress={() => onDismiss(item.id)}>
                <Text style={styles.dismissText}>Dismiss</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.doneRow}>
              <Feather name="check-circle" size={16} color="#22C55E" />
              <Text style={styles.doneText}>
                Completed{item.completed_at ? ` · ${new Date(item.completed_at).toLocaleDateString()}` : ''}
              </Text>
            </View>
          )}
        </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    marginBottom: 20,
    borderRadius: 20,
    shadowColor: '#3B5DE7',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: '#E2E8F5',
  },
  cardMuted: {
    backgroundColor: '#F5F8FF',
    opacity: 0.9,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  chipText: {
    fontSize: 11,
    fontFamily: Font.extrabold,
    letterSpacing: 1,
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  durationText: {
    fontSize: 13,
    fontFamily: Font.bold,
    color: '#6B7A99',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontFamily: Font.extrabold,
    color: '#0F1B2E',
    letterSpacing: -0.5,
    lineHeight: 26,
  },
  titleMuted: { color: '#6B7A99' },
  description: {
    fontSize: 15,
    fontFamily: Font.medium,
    color: '#6B7A99',
    lineHeight: 24,
    marginBottom: 24,
    paddingLeft: 60,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 20,
  },
  toggleLine: { flex: 1, height: 1 },
  toggleLabel: {
    fontSize: 13,
    fontFamily: Font.bold,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  stepsContainer: { paddingLeft: 8, marginBottom: 24 },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 20,
  },
  stepLeft: {
    alignItems: 'center',
    width: 36,
  },
  stepBubble: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNum: {
    fontSize: 14,
    fontFamily: Font.bold,
  },
  stepConnector: {
    width: 2,
    height: 28,
    borderRadius: 1,
    marginVertical: 6,
  },
  stepText: {
    flex: 1,
    fontSize: 16,
    fontFamily: Font.medium,
    color: '#0F1B2E',
    lineHeight: 24,
    paddingTop: 6,
    paddingBottom: 28,
  },
  stepTextMuted: { color: '#6B7A99' },
  actions: { flexDirection: 'row', gap: 16, marginTop: 8 },
  completeBtnContainer: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#3B5DE7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  completeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
  },
  completeBtnText: {
    color: '#FFFFFF',
    fontFamily: Font.bold,
    fontSize: 16,
    letterSpacing: 0.5,
  },
  dismissBtn: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F5',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  dismissText: {
    color: '#6B7A99',
    fontFamily: Font.bold,
    fontSize: 16,
  },
  doneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  doneText: {
    fontSize: 14,
    fontFamily: Font.bold,
    color: '#22C55E',
  },
});