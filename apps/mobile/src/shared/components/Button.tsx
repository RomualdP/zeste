import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { color, radius, space, type } from '../theme';

type ButtonVariant = 'primary' | 'secondary' | 'icon';

interface ButtonProps {
  label?: string;
  onPress: () => void;
  variant?: ButtonVariant;
  icon?: React.ReactNode;
  disabled?: boolean;
  loading?: boolean;
  testID?: string;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  disabled = false,
  loading = false,
  testID,
}: ButtonProps) {
  const isInteractive = !disabled && !loading;
  const containerStyle: ViewStyle[] = [styles.base];
  const labelStyle: TextStyle[] = [styles.label];

  if (variant === 'primary') {
    containerStyle.push(styles.primary);
    labelStyle.push(styles.labelOnInk);
  } else if (variant === 'secondary') {
    containerStyle.push(styles.secondary);
    labelStyle.push(styles.labelOnSurface);
  } else {
    containerStyle.push(styles.icon);
    labelStyle.push(styles.labelOnInk);
  }

  if (disabled || loading) {
    containerStyle.push(styles.disabled);
  }

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      disabled={!isInteractive}
      onPress={onPress}
      style={containerStyle}
      testID={testID}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'secondary' ? color.ink : color.bg} />
      ) : (
        <View style={styles.content}>
          {label ? <Text style={labelStyle}>{label}</Text> : null}
          {icon ? <View style={label ? styles.iconWithLabel : null}>{icon}</View> : null}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 56,
    borderRadius: radius.pill,
    paddingHorizontal: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    backgroundColor: color.ink,
  },
  secondary: {
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.line,
  },
  icon: {
    width: 56,
    paddingHorizontal: 0,
    backgroundColor: color.ink,
  },
  disabled: {
    opacity: 0.4,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    fontSize: type.label.fontSize,
    fontWeight: type.label.fontWeight,
    letterSpacing: type.label.letterSpacing,
  },
  labelOnInk: {
    color: color.bg,
  },
  labelOnSurface: {
    color: color.ink,
  },
  iconWithLabel: {
    marginLeft: space.sm,
  },
});
