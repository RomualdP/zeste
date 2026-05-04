import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { color } from '../theme';

interface CheckboxProps {
  checked: boolean;
  label: string;
  onToggle: () => void;
  activeColor?: string;
  testID?: string;
}

export function Checkbox({
  checked,
  label,
  onToggle,
  activeColor = color.ink,
  testID,
}: CheckboxProps) {
  return (
    <TouchableOpacity style={styles.row} onPress={onToggle} testID={testID}>
      <View style={[styles.box, checked && { backgroundColor: activeColor, borderColor: activeColor }]}>
        {checked && <Text style={styles.checkmark}>{'✓'}</Text>}
      </View>
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  box: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: color.line,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  checkmark: { color: color.bg, fontSize: 16, fontWeight: 'bold' },
  label: { fontSize: 15, color: color.ink },
});
