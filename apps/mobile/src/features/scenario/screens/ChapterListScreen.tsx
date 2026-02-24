import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { apiGet, apiPost } from '../../../shared/services/api';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../../../navigation/types';
import type { Chapter } from '@zeste/shared';

type Props = NativeStackScreenProps<MainStackParamList, 'ChapterList'>;

export function ChapterListScreen({ route, navigation }: Props) {
  const { projectId } = route.params;
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const loadChapters = useCallback(async () => {
    try {
      const data = await apiGet<Chapter[]>(`/api/projects/${projectId}/chapters`);
      setChapters(data);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadChapters();
  }, [loadChapters]);

  useEffect(() => {
    return navigation.addListener('focus', loadChapters);
  }, [navigation, loadChapters]);

  const handleGeneratePlan = async () => {
    setGenerating(true);
    try {
      const data = await apiPost<Chapter[]>(`/api/projects/${projectId}/generate-plan`);
      setChapters(data);
    } catch (err: any) {
      Alert.alert('Erreur', err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateScenario = async () => {
    setGenerating(true);
    try {
      const data = await apiPost<Chapter[]>(`/api/projects/${projectId}/generate`);
      setChapters(data);
    } catch (err: any) {
      Alert.alert('Erreur', err.message);
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={chapters}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card} testID={`chapter-${item.id}`}>
            <View style={styles.positionBadge}>
              <Text style={styles.positionText}>{item.position + 1}</Text>
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardSummary} numberOfLines={2}>{item.summary}</Text>
              <Text style={styles.cardStatus}>{item.status}</Text>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Aucun chapitre</Text>
        }
      />

      {chapters.length === 0 && (
        <TouchableOpacity
          style={[styles.button, generating && styles.buttonDisabled]}
          onPress={handleGeneratePlan}
          disabled={generating}
          testID="generate-plan-button"
        >
          <Text style={styles.buttonText}>
            {generating ? 'Génération...' : 'Générer le plan'}
          </Text>
        </TouchableOpacity>
      )}

      {chapters.length > 0 && (
        <TouchableOpacity
          style={[styles.button, generating && styles.buttonDisabled]}
          onPress={handleGenerateScenario}
          disabled={generating}
          testID="generate-scenario-button"
        >
          <Text style={styles.buttonText}>
            {generating ? 'Génération...' : 'Générer le scénario'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  loadingText: { textAlign: 'center', marginTop: 48, color: '#888', fontSize: 16 },
  card: { flexDirection: 'row', backgroundColor: '#fff', margin: 12, marginBottom: 0, padding: 16, borderRadius: 12 },
  positionBadge: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#FF6B35', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  positionText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  cardSummary: { fontSize: 13, color: '#666', marginBottom: 4 },
  cardStatus: { fontSize: 11, color: '#888', textTransform: 'capitalize' },
  emptyText: { textAlign: 'center', marginTop: 48, color: '#888', fontSize: 16 },
  button: { backgroundColor: '#FF6B35', margin: 16, borderRadius: 8, padding: 16, alignItems: 'center' },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
