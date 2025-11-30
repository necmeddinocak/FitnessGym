import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, borderRadius, spacing, fontSize, fontWeight } from '../../theme';

export const Badge = ({ label, variant = 'default' }) => {
  return (
    <View style={[styles.badge, styles[variant]]}>
      <Text style={styles.text}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-start',
  },
  default: {
    backgroundColor: colors.surfaceLight,
  },
  beginner: {
    backgroundColor: colors.success + '30',
  },
  intermediate: {
    backgroundColor: colors.warning + '30',
  },
  advanced: {
    backgroundColor: colors.error + '30',
  },
  text: {
    color: colors.text,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    textTransform: 'uppercase',
  },
});

