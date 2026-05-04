import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { color, radius, space, tone, ToneId, type } from '../theme';

interface ListRowProps {
  toneId: ToneId;
  title: string;
  meta: string;
  generating?: boolean;
  onPress: () => void;
}

export function ListRow({ toneId, title, meta, generating = false, onPress }: ListRowProps) {
  const palette = tone[toneId];
  const initial = (title.trim().charAt(0) || '·').toUpperCase();

  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={styles.row}>
      <View style={[styles.avatar, { backgroundColor: palette.bg }]}>
        <Text style={[styles.initial, { color: palette.ink }]}>{initial}</Text>
      </View>

      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <View style={styles.metaRow}>
          {generating ? <PulseDot /> : null}
          <Text style={styles.meta} numberOfLines={1}>
            {meta}
          </Text>
        </View>
      </View>

      <Text style={styles.chevron}>→</Text>
    </TouchableOpacity>
  );
}

function PulseDot() {
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.3, duration: 600, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return <Animated.View testID="list-row-dot" style={[styles.dot, { opacity }]} />;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: space.lg,
    backgroundColor: color.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: color.line,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: radius.chip,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  body: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: -0.1,
    color: color.ink,
  },
  metaRow: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  meta: {
    fontSize: type.meta.fontSize,
    color: color.mute,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: color.warm,
  },
  chevron: {
    color: color.mute2,
    fontSize: 18,
  },
});
