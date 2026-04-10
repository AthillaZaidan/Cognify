import { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  TextInput,
} from 'react-native';
import { login } from '../services/api';
import { authFromLogin, useAuth } from '../context/AuthContext';
import { Colors } from '../constants/colors';
import { Font } from '../constants/typography';

export default function LoginScreen() {
  const { setAuth } = useAuth();
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('cognify-demo');
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    const e = email.trim();
    if (!e) {
      Alert.alert('Missing email', 'Enter your demo username (email).');
      return;
    }
    if (!pw) {
      Alert.alert('Missing password', 'Enter the demo password.');
      return;
    }
    setLoading(true);
    try {
      const res = await login({ email: e, password: pw });
      setAuth(authFromLogin(res));
    } catch (err) {
      Alert.alert('Could not sign in', String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.title}>Cognify</Text>
        <Text style={styles.tag}>ADHD follow-up · demo environment</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.formBox}>
          <Text style={styles.fieldLabel}>Username (email)</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            placeholder="e.g. patient_000@cognify.demo"
            placeholderTextColor={Colors.onPrimaryMuted}
            style={styles.input}
            editable={!loading}
          />

          <Text style={[styles.fieldLabel, { marginTop: 12 }]}>Password</Text>
          <TextInput
            value={pw}
            onChangeText={setPw}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="cognify-demo"
            placeholderTextColor={Colors.onPrimaryMuted}
            style={styles.input}
            editable={!loading}
          />

          <Pressable
            style={({ pressed }) => [styles.primaryBtn, pressed && styles.primaryBtnPressed]}
            onPress={onSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={Colors.onPrimary} />
            ) : (
              <Text style={styles.primaryBtnText}>Sign in</Text>
            )}
          </Pressable>

          <Text style={styles.hint}>
            Use one of the seeded demo emails (patients and one psychologist).
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.primary },
  header: { paddingHorizontal: 24, paddingTop: 72, paddingBottom: 28 },
  title: {
    fontFamily: Font.extrabold,
    fontSize: 36,
    letterSpacing: -0.6,
    color: Colors.onPrimary,
    marginBottom: 6,
  },
  tag: { fontFamily: Font.regular, fontSize: 14, color: Colors.onPrimaryMuted },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 48 },
  formBox: {
    marginTop: 6,
    marginBottom: 18,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  fieldLabel: {
    fontFamily: Font.medium,
    fontSize: 12,
    color: Colors.onPrimaryMuted,
    marginBottom: 8,
  },
  input: {
    fontFamily: Font.semibold,
    fontSize: 14,
    color: Colors.onPrimary,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  primaryBtn: {
    marginTop: 14,
    backgroundColor: Colors.onPrimary,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryBtnPressed: { opacity: 0.85 },
  primaryBtnText: { fontFamily: Font.bold, fontSize: 15, color: Colors.primary },
  hint: {
    marginTop: 10,
    fontFamily: Font.regular,
    fontSize: 12,
    lineHeight: 18,
    color: Colors.onPrimaryMuted,
  },
});
