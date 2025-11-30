import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card } from '../../components/common';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../theme';
import { useUser } from '../../context/UserContext';
import { updateUserProfile, updateUserEmailAndName } from '../../services/userService';

const ProfileEditScreen = ({ navigation }) => {
  const { userId, userProfile, userName, userEmail, refreshUserProfile } = useUser();
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    age: '',
    height: '',
    current_weight: '',
    target_weight: '',
    gender: 'male',
  });

  useEffect(() => {
    if (userProfile) {
      setFormData({
        name: userName || userProfile.name || '',
        email: userEmail || userProfile.email || '',
        age: userProfile.age ? String(userProfile.age) : '',
        height: userProfile.height ? String(userProfile.height) : '',
        current_weight: userProfile.current_weight ? String(userProfile.current_weight) : '',
        target_weight: userProfile.target_weight ? String(userProfile.target_weight) : '',
        gender: userProfile.gender || 'male',
      });
    }
  }, [userProfile, userName, userEmail]);

  const handleSave = async () => {
    // Validation
    if (!formData.name.trim()) {
      Alert.alert('Hata', 'Lütfen adınızı girin.');
      return;
    }

    if (!formData.email.trim()) {
      Alert.alert('Hata', 'Lütfen e-posta adresinizi girin.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      Alert.alert('Hata', 'Lütfen geçerli bir e-posta adresi girin.');
      return;
    }

    setLoading(true);
    try {
      // Update email and name
      await updateUserEmailAndName(userId, formData.email.trim().toLowerCase(), formData.name.trim());

      // Update profile data
      const profileData = {
        age: formData.age ? parseInt(formData.age) : null,
        height: formData.height ? parseFloat(formData.height) : null,
        current_weight: formData.current_weight ? parseFloat(formData.current_weight) : null,
        target_weight: formData.target_weight ? parseFloat(formData.target_weight) : null,
        gender: formData.gender,
      };

      await updateUserProfile(userId, profileData);

      // Refresh user profile in context
      await refreshUserProfile();

      Alert.alert(
        'Başarılı',
        'Profiliniz güncellendi.',
        [
          {
            text: 'Tamam',
            onPress: () => navigation.goBack()
          }
        ]
      );
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Hata', 'Profil güncellenirken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Personal Info */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Kişisel Bilgiler</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Ad *</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Adınız"
                placeholderTextColor={colors.textMuted}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                autoCapitalize="words"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>E-posta *</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="E-posta adresiniz"
                placeholderTextColor={colors.textMuted}
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Yaş</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Yaşınız"
                placeholderTextColor={colors.textMuted}
                value={formData.age}
                onChangeText={(text) => setFormData({ ...formData, age: text.replace(/[^0-9]/g, '') })}
                keyboardType="numeric"
              />
            </View>
          </View>
        </Card>

        {/* Body Measurements */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Vücut Ölçüleri</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Boy (cm)</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="resize-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Boy uzunluğunuz"
                placeholderTextColor={colors.textMuted}
                value={formData.height}
                onChangeText={(text) => setFormData({ ...formData, height: text.replace(/[^0-9.]/g, '') })}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Güncel Kilo (kg)</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="speedometer-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Güncel kilonuz"
                placeholderTextColor={colors.textMuted}
                value={formData.current_weight}
                onChangeText={(text) => setFormData({ ...formData, current_weight: text.replace(/[^0-9.]/g, '') })}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Hedef Kilo (kg)</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="flag-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Hedef kilonuz"
                placeholderTextColor={colors.textMuted}
                value={formData.target_weight}
                onChangeText={(text) => setFormData({ ...formData, target_weight: text.replace(/[^0-9.]/g, '') })}
                keyboardType="numeric"
              />
            </View>
          </View>
        </Card>

        {/* Save Button */}
        <Button
          title={loading ? 'Kaydediliyor...' : 'Kaydet'}
          onPress={handleSave}
          disabled={loading}
          style={styles.saveButton}
        />

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
    padding: spacing.md,
  },
  card: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
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
  saveButton: {
    marginTop: spacing.md,
    marginBottom: spacing.xl,
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

export default ProfileEditScreen;

