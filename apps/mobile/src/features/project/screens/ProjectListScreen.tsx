import React, { useEffect, useState, useCallback, useLayoutEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { apiGet } from '../../../shared/services/api';
import { useAuth } from '../../auth/hooks/useAuth';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../../../navigation/types';
import type { Project } from '@zeste/shared';

type Props = NativeStackScreenProps<MainStackParamList, 'ProjectList'>;

const STATUS_LABELS: Record<string, string> = {
  draft: 'Brouillon',
  processing: 'En cours...',
  ready: 'Prêt',
  error: 'Erreur',
};

export function ProjectListScreen({ navigation }: Props) {
  const { signOut } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={signOut} testID="logout-button">
          <Text style={{ color: '#FF6B35', fontSize: 14, fontWeight: '600' }}>Déconnexion</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, signOut]);

  const loadProjects = useCallback(async () => {
    try {
      const data = await apiGet<Project[]>('/api/projects');
      setProjects(data);
    } finally {
      setLoading(false);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const data = await apiGet<Project[]>('/api/projects');
      setProjects(data);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    return navigation.addListener('focus', loadProjects);
  }, [navigation, loadProjects]);

  const handleCreate = async () => {
    navigation.navigate('CreateProject');
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={projects}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#FF6B35"
            colors={['#FF6B35']}
          />
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('ProjectDetail', { projectId: item.id })}
            testID={`project-${item.id}`}
          >
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>{item.name}</Text>
              <Text style={styles.cardMeta}>{item.targetDuration} min</Text>
            </View>
            <View style={[styles.statusBadge, item.status === 'ready' && styles.statusReady, item.status === 'error' && styles.statusError]}>
              <Text style={[styles.statusText, item.status === 'ready' && styles.statusTextReady, item.status === 'error' && styles.statusTextError]}>
                {STATUS_LABELS[item.status] ?? item.status}
              </Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>
            {loading ? 'Chargement...' : 'Aucun projet. Créez-en un !'}
          </Text>
        }
        contentContainerStyle={projects.length === 0 ? styles.emptyContainer : undefined}
      />
      <TouchableOpacity style={styles.fab} onPress={handleCreate} testID="create-project-button">
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  card: { backgroundColor: '#fff', margin: 12, marginBottom: 0, padding: 16, borderRadius: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardContent: { flex: 1, marginRight: 12 },
  cardTitle: { fontSize: 16, fontWeight: '600' },
  cardMeta: { fontSize: 12, color: '#888', marginTop: 4 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: '#f0f0f0' },
  statusReady: { backgroundColor: '#e8f5e9' },
  statusError: { backgroundColor: '#fbe9e7' },
  statusText: { fontSize: 12, color: '#888', fontWeight: '500' },
  statusTextReady: { color: '#4CAF50' },
  statusTextError: { color: '#f44336' },
  empty: { textAlign: 'center', marginTop: 48, color: '#888', fontSize: 16 },
  emptyContainer: { flex: 1, justifyContent: 'center' },
  fab: { position: 'absolute', right: 24, bottom: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: '#FF6B35', justifyContent: 'center', alignItems: 'center', elevation: 4 },
  fabText: { color: '#fff', fontSize: 28, fontWeight: '300', lineHeight: 30 },
});
