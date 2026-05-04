import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { radius, tone, ToneId } from '../theme';

interface ToneCardProps {
  toneId: ToneId;
  selected: boolean;
  onPress: () => void;
  testID?: string;
}

export function ToneCard({ toneId, selected, onPress, testID }: ToneCardProps) {
  const palette = tone[toneId];

  return (
    <TouchableOpacity
      accessibilityRole="button"
      activeOpacity={0.9}
      onPress={onPress}
      testID={testID}
      style={[
        styles.base,
        { backgroundColor: palette.bg },
        selected ? styles.selected : null,
      ]}
    >
      <Text style={[styles.title, { color: palette.ink }]}>{palette.label}</Text>
      <Text style={[styles.desc, { color: palette.ink }]}>{palette.desc}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    width: 168,
    borderRadius: radius.card,
    paddingTop: 18,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  selected: {
    transform: [{ scale: 0.97 }],
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  desc: {
    marginTop: 6,
    fontSize: 12,
    opacity: 0.7,
    lineHeight: 16,
  },
});
