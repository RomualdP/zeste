import React, { useCallback, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button } from '../../../shared/components';
import { color, space, type } from '../../../shared/theme';
import type { AuthStackParamList } from '../../../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Onboarding'>;

interface Slide {
  id: string;
  renderHero: () => React.ReactNode;
  sub: string;
}

const SLIDES: Slide[] = [
  {
    id: 'transform',
    renderHero: () => (
      <Text style={styles.hero}>
        Transforme ce que tu <Text style={styles.heroSerif}>lis</Text> en podcast.
      </Text>
    ),
    sub: 'Articles, PDF, tes propres notes. Zeste en fait un épisode pour toi.',
  },
  {
    id: 'rythme',
    renderHero: () => (
      <Text style={styles.hero}>
        À ton <Text style={styles.heroSerif}>rythme</Text>, ton{' '}
        <Text style={styles.heroSerif}>ton</Text>.
      </Text>
    ),
    sub: '4 tons, de 5 à 30 minutes, chapitré ou pas. C’est toi qui décides.',
  },
  {
    id: 'ecoute',
    renderHero: () => (
      <Text style={styles.hero}>
        Écoute <Text style={styles.heroSerif}>partout</Text>.
      </Text>
    ),
    sub: 'Téléchargement, lecture en arrière-plan, partage par lien.',
  },
];

const HAS_SEEN_ONBOARDING_KEY = 'hasSeenOnboarding';

export function OnboardingScreen({ navigation }: Props) {
  const [index, setIndex] = useState(0);
  const listRef = useRef<FlatList<Slide>>(null);
  const width = Dimensions.get('window').width;

  const completeOnboarding = useCallback(async () => {
    await AsyncStorage.getItem(HAS_SEEN_ONBOARDING_KEY);
    await AsyncStorage.setItem(HAS_SEEN_ONBOARDING_KEY, 'true');
    navigation.navigate('Auth');
  }, [navigation]);

  const onMomentumScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(e.nativeEvent.contentOffset.x / width);
    setIndex(next);
  };

  const isLast = index === SLIDES.length - 1;

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.spacer} />
        <TouchableOpacity
          accessibilityRole="button"
          activeOpacity={0.7}
          onPress={completeOnboarding}
          testID="onboarding-skip"
          style={styles.skipButton}
        >
          <Text style={styles.skipLabel}>Passer</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        ref={listRef}
        testID="onboarding-list"
        data={SLIDES}
        keyExtractor={(s) => s.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onMomentumScrollEnd}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>
            {item.renderHero()}
            <Text style={styles.sub}>{item.sub}</Text>
          </View>
        )}
      />

      <View style={styles.dots}>
        {SLIDES.map((s, i) => (
          <View
            key={s.id}
            testID={`onboarding-dot-${i}`}
            style={[styles.dot, i === index ? styles.dotActive : styles.dotInactive]}
          />
        ))}
      </View>

      <View style={styles.cta}>
        {isLast ? (
          <Button
            label="Commencer →"
            onPress={completeOnboarding}
            testID="onboarding-cta"
          />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: color.bg,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: space['3xl'],
    paddingHorizontal: space.xl,
    height: 80,
  },
  spacer: {
    width: 40,
  },
  skipButton: {
    paddingVertical: space.sm,
    paddingHorizontal: space.md,
  },
  skipLabel: {
    color: color.mute,
    fontSize: type.meta.fontSize,
    fontWeight: type.meta.fontWeight,
  },
  slide: {
    flex: 1,
    paddingHorizontal: space.xl,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  hero: {
    fontSize: type.hero.fontSize,
    fontWeight: type.hero.fontWeight,
    lineHeight: type.hero.lineHeight,
    color: color.ink,
    marginBottom: space.lg,
  },
  heroSerif: {
    fontFamily: type.serif.fontFamily,
    fontStyle: type.serif.fontStyle,
  },
  sub: {
    fontSize: type.body.fontSize,
    fontWeight: type.body.fontWeight,
    lineHeight: type.body.lineHeight,
    color: color.mute,
    maxWidth: 320,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: space.lg,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    backgroundColor: color.ink,
  },
  dotInactive: {
    backgroundColor: color.line,
  },
  cta: {
    paddingHorizontal: space.xl,
    paddingBottom: space['2xl'],
    minHeight: 80,
    justifyContent: 'center',
  },
});
