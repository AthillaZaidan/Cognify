import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Pressable,
  TextInput,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { getPatients, getAlerts, acknowledgeAlert } from '../../services/api';
import type { PatientSummary, Alert as ApiAlert } from '../../types/api';
import { Colors } from '../../constants/colors';
import { Font } from '../../constants/typography';
import { PatientRow } from '../../components/PatientRow';

export default function PsychologistScreen() {
  const insets = useSafeAreaInsets();
  const { auth } = useAuth();
  const [patients, setPatients] = useState<PatientSummary[]>([]);
  const [alerts, setAlerts] = useState<ApiAlert[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [notes, setNotes] = useState<Record<number, string>>({});

  const load = useCallback(async () => {
    if (!auth || auth.role !== 'psychologist') return;
    const [p, a] = await Promise.all([getPatients(auth.user_id), getAlerts(auth.user_id)]);
    const sorted = [...p].sort((x, y) => y.latest_wcs - x.latest_wcs);
    setPatients(sorted);
    setAlerts(a);
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

  const unacked = alerts.filter((a) => !a.acknowledged);

  const ack = async (id: number) => {
    try {
      await acknowledgeAlert(id, notes[id]?.trim() || null);
      setNotes((n) => ({ ...n, [id]: '' }));
      await load();
    } catch (e) {
      Alert.alert('Error', String(e));
    }
  };

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={{ paddingBottom: 40, paddingTop: insets.top + 12 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={Colors.accent}
          colors={[Colors.accent]}
        />
      }
    >
      <View style={styles.pad}>
        <Text style={styles.title}>Patients</Text>
        <Text style={styles.sub}>Highest WCS first · {patients.length} on roster</Text>

        <Text style={styles.section}>Open alerts</Text>
        {unacked.length === 0 ? (
          <Text style={styles.muted}>None.</Text>
        ) : (
          unacked.map((a) => (
            <View key={a.id} style={styles.alertCard}>
              <View style={styles.alertTop}>
                <Text style={styles.patientName}>{a.patient_name}</Text>
                <View style={styles.sev}>
                  <Text style={styles.sevText}>{a.severity}</Text>
                </View>
              </View>
              <Text style={styles.summary}>{a.summary}</Text>
              <TextInput
                style={styles.input}
                placeholder="Notes (optional)"
                placeholderTextColor={Colors.textMuted}
                value={notes[a.id] ?? ''}
                onChangeText={(t) => setNotes((n) => ({ ...n, [a.id]: t }))}
              />
              <Pressable style={styles.ackBtn} onPress={() => void ack(a.id)}>
                <Text style={styles.ackText}>Acknowledge</Text>
              </Pressable>
            </View>
          ))
        )}

        <Text style={[styles.section, { marginTop: 20 }]}>Patients</Text>
        {patients.map((p) => (
          <PatientRow key={p.id} patient={p} />
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  pad: { paddingHorizontal: 16 },
  title: { fontSize: 26, fontFamily: Font.bold, color: Colors.text, letterSpacing: -0.4 },
  sub: { fontSize: 14, fontFamily: Font.regular, color: Colors.textMuted, marginBottom: 12, lineHeight: 20 },
  section: { fontSize: 15, fontFamily: Font.semibold, color: Colors.text, marginBottom: 8, letterSpacing: 0.1 },
  muted: { fontSize: 14, fontFamily: Font.regular, color: Colors.textMuted, marginBottom: 12 },
  alertCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
  },
  alertTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  patientName: { fontSize: 16, fontFamily: Font.bold, color: Colors.text, letterSpacing: -0.2 },
  sev: {
    backgroundColor: Colors.dangerLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  sevText: { fontSize: 11, fontFamily: Font.bold, color: Colors.danger, textTransform: 'uppercase' },
  summary: { fontSize: 14, fontFamily: Font.regular, color: Colors.textMuted, marginTop: 8, marginBottom: 8, lineHeight: 20 },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    color: Colors.text,
    fontFamily: Font.regular,
    fontSize: 14,
  },
  ackBtn: {
    backgroundColor: Colors.accent,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  ackText: { color: '#fff', fontFamily: Font.semibold, fontSize: 15 },
});
