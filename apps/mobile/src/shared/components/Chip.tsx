import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { color, radius } from '../theme';

interface ChipProps {
  label: string;
  active?: boolean;
  onPress?: () => void;
}

export function Chip({ label, active = false, onPress }: ChipProps) {
  const containerStyle: ViewStyle[] = [styles.base];
  if (active) {
    containerStyle.push(styles.active);
  }

  const textStyle = [styles.label, active ? styles.labelActive : null];

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={containerStyle}>
        <Text style={textStyle}>{label}</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={containerStyle}>
      <Text style={textStyle}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radius.chip,
    backgroundColor: 'rgba(15,15,14,0.06)',
    alignSelf: 'flex-start',
  },
  active: {
    backgroundColor: color.ink,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    color: color.ink,
  },
  labelActive: {
    color: color.bg,
  },
});
