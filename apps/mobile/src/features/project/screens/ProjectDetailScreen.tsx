import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { apiGet } from '../../../shared/services/api';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../../../navigation/types';
import type { Project } from '@zeste/shared';

type Props = NativeStackScreenProps<MainStackParamList, 'ProjectDetail'>;

export function ProjectDetailScreen({ route, navigation }: Props) {
  const { projectId } = route.params;
  const [project, setProject] = useState<Project | null>(null);

  useEffect(() => {
    apiGet<Project>(`/api/projects/${projectId}`).then(setProject);
  }, [projectId]);

  if (!project) {
    return (
      <View style={styles.container}>
        <Text style={styles.loading}>Chargement...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{project.name}</Text>
      <View style={styles.info}>
        <Text style={styles.label}>Statut</Text>
        <Text style={styles.value}>{project.status}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.label}>Ton</Text>
        <Text style={styles.value}>{project.tone}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.label}>Durée cible</Text>
        <Text style={styles.value}>{project.targetDuration} min</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.label}>Chapitres</Text>
        <Text style={styles.value}>{project.chapterCount}</Text>
      </View>

      {project.status === 'draft' && (
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('Configure', { projectId })}
          testID="configure-button"
        >
          <Text style={styles.buttonText}>Configurer</Text>
        </TouchableOpacity>
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
  value: { fontSize: 14, fontWeight: '600', textTransform: 'capitalize' },
  button: { backgroundColor: '#FF6B35', borderRadius: 8, padding: 16, alignItems: 'center', marginTop: 24 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
