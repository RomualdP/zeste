import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { apiPost } from '../../../shared/services/api';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../../../navigation/types';
import type { Source } from '@zeste/shared';

type Props = NativeStackScreenProps<MainStackParamList, 'AddSource'>;

function isValidUrl(text: string): boolean {
  try {
    const url = new URL(text);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export function AddSourceScreen({ route, navigation }: Props) {
  const { projectId } = route.params;
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const canSubmit = isValidUrl(url.trim()) && !loading;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    try {
      await apiPost<Source>(`/api/projects/${projectId}/sources`, {
        type: 'url',
        url: url.trim(),
      });
      navigation.goBack();
    } catch (err: any) {
      Alert.alert('Erreur', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>URL de la source</Text>
      <TextInput
        style={styles.input}
        placeholder="https://example.com/article"
        value={url}
        onChangeText={setUrl}
        autoCapitalize="none"
        keyboardType="url"
        autoFocus
        testID="source-url-input"
      />
      <TouchableOpacity
        style={[styles.button, !canSubmit && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={!canSubmit}
        testID="add-source-submit"
      >
        <Text style={styles.buttonText}>
          {loading ? 'Ajout...' : 'Ajouter'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#fff' },
  label: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 16, marginBottom: 24 },
  button: { backgroundColor: '#FF6B35', borderRadius: 8, padding: 16, alignItems: 'center' },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
