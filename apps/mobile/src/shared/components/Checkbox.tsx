import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

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
  activeColor = '#FF6B35',
  testID,
}: CheckboxProps) {
  return (
    <TouchableOpacity style={styles.row} onPress={onToggle} testID={testID}>
      <View style={[styles.box, checked && { backgroundColor: activeColor, borderColor: activeColor }]}>
        {checked && <Text style={styles.checkmark}>{'\u2713'}</Text>}
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
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  checkmark: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  label: { fontSize: 15, color: '#333' },
});
