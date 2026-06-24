import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BrainSphere } from '../components/Illustrations';
import { Colors } from '../constants/colors';
import { Font } from '../constants/typography';
import { useAuth, authFromLogin } from '../context/AuthContext';
import { login } from '../services/api';

export default function LoginScreen() {
  const { setAuth } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please enter email and password');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const user = await login({ email, password });
      setAuth(authFromLogin(user));
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['#3B5DE7', '#2A47C7']}
      style={styles.container}
    >
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <BrainSphere size={140} />
            <Text style={styles.title}>Cognify</Text>
            <Text style={styles.subtitle}>ADHD behavioral monitoring</Text>
          </View>

          <View style={styles.card}>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={Colors.textSubtle}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor={Colors.textSubtle}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            <Pressable
              style={({ pressed }) => [
                styles.button,
                pressed && styles.buttonPressed,
                loading && styles.buttonDisabled
              ]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={Colors.accent} />
              ) : (
                <Text style={styles.buttonText}>Sign in</Text>
              )}
            </Pressable>
          </View>

          <Text style={styles.hint}>
            Try: patient_000@cognify.demo / cognify-demo
          </Text>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontFamily: Font.extrabold,
    fontSize: 40,
    color: '#FFFFFF',
    letterSpacing: -1,
    marginTop: 24,
  },
  subtitle: {
    fontFamily: Font.medium,
    fontSize: 16,
    color: Colors.onAccentMuted,
    marginTop: 8,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#3B5DE7',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  input: {
    backgroundColor: '#F5F8FF',
    borderWidth: 1,
    borderColor: '#E2E8F5',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
    marginBottom: 16,
    fontFamily: Font.medium,
    fontSize: 16,
    color: Colors.text,
  },
  button: {
    backgroundColor: '#FFFFFF',
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  buttonPressed: {
    opacity: 0.9,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    fontFamily: Font.bold,
    fontSize: 16,
    color: Colors.accent,
  },
  errorText: {
    fontFamily: Font.medium,
    fontSize: 14,
    color: Colors.danger,
    marginBottom: 16,
    textAlign: 'center',
  },
  hint: {
    fontFamily: Font.medium,
    fontSize: 14,
    color: Colors.onAccentMuted,
    textAlign: 'center',
    marginTop: 32,
  },
});
