import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { color, space, type } from '../../../shared/theme';

interface GeneratingScreenProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  navigation: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  route: any;
}

export function GeneratingScreen({ route }: GeneratingScreenProps) {
  return (
    <View style={styles.root}>
      <ActivityIndicator size="large" color={color.ink} />
      <Text style={styles.title}>On prépare ton épisode…</Text>
      <Text style={styles.meta}>{route?.params?.projectId ?? ''}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: color.bg,
    gap: space.lg,
    padding: space.xl,
  },
  title: {
    fontSize: type.label.fontSize,
    color: color.ink,
  },
  meta: {
    fontSize: type.meta.fontSize,
    color: color.mute,
  },
});
