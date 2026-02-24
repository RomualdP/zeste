import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { apiGet } from '../../../shared/services/api';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../../../navigation/types';
import type { Chapter } from '@zeste/shared';

type Props = NativeStackScreenProps<MainStackParamList, 'Player'>;

export function PlayerScreen({ route }: Props) {
  const { projectId } = route.params;
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

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

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  const readyChapters = chapters.filter((c) => c.status === 'ready' && c.audioPath);

  if (readyChapters.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>Aucun audio disponible</Text>
      </View>
    );
  }

  const current = readyChapters[currentIndex];

  const handlePrevious = () => {
    setCurrentIndex((i) => Math.max(0, i - 1));
  };

  const handleNext = () => {
    setCurrentIndex((i) => Math.min(readyChapters.length - 1, i + 1));
  };

  const handlePlayPause = () => {
    setIsPlaying((p) => !p);
  };

  return (
    <View style={styles.container}>
      <View style={styles.playerSection}>
        <Text style={styles.nowPlaying}>En cours de lecture</Text>
        <Text style={styles.chapterTitle} testID="current-chapter-title">
          {current?.title}
        </Text>

        <View style={styles.controls}>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={handlePrevious}
            testID="prev-button"
          >
            <Text style={styles.controlText}>⏮</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.playButton}
            onPress={handlePlayPause}
            testID="play-pause-button"
          >
            <Text style={styles.playText}>{isPlaying ? '⏸' : '▶'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.controlButton}
            onPress={handleNext}
            testID="next-button"
          >
            <Text style={styles.controlText}>⏭</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.playlistTitle}>Playlist</Text>
      <FlatList
        data={readyChapters}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <TouchableOpacity
            style={[styles.playlistItem, index === currentIndex && styles.playlistItemActive]}
            onPress={() => setCurrentIndex(index)}
            testID={`playlist-item-${item.id}`}
          >
            <Text style={styles.playlistPosition}>{index + 1}</Text>
            <Text style={[styles.playlistText, index === currentIndex && styles.playlistTextActive]}>
              {item.title}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  loadingText: { textAlign: 'center', marginTop: 48, color: '#888', fontSize: 16 },
  emptyText: { textAlign: 'center', marginTop: 48, color: '#888', fontSize: 16 },
  playerSection: { alignItems: 'center', paddingVertical: 32, paddingHorizontal: 24, backgroundColor: '#f8f8f8' },
  nowPlaying: { fontSize: 12, color: '#888', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  chapterTitle: { fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 24 },
  controls: { flexDirection: 'row', alignItems: 'center', gap: 24 },
  controlButton: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#eee', justifyContent: 'center', alignItems: 'center' },
  controlText: { fontSize: 20 },
  playButton: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#FF6B35', justifyContent: 'center', alignItems: 'center' },
  playText: { fontSize: 28, color: '#fff' },
  playlistTitle: { fontSize: 16, fontWeight: '600', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  playlistItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  playlistItemActive: { backgroundColor: '#FFF0E8' },
  playlistPosition: { width: 24, fontSize: 14, color: '#888', fontWeight: '600' },
  playlistText: { fontSize: 15, flex: 1 },
  playlistTextActive: { color: '#FF6B35', fontWeight: '600' },
});
