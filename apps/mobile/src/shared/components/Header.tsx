import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { color, space } from '../theme';

interface HeaderProps {
  onBack?: () => void;
  onMenu?: () => void;
  steps?: { total: number; current: number };
}

export function Header({ onBack, onMenu, steps }: HeaderProps) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.row}>
        <View style={styles.side}>
          {onBack ? (
            <TouchableOpacity
              accessibilityRole="button"
              activeOpacity={0.85}
              onPress={onBack}
              style={styles.iconButton}
              testID="header-back"
            >
              <Text style={styles.glyph}>←</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={styles.center}>
          {steps ? <ProgressSegments total={steps.total} current={steps.current} /> : null}
        </View>

        <View style={[styles.side, styles.sideRight]}>
          {onMenu ? (
            <TouchableOpacity
              accessibilityRole="button"
              activeOpacity={0.85}
              onPress={onMenu}
              style={styles.iconButton}
              testID="header-menu"
            >
              <Text style={styles.glyph}>⋯</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </View>
  );
}

function ProgressSegments({ total, current }: { total: number; current: number }) {
  return (
    <View style={styles.segments}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          testID={`header-step-${i}`}
          style={[styles.segment, i < current ? styles.segmentDone : styles.segmentTodo]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingTop: space['3xl'],
    paddingHorizontal: space.xl,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
  },
  side: {
    width: 40,
    alignItems: 'flex-start',
  },
  sideRight: {
    alignItems: 'flex-end',
  },
  center: {
    flex: 1,
    paddingHorizontal: space.lg,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glyph: {
    color: color.ink,
    fontSize: 18,
    lineHeight: 22,
  },
  segments: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  segment: {
    flex: 1,
    height: 2,
    borderRadius: 1,
  },
  segmentDone: {
    backgroundColor: color.ink,
  },
  segmentTodo: {
    backgroundColor: color.line,
  },
});
