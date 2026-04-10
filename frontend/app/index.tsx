import { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { login } from '../services/api';
import { authFromLogin, useAuth } from '../context/AuthContext';
import { Colors } from '../constants/colors';
import { Font } from '../constants/typography';

export default function LoginScreen() {
  const { setAuth } = useAuth();
  const [loading, setLoading] = useState(false);

  const pick = async (email: string) => {
    setLoading(true);
    try {
      const res = await login({ email });
      setAuth(authFromLogin(res));
      router.replace('/(tabs)');
    } catch (e) {
      Alert.alert('Could not sign in', String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <View style={styles.brandMark}>
        <View style={styles.brandDot} />
      </View>
      <Text style={styles.title}>Cognify</Text>
      <Text style={styles.tag}>Behavioral signals for ADHD follow-up</Text>

      <Pressable
        style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
        onPress={() => pick('patient_000@cognify.demo')}
        disabled={loading}
      >
        <View style={styles.iconBox}>
          <Feather name="user" size={20} color={Colors.accent} />
        </View>
        <View style={styles.rowText}>
          <Text style={styles.rowTitle}>Patient</Text>
          <Text style={styles.rowSub}>Alex Santosa · demo</Text>
        </View>
        {loading ? (
          <ActivityIndicator color={Colors.onPrimary} />
        ) : (
          <Feather name="arrow-right" size={18} color={Colors.onPrimaryMuted} />
        )}
      </Pressable>

      <Pressable
        style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
        onPress={() => pick('psych@cognify.demo')}
        disabled={loading}
      >
        <View style={styles.iconBox}>
          <Feather name="clipboard" size={20} color={Colors.accent} />
        </View>
        <View style={styles.rowText}>
          <Text style={styles.rowTitle}>Clinician</Text>
          <Text style={styles.rowSub}>Dr. Kartika · demo</Text>
        </View>
        <Feather name="arrow-right" size={18} color={Colors.onPrimaryMuted} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 14,
  },
  brandMark: { marginBottom: 16 },
  brandDot: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.onPrimary,
  },
  title: {
    fontFamily: Font.extrabold,
    fontSize: 38,
    letterSpacing: -0.6,
    color: Colors.onPrimary,
  },
  tag: {
    fontFamily: Font.regular,
    fontSize: 15,
    lineHeight: 22,
    color: Colors.onPrimaryMuted,
    marginBottom: 32,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.14)',
    gap: 12,
  },
  rowPressed: { backgroundColor: 'rgba(255,255,255,0.14)' },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: { flex: 1 },
  rowTitle: { fontFamily: Font.semibold, fontSize: 16, color: Colors.onPrimary },
  rowSub: { fontFamily: Font.regular, fontSize: 13, color: Colors.onPrimaryMuted, marginTop: 2 },
});
