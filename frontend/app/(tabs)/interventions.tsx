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
import { FocusRings } from '../../components/Illustrations';

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
      contentContainerStyle={{ paddingBottom: 40, paddingTop: insets.top + 24 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} colors={[Colors.accent]} />}
    >
      <View style={styles.pad}>
        <View style={styles.header}>
          <Text style={styles.title}>Recovery Actions</Text>
          <Text style={styles.sub}>
            {active.length > 0
              ? `${active.length} active · CBT techniques`
              : 'All caught up'}
          </Text>
        </View>

        {active.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyIllustration}>
              <FocusRings size={100} />
            </View>
            <Text style={styles.emptyTitle}>You're on track</Text>
            <Text style={styles.emptyText}>No open actions. Behavioral patterns look stable.</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {active.map((i) => (
              <InterventionCard key={i.id} item={i} onComplete={onComplete} onDismiss={onDismiss} />
            ))}
          </View>
        )}

        <Pressable style={styles.toggle} onPress={() => setShowDone(!showDone)}>
          <Text style={styles.toggleText}>
            {showDone ? 'Hide' : 'Show'} completed ({done.length})
          </Text>
          <Feather name={showDone ? 'chevron-up' : 'chevron-down'} size={16} color={Colors.accent} />
        </Pressable>

        {showDone && (
          <View style={styles.doneList}>
            {done.map((i) => (
              <InterventionCard
                key={i.id}
                item={i}
                onComplete={() => {}}
                onDismiss={() => {}}
                muted
              />
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  pad: { paddingHorizontal: 20 },
  header: { marginBottom: 24 },
  title: { fontSize: 30, fontFamily: Font.bold, color: Colors.text, letterSpacing: -0.8, marginBottom: 6 },
  sub: { fontSize: 15, fontFamily: Font.medium, color: Colors.textMuted, letterSpacing: 0.2 },
  list: { gap: 16 },
  empty: { 
    alignItems: 'center', 
    paddingVertical: 48, 
    paddingHorizontal: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: 12,
    shadowColor: '#3B5DE7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  emptyIllustration: {
    marginBottom: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: { fontSize: 20, fontFamily: Font.bold, color: Colors.text, marginBottom: 8, letterSpacing: -0.3 },
  emptyText: { fontSize: 15, fontFamily: Font.regular, color: Colors.textMuted, textAlign: 'center', lineHeight: 22 },
  toggle: { 
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 32,
    marginBottom: 16,
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(59, 93, 231, 0.1)',
    borderRadius: 100,
  },
  toggleText: { color: Colors.accent, fontFamily: Font.semibold, fontSize: 14, letterSpacing: 0.2 },
  doneList: { gap: 12, opacity: 0.7 },
});
