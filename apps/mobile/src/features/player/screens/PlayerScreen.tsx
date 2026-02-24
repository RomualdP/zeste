import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Audio } from 'expo-av';
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
  const [isBuffering, setIsBuffering] = useState(false);
  const [positionMs, setPositionMs] = useState(0);
  const [durationMs, setDurationMs] = useState(0);
  const soundRef = useRef<Audio.Sound | null>(null);

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

  // Configure audio mode for background playback
  useEffect(() => {
    Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
    });

    return () => {
      // Cleanup sound on unmount
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  const readyChapters = chapters.filter((c) => c.status === 'ready' && c.audioPath);

  const loadAndPlayChapter = useCallback(async (index: number) => {
    if (readyChapters.length === 0 || index < 0 || index >= readyChapters.length) return;

    // Unload previous sound
    if (soundRef.current) {
      await soundRef.current.unloadAsync();
      soundRef.current = null;
    }

    setCurrentIndex(index);
    setIsBuffering(true);
    setPositionMs(0);
    setDurationMs(0);

    try {
      const chapter = readyChapters[index]!;
      // Get signed URL from backend
      const { url } = await apiGet<{ url: string }>(
        `/api/projects/${projectId}/chapters/${chapter.id}/audio`,
      );

      const { sound } = await Audio.Sound.createAsync(
        { uri: url },
        { shouldPlay: true },
        (status) => {
          if (!status.isLoaded) return;
          setPositionMs(status.positionMillis);
          setDurationMs(status.durationMillis ?? 0);
          setIsPlaying(status.isPlaying);
          setIsBuffering(status.isBuffering);

          // Auto-advance to next chapter when finished
          if (status.didJustFinish && index < readyChapters.length - 1) {
            loadAndPlayChapter(index + 1);
          }
        },
      );

      soundRef.current = sound;
      setIsPlaying(true);
    } catch {
      setIsBuffering(false);
    }
  }, [readyChapters, projectId]);

  const handlePlayPause = async () => {
    if (!soundRef.current) {
      // First play
      await loadAndPlayChapter(currentIndex);
      return;
    }

    if (isPlaying) {
      await soundRef.current.pauseAsync();
    } else {
      await soundRef.current.playAsync();
    }
  };

  const handlePrevious = () => {
    const newIndex = Math.max(0, currentIndex - 1);
    loadAndPlayChapter(newIndex);
  };

  const handleNext = () => {
    const newIndex = Math.min(readyChapters.length - 1, currentIndex + 1);
    loadAndPlayChapter(newIndex);
  };

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  if (readyChapters.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>Aucun audio disponible</Text>
      </View>
    );
  }

  const current = readyChapters[currentIndex];
  const progress = durationMs > 0 ? positionMs / durationMs : 0;

  return (
    <View style={styles.container}>
      <View style={styles.playerSection}>
        <Text style={styles.nowPlaying}>En cours de lecture</Text>
        <Text style={styles.chapterTitle} testID="current-chapter-title">
          {current?.title}
        </Text>

        {/* Progress bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          </View>
          <View style={styles.timeRow}>
            <Text style={styles.timeText}>{formatTime(positionMs)}</Text>
            <Text style={styles.timeText}>{formatTime(durationMs)}</Text>
          </View>
        </View>

        {isBuffering && (
          <ActivityIndicator size="small" color="#FF6B35" style={styles.bufferingIndicator} />
        )}

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
            onPress={() => loadAndPlayChapter(index)}
            testID={`playlist-item-${item.id}`}
          >
            <Text style={styles.playlistPosition}>{index + 1}</Text>
            <View style={styles.playlistInfo}>
              <Text style={[styles.playlistText, index === currentIndex && styles.playlistTextActive]}>
                {item.title}
              </Text>
              {item.audioDuration && (
                <Text style={styles.playlistDuration}>
                  {formatTime(item.audioDuration)}
                </Text>
              )}
            </View>
            {index === currentIndex && isPlaying && (
              <Text style={styles.playingIndicator}>♪</Text>
            )}
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
  chapterTitle: { fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 16 },
  progressContainer: { width: '100%', marginBottom: 16 },
  progressBar: { height: 4, backgroundColor: '#ddd', borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#FF6B35', borderRadius: 2 },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  timeText: { fontSize: 11, color: '#888' },
  bufferingIndicator: { marginBottom: 8 },
  controls: { flexDirection: 'row', alignItems: 'center', gap: 24 },
  controlButton: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#eee', justifyContent: 'center', alignItems: 'center' },
  controlText: { fontSize: 20 },
  playButton: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#FF6B35', justifyContent: 'center', alignItems: 'center' },
  playText: { fontSize: 28, color: '#fff' },
  playlistTitle: { fontSize: 16, fontWeight: '600', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  playlistItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  playlistItemActive: { backgroundColor: '#FFF0E8' },
  playlistPosition: { width: 24, fontSize: 14, color: '#888', fontWeight: '600' },
  playlistInfo: { flex: 1 },
  playlistText: { fontSize: 15 },
  playlistTextActive: { color: '#FF6B35', fontWeight: '600' },
  playlistDuration: { fontSize: 12, color: '#888', marginTop: 2 },
  playingIndicator: { fontSize: 16, color: '#FF6B35', marginLeft: 8 },
});
