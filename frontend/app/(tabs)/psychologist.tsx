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
import { LinearGradient } from 'expo-linear-gradient';

function severityLabel(s: string): string {
  const v = s.toLowerCase();
  if (v === 'high' || v === 'severe') return 'SEVERE';
  if (v === 'moderate') return 'MODERATE';
  return 'MILD';
}
function isHighSeverity(s: string): boolean {
  const v = s.toLowerCase();
  return v === 'high' || v === 'severe';
}

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
      contentContainerStyle={{ paddingBottom: 40, paddingTop: insets.top + 24 }}
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
        <View style={styles.header}>
          <Text style={styles.title}>Patients</Text>
          <Text style={styles.sub}>Highest WCS first · {patients.length} on roster</Text>
        </View>

        <Text style={styles.section}>Open alerts</Text>
        {unacked.length === 0 ? (
          <View style={styles.emptyAlerts}>
            <Text style={styles.muted}>None.</Text>
          </View>
        ) : (
          <View style={styles.alertsList}>
            {unacked.map((a) => (
              <View key={a.id} style={styles.alertCardContainer}>
                <LinearGradient
                  colors={[Colors.border, Colors.border]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.gradientBorder}
                >
                  <View style={styles.alertCard}>
                    <View style={styles.alertTop}>
                      <Text style={styles.patientName}>{a.patient_name}</Text>
                      <View style={[styles.sev, isHighSeverity(a.severity) ? styles.sevHigh : styles.sevMedium]}>
                        <Text style={[styles.sevText, isHighSeverity(a.severity) ? styles.sevTextHigh : styles.sevTextMedium]}>
                          {severityLabel(a.severity)}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.summary}>{a.summary}</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Notes (optional)"
                      placeholderTextColor={Colors.textSubtle}
                      value={notes[a.id] ?? ''}
                      onChangeText={(t) => setNotes((n) => ({ ...n, [a.id]: t }))}
                      multiline
                    />
                    <Pressable onPress={() => void ack(a.id)} style={styles.ackBtnWrapper}>
                      <LinearGradient
                        colors={[Colors.accent, '#2A46B8']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.ackBtn}
                      >
                        <Text style={styles.ackText}>Acknowledge</Text>
                      </LinearGradient>
                    </Pressable>
                  </View>
                </LinearGradient>
              </View>
            ))}
          </View>
        )}

        <Text style={[styles.section, { marginTop: 32 }]}>Patients</Text>
        <View style={styles.patientsList}>
          {patients.map((p) => (
            <PatientRow key={p.id} patient={p} />
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  pad: { paddingHorizontal: 20 },
  header: { marginBottom: 32 },
  title: { fontSize: 30, fontFamily: Font.bold, color: Colors.text, letterSpacing: -0.8, marginBottom: 6 },
  sub: { fontSize: 15, fontFamily: Font.medium, color: Colors.textMuted, letterSpacing: 0.2 },
  section: { fontSize: 18, fontFamily: Font.bold, color: Colors.text, marginBottom: 16, letterSpacing: -0.2 },
  emptyAlerts: {
    paddingVertical: 24,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  muted: { fontSize: 15, fontFamily: Font.medium, color: Colors.textSubtle, textAlign: 'center' },
  alertsList: { gap: 16 },
  alertCardContainer: {
    borderRadius: 16,
    shadowColor: '#3B5DE7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  gradientBorder: {
    borderRadius: 16,
    padding: 1,
  },
  alertCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    borderLeftWidth: 4,
    borderLeftColor: Colors.danger,
  },
  alertTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  patientName: { fontSize: 18, fontFamily: Font.bold, color: Colors.text, letterSpacing: -0.3 },
  sev: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  sevHigh: { backgroundColor: 'rgba(239, 68, 68, 0.1)' },
  sevMedium: { backgroundColor: 'rgba(245, 158, 11, 0.1)' },
  sevText: { fontSize: 12, fontFamily: Font.bold, textTransform: 'uppercase', letterSpacing: 0.5 },
  sevTextHigh: { color: Colors.danger },
  sevTextMedium: { color: Colors.warning },
  summary: { fontSize: 15, fontFamily: Font.regular, color: Colors.textMuted, marginBottom: 16, lineHeight: 22 },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    color: Colors.text,
    fontFamily: Font.regular,
    fontSize: 15,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  ackBtnWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  ackBtn: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ackText: { color: '#FFFFFF', fontFamily: Font.bold, fontSize: 15, letterSpacing: 0.2 },
  patientsList: { gap: 12 },
});
