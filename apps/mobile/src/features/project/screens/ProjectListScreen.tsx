import React, { useEffect, useState, useCallback, useLayoutEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { apiGet } from '../../../shared/services/api';
import { useAuth } from '../../auth/hooks/useAuth';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../../../navigation/types';
import type { Project } from '@zeste/shared';

type Props = NativeStackScreenProps<MainStackParamList, 'ProjectList'>;

export function ProjectListScreen({ navigation }: Props) {
  const { signOut } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

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
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('ProjectDetail', { projectId: item.id })}
            testID={`project-${item.id}`}
          >
            <Text style={styles.cardTitle}>{item.name}</Text>
            <Text style={styles.cardStatus}>{item.status}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>
            {loading ? 'Chargement...' : 'Aucun projet. Créez-en un !'}
          </Text>
        }
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
  cardTitle: { fontSize: 16, fontWeight: '600' },
  cardStatus: { fontSize: 12, color: '#888', textTransform: 'capitalize' },
  empty: { textAlign: 'center', marginTop: 48, color: '#888', fontSize: 16 },
  fab: { position: 'absolute', right: 24, bottom: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: '#FF6B35', justifyContent: 'center', alignItems: 'center', elevation: 4 },
  fabText: { color: '#fff', fontSize: 28, fontWeight: '300', lineHeight: 30 },
});
