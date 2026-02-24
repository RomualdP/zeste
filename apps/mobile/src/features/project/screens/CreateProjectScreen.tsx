import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { apiPost } from '../../../shared/services/api';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../../../navigation/types';
import type { Project } from '@zeste/shared';

type Props = NativeStackScreenProps<MainStackParamList, 'CreateProject'>;

export function CreateProjectScreen({ navigation }: Props) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      const project = await apiPost<Project>('/api/projects', { name: name.trim() });
      navigation.replace('ProjectDetail', { projectId: project.id });
    } catch (err: any) {
      Alert.alert('Erreur', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Nom du projet</Text>
      <TextInput
        style={styles.input}
        placeholder="Ex: L'IA en 2026"
        value={name}
        onChangeText={setName}
        autoFocus
        testID="project-name-input"
      />
      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleCreate}
        disabled={loading || !name.trim()}
        testID="create-project-submit"
      >
        <Text style={styles.buttonText}>
          {loading ? 'Création...' : 'Créer le projet'}
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
