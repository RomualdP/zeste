import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAudioPlayer, useAudioPlayerStatus, setAudioModeAsync } from 'expo-audio';
import { apiGet } from '../../../shared/services/api';
import { color, radius, space, type, tone, ToneId } from '../../../shared/theme';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../../../navigation/types';
import type { Chapter, Project, Source } from '@zeste/shared';

type Props = NativeStackScreenProps<MainStackParamList, 'Player'>;

type TabId = 'chapters' | 'transcript' | 'sources';

const VALID_TONES: ToneId[] = ['pedagogue', 'debate', 'vulgarization', 'interview'];

function safeTone(value: unknown): ToneId {
  if (typeof value === 'string' && (VALID_TONES as string[]).includes(value)) {
    return value as ToneId;
  }
  return 'pedagogue';
}

function formatTime(seconds: number) {
  const total = Math.floor(seconds);
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function sourceLabel(s: Source): string {
  if (s.type === 'url' && s.url) return s.url;
  if (s.type === 'pdf') return s.filePath ?? 'PDF';
  return s.rawContent.slice(0, 80) || 'Texte';
}

export function PlayerScreen({ route }: Props) {
  const { projectId } = route.params;
  const [project, setProject] = useState<Project | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isBuffering, setIsBuffering] = useState(false);
  const [tab, setTab] = useState<TabId>('chapters');

  const player = useAudioPlayer(null);
  const status = useAudioPlayerStatus(player);
  const autoAdvanceRef = useRef(false);

  const load = useCallback(async () => {
    try {
      const [p, ch, src] = await Promise.all([
        apiGet<Project>(`/api/projects/${projectId}`),
        apiGet<Chapter[]>(`/api/projects/${projectId}/chapters`),
        apiGet<Source[]>(`/api/projects/${projectId}/sources`),
      ]);
      setProject(p);
      setChapters(ch);
      setSources(src);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
    });
  }, []);

  const readyChapters = chapters.filter((c) => c.status === 'ready' && c.audioPath);

  useEffect(() => {
    if (status.didJustFinish && !autoAdvanceRef.current) {
      autoAdvanceRef.current = true;
      if (currentIndex < readyChapters.length - 1) {
        loadAndPlayChapter(currentIndex + 1);
      }
    }
    if (!status.didJustFinish) {
      autoAdvanceRef.current = false;
    }
  }, [status.didJustFinish, currentIndex, readyChapters.length]);

  const loadAndPlayChapter = useCallback(
    async (index: number) => {
      if (readyChapters.length === 0 || index < 0 || index >= readyChapters.length) return;
      setCurrentIndex(index);
      setIsBuffering(true);
      try {
        const chapter = readyChapters[index]!;
        const { url } = await apiGet<{ url: string }>(
          `/api/projects/${projectId}/chapters/${chapter.id}/audio`,
        );
        player.replace({ uri: url });
        player.play();
        setIsBuffering(false);
      } catch {
        setIsBuffering(false);
      }
    },
    [readyChapters, projectId, player],
  );

  const handlePlayPause = async () => {
    if (!status.isLoaded) {
      await loadAndPlayChapter(currentIndex);
      return;
    }
    if (status.playing) {
      player.pause();
    } else {
      player.play();
    }
  };

  const handlePrevious = () => {
    loadAndPlayChapter(Math.max(0, currentIndex - 1));
  };

  const handleNext = () => {
    loadAndPlayChapter(Math.min(readyChapters.length - 1, currentIndex + 1));
  };

  if (loading) {
    return (
      <View style={[styles.root, { backgroundColor: color.bg }]}>
        <Text style={styles.centerNote}>Chargement…</Text>
      </View>
    );
  }

  if (readyChapters.length === 0) {
    return (
      <View style={[styles.root, { backgroundColor: color.bg }]}>
        <Text style={styles.centerNote}>Aucun audio disponible</Text>
      </View>
    );
  }

  const toneId = safeTone(project?.tone);
  const palette = tone[toneId];
  const current = readyChapters[currentIndex]!;
  const progress = status.duration > 0 ? status.currentTime / status.duration : 0;
  const totalDuration = readyChapters.reduce((sum, c) => sum + (c.audioDuration ?? 0), 0);
  const initial = (project?.name ?? 'Z').trim().charAt(0).toUpperCase();

  return (
    <View style={[styles.root, { backgroundColor: palette.bg }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={[styles.art, { backgroundColor: palette.ink }]}>
          <Text style={[styles.artGlyph, type.serif, { color: palette.bg }]}>{initial}</Text>
        </View>

        <Text style={[styles.title, { color: palette.ink }]}>{project?.name}</Text>
        <Text style={[styles.meta, { color: palette.ink }]}>
          {`Chapitre ${currentIndex + 1}/${readyChapters.length} · ${formatTime(totalDuration)}`}
        </Text>

        <View style={styles.tabs}>
          <Tab
            id="chapters"
            label="Chapitres"
            active={tab === 'chapters'}
            palette={palette}
            onPress={() => setTab('chapters')}
          />
          <Tab
            id="transcript"
            label="Transcript"
            active={tab === 'transcript'}
            palette={palette}
            onPress={() => setTab('transcript')}
          />
          <Tab
            id="sources"
            label="Sources"
            active={tab === 'sources'}
            palette={palette}
            onPress={() => setTab('sources')}
          />
        </View>

        {tab === 'chapters' && (
          <View style={styles.section}>
            {readyChapters.map((c, index) => {
              const active = index === currentIndex;
              return (
                <TouchableOpacity
                  key={c.id}
                  testID={`playlist-item-${c.id}`}
                  onPress={() => loadAndPlayChapter(index)}
                  activeOpacity={0.85}
                  style={[
                    styles.row,
                    active && { backgroundColor: withAlpha(palette.ink, 0.1) },
                  ]}
                >
                  <Text style={[styles.rowIndex, { color: palette.ink }]}>{index + 1}</Text>
                  <View style={styles.rowBody}>
                    <Text
                      testID={active ? 'current-chapter-title' : undefined}
                      style={[
                        styles.rowTitle,
                        { color: palette.ink },
                        active && styles.rowTitleActive,
                      ]}
                    >
                      {c.title}
                    </Text>
                    {c.audioDuration != null && (
                      <Text style={[styles.rowMeta, { color: palette.ink }]}>
                        {formatTime(c.audioDuration)}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {tab === 'transcript' && (
          <View style={styles.section}>
            {current.script.length === 0 ? (
              <Text style={[styles.emptyTab, { color: palette.ink }]}>Pas de transcript.</Text>
            ) : (
              current.script.map((entry, idx) => (
                <View key={idx} style={styles.scriptEntry}>
                  <Text style={[styles.scriptSpeaker, { color: palette.ink }]}>
                    {entry.speaker === 'host' ? 'Hôte' : 'Expert'}
                  </Text>
                  <Text style={[styles.scriptText, { color: palette.ink }]}>{entry.text}</Text>
                </View>
              ))
            )}
          </View>
        )}

        {tab === 'sources' && (
          <View style={styles.section}>
            {sources.length === 0 ? (
              <Text style={[styles.emptyTab, { color: palette.ink }]}>Aucune source.</Text>
            ) : (
              sources.map((s) => (
                <View key={s.id} style={styles.sourceRow}>
                  <Text style={[styles.sourceType, { color: palette.ink }]}>
                    {s.type.toUpperCase()}
                  </Text>
                  <Text
                    style={[styles.sourceLabel, { color: palette.ink }]}
                    numberOfLines={2}
                  >
                    {sourceLabel(s)}
                  </Text>
                </View>
              ))
            )}
          </View>
        )}

        {/* spacer so content does not slip under controls */}
        <View style={{ height: 160 }} />
      </ScrollView>

      <View style={[styles.controlsWrap, { backgroundColor: palette.bg }]}>
        <View style={[styles.progressBar, { backgroundColor: withAlpha(palette.ink, 0.18) }]}>
          <View
            style={[
              styles.progressFill,
              { backgroundColor: palette.ink, width: `${progress * 100}%` },
            ]}
          />
        </View>
        <View style={styles.timeRow}>
          <Text style={[styles.timeText, { color: palette.ink }]}>
            {formatTime(status.currentTime)}
          </Text>
          <Text style={[styles.timeText, { color: palette.ink }]}>
            {formatTime(status.duration)}
          </Text>
        </View>

        <View style={styles.controls}>
          <TouchableOpacity testID="prev-button" onPress={handlePrevious} style={styles.sideBtn}>
            <Text style={[styles.sideGlyph, { color: palette.ink }]}>{'⏮'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            testID="play-pause-button"
            onPress={handlePlayPause}
            style={[styles.playBtn, { backgroundColor: palette.ink }]}
            activeOpacity={0.9}
          >
            <Text style={[styles.playGlyph, { color: palette.bg }]}>
              {status.playing ? '⏸' : '▶'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity testID="next-button" onPress={handleNext} style={styles.sideBtn}>
            <Text style={[styles.sideGlyph, { color: palette.ink }]}>{'⏭'}</Text>
          </TouchableOpacity>
        </View>

        {isBuffering && (
          <ActivityIndicator size="small" color={palette.ink} style={styles.buffering} />
        )}
      </View>
    </View>
  );
}

interface TabProps {
  id: TabId;
  label: string;
  active: boolean;
  palette: { bg: string; ink: string };
  onPress: () => void;
}

function Tab({ id, label, active, palette, onPress }: TabProps) {
  return (
    <Pressable
      testID={`player-tab-${id}`}
      onPress={onPress}
      style={[
        styles.tab,
        {
          backgroundColor: active ? palette.ink : 'transparent',
          borderColor: withAlpha(palette.ink, 0.2),
        },
      ]}
    >
      <Text
        style={[
          styles.tabLabel,
          { color: active ? palette.bg : palette.ink },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function withAlpha(hex: string, alpha: number): string {
  // hex assumed in #RRGGBB form; produces rgba()
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  centerNote: {
    textAlign: 'center',
    marginTop: 96,
    color: color.mute,
    fontSize: type.body.fontSize,
  },
  scroll: {
    paddingHorizontal: space.xl,
    paddingTop: space['2xl'],
    paddingBottom: space.lg,
    alignItems: 'stretch',
  },
  art: {
    width: 320,
    height: 320,
    maxWidth: '100%',
    alignSelf: 'center',
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  artGlyph: {
    fontSize: 120,
    lineHeight: 130,
  },
  title: {
    ...type.title,
    marginTop: space.xl,
    textAlign: 'center',
  },
  meta: {
    ...type.meta,
    opacity: 0.7,
    marginTop: 4,
    textAlign: 'center',
  },
  tabs: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: space.sm,
    marginTop: space.xl,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: radius.chip,
    borderWidth: 1,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  section: {
    marginTop: space.lg,
    gap: space.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: radius.md,
  },
  rowIndex: {
    width: 24,
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.6,
  },
  rowBody: { flex: 1, gap: 2 },
  rowTitle: { fontSize: type.label.fontSize, fontWeight: '500' },
  rowTitleActive: { fontWeight: '700' },
  rowMeta: { fontSize: type.meta.fontSize, opacity: 0.7 },
  scriptEntry: {
    paddingVertical: 8,
    gap: 4,
  },
  scriptSpeaker: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    opacity: 0.7,
  },
  scriptText: {
    fontSize: type.body.fontSize,
    lineHeight: type.body.lineHeight,
  },
  sourceRow: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: radius.md,
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.04)',
  },
  sourceType: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.4,
    opacity: 0.7,
  },
  sourceLabel: { fontSize: type.body.fontSize },
  emptyTab: {
    fontSize: type.body.fontSize,
    opacity: 0.7,
    paddingVertical: space.lg,
    textAlign: 'center',
  },
  controlsWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: space.xl,
    paddingTop: space.md,
    paddingBottom: 28,
    gap: 4,
  },
  progressBar: {
    height: 2,
    width: '100%',
    overflow: 'hidden',
    borderRadius: 1,
  },
  progressFill: { height: '100%' },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: space.sm,
  },
  timeText: { fontSize: 11, opacity: 0.7 },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.xl,
  },
  sideBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sideGlyph: { fontSize: 22 },
  playBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playGlyph: { fontSize: 30 },
  buffering: { marginTop: space.sm },
});
