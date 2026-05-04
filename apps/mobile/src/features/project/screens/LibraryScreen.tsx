import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Header, ListRow } from '../../../shared/components';
import { color, radius, space, type, ToneId } from '../../../shared/theme';
import { apiGet } from '../../../shared/services/api';
import type { Project } from '@zeste/shared';

interface LibraryScreenProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  navigation: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  route: any;
}

const VALID_TONES: ToneId[] = ['pedagogue', 'debate', 'vulgarization', 'interview'];

function safeTone(value: unknown): ToneId {
  if (typeof value === 'string' && (VALID_TONES as string[]).includes(value)) {
    return value as ToneId;
  }
  return 'pedagogue';
}

function metaFor(project: Project): string {
  const minutes = project.targetDuration ? `${project.targetDuration} min` : '—';
  const chapters = project.chapterCount && project.chapterCount > 1
    ? `${project.chapterCount} chapitres · `
    : '';
  return `${chapters}${minutes}`;
}

export function LibraryScreen({ navigation }: LibraryScreenProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProjects = useCallback(async () => {
    try {
      const data = await apiGet<Project[]>('/api/projects');
      setProjects(data);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    return navigation.addListener?.('focus', fetchProjects);
  }, [navigation, fetchProjects]);

  const goToProject = (project: Project) => {
    if (project.status === 'ready') {
      navigation.navigate('Player', { projectId: project.id });
    } else if (project.status === 'processing') {
      navigation.navigate('Generating', { projectId: project.id });
    } else {
      navigation.navigate('Compose', { projectId: project.id });
    }
  };

  const hasGenerating = projects.some((p) => p.status === 'processing');

  return (
    <View style={styles.root}>
      <Header />

      <FlatList
        contentContainerStyle={styles.list}
        data={projects}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <View style={styles.headerBlock}>
            <Text style={styles.hero}>
              Ta <Text style={[styles.hero, type.serif]}>bibliothèque</Text>.
            </Text>
            {hasGenerating ? <Text style={styles.eyebrow}>EN COURS</Text> : null}
          </View>
        }
        ListEmptyComponent={loading ? <Loading /> : <EmptyState navigation={navigation} />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchProjects();
            }}
            tintColor={color.ink}
          />
        }
        renderItem={({ item }) => (
          <View style={styles.rowWrap}>
            <ListRow
              toneId={safeTone(item.tone)}
              title={item.name}
              meta={metaFor(item)}
              generating={item.status === 'processing'}
              onPress={() => goToProject(item)}
            />
          </View>
        )}
      />

      <Pressable
        accessibilityRole="button"
        onPress={() => navigation.navigate('Compose')}
        style={styles.fab}
        testID="library-fab"
      >
        <Text style={styles.fabGlyph}>+</Text>
      </Pressable>
    </View>
  );
}

function Loading() {
  return (
    <View style={styles.loadingBlock}>
      <ActivityIndicator color={color.ink} />
    </View>
  );
}

function EmptyState({ navigation }: { navigation: LibraryScreenProps['navigation'] }) {
  const cards = [
    {
      testID: 'library-empty-url',
      glyph: '🔗',
      title: 'Un article',
      desc: 'Colle une URL, on extrait le contenu',
    },
    {
      testID: 'library-empty-pdf',
      glyph: '📄',
      title: 'Un PDF',
      desc: 'Upload un document, on le lit pour toi',
    },
    {
      testID: 'library-empty-text',
      glyph: '✍️',
      title: 'Tes notes',
      desc: 'Tape ou colle directement du texte',
    },
  ];

  return (
    <View style={styles.empty}>
      <Text style={styles.emptyHero}>
        Premier <Text style={[styles.emptyHero, type.serif]}>épisode</Text>.
      </Text>
      <Text style={styles.emptySub}>Colle une source, on s'occupe du reste.</Text>

      <View style={styles.emptyCards}>
        {cards.map((card) => (
          <Pressable
            key={card.testID}
            testID={card.testID}
            onPress={() => navigation.navigate('Compose')}
            style={styles.emptyCard}
            accessibilityRole="button"
          >
            <Text style={styles.emptyGlyph}>{card.glyph}</Text>
            <View style={styles.emptyCardBody}>
              <Text style={styles.emptyTitle}>{card.title}</Text>
              <Text style={styles.emptyDesc}>{card.desc}</Text>
            </View>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: color.bg,
  },
  list: {
    paddingHorizontal: space.xl,
    paddingBottom: 100,
    flexGrow: 1,
  },
  headerBlock: {
    paddingTop: space.lg,
    paddingBottom: space.md,
    gap: space.sm,
  },
  hero: {
    fontSize: type.hero.fontSize,
    fontWeight: type.hero.fontWeight,
    letterSpacing: type.hero.letterSpacing,
    color: color.ink,
  },
  eyebrow: {
    fontSize: type.eyebrow.fontSize,
    fontWeight: type.eyebrow.fontWeight,
    letterSpacing: type.eyebrow.letterSpacing,
    textTransform: 'uppercase',
    color: color.warm,
  },
  rowWrap: {
    marginBottom: 10,
  },
  loadingBlock: {
    paddingTop: space['2xl'],
    alignItems: 'center',
  },
  empty: {
    paddingTop: space.lg,
    gap: space.lg,
  },
  emptyHero: {
    fontSize: type.title.fontSize,
    fontWeight: type.title.fontWeight,
    letterSpacing: type.title.letterSpacing,
    color: color.ink,
  },
  emptySub: {
    fontSize: type.body.fontSize,
    color: color.mute,
  },
  emptyCards: {
    gap: space.md,
  },
  emptyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.lg,
    padding: 18,
    borderRadius: radius.card,
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.line,
  },
  emptyGlyph: {
    fontSize: 24,
  },
  emptyCardBody: {
    flex: 1,
    gap: 4,
  },
  emptyTitle: {
    fontSize: type.label.fontSize,
    fontWeight: type.label.fontWeight,
    color: color.ink,
  },
  emptyDesc: {
    fontSize: type.meta.fontSize,
    color: color.mute,
  },
  fab: {
    position: 'absolute',
    right: space.xl,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: color.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabGlyph: {
    color: color.bg,
    fontSize: 28,
    fontWeight: '300',
    lineHeight: 30,
  },
});
