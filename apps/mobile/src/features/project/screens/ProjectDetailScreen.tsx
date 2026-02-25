import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { apiGet, apiDelete } from '../../../shared/services/api';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../../../navigation/types';
import type { Project, Source } from '@zeste/shared';

type Props = NativeStackScreenProps<MainStackParamList, 'ProjectDetail'>;

const STATUS_LABELS: Record<string, string> = {
  draft: 'Brouillon',
  processing: 'En cours...',
  ready: 'Prêt',
  error: 'Erreur',
};

const TONE_LABELS: Record<string, string> = {
  pedagogue: 'Pédagogue',
  debate: 'Débat',
  vulgarization: 'Vulgarisation',
  interview: 'Interview',
};

const SOURCE_STATUS_LABELS: Record<string, string> = {
  pending: 'En attente',
  ingested: 'Prêt',
  error: 'Erreur',
};

export function ProjectDetailScreen({ route, navigation }: Props) {
  const { projectId } = route.params;
  const [project, setProject] = useState<Project | null>(null);
  const [sources, setSources] = useState<Source[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    const [proj, srcs] = await Promise.all([
      apiGet<Project>(`/api/projects/${projectId}`),
      apiGet<Source[]>(`/api/projects/${projectId}/sources`),
    ]);
    setProject(proj);
    setSources(srcs);
  }, [projectId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    return navigation.addListener('focus', loadData);
  }, [navigation, loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadData();
    } finally {
      setRefreshing(false);
    }
  }, [loadData]);

  const handleDeleteSource = async (sourceId: string) => {
    await apiDelete(`/api/projects/${projectId}/sources/${sourceId}`);
    setSources((prev) => prev.filter((s) => s.id !== sourceId));
  };

  if (!project) {
    return (
      <View style={styles.container}>
        <Text style={styles.loading}>Chargement...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#FF6B35"
          colors={['#FF6B35']}
        />
      }
    >
      <Text style={styles.title}>{project.name}</Text>
      <View style={styles.info}>
        <Text style={styles.label}>Statut</Text>
        <Text style={styles.value}>{STATUS_LABELS[project.status] ?? project.status}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.label}>Ton</Text>
        <Text style={styles.value}>{TONE_LABELS[project.tone] ?? project.tone}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.label}>Durée cible</Text>
        <Text style={styles.value}>{project.targetDuration} min</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.label}>Chapitres</Text>
        <Text style={styles.value}>{project.chapterCount}</Text>
      </View>

      <Text style={styles.sectionTitle}>Sources</Text>
      {sources.length === 0 ? (
        <Text style={styles.emptyText}>Aucune source ajoutée</Text>
      ) : (
        sources.map((source) => (
          <View key={source.id} style={styles.sourceCard} testID={`source-${source.id}`}>
            <View style={styles.sourceInfo}>
              <Text style={styles.sourceUrl} numberOfLines={1}>
                {source.url ?? source.filePath ?? 'Source'}
              </Text>
              <Text style={[styles.sourceStatus, source.status === 'error' && styles.sourceStatusError]}>
                {SOURCE_STATUS_LABELS[source.status] ?? source.status}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => handleDeleteSource(source.id)}
              testID={`delete-source-${source.id}`}
            >
              <Text style={styles.deleteText}>Supprimer</Text>
            </TouchableOpacity>
          </View>
        ))
      )}

      <TouchableOpacity
        style={styles.addSourceButton}
        onPress={() => navigation.navigate('AddSource', { projectId })}
        testID="add-source-button"
      >
        <Text style={styles.addSourceText}>+ Ajouter une source</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('Configure', { projectId })}
        testID="configure-button"
      >
        <Text style={styles.buttonText}>Configurer</Text>
      </TouchableOpacity>

      {sources.length > 0 && (
        <TouchableOpacity
          style={[styles.button, styles.generateButton]}
          onPress={() => navigation.navigate('ChapterList', { projectId })}
          testID="chapters-button"
        >
          <Text style={styles.buttonText}>Générer le podcast</Text>
        </TouchableOpacity>
      )}

      {project.status === 'ready' && (
        <>
          <TouchableOpacity
            style={[styles.button, styles.listenButton]}
            onPress={() => navigation.navigate('Player', { projectId })}
            testID="listen-button"
          >
            <Text style={styles.buttonText}>Écouter</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.shareButton]}
            onPress={() => navigation.navigate('Share', { projectId })}
            testID="share-button"
          >
            <Text style={styles.buttonText}>Partager</Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#fff' },
  loading: { textAlign: 'center', marginTop: 48, color: '#888' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 24 },
  info: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  label: { fontSize: 14, color: '#666' },
  value: { fontSize: 14, fontWeight: '600' },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginTop: 24, marginBottom: 12 },
  emptyText: { color: '#888', fontSize: 14, marginBottom: 12 },
  sourceCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8f8f8', padding: 12, borderRadius: 8, marginBottom: 8 },
  sourceInfo: { flex: 1, marginRight: 12 },
  sourceUrl: { fontSize: 14, fontWeight: '500' },
  sourceStatus: { fontSize: 12, color: '#4CAF50', marginTop: 2 },
  sourceStatusError: { color: '#f44336' },
  deleteText: { color: '#FF3B30', fontSize: 14, fontWeight: '500' },
  addSourceButton: { borderWidth: 1, borderColor: '#FF6B35', borderRadius: 8, padding: 12, alignItems: 'center', marginTop: 8, borderStyle: 'dashed' },
  addSourceText: { color: '#FF6B35', fontSize: 14, fontWeight: '600' },
  button: { backgroundColor: '#FF6B35', borderRadius: 8, padding: 16, alignItems: 'center', marginTop: 24 },
  generateButton: { backgroundColor: '#E65100' },
  listenButton: { backgroundColor: '#4CAF50' },
  shareButton: { backgroundColor: '#2196F3' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
