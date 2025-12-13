import React from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme';

export const ScreenContainer = ({ 
  children, 
  scrollable = false, 
  keyboardAvoiding = false,
  style 
}) => {
  const Container = scrollable ? ScrollView : View;
  
  const content = (
    <Container 
      style={[styles.container, style]}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={scrollable ? styles.scrollContent : undefined}
      keyboardShouldPersistTaps={scrollable ? "handled" : undefined}
    >
      {children}
    </Container>
  );
  
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {keyboardAvoiding ? (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          {content}
        </KeyboardAvoidingView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
});

