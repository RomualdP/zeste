import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { apiGet, apiPost } from '../../../shared/services/api';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../../../navigation/types';
import type { Chapter } from '@zeste/shared';

type Props = NativeStackScreenProps<MainStackParamList, 'ChapterList'>;

type Step = 'plan' | 'scenario' | 'audio' | 'done';

function getStep(chapters: Chapter[]): Step {
  if (chapters.length === 0) return 'plan';
  const hasScripts = chapters.some((c) => c.script && c.script.length > 0);
  if (!hasScripts) return 'scenario';
  const allReady = chapters.every((c) => c.status === 'ready');
  if (allReady) return 'done';
  return 'audio';
}

export function ChapterListScreen({ route, navigation }: Props) {
  const { projectId } = route.params;
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generatingLabel, setGeneratingLabel] = useState('');

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
    setGeneratingLabel('Génération du plan...');
    try {
      const data = await apiPost<Chapter[]>(`/api/projects/${projectId}/generate-plan`);
      setChapters(data);
    } catch (err: any) {
      Alert.alert('Erreur', err.message);
    } finally {
      setGenerating(false);
      setGeneratingLabel('');
    }
  };

  const handleGenerateScenario = async () => {
    setGenerating(true);
    setGeneratingLabel('Génération du scénario... (peut prendre 1-2 min)');
    try {
      const data = await apiPost<Chapter[]>(`/api/projects/${projectId}/generate`);
      setChapters(data);
      Alert.alert('Succès', 'Scénario généré ! Vous pouvez maintenant générer l\'audio.');
    } catch (err: any) {
      Alert.alert('Erreur', err.message);
    } finally {
      setGenerating(false);
      setGeneratingLabel('');
    }
  };

  const handleGenerateAudio = async () => {
    setGenerating(true);
    setGeneratingLabel('Génération audio... (peut prendre plusieurs minutes)');
    try {
      await apiPost(`/api/projects/${projectId}/generate-audio`);
      await loadChapters();
      Alert.alert('Succès', 'Audio généré avec succès !');
    } catch (err: any) {
      Alert.alert('Erreur', err.message);
    } finally {
      setGenerating(false);
      setGeneratingLabel('');
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  const step = getStep(chapters);

  return (
    <View style={styles.container}>
      <FlatList
        data={chapters}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card} testID={`chapter-${item.id}`}>
            <View style={[styles.positionBadge, item.status === 'ready' && styles.positionBadgeReady]}>
              <Text style={styles.positionText}>{item.position + 1}</Text>
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardSummary} numberOfLines={2}>{item.summary}</Text>
              <Text style={[styles.cardStatus, item.status === 'ready' && styles.statusReady]}>
                {item.status === 'ready' ? 'Audio prêt' : item.script && item.script.length > 0 ? 'Scénario prêt' : 'En attente'}
              </Text>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Aucun chapitre</Text>
        }
      />

      {generating && (
        <View style={styles.generatingContainer}>
          <ActivityIndicator size="small" color="#FF6B35" />
          <Text style={styles.generatingText}>{generatingLabel}</Text>
        </View>
      )}

      {!generating && step === 'plan' && (
        <TouchableOpacity
          style={styles.button}
          onPress={handleGeneratePlan}
          testID="generate-plan-button"
        >
          <Text style={styles.buttonText}>Générer le plan</Text>
        </TouchableOpacity>
      )}

      {!generating && step === 'scenario' && (
        <TouchableOpacity
          style={styles.button}
          onPress={handleGenerateScenario}
          testID="generate-scenario-button"
        >
          <Text style={styles.buttonText}>Générer le scénario</Text>
        </TouchableOpacity>
      )}

      {!generating && step === 'audio' && (
        <TouchableOpacity
          style={[styles.button, styles.audioButton]}
          onPress={handleGenerateAudio}
          testID="generate-audio-button"
        >
          <Text style={styles.buttonText}>Générer l'audio</Text>
        </TouchableOpacity>
      )}

      {!generating && step === 'done' && (
        <TouchableOpacity
          style={[styles.button, styles.listenButton]}
          onPress={() => navigation.navigate('Player', { projectId })}
          testID="listen-button"
        >
          <Text style={styles.buttonText}>Écouter le podcast</Text>
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
  positionBadgeReady: { backgroundColor: '#4CAF50' },
  positionText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  cardSummary: { fontSize: 13, color: '#666', marginBottom: 4 },
  cardStatus: { fontSize: 11, color: '#888' },
  statusReady: { color: '#4CAF50', fontWeight: '600' },
  emptyText: { textAlign: 'center', marginTop: 48, color: '#888', fontSize: 16 },
  generatingContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 16, gap: 8 },
  generatingText: { color: '#666', fontSize: 14 },
  button: { backgroundColor: '#FF6B35', margin: 16, borderRadius: 8, padding: 16, alignItems: 'center' },
  audioButton: { backgroundColor: '#E65100' },
  listenButton: { backgroundColor: '#4CAF50' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
