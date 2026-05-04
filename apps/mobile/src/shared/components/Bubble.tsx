import React from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { color, type } from '../theme';
import { useRise } from '../motion/useRise';

interface BubbleProps {
  from: 'app' | 'user';
  children: React.ReactNode;
  delay?: number;
}

export function Bubble({ from, children, delay = 0 }: BubbleProps) {
  const rise = useRise(delay);
  const isUser = from === 'user';

  return (
    <Animated.View
      style={[
        styles.row,
        isUser ? styles.rowUser : styles.rowApp,
        rise.style,
      ]}
    >
      <View
        style={[
          styles.bubble,
          isUser ? styles.bubbleUser : styles.bubbleApp,
        ]}
      >
        {typeof children === 'string' ? (
          <Text style={[styles.text, isUser ? styles.textUser : styles.textApp]}>
            {children}
          </Text>
        ) : (
          children
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    width: '100%',
    flexDirection: 'row',
    marginBottom: 10,
  },
  rowApp: {
    justifyContent: 'flex-start',
  },
  rowUser: {
    justifyContent: 'flex-end',
  },
  bubble: {
    maxWidth: '85%',
    paddingVertical: 14,
    paddingHorizontal: 18,
  },
  bubbleApp: {
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.line,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderBottomRightRadius: 22,
    borderBottomLeftRadius: 4,
  },
  bubbleUser: {
    backgroundColor: color.ink,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderBottomRightRadius: 4,
    borderBottomLeftRadius: 22,
  },
  text: {
    fontSize: type.body.fontSize,
    fontWeight: type.body.fontWeight,
    lineHeight: type.body.lineHeight,
  },
  textApp: {
    color: color.ink,
  },
  textUser: {
    color: color.bg,
  },
});
