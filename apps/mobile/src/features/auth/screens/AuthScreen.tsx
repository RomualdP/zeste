import React, { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Bubble, Button, Header } from '../../../shared/components';
import { color, radius, space, type } from '../../../shared/theme';
import type { AuthStackParamList } from '../../../navigation/types';
import { useAuth } from '../hooks/useAuth';

type Props = NativeStackScreenProps<AuthStackParamList, 'Auth'>;

type Mode = 'signin' | 'signup';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const INVALID_EMAIL_MSG = 'Hmm, ce format d’email a l’air bizarre.';

export function AuthScreen({}: Props) {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<Mode>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isSignup = mode === 'signup';
  const submitLabel = isSignup ? 'Créer mon compte' : 'Se connecter';
  const toggleLabel = isSignup
    ? 'Déjà un compte ? Se connecter'
    : 'Pas encore de compte ? Créer un compte';

  const canSubmit = useMemo(() => {
    if (!email || !password) return false;
    if (isSignup && !name.trim()) return false;
    return true;
  }, [email, password, name, isSignup]);

  const handleToggle = () => {
    setMode(isSignup ? 'signin' : 'signup');
    setError(null);
  };

  const handleSubmit = async () => {
    if (loading) return;
    if (!EMAIL_REGEX.test(email.trim())) {
      setError(INVALID_EMAIL_MSG);
      return;
    }

    setError(null);
    setLoading(true);
    try {
      if (isSignup) {
        await signUp(email.trim(), password, name.trim());
        setMode('signin');
        setPassword('');
      } else {
        await signIn(email.trim(), password);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Header />

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <Bubble from="app">
          <Text style={styles.bubbleText}>
            Hello 👋 Contente de te rencontrer.{'\n'}
            {isSignup
              ? 'On crée ton compte ?'
              : 'Connecte-toi pour retrouver tes épisodes.'}
          </Text>
        </Bubble>

        <View style={styles.fields}>
          {isSignup ? (
            <TextInput
              style={styles.input}
              placeholder="Ton prénom"
              placeholderTextColor={color.mute2}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              testID="auth-name"
            />
          ) : null}

          <TextInput
            style={styles.input}
            placeholder="ton@email.com"
            placeholderTextColor={color.mute2}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            testID="auth-email"
          />

          <TextInput
            style={styles.input}
            placeholder="Mot de passe"
            placeholderTextColor={color.mute2}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            testID="auth-password"
          />
        </View>

        {error ? (
          <View style={styles.dangerWrapper}>
            <Bubble from="app">
              <Text style={[styles.bubbleText, styles.dangerText]}>{error}</Text>
            </Bubble>
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.footer}>
        <Button
          label={submitLabel}
          onPress={handleSubmit}
          disabled={!canSubmit}
          loading={loading}
          testID="auth-submit"
        />
        <TouchableOpacity
          accessibilityRole="button"
          activeOpacity={0.7}
          onPress={handleToggle}
          style={styles.toggle}
        >
          <Text style={styles.toggleLabel}>{toggleLabel}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: color.bg,
  },
  scroll: {
    paddingHorizontal: space.xl,
    paddingTop: space.lg,
    paddingBottom: space['2xl'],
  },
  bubbleText: {
    fontSize: type.body.fontSize,
    fontWeight: type.body.fontWeight,
    lineHeight: type.body.lineHeight,
    color: color.ink,
  },
  fields: {
    marginTop: space.xl,
    gap: space.md,
  },
  input: {
    height: 56,
    borderRadius: radius.pill,
    paddingHorizontal: 22,
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.line,
    fontSize: type.body.fontSize,
    color: color.ink,
  },
  dangerWrapper: {
    marginTop: space.lg,
  },
  dangerText: {
    color: color.danger,
  },
  footer: {
    paddingHorizontal: space.xl,
    paddingBottom: space['2xl'],
    paddingTop: space.md,
    gap: space.md,
  },
  toggle: {
    alignItems: 'center',
    paddingVertical: space.sm,
  },
  toggleLabel: {
    fontSize: type.meta.fontSize,
    fontWeight: type.meta.fontWeight,
    color: color.mute,
  },
});
