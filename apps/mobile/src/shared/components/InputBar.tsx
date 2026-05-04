import React from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { color, radius, space, type } from '../theme';

interface InputBarProps {
  value: string;
  onChangeText: (v: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  submitIcon?: React.ReactNode;
  submitDisabled?: boolean;
}

export function InputBar({
  value,
  onChangeText,
  onSubmit,
  placeholder,
  submitIcon,
  submitDisabled,
}: InputBarProps) {
  const isEmpty = value.trim().length === 0;
  const disabled = submitDisabled ?? isEmpty;

  const handleSubmit = () => {
    if (disabled) return;
    onSubmit();
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.row}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={color.mute2}
          returnKeyType="send"
          onSubmitEditing={handleSubmit}
        />
        <TouchableOpacity
          accessibilityRole="button"
          activeOpacity={0.85}
          disabled={disabled}
          onPress={handleSubmit}
          style={[styles.submit, disabled ? styles.submitDisabled : null]}
          testID="input-bar-submit"
        >
          {submitIcon ?? <Text style={styles.submitGlyph}>→</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: space.xl,
    paddingTop: space.sm,
    paddingBottom: space.lg,
    backgroundColor: color.bg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  input: {
    flex: 1,
    height: 56,
    borderRadius: radius.pill,
    paddingHorizontal: 22,
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.line,
    fontSize: type.body.fontSize,
    color: color.ink,
  },
  submit: {
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: color.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitDisabled: {
    opacity: 0.4,
  },
  submitGlyph: {
    color: color.bg,
    fontSize: 22,
    fontWeight: '500',
  },
});
