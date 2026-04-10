import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Pressable,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import {
  getInterventions,
  completeIntervention,
  dismissIntervention,
} from '../../services/api';
import type { Intervention } from '../../types/api';
import { Colors } from '../../constants/colors';
import { Font } from '../../constants/typography';
import { InterventionCard } from '../../components/InterventionCard';

export default function InterventionsScreen() {
  const insets = useSafeAreaInsets();
  const { auth } = useAuth();
  const [items, setItems] = useState<Intervention[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showDone, setShowDone] = useState(false);

  const load = useCallback(async () => {
    if (!auth || auth.role !== 'patient') return;
    const list = await getInterventions(auth.user_id);
    setItems(list);
  }, [auth]);

  useEffect(() => {
    void load();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  };

  const active = items.filter((i) => !i.completed && !i.dismissed);
  const done = items.filter((i) => i.completed);

  const onComplete = async (id: number) => {
    await completeIntervention(id);
    await load();
  };

  const onDismiss = async (id: number) => {
    await dismissIntervention(id);
    await load();
  };

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={{ paddingBottom: 40, paddingTop: insets.top + 12 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} colors={[Colors.accent]} />}
    >
      <View style={styles.pad}>
        <Text style={styles.title}>Recovery Actions</Text>
        <Text style={styles.sub}>
          {active.length > 0
            ? `${active.length} active · evidence-based CBT techniques`
            : 'All caught up'}
        </Text>

        {active.length === 0 ? (
          <View style={styles.empty}>
            <Feather name="check-circle" size={44} color={Colors.success} style={styles.emptyIcon} />
            <Text style={styles.emptyTitle}>You're on track</Text>
            <Text style={styles.emptyText}>No open actions. Your behavioral patterns look stable.</Text>
          </View>
        ) : (
          active.map((i) => (
            <InterventionCard key={i.id} item={i} onComplete={onComplete} onDismiss={onDismiss} />
          ))
        )}

        <Pressable style={styles.toggle} onPress={() => setShowDone(!showDone)}>
          <Text style={styles.toggleText}>
            {showDone ? 'Hide' : 'Show'} completed ({done.length})
          </Text>
        </Pressable>

        {showDone
          ? done.map((i) => (
              <InterventionCard
                key={i.id}
                item={i}
                onComplete={() => {}}
                onDismiss={() => {}}
                muted
              />
            ))
          : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  pad: { paddingHorizontal: 16 },
  title: { fontSize: 26, fontFamily: Font.bold, color: Colors.text, letterSpacing: -0.5, marginBottom: 4 },
  sub: { fontSize: 13, fontFamily: Font.regular, color: Colors.textMuted, marginBottom: 20, lineHeight: 18 },
  empty: { alignItems: 'center', paddingVertical: 48, paddingHorizontal: 24 },
  emptyIcon: { marginBottom: 14 },
  emptyTitle: { fontSize: 17, fontFamily: Font.bold, color: Colors.text, marginBottom: 6 },
  emptyText: { fontSize: 14, fontFamily: Font.regular, color: Colors.textMuted, textAlign: 'center', lineHeight: 20 },
  toggle: { marginVertical: 12, alignSelf: 'flex-start' },
  toggleText: { color: Colors.accent, fontFamily: Font.semibold, fontSize: 14 },
});
