import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { apiDelete, apiGet } from '../../../shared/services/api';
import { Button } from '../../../shared/components';
import { color, radius, space, type, tone, ToneId } from '../../../shared/theme';
import { ShareSheet, ShareSheetHandle } from '../../sharing/components/ShareSheet';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../../../navigation/types';
import type { Project, Source } from '@zeste/shared';

type Props = NativeStackScreenProps<MainStackParamList, 'Detail'>;

const VALID_TONES: ToneId[] = ['pedagogue', 'debate', 'vulgarization', 'interview'];

function safeTone(value: unknown): ToneId {
  if (typeof value === 'string' && (VALID_TONES as string[]).includes(value)) {
    return value as ToneId;
  }
  return 'pedagogue';
}

function sourceLabel(s: Source): string {
  if (s.type === 'url' && s.url) return s.url;
  if (s.type === 'pdf') return s.filePath ?? 'PDF';
  return s.rawContent.slice(0, 80) || 'Texte';
}

export function DetailScreen({ navigation, route }: Props) {
  const { projectId } = route.params;
  const [project, setProject] = useState<Project | null>(null);
  const [sources, setSources] = useState<Source[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const shareRef = useRef<ShareSheetHandle>(null);

  const load = useCallback(async () => {
    const [p, src] = await Promise.all([
      apiGet<Project>(`/api/projects/${projectId}`),
      apiGet<Source[]>(`/api/projects/${projectId}/sources`),
    ]);
    setProject(p);
    setSources(src);
  }, [projectId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    return navigation.addListener?.('focus', load);
  }, [navigation, load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  const handleDeleteSource = async (sourceId: string) => {
    await apiDelete(`/api/projects/${projectId}/sources/${sourceId}`);
    setSources((prev) => prev.filter((s) => s.id !== sourceId));
  };

  const confirmDeleteProject = () => {
    Alert.alert(
      'Supprimer le projet',
      'Cette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiDelete(`/api/projects/${projectId}`);
              navigation.navigate('Library');
            } catch (err) {
              Alert.alert('Erreur', err instanceof Error ? err.message : 'Erreur');
            }
          },
        },
      ],
    );
  };

  if (!project) {
    return (
      <View style={[styles.root, { justifyContent: 'center' }]}>
        <Text style={styles.center}>Chargement…</Text>
      </View>
    );
  }

  const toneId = safeTone(project.tone);
  const palette = tone[toneId];
  const initial = project.name.trim().charAt(0).toUpperCase() || 'Z';

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={color.ink} />
        }
      >
        <View style={[styles.art, { backgroundColor: palette.ink }]}>
          <Text style={[styles.artGlyph, type.serif, { color: palette.bg }]}>{initial}</Text>
        </View>

        <Text style={styles.title}>{project.name}</Text>
        <Text style={styles.meta}>
          {`${project.targetDuration} min · ${project.chapterCount} chapitre${project.chapterCount > 1 ? 's' : ''}`}
        </Text>

        <View style={styles.ctaRow}>
          <View style={styles.ctaPrimary}>
            <Button
              testID="detail-listen-button"
              label="Écouter"
              onPress={() => navigation.navigate('Player', { projectId })}
            />
          </View>
          <Pressable
            testID="detail-share-button"
            onPress={() => shareRef.current?.present()}
            style={styles.ctaSecondary}
          >
            <Text style={styles.ctaSecondaryText}>Partager</Text>
          </Pressable>
          <Pressable
            testID="detail-download-button"
            onPress={() => Alert.alert('Bientôt', 'Téléchargement bientôt disponible.')}
            style={[styles.ctaSecondary, styles.ctaIcon]}
          >
            <Text style={styles.ctaSecondaryText}>↓</Text>
          </Pressable>
        </View>

        <Text style={styles.section}>Sources</Text>
        {sources.length === 0 ? (
          <Text style={styles.empty}>Aucune source.</Text>
        ) : (
          sources.map((src) => (
            <View key={src.id} style={styles.sourceRow} testID={`source-${src.id}`}>
              <View style={styles.sourceTypeChip}>
                <Text style={styles.sourceTypeText}>{src.type.toUpperCase()}</Text>
              </View>
              <Text style={styles.sourceLabel} numberOfLines={2}>
                {sourceLabel(src)}
              </Text>
              <Pressable
                testID={`delete-source-${src.id}`}
                onPress={() => handleDeleteSource(src.id)}
                hitSlop={8}
              >
                <Text style={styles.sourceDelete}>⋯</Text>
              </Pressable>
            </View>
          ))
        )}

        <Text style={styles.section}>Actions</Text>
        <View style={styles.actionsCard}>
          <ActionRow
            label="Régénérer"
            onPress={() => navigation.navigate('Compose', { projectId })}
            testID="detail-regenerate-button"
          />
          <View style={styles.divider} />
          <ActionRow
            label="Dupliquer"
            onPress={() => Alert.alert('Bientôt', 'Duplication bientôt disponible.')}
            testID="detail-duplicate-button"
          />
          <View style={styles.divider} />
          <ActionRow
            label="Supprimer"
            onPress={confirmDeleteProject}
            testID="detail-delete-project-button"
            danger
          />
        </View>
      </ScrollView>

      <ShareSheet ref={shareRef} projectId={projectId} />
    </View>
  );
}

interface ActionRowProps {
  label: string;
  onPress: () => void;
  testID?: string;
  danger?: boolean;
}

function ActionRow({ label, onPress, testID, danger }: ActionRowProps) {
  return (
    <Pressable testID={testID} onPress={onPress} style={styles.actionRow}>
      <Text style={[styles.actionLabel, danger && { color: color.danger }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.bg },
  scroll: {
    paddingHorizontal: space.xl,
    paddingTop: space.xl,
    paddingBottom: 80,
  },
  center: {
    textAlign: 'center',
    color: color.mute,
    fontSize: type.body.fontSize,
  },
  art: {
    width: 200,
    height: 200,
    alignSelf: 'center',
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  artGlyph: {
    fontSize: 96,
    lineHeight: 110,
  },
  title: {
    ...type.title,
    color: color.ink,
    textAlign: 'center',
    marginTop: space.lg,
  },
  meta: {
    ...type.meta,
    color: color.mute,
    textAlign: 'center',
    marginTop: 4,
  },
  ctaRow: {
    flexDirection: 'row',
    gap: space.sm,
    marginTop: space.xl,
    alignItems: 'stretch',
  },
  ctaPrimary: {
    flex: 1,
  },
  ctaSecondary: {
    height: 56,
    paddingHorizontal: space.xl,
    borderRadius: radius.pill,
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaIcon: {
    paddingHorizontal: 0,
    width: 56,
  },
  ctaSecondaryText: {
    ...type.label,
    color: color.ink,
  },
  section: {
    ...type.eyebrow,
    color: color.mute,
    marginTop: space['2xl'],
    marginBottom: space.md,
  },
  empty: {
    fontSize: type.body.fontSize,
    color: color.mute,
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: color.line,
  },
  sourceTypeChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.chip,
    backgroundColor: 'rgba(15,15,14,0.06)',
  },
  sourceTypeText: {
    fontSize: 11,
    fontWeight: '700',
    color: color.ink,
  },
  sourceLabel: {
    flex: 1,
    fontSize: type.body.fontSize,
    color: color.ink,
  },
  sourceDelete: {
    fontSize: 22,
    color: color.mute,
    paddingHorizontal: 4,
  },
  actionsCard: {
    backgroundColor: color.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: color.line,
    overflow: 'hidden',
  },
  actionRow: {
    paddingVertical: 14,
    paddingHorizontal: space.lg,
  },
  actionLabel: {
    ...type.label,
    color: color.ink,
  },
  divider: {
    height: 1,
    backgroundColor: color.line,
  },
});
