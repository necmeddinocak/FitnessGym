import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  KeyboardAvoidingView, 
  Platform,
  ActivityIndicator,
  Alert,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card } from '../../components/common';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../theme';

const LoginScreen = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleContinue = async () => {
    // Validate email
    if (!email.trim()) {
      Alert.alert('Hata', 'Lütfen e-posta adresinizi girin.');
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert('Hata', 'Lütfen geçerli bir e-posta adresi girin.');
      return;
    }

    // If new user, validate name
    if (isNewUser && !name.trim()) {
      Alert.alert('Hata', 'Lütfen adınızı girin.');
      return;
    }

    setLoading(true);
    try {
      await onLogin(email.trim().toLowerCase(), name.trim(), isNewUser);
    } catch (error) {
      // Log for debugging (won't show to user)
      console.log('Login attempt failed:', error.message);
      
      // Show user-friendly error message
      let errorMessage = 'Bir hata oluştu. Lütfen tekrar deneyin.';
      
      if (error.message && error.message.includes('kayıtlı kullanıcı bulunamadı')) {
        errorMessage = 'Bu e-posta adresiyle kayıtlı kullanıcı bulunamadı. Lütfen hesap oluşturun.';
      } else if (error.message && error.message.includes('zaten kayıtlı')) {
        errorMessage = 'Bu e-posta adresi zaten kayıtlı. Lütfen giriş yapın.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Hata', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo/Icon Section */}
        <View style={styles.headerSection}>
          <View style={styles.logoContainer}>
            <Ionicons name="fitness" size={64} color={colors.primary} />
          </View>
          <Text style={styles.appTitle}>FitnessGym</Text>
          <Text style={styles.appSubtitle}>Fitness Yolculuğuna Başla</Text>
        </View>

        {/* Login Card */}
        <Card style={styles.loginCard}>
          <Text style={styles.cardTitle}>
            {isNewUser ? 'Hesap Oluştur' : 'Giriş Yap'}
          </Text>
          <Text style={styles.cardSubtitle}>
            {isNewUser 
              ? 'Yeni hesap oluşturmak için bilgilerini gir' 
              : 'E-posta adresinle devam et'}
          </Text>

          {/* Email Input */}
          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="E-posta adresi"
              placeholderTextColor={colors.textMuted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
            />
          </View>

          {/* Name Input (only for new users) */}
          {isNewUser && (
            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Adın"
                placeholderTextColor={colors.textMuted}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                autoCorrect={false}
                editable={!loading}
              />
            </View>
          )}

          {/* Continue Button */}
          <Button
            title={loading ? 'Yükleniyor...' : isNewUser ? 'Hesap Oluştur' : 'Devam Et'}
            onPress={handleContinue}
            disabled={loading}
            style={styles.continueButton}
          />

          {/* Toggle New/Existing User */}
          <View style={styles.toggleContainer}>
            <Text style={styles.toggleText}>
              {isNewUser ? 'Zaten hesabın var mı?' : 'Yeni kullanıcı mısın?'}
            </Text>
            <Text 
              style={styles.toggleLink}
              onPress={() => {
                setIsNewUser(!isNewUser);
                setName('');
              }}
            >
              {isNewUser ? 'Giriş Yap' : 'Hesap Oluştur'}
            </Text>
          </View>
        </Card>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <View style={styles.featureRow}>
            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
            <Text style={styles.featureText}>Ücretsiz ve sınırsız kullanım</Text>
          </View>
          <View style={styles.featureRow}>
            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
            <Text style={styles.featureText}>Kişiselleştirilmiş antrenman programları</Text>
          </View>
          <View style={styles.featureRow}>
            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
            <Text style={styles.featureText}>İlerleme takibi ve istatistikler</Text>
          </View>
        </View>

        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  appTitle: {
    fontSize: fontSize.xxxl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  appSubtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  loginCard: {
    marginBottom: spacing.xl,
  },
  cardTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  cardSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
  },
  inputIcon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: fontSize.md,
    color: colors.text,
  },
  continueButton: {
    marginTop: spacing.sm,
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  toggleText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginRight: spacing.xs,
  },
  toggleLink: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: fontWeight.bold,
  },
  infoSection: {
    gap: spacing.md,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  featureText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default LoginScreen;

