import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { Font } from '../constants/typography';
import type { Intervention } from '../types/api';

function typeIcon(type: string): React.ComponentProps<typeof Feather>['name'] {
  switch (type) {
    case 'focus_reset':
      return 'target';
    case 'sleep_hygiene':
      return 'moon';
    case 'deep_work':
      return 'clock';
    case 'digital_detox':
      return 'smartphone';
    case 'routine_anchor':
      return 'list';
    default:
      return 'zap';
  }
}

interface Props {
  item: Intervention;
  onComplete: (id: number) => void;
  onDismiss: (id: number) => void;
  muted?: boolean;
}

export function InterventionCard({ item, onComplete, onDismiss, muted }: Props) {
  const [open, setOpen] = useState(false);
  const icon = typeIcon(item.type);

  return (
    <View style={[styles.card, muted && styles.cardMuted]}>
      <View style={styles.top}>
        <Feather name={icon} size={22} color={muted ? Colors.textMuted : Colors.accent} />
        <View style={styles.topText}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.reason}>{item.trigger_reason}</Text>
        </View>
      </View>
      <Pressable onPress={() => setOpen(!open)} style={styles.expandHit}>
        <Text style={styles.expand}>{open ? 'Hide steps' : 'Show steps'}</Text>
      </Pressable>
      {open ? (
        <View style={styles.steps}>
          {item.steps.map((s, i) => (
            <Text key={i} style={styles.stepLine}>
              {i + 1}. {s}
            </Text>
          ))}
        </View>
      ) : null}
      {!muted ? (
        <View style={styles.actions}>
          <Pressable style={styles.completeBtn} onPress={() => onComplete(item.id)}>
            <Text style={styles.completeText}>Complete</Text>
          </Pressable>
          <Pressable style={styles.dismissBtn} onPress={() => onDismiss(item.id)}>
            <Text style={styles.dismissText}>Dismiss</Text>
          </Pressable>
        </View>
      ) : (
        <Text style={styles.doneAt}>
          Completed {item.completed_at ? new Date(item.completed_at).toLocaleDateString() : ''}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
  },
  cardMuted: { opacity: 0.85, backgroundColor: Colors.surfaceMuted },
  top: { flexDirection: 'row', gap: 12 },
  topText: { flex: 1 },
  title: { fontSize: 16, fontFamily: Font.bold, color: Colors.text, letterSpacing: -0.2 },
  reason: { fontSize: 13, fontFamily: Font.regular, color: Colors.textMuted, marginTop: 4, lineHeight: 18 },
  expandHit: { marginTop: 8 },
  expand: { fontSize: 13, color: Colors.accent, fontFamily: Font.semibold },
  steps: { marginTop: 10, paddingLeft: 4 },
  stepLine: { fontSize: 14, color: Colors.text, marginBottom: 6 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  completeBtn: {
    flex: 1,
    backgroundColor: Colors.accent,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  completeText: { color: '#fff', fontFamily: Font.semibold },
  dismissBtn: {
    flex: 1,
    backgroundColor: Colors.border,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  dismissText: { color: Colors.textMuted, fontFamily: Font.semibold },
  doneAt: { marginTop: 8, fontSize: 12, color: Colors.textMuted },
});
