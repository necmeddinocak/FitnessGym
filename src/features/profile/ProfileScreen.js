import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Linking, Modal, Switch, Image, TextInput, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer, Card, Button } from '../../components/common';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../theme';
import { useUser } from '../../context/UserContext';
import { 
  getUserProfile,
  loadNotificationSettings,
  saveNotificationSettings,
  scheduleWeeklySummaryNotification,
  scheduleMotivationReminder,
  toggleNotifications,
  registerForPushNotifications,
  updateAvatarWithPicker,
  updateAvatarWithCamera,
  updateUserProfile,
  updateUserEmailAndName
} from '../../services';
import { useFocusEffect } from '@react-navigation/native';

const ProfileScreen = ({ navigation }) => {
  const { userId, userName, userEmail, isAnonymous, logout: logoutUser, refreshUserProfile, claimAccount, signIn } = useUser();
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notificationModalVisible, setNotificationModalVisible] = useState(false);
  const [privacyModalVisible, setPrivacyModalVisible] = useState(false);
  const [helpModalVisible, setHelpModalVisible] = useState(false);
  const [aboutModalVisible, setAboutModalVisible] = useState(false);
  const [avatarModalVisible, setAvatarModalVisible] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [profileEditModalVisible, setProfileEditModalVisible] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  
  // Claim Account Modal States
  const [claimAccountModalVisible, setClaimAccountModalVisible] = useState(false);
  const [claimEmail, setClaimEmail] = useState('');
  const [claimPassword, setClaimPassword] = useState('');
  const [claimPasswordConfirm, setClaimPasswordConfirm] = useState('');
  const [claimLoading, setClaimLoading] = useState(false);
  const [showClaimPassword, setShowClaimPassword] = useState(false);
  
  // Login Modal States
  const [loginModalVisible, setLoginModalVisible] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    age: '',
    height: '',
    current_weight: '',
    target_weight: '',
  });
  const [notificationSettings, setNotificationSettings] = useState({
    weeklySummary: true,
    motivationReminder: true,
  });

  // Login Handler
  const handleLogin = async () => {
    // Validation
    if (!loginEmail.trim()) {
      Alert.alert('Hata', 'Lütfen e-posta adresinizi girin.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(loginEmail)) {
      Alert.alert('Hata', 'Lütfen geçerli bir e-posta adresi girin.');
      return;
    }

    if (!loginPassword) {
      Alert.alert('Hata', 'Lütfen şifrenizi girin.');
      return;
    }

    setLoginLoading(true);
    try {
      await signIn(loginEmail.trim().toLowerCase(), loginPassword);
      
      // Clear loading state immediately after successful login
      setLoginLoading(false);
      
      setLoginModalVisible(false);
      setLoginEmail('');
      setLoginPassword('');
      
      Alert.alert(
        'Hoş Geldiniz! 👋', 
        'Başarıyla giriş yaptınız.',
        [{ text: 'Tamam' }]
      );
      
      // Refresh profile to update UI (don't await to prevent hanging)
      if (refreshUserProfile) {
        refreshUserProfile().catch(err => {
          console.log('Profile refresh error (non-blocking):', err);
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      setLoginLoading(false);
      let errorMessage = 'Giriş yapılırken bir hata oluştu. Lütfen tekrar deneyin.';
      
      if (error.message?.toLowerCase().includes('invalid') || error.message?.toLowerCase().includes('credentials')) {
        errorMessage = 'E-posta veya şifre hatalı. Lütfen kontrol edip tekrar deneyin.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Hata', errorMessage);
    }
  };

  // Claim Account Handler
  const handleClaimAccount = async () => {
    // Validation
    if (!claimEmail.trim()) {
      Alert.alert('Hata', 'Lütfen e-posta adresinizi girin.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(claimEmail)) {
      Alert.alert('Hata', 'Lütfen geçerli bir e-posta adresi girin.');
      return;
    }

    if (!claimPassword || claimPassword.length < 6) {
      Alert.alert('Hata', 'Şifre en az 6 karakter olmalıdır.');
      return;
    }

    if (claimPassword !== claimPasswordConfirm) {
      Alert.alert('Hata', 'Şifreler eşleşmiyor.');
      return;
    }

    setClaimLoading(true);
    try {
      await claimAccount(claimEmail.trim().toLowerCase(), claimPassword);
      
      // Clear loading state immediately after successful claim
      setClaimLoading(false);
      
      // Close modal and clear form
      setClaimAccountModalVisible(false);
      setClaimEmail('');
      setClaimPassword('');
      setClaimPasswordConfirm('');
      
      Alert.alert(
        'Başarılı! 🎉', 
        'Hesabınız başarıyla kaydedildi! Artık e-posta ve şifrenizle giriş yapabilirsiniz. Tüm verileriniz korunmuştur.',
        [{ text: 'Tamam' }]
      );
      
      // Refresh profile to update UI (don't await to prevent hanging)
      if (refreshUserProfile) {
        refreshUserProfile().catch(err => {
          console.log('Profile refresh error (non-blocking):', err);
        });
      }
    } catch (error) {
      console.error('Claim account error:', error);
      setClaimLoading(false);
      Alert.alert('Hata', error.message || 'Hesap kaydedilirken bir hata oluştu. Lütfen tekrar deneyin.');
    }
  };

  // Avatar upload handlers
  const handleAvatarPress = () => {
    setAvatarModalVisible(true);
  };

  const handlePickFromGallery = async () => {
    try {
      setAvatarModalVisible(false);
      setAvatarUploading(true);
      
      const newAvatarUrl = await updateAvatarWithPicker(userId, userProfile?.avatar_url);
      
      if (newAvatarUrl) {
        setUserProfile(prev => ({ ...prev, avatar_url: newAvatarUrl }));
        Alert.alert('Başarılı', 'Profil fotoğrafınız güncellendi! 📸');
      }
    } catch (error) {
      console.error('Gallery upload error:', error);
      Alert.alert('Hata', error.message || 'Fotoğraf yüklenirken bir hata oluştu.');
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleTakePhoto = async () => {
    try {
      setAvatarModalVisible(false);
      setAvatarUploading(true);
      
      const newAvatarUrl = await updateAvatarWithCamera(userId, userProfile?.avatar_url);
      
      if (newAvatarUrl) {
        setUserProfile(prev => ({ ...prev, avatar_url: newAvatarUrl }));
        Alert.alert('Başarılı', 'Profil fotoğrafınız güncellendi! 📸');
      }
    } catch (error) {
      console.error('Camera upload error:', error);
      Alert.alert('Hata', error.message || 'Fotoğraf yüklenirken bir hata oluştu.');
    } finally {
      setAvatarUploading(false);
    }
  };

  // Profile Edit Modal handlers
  const openProfileEditModal = () => {
    setEditFormData({
      name: userName || userProfile?.name || '',
      email: userEmail || '',
      age: userProfile?.age ? String(userProfile.age) : '',
      height: userProfile?.height ? String(userProfile.height) : '',
      current_weight: userProfile?.current_weight ? String(userProfile.current_weight) : '',
      target_weight: userProfile?.target_weight ? String(userProfile.target_weight) : '',
    });
    setProfileEditModalVisible(true);
  };

  const handleSaveProfile = async () => {
    // Validation
    if (!editFormData.name.trim()) {
      Alert.alert('Hata', 'Lütfen adınızı girin.');
      return;
    }

    // Only validate email if user is not anonymous and has entered email
    if (!isAnonymous && editFormData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(editFormData.email)) {
        Alert.alert('Hata', 'Lütfen geçerli bir e-posta adresi girin.');
        return;
      }
    }

    setProfileSaving(true);
    try {
      // Update email and name (only if not anonymous)
      if (!isAnonymous && editFormData.email.trim()) {
        await updateUserEmailAndName(userId, editFormData.email.trim().toLowerCase(), editFormData.name.trim());
      }

      // Update profile data
      const profileData = {
        name: editFormData.name.trim(),
        age: editFormData.age ? parseInt(editFormData.age) : null,
        height: editFormData.height ? parseFloat(editFormData.height) : null,
        current_weight: editFormData.current_weight ? parseFloat(editFormData.current_weight) : null,
        target_weight: editFormData.target_weight ? parseFloat(editFormData.target_weight) : null,
      };

      await updateUserProfile(userId, profileData);

      // Refresh user profile
      if (refreshUserProfile) {
        await refreshUserProfile();
      }
      
      // Update local state
      setUserProfile(prev => ({
        ...prev,
        ...profileData,
      }));

      setProfileEditModalVisible(false);
      Alert.alert('Başarılı', 'Profiliniz güncellendi! ✅');
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Hata', 'Profil güncellenirken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setProfileSaving(false);
    }
  };

  useEffect(() => {
    if (userId) {
      loadProfile();
      loadNotifications();
    }
  }, [userId]);

  const loadNotifications = async () => {
    try {
      const settings = await loadNotificationSettings();
      setNotificationSettings(settings);
    } catch (error) {
      console.log('Bildirim ayarları yüklenemedi:', error);
    }
  };

  const handleToggleWeeklySummary = async (value) => {
    try {
      const newSettings = { ...notificationSettings, weeklySummary: value };
      setNotificationSettings(newSettings);
      await saveNotificationSettings(newSettings);
      
      if (value) {
        await registerForPushNotifications();
        await scheduleWeeklySummaryNotification(0);
      }
    } catch (error) {
      console.error('Haftalık özet ayarı değiştirilemedi:', error);
      Alert.alert('Hata', 'Ayar değiştirilemedi.');
    }
  };

  const handleToggleMotivationReminder = async (value) => {
    try {
      const newSettings = { ...notificationSettings, motivationReminder: value };
      setNotificationSettings(newSettings);
      await saveNotificationSettings(newSettings);
      
      if (value) {
        await registerForPushNotifications();
        await scheduleMotivationReminder();
      }
    } catch (error) {
      console.error('Motivasyon hatırlatıcısı ayarı değiştirilemedi:', error);
      Alert.alert('Hata', 'Ayar değiştirilemedi.');
    }
  };

  const handleToggleAllNotifications = async (enabled) => {
    try {
      const newSettings = {
        weeklySummary: enabled,
        motivationReminder: enabled,
      };
      setNotificationSettings(newSettings);
      await toggleNotifications(enabled);
    } catch (error) {
      console.error('Bildirim ayarları değiştirilemedi:', error);
      Alert.alert('Hata', 'Ayarlar değiştirilemedi.');
    }
  };

  // Reload profile when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      if (userId) {
        loadProfile();
      }
    }, [userId])
  );

  const loadProfile = async () => {
    try {
      setLoading(true);
      const profile = await getUserProfile(userId);
      setUserProfile(profile);
    } catch (error) {
      console.error('Error loading profile:', error);
      // Set default values if profile doesn't exist
      setUserProfile({
        name: 'Anonim Kullanıcı',
        age: null,
        height: null,
        current_weight: null,
        target_weight: null,
        join_date: new Date().toISOString().split('T')[0],
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <ScreenContainer>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenContainer>
    );
  }

  if (!userProfile) {
    return (
      <ScreenContainer>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Profil yüklenemedi</Text>
        </View>
      </ScreenContainer>
    );
  }

  // Calculate BMI
  const calculateBMI = () => {
    if (!userProfile.height || !userProfile.current_weight) return '0.0';
    const heightInMeters = userProfile.height / 100;
    const bmi = userProfile.current_weight / (heightInMeters * heightInMeters);
    return bmi.toFixed(1);
  };

  // Get BMI category
  const getBMICategory = (bmi) => {
    if (bmi < 18.5) return { text: 'Zayıf', color: colors.info };
    if (bmi < 25) return { text: 'Normal', color: colors.success };
    if (bmi < 30) return { text: 'Fazla Kilolu', color: colors.warning };
    return { text: 'Obez', color: colors.error };
  };

  // Calculate days since joining
  const getDaysSinceJoin = () => {
    if (!userProfile.join_date) return 0;
    const joinDate = new Date(userProfile.join_date);
    const today = new Date();
    const diffTime = Math.abs(today - joinDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const bmi = calculateBMI();
  const bmiCategory = getBMICategory(parseFloat(bmi));
  const daysSinceJoin = getDaysSinceJoin();

  const InfoRow = ({ icon, label, value, unit = '', color = colors.textSecondary }) => (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>
          {String(value)} {unit && <Text style={styles.infoUnit}>{unit}</Text>}
        </Text>
      </View>
    </View>
  );

  const SettingItem = ({ icon, title, onPress, showArrow = true, highlight = false }) => (
    <TouchableOpacity style={[styles.settingItem, highlight && styles.settingItemHighlight]} onPress={onPress}>
      <View style={styles.settingLeft}>
        <View style={[styles.settingIcon, highlight && styles.settingIconHighlight]}>
          <Ionicons name={icon} size={20} color={highlight ? colors.text : colors.text} />
        </View>
        <Text style={[styles.settingTitle, highlight && styles.settingTitleHighlight]}>{title}</Text>
      </View>
      {showArrow && (
        <Ionicons name="chevron-forward" size={20} color={highlight ? colors.text : colors.textMuted} />
      )}
    </TouchableOpacity>
  );

  return (
    <ScreenContainer scrollable>
      <View style={styles.container}>
        {/* Profile Header */}
        <Card style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <TouchableOpacity onPress={handleAvatarPress} disabled={avatarUploading}>
              <View style={styles.avatar}>
                {avatarUploading ? (
                  <ActivityIndicator size="large" color={colors.primary} />
                ) : userProfile?.avatar_url ? (
                  <Image 
                    source={{ uri: userProfile.avatar_url }} 
                    style={styles.avatarImage}
                  />
                ) : (
                  <Ionicons name="person" size={48} color={colors.text} />
                )}
              </View>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.editAvatarButton} 
              onPress={handleAvatarPress}
              disabled={avatarUploading}
            >
              <Ionicons name="camera" size={16} color={colors.text} />
            </TouchableOpacity>
          </View>
          <Text style={styles.userName}>{userProfile.name || 'Anonim Kullanıcı'}</Text>
          
          {/* Anonymous User Badge */}
          {isAnonymous && (
            <View style={styles.anonymousBadge}>
              <Ionicons name="eye-off-outline" size={14} color={colors.warning} />
              <Text style={styles.anonymousBadgeText}>Anonim Hesap</Text>
            </View>
          )}
          
          <Text style={styles.userMemberSince}>
            Üye olma: {userProfile.join_date ? new Date(userProfile.join_date).toLocaleDateString('tr-TR') : '-'}
          </Text>
          <View style={styles.memberBadge}>
            <Ionicons name="trophy" size={16} color={colors.accent} />
            <Text style={styles.memberBadgeText}>{daysSinceJoin} gündür aktif</Text>
          </View>
        </Card>

        {/* Claim Account Card - Only show for anonymous users */}
        {isAnonymous && (
          <Card style={styles.claimAccountCard}>
            <View style={styles.claimAccountHeader}>
              <View style={styles.claimAccountIconContainer}>
                <Ionicons name="shield-checkmark" size={32} color={colors.primary} />
              </View>
              <View style={styles.claimAccountTextContainer}>
                <Text style={styles.claimAccountTitle}>Hesabını Kaydet</Text>
                <Text style={styles.claimAccountDescription}>
                  E-posta ve şifre ekleyerek verilerini kalıcı olarak koru. Tüm antrenmanların ve ilerlemen korunacak!
                </Text>
              </View>
            </View>
            <TouchableOpacity 
              style={styles.claimAccountButton}
              onPress={() => setClaimAccountModalVisible(true)}
            >
              <Ionicons name="key" size={20} color={colors.text} />
              <Text style={styles.claimAccountButtonText}>Hesabı Kaydet</Text>
            </TouchableOpacity>
            
            {/* Login Option */}
            <View style={styles.loginOptionContainer}>
              <View style={styles.loginOptionDivider}>
                <View style={styles.loginOptionLine} />
                <Text style={styles.loginOptionText}>veya</Text>
                <View style={styles.loginOptionLine} />
              </View>
              <TouchableOpacity 
                style={styles.loginOptionButton}
                onPress={() => setLoginModalVisible(true)}
              >
                <Ionicons name="log-in-outline" size={20} color={colors.primary} />
                <Text style={styles.loginOptionButtonText}>Mevcut Hesabınla Giriş Yap</Text>
              </TouchableOpacity>
            </View>
          </Card>
        )}

        {/* User Stats */}
        <Card style={styles.statsCard}>
          <Text style={styles.sectionTitle}>Vücut Bilgileri</Text>
          
          <InfoRow 
            icon="person-outline" 
            label="Yaş" 
            value={userProfile.age || '-'}
            unit={userProfile.age ? 'yaşında' : ''}
            color={colors.secondary}
          />
          
          <InfoRow 
            icon="resize-outline" 
            label="Boy" 
            value={userProfile.height || '-'}
            unit={userProfile.height ? 'cm' : ''}
            color={colors.secondary}
          />
          
          <InfoRow 
            icon="speedometer-outline" 
            label="Güncel Kilo" 
            value={userProfile.current_weight || '-'}
            unit={userProfile.current_weight ? 'kg' : ''}
            color={colors.primary}
          />
          
          <InfoRow 
            icon="flag-outline" 
            label="Hedef Kilo" 
            value={userProfile.target_weight || '-'}
            unit={userProfile.target_weight ? 'kg' : ''}
            color={colors.accent}
          />

          <View style={styles.divider} />

          {/* Progress to Goal */}
          {userProfile.current_weight && userProfile.target_weight && (
            <View style={styles.progressSection}>
              <Text style={styles.progressTitle}>Hedefe İlerleme</Text>
              <View style={styles.progressBarContainer}>
                <View 
                  style={[
                    styles.progressBar, 
                    { 
                      width: `${Math.min(100, 50)}%` 
                    }
                  ]} 
                />
              </View>
              <Text style={styles.progressText}>
                {`${Math.abs(userProfile.current_weight - userProfile.target_weight).toFixed(1)} kg kaldı`}
              </Text>
            </View>
          )}
        </Card>

        {/* BMI Card */}
        <Card style={styles.bmiCard}>
          <Text style={styles.sectionTitle}>Vücut Kitle İndeksi (BMI)</Text>
          <View style={styles.bmiContent}>
            <View style={styles.bmiValueContainer}>
              <Text style={styles.bmiValue}>{String(bmi)}</Text>
              <View style={[styles.bmiCategory, { backgroundColor: bmiCategory.color + '30' }]}>
                <Text style={[styles.bmiCategoryText, { color: bmiCategory.color }]}>
                  {String(bmiCategory.text)}
                </Text>
              </View>
            </View>
            <View style={styles.bmiScale}>
              <View style={[styles.bmiScaleBar, { backgroundColor: colors.info }]} />
              <View style={[styles.bmiScaleBar, { backgroundColor: colors.success }]} />
              <View style={[styles.bmiScaleBar, { backgroundColor: colors.warning }]} />
              <View style={[styles.bmiScaleBar, { backgroundColor: colors.error }]} />
            </View>
            <View style={styles.bmiLabels}>
              <Text style={styles.bmiLabel}>18.5</Text>
              <Text style={styles.bmiLabel}>25</Text>
              <Text style={styles.bmiLabel}>30</Text>
            </View>
          </View>
        </Card>

        {/* Settings */}
        <Card style={styles.settingsCard}>
          <Text style={styles.sectionTitle}>Ayarlar</Text>
          
          <SettingItem 
            icon="pencil-outline" 
            title="Profili Düzenle" 
            onPress={openProfileEditModal}
          />
          
          <SettingItem 
            icon="notifications-outline" 
            title="Bildirimler" 
            onPress={() => setNotificationModalVisible(true)}
          />
          
          <SettingItem 
            icon="lock-closed-outline" 
            title="Gizlilik" 
            onPress={() => setPrivacyModalVisible(true)}
          />
          
          <SettingItem 
            icon="help-circle-outline" 
            title="Yardım ve Destek" 
            onPress={() => setHelpModalVisible(true)}
          />
          
          <SettingItem 
            icon="information-circle-outline" 
            title="Hakkında" 
            onPress={() => setAboutModalVisible(true)}
          />

          <View style={styles.divider} />
          
          <SettingItem 
            icon="log-out-outline" 
            title="Çıkış Yap" 
            onPress={() => {
              Alert.alert(
                'Çıkış Yap',
                isAnonymous 
                  ? 'Dikkat: Anonim hesabınızdan çıkış yaparsanız tüm verileriniz kaybolacak! Önce hesabınızı kaydetmenizi öneririz.'
                  : 'Çıkış yapmak istediğinizden emin misiniz?',
                [
                  {
                    text: 'İptal',
                    style: 'cancel'
                  },
                  {
                    text: 'Çıkış Yap',
                    style: 'destructive',
                    onPress: async () => {
                      try {
                        await logoutUser();
                      } catch (error) {
                        console.error('Logout error:', error);
                        Alert.alert('Hata', 'Çıkış yapılırken bir hata oluştu.');
                      }
                    }
                  }
                ]
              );
            }}
            showArrow={false}
          />
        </Card>

        {/* App Version */}
        <Text style={styles.appVersion}>FitnessGym v1.0.0</Text>

        {/* Claim Account Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={claimAccountModalVisible}
          onRequestClose={() => setClaimAccountModalVisible(false)}
        >
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalOverlay}
          >
            <View style={styles.claimModalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>🔐 Hesabını Kaydet</Text>
                <TouchableOpacity 
                  style={styles.modalCloseButton}
                  onPress={() => setClaimAccountModalVisible(false)}
                  disabled={claimLoading}
                >
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                <View style={styles.claimInfoBox}>
                  <Ionicons name="information-circle" size={24} color={colors.primary} />
                  <Text style={styles.claimInfoText}>
                    E-posta ve şifre ekleyerek anonim hesabınızı kalıcı hale getirin. Tüm antrenman verileriniz, ağırlık geçmişiniz ve programlarınız korunacak!
                  </Text>
                </View>

                <View style={styles.claimInputGroup}>
                  <Text style={styles.claimInputLabel}>E-posta Adresi</Text>
                  <View style={styles.claimInputContainer}>
                    <Ionicons name="mail-outline" size={20} color={colors.textSecondary} style={styles.claimInputIcon} />
                    <TextInput
                      style={styles.claimInput}
                      placeholder="ornek@email.com"
                      placeholderTextColor={colors.textMuted}
                      value={claimEmail}
                      onChangeText={setClaimEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={!claimLoading}
                    />
                  </View>
                </View>

                <View style={styles.claimInputGroup}>
                  <Text style={styles.claimInputLabel}>Şifre</Text>
                  <View style={styles.claimInputContainer}>
                    <Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} style={styles.claimInputIcon} />
                    <TextInput
                      style={styles.claimInput}
                      placeholder="En az 6 karakter"
                      placeholderTextColor={colors.textMuted}
                      value={claimPassword}
                      onChangeText={setClaimPassword}
                      secureTextEntry={!showClaimPassword}
                      editable={!claimLoading}
                    />
                    <TouchableOpacity onPress={() => setShowClaimPassword(!showClaimPassword)}>
                      <Ionicons 
                        name={showClaimPassword ? "eye-outline" : "eye-off-outline"} 
                        size={20} 
                        color={colors.textSecondary} 
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.claimInputGroup}>
                  <Text style={styles.claimInputLabel}>Şifre Tekrar</Text>
                  <View style={styles.claimInputContainer}>
                    <Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} style={styles.claimInputIcon} />
                    <TextInput
                      style={styles.claimInput}
                      placeholder="Şifrenizi tekrar girin"
                      placeholderTextColor={colors.textMuted}
                      value={claimPasswordConfirm}
                      onChangeText={setClaimPasswordConfirm}
                      secureTextEntry={!showClaimPassword}
                      editable={!claimLoading}
                    />
                  </View>
                </View>

                <View style={styles.claimBenefits}>
                  <Text style={styles.claimBenefitsTitle}>Hesap Kaydetmenin Avantajları:</Text>
                  <View style={styles.claimBenefitItem}>
                    <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                    <Text style={styles.claimBenefitText}>Verileriniz kalıcı olarak korunur</Text>
                  </View>
                  <View style={styles.claimBenefitItem}>
                    <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                    <Text style={styles.claimBenefitText}>Farklı cihazlardan erişim</Text>
                  </View>
                  <View style={styles.claimBenefitItem}>
                    <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                    <Text style={styles.claimBenefitText}>Şifre ile güvenli giriş</Text>
                  </View>
                </View>
              </ScrollView>

              <View style={styles.claimActions}>
                <TouchableOpacity 
                  style={styles.claimCancelButton}
                  onPress={() => setClaimAccountModalVisible(false)}
                  disabled={claimLoading}
                >
                  <Text style={styles.claimCancelButtonText}>İptal</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.claimSaveButton, claimLoading && styles.claimSaveButtonDisabled]}
                  onPress={handleClaimAccount}
                  disabled={claimLoading}
                >
                  {claimLoading ? (
                    <ActivityIndicator size="small" color={colors.text} />
                  ) : (
                    <>
                      <Ionicons name="shield-checkmark" size={20} color={colors.text} />
                      <Text style={styles.claimSaveButtonText}>Hesabı Kaydet</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>

        {/* Login Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={loginModalVisible}
          onRequestClose={() => setLoginModalVisible(false)}
        >
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalOverlay}
          >
            <View style={styles.claimModalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>🔑 Giriş Yap</Text>
                <TouchableOpacity 
                  style={styles.modalCloseButton}
                  onPress={() => setLoginModalVisible(false)}
                  disabled={loginLoading}
                >
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                <View style={styles.claimInfoBox}>
                  <Ionicons name="information-circle" size={24} color={colors.primary} />
                  <Text style={styles.claimInfoText}>
                    Daha önce kaydettiğiniz hesabınıza giriş yapın. Tüm verileriniz otomatik olarak yüklenecek.
                  </Text>
                </View>

                <View style={styles.claimInputGroup}>
                  <Text style={styles.claimInputLabel}>E-posta Adresi</Text>
                  <View style={styles.claimInputContainer}>
                    <Ionicons name="mail-outline" size={20} color={colors.textSecondary} style={styles.claimInputIcon} />
                    <TextInput
                      style={styles.claimInput}
                      placeholder="ornek@email.com"
                      placeholderTextColor={colors.textMuted}
                      value={loginEmail}
                      onChangeText={setLoginEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={!loginLoading}
                    />
                  </View>
                </View>

                <View style={styles.claimInputGroup}>
                  <Text style={styles.claimInputLabel}>Şifre</Text>
                  <View style={styles.claimInputContainer}>
                    <Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} style={styles.claimInputIcon} />
                    <TextInput
                      style={styles.claimInput}
                      placeholder="Şifreniz"
                      placeholderTextColor={colors.textMuted}
                      value={loginPassword}
                      onChangeText={setLoginPassword}
                      secureTextEntry={!showLoginPassword}
                      editable={!loginLoading}
                    />
                    <TouchableOpacity onPress={() => setShowLoginPassword(!showLoginPassword)}>
                      <Ionicons 
                        name={showLoginPassword ? "eye-outline" : "eye-off-outline"} 
                        size={20} 
                        color={colors.textSecondary} 
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </ScrollView>

              <View style={styles.claimActions}>
                <TouchableOpacity 
                  style={styles.claimCancelButton}
                  onPress={() => setLoginModalVisible(false)}
                  disabled={loginLoading}
                >
                  <Text style={styles.claimCancelButtonText}>İptal</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.claimSaveButton, loginLoading && styles.claimSaveButtonDisabled]}
                  onPress={handleLogin}
                  disabled={loginLoading}
                >
                  {loginLoading ? (
                    <ActivityIndicator size="small" color={colors.text} />
                  ) : (
                    <>
                      <Ionicons name="log-in" size={20} color={colors.text} />
                      <Text style={styles.claimSaveButtonText}>Giriş Yap</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>

        {/* Notification Settings Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={notificationModalVisible}
          onRequestClose={() => setNotificationModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>🔔 Bildirim Ayarları</Text>
                <TouchableOpacity 
                  style={styles.modalCloseButton}
                  onPress={() => setNotificationModalVisible(false)}
                >
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              <View style={styles.modalBody}>
                {/* All Notifications Toggle */}
                <View style={styles.notificationMasterToggle}>
                  <View style={styles.notificationToggleInfo}>
                    <Ionicons name="notifications" size={24} color={colors.primary} />
                    <View style={styles.notificationToggleText}>
                      <Text style={styles.notificationToggleTitle}>Tüm Bildirimler</Text>
                      <Text style={styles.notificationToggleDesc}>
                        Tüm bildirimleri aç/kapat
                      </Text>
                    </View>
                  </View>
                  <Switch
                    value={notificationSettings.weeklySummary || notificationSettings.motivationReminder}
                    onValueChange={handleToggleAllNotifications}
                    trackColor={{ false: colors.border, true: colors.primary + '60' }}
                    thumbColor={
                      (notificationSettings.weeklySummary || notificationSettings.motivationReminder) 
                        ? colors.primary 
                        : colors.textMuted
                    }
                  />
                </View>

                <View style={styles.notificationDivider} />

                {/* Weekly Summary */}
                <View style={styles.notificationItem}>
                  <View style={styles.notificationItemIcon}>
                    <Ionicons name="calendar" size={20} color={colors.secondary} />
                  </View>
                  <View style={styles.notificationItemContent}>
                    <Text style={styles.notificationItemTitle}>📊 Haftalık Özet</Text>
                    <Text style={styles.notificationItemDesc}>
                      Her Pazar saat 22:00'de haftalık antrenman özetini alın
                    </Text>
                  </View>
                  <Switch
                    value={notificationSettings.weeklySummary}
                    onValueChange={handleToggleWeeklySummary}
                    trackColor={{ false: colors.border, true: colors.primary + '60' }}
                    thumbColor={notificationSettings.weeklySummary ? colors.primary : colors.textMuted}
                  />
                </View>

                {/* Motivation Reminder */}
                <View style={styles.notificationItem}>
                  <View style={styles.notificationItemIcon}>
                    <Ionicons name="heart" size={20} color={colors.error} />
                  </View>
                  <View style={styles.notificationItemContent}>
                    <Text style={styles.notificationItemTitle}>🔥 Motivasyon Hatırlatıcısı</Text>
                    <Text style={styles.notificationItemDesc}>
                      3 gün giriş yapmazsanız size hatırlatma gönderilir
                    </Text>
                  </View>
                  <Switch
                    value={notificationSettings.motivationReminder}
                    onValueChange={handleToggleMotivationReminder}
                    trackColor={{ false: colors.border, true: colors.primary + '60' }}
                    thumbColor={notificationSettings.motivationReminder ? colors.primary : colors.textMuted}
                  />
                </View>

                <View style={styles.notificationInfo}>
                  <Ionicons name="information-circle-outline" size={16} color={colors.textMuted} />
                  <Text style={styles.notificationInfoText}>
                    Bildirimler sadece fiziksel cihazlarda çalışır.
                  </Text>
                </View>
              </View>

              <TouchableOpacity 
                style={styles.modalDoneButton}
                onPress={() => setNotificationModalVisible(false)}
              >
                <Text style={styles.modalDoneButtonText}>Tamam</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Privacy Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={privacyModalVisible}
          onRequestClose={() => setPrivacyModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>🔒 Gizlilik Politikası</Text>
                <TouchableOpacity 
                  style={styles.modalCloseButton}
                  onPress={() => setPrivacyModalVisible(false)}
                >
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody}>
                <View style={styles.privacySection}>
                  <View style={styles.privacySectionHeader}>
                    <Ionicons name="folder-outline" size={20} color={colors.primary} />
                    <Text style={styles.privacySectionTitle}>Veri Toplama</Text>
                  </View>
                  <Text style={styles.privacySectionText}>
                    FitnessGym, fitness deneyiminizi kişiselleştirmek için temel bilgilerinizi toplar. Bu veriler sadece uygulama içinde kullanılır.
                  </Text>
                </View>

                <View style={styles.privacySection}>
                  <View style={styles.privacySectionHeader}>
                    <Ionicons name="shield-checkmark-outline" size={20} color={colors.success} />
                    <Text style={styles.privacySectionTitle}>Veri Güvenliği</Text>
                  </View>
                  <Text style={styles.privacySectionText}>
                    Tüm verileriniz güvenli sunucularda şifrelenmiş olarak saklanır. Verileriniz asla üçüncü taraflarla paylaşılmaz.
                  </Text>
                </View>
              </ScrollView>

              <TouchableOpacity 
                style={styles.modalDoneButton}
                onPress={() => setPrivacyModalVisible(false)}
              >
                <Text style={styles.modalDoneButtonText}>Anladım</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Help Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={helpModalVisible}
          onRequestClose={() => setHelpModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>💬 Yardım ve Destek</Text>
                <TouchableOpacity 
                  style={styles.modalCloseButton}
                  onPress={() => setHelpModalVisible(false)}
                >
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody}>
                <Text style={styles.helpSectionTitle}>📋 Sık Sorulan Sorular</Text>
                
                <View style={styles.faqItem}>
                  <Text style={styles.faqQuestion}>Anonim hesabım ne demek?</Text>
                  <Text style={styles.faqAnswer}>
                    Uygulamaya kayıt olmadan kullanmaya başladığınızda anonim bir hesap oluşturulur. Hesabınızı kaydetmezseniz cihazı değiştirdiğinizde verilerinize erişemezsiniz.
                  </Text>
                </View>

                <View style={styles.faqItem}>
                  <Text style={styles.faqQuestion}>Hesabımı nasıl kaydederim?</Text>
                  <Text style={styles.faqAnswer}>
                    Profil sayfasındaki "Hesabı Kaydet" butonuna tıklayarak e-posta ve şifre ekleyebilirsiniz. Tüm verileriniz korunacaktır.
                  </Text>
                </View>

                <TouchableOpacity 
                  style={styles.helpContactItem}
                  onPress={() => Linking.openURL('mailto:support@fitnessgym.com')}
                >
                  <View style={styles.helpContactIcon}>
                    <Ionicons name="mail" size={20} color={colors.primary} />
                  </View>
                  <View style={styles.helpContactContent}>
                    <Text style={styles.helpContactTitle}>E-posta Desteği</Text>
                    <Text style={styles.helpContactDesc}>support@fitnessgym.com</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                </TouchableOpacity>
              </ScrollView>

              <TouchableOpacity 
                style={styles.modalDoneButton}
                onPress={() => setHelpModalVisible(false)}
              >
                <Text style={styles.modalDoneButtonText}>Kapat</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* About Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={aboutModalVisible}
          onRequestClose={() => setAboutModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>ℹ️ Hakkında</Text>
                <TouchableOpacity 
                  style={styles.modalCloseButton}
                  onPress={() => setAboutModalVisible(false)}
                >
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              <View style={styles.modalBody}>
                <View style={styles.aboutHeader}>
                  <View style={styles.aboutLogo}>
                    <Ionicons name="fitness" size={48} color={colors.primary} />
                  </View>
                  <Text style={styles.aboutAppName}>FitnessGym</Text>
                  <Text style={styles.aboutTagline}>Güçlü Ol, Sağlıklı Kal! 💪</Text>
                  <View style={styles.aboutVersionBadge}>
                    <Text style={styles.aboutVersionText}>Versiyon 1.0.0</Text>
                  </View>
                </View>

                <Text style={styles.aboutDescription}>
                  FitnessGym, fitness yolculuğunuzda yanınızda olan kişisel antrenman asistanınızdır.
                </Text>

                <Text style={styles.aboutCopyright}>
                  © 2025 FitnessGym. Tüm hakları saklıdır.
                </Text>
              </View>

              <TouchableOpacity 
                style={styles.modalDoneButton}
                onPress={() => setAboutModalVisible(false)}
              >
                <Text style={styles.modalDoneButtonText}>Kapat</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Avatar Selection Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={avatarModalVisible}
          onRequestClose={() => setAvatarModalVisible(false)}
        >
          <View style={styles.avatarModalOverlay}>
            <View style={styles.avatarModalContent}>
              <View style={styles.avatarModalHeader}>
                <Text style={styles.avatarModalTitle}>📷 Profil Fotoğrafı</Text>
                <TouchableOpacity 
                  style={styles.modalCloseButton}
                  onPress={() => setAvatarModalVisible(false)}
                >
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              <View style={styles.avatarModalBody}>
                <View style={styles.avatarOptions}>
                  <TouchableOpacity 
                    style={styles.avatarOptionButton}
                    onPress={handlePickFromGallery}
                  >
                    <View style={[styles.avatarOptionIcon, { backgroundColor: colors.primary + '20' }]}>
                      <Ionicons name="images" size={28} color={colors.primary} />
                    </View>
                    <Text style={styles.avatarOptionTitle}>Galeriden Seç</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.avatarOptionButton}
                    onPress={handleTakePhoto}
                  >
                    <View style={[styles.avatarOptionIcon, { backgroundColor: colors.secondary + '20' }]}>
                      <Ionicons name="camera" size={28} color={colors.secondary} />
                    </View>
                    <Text style={styles.avatarOptionTitle}>Fotoğraf Çek</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity 
                style={[styles.modalDoneButton, { backgroundColor: colors.surfaceLight }]}
                onPress={() => setAvatarModalVisible(false)}
              >
                <Text style={[styles.modalDoneButtonText, { color: colors.textSecondary }]}>İptal</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Profile Edit Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={profileEditModalVisible}
          onRequestClose={() => setProfileEditModalVisible(false)}
        >
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.profileEditModalOverlay}
          >
            <View style={styles.profileEditModalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>✏️ Profili Düzenle</Text>
                <TouchableOpacity 
                  style={styles.modalCloseButton}
                  onPress={() => setProfileEditModalVisible(false)}
                  disabled={profileSaving}
                >
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.profileEditModalBody} showsVerticalScrollIndicator={false}>
                <Text style={styles.profileEditSectionTitle}>Kişisel Bilgiler</Text>
                
                <View style={styles.profileEditInputGroup}>
                  <Text style={styles.profileEditLabel}>Ad *</Text>
                  <View style={styles.profileEditInputContainer}>
                    <Ionicons name="person-outline" size={20} color={colors.textSecondary} style={styles.profileEditInputIcon} />
                    <TextInput
                      style={styles.profileEditInput}
                      placeholder="Adınız"
                      placeholderTextColor={colors.textMuted}
                      value={editFormData.name}
                      onChangeText={(text) => setEditFormData({ ...editFormData, name: text })}
                      autoCapitalize="words"
                      editable={!profileSaving}
                    />
                  </View>
                </View>

                {!isAnonymous && (
                  <View style={styles.profileEditInputGroup}>
                    <Text style={styles.profileEditLabel}>E-posta</Text>
                    <View style={styles.profileEditInputContainer}>
                      <Ionicons name="mail-outline" size={20} color={colors.textSecondary} style={styles.profileEditInputIcon} />
                      <TextInput
                        style={styles.profileEditInput}
                        placeholder="E-posta adresiniz"
                        placeholderTextColor={colors.textMuted}
                        value={editFormData.email}
                        onChangeText={(text) => setEditFormData({ ...editFormData, email: text })}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        editable={!profileSaving}
                      />
                    </View>
                  </View>
                )}

                <View style={styles.profileEditInputGroup}>
                  <Text style={styles.profileEditLabel}>Yaş</Text>
                  <View style={styles.profileEditInputContainer}>
                    <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} style={styles.profileEditInputIcon} />
                    <TextInput
                      style={styles.profileEditInput}
                      placeholder="Yaşınız"
                      placeholderTextColor={colors.textMuted}
                      value={editFormData.age}
                      onChangeText={(text) => setEditFormData({ ...editFormData, age: text.replace(/[^0-9]/g, '') })}
                      keyboardType="numeric"
                      editable={!profileSaving}
                    />
                  </View>
                </View>

                <Text style={[styles.profileEditSectionTitle, { marginTop: spacing.lg }]}>Vücut Ölçüleri</Text>

                <View style={styles.profileEditInputGroup}>
                  <Text style={styles.profileEditLabel}>Boy (cm)</Text>
                  <View style={styles.profileEditInputContainer}>
                    <Ionicons name="resize-outline" size={20} color={colors.textSecondary} style={styles.profileEditInputIcon} />
                    <TextInput
                      style={styles.profileEditInput}
                      placeholder="Boy uzunluğunuz"
                      placeholderTextColor={colors.textMuted}
                      value={editFormData.height}
                      onChangeText={(text) => setEditFormData({ ...editFormData, height: text.replace(/[^0-9.]/g, '') })}
                      keyboardType="numeric"
                      editable={!profileSaving}
                    />
                  </View>
                </View>

                <View style={styles.profileEditInputGroup}>
                  <Text style={styles.profileEditLabel}>Güncel Kilo (kg)</Text>
                  <View style={styles.profileEditInputContainer}>
                    <Ionicons name="speedometer-outline" size={20} color={colors.textSecondary} style={styles.profileEditInputIcon} />
                    <TextInput
                      style={styles.profileEditInput}
                      placeholder="Güncel kilonuz"
                      placeholderTextColor={colors.textMuted}
                      value={editFormData.current_weight}
                      onChangeText={(text) => setEditFormData({ ...editFormData, current_weight: text.replace(/[^0-9.]/g, '') })}
                      keyboardType="numeric"
                      editable={!profileSaving}
                    />
                  </View>
                </View>

                <View style={styles.profileEditInputGroup}>
                  <Text style={styles.profileEditLabel}>Hedef Kilo (kg)</Text>
                  <View style={styles.profileEditInputContainer}>
                    <Ionicons name="flag-outline" size={20} color={colors.textSecondary} style={styles.profileEditInputIcon} />
                    <TextInput
                      style={styles.profileEditInput}
                      placeholder="Hedef kilonuz"
                      placeholderTextColor={colors.textMuted}
                      value={editFormData.target_weight}
                      onChangeText={(text) => setEditFormData({ ...editFormData, target_weight: text.replace(/[^0-9.]/g, '') })}
                      keyboardType="numeric"
                      editable={!profileSaving}
                    />
                  </View>
                </View>
              </ScrollView>

              <View style={styles.profileEditActions}>
                <TouchableOpacity 
                  style={styles.profileEditCancelButton}
                  onPress={() => setProfileEditModalVisible(false)}
                  disabled={profileSaving}
                >
                  <Text style={styles.profileEditCancelButtonText}>İptal</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.profileEditSaveButton, profileSaving && styles.profileEditSaveButtonDisabled]}
                  onPress={handleSaveProfile}
                  disabled={profileSaving}
                >
                  {profileSaving ? (
                    <ActivityIndicator size="small" color={colors.text} />
                  ) : (
                    <>
                      <Ionicons name="checkmark" size={20} color={colors.text} />
                      <Text style={styles.profileEditSaveButtonText}>Kaydet</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: fontSize.lg,
    color: colors.error,
  },
  container: {
    padding: spacing.md,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    marginBottom: spacing.md,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: spacing.md,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primary + '30',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.primary,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
  },
  userName: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  anonymousBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.warning + '20',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    marginBottom: spacing.sm,
  },
  anonymousBadgeText: {
    fontSize: fontSize.sm,
    color: colors.warning,
    fontWeight: fontWeight.medium,
  },
  userMemberSince: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  memberBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  memberBadgeText: {
    fontSize: fontSize.sm,
    color: colors.text,
    fontWeight: fontWeight.medium,
  },
  // Claim Account Card Styles
  claimAccountCard: {
    marginBottom: spacing.md,
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: 'dashed',
  },
  claimAccountHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  claimAccountIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  claimAccountTextContainer: {
    flex: 1,
  },
  claimAccountTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  claimAccountDescription: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  claimAccountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  claimAccountButtonText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  // Login Option Styles
  loginOptionContainer: {
    marginTop: spacing.md,
  },
  loginOptionDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  loginOptionLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  loginOptionText: {
    marginHorizontal: spacing.md,
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  loginOptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceLight,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.primary,
    gap: spacing.sm,
  },
  loginOptionButtonText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },
  // Stats Card
  statsCard: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  infoIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs / 2,
  },
  infoValue: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  infoUnit: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.regular,
    color: colors.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  progressSection: {
    marginTop: spacing.sm,
  },
  progressTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
  },
  progressText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  // BMI Card
  bmiCard: {
    marginBottom: spacing.md,
  },
  bmiContent: {
    alignItems: 'center',
  },
  bmiValueContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  bmiValue: {
    fontSize: fontSize.xxxl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  bmiCategory: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  bmiCategoryText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },
  bmiScale: {
    flexDirection: 'row',
    width: '100%',
    height: 12,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  bmiScaleBar: {
    flex: 1,
  },
  bmiLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: spacing.sm,
  },
  bmiLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  // Settings Card
  settingsCard: {
    marginBottom: spacing.md,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  settingItemHighlight: {
    backgroundColor: colors.primary + '10',
    marginHorizontal: -spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  settingIconHighlight: {
    backgroundColor: colors.primary,
  },
  settingTitle: {
    fontSize: fontSize.md,
    color: colors.text,
    fontWeight: fontWeight.medium,
  },
  settingTitleHighlight: {
    fontWeight: fontWeight.bold,
  },
  appVersion: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    maxHeight: '85%',
  },
  claimModalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  modalDoneButton: {
    backgroundColor: colors.primary,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  modalDoneButtonText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  // Claim Account Modal Styles
  claimInfoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.primary + '15',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  claimInfoText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.text,
    lineHeight: 20,
  },
  claimInputGroup: {
    marginBottom: spacing.md,
  },
  claimInputLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  claimInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
  },
  claimInputIcon: {
    marginRight: spacing.sm,
  },
  claimInput: {
    flex: 1,
    height: 48,
    fontSize: fontSize.md,
    color: colors.text,
  },
  claimBenefits: {
    backgroundColor: colors.surfaceLight,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginTop: spacing.md,
  },
  claimBenefitsTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  claimBenefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  claimBenefitText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  claimActions: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.md,
  },
  claimCancelButton: {
    flex: 1,
    backgroundColor: colors.surfaceLight,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  claimCancelButtonText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
  },
  claimSaveButton: {
    flex: 2,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  claimSaveButtonDisabled: {
    opacity: 0.7,
  },
  claimSaveButtonText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  // Notification Styles
  notificationMasterToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primary + '15',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
  },
  notificationToggleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  notificationToggleText: {
    marginLeft: spacing.md,
    flex: 1,
  },
  notificationToggleTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  notificationToggleDesc: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  notificationDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  notificationItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  notificationItemContent: {
    flex: 1,
    marginRight: spacing.sm,
  },
  notificationItemTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.xs / 2,
  },
  notificationItemDesc: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  notificationInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surfaceLight,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  notificationInfoText: {
    flex: 1,
    fontSize: fontSize.xs,
    color: colors.textMuted,
    lineHeight: 16,
  },
  // Privacy Styles
  privacySection: {
    marginBottom: spacing.lg,
  },
  privacySectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  privacySectionTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  privacySectionText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
    paddingLeft: spacing.lg + spacing.sm,
  },
  // Help Styles
  helpSectionTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  faqItem: {
    backgroundColor: colors.surfaceLight,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  faqQuestion: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  faqAnswer: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  helpContactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  helpContactIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  helpContactContent: {
    flex: 1,
  },
  helpContactTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
  helpContactDesc: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  // About Styles
  aboutHeader: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  aboutLogo: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  aboutAppName: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  aboutTagline: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  aboutVersionBadge: {
    backgroundColor: colors.primary + '20',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  aboutVersionText: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: fontWeight.medium,
  },
  aboutDescription: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  aboutCopyright: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  // Avatar Modal Styles
  avatarModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  avatarModalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  avatarModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatarModalTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  avatarModalBody: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  avatarOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  avatarOptionButton: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatarOptionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  avatarOptionTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  // Profile Edit Modal Styles
  profileEditModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  profileEditModalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    maxHeight: '90%',
  },
  profileEditModalBody: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    maxHeight: 400,
  },
  profileEditSectionTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  profileEditInputGroup: {
    marginBottom: spacing.md,
  },
  profileEditLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  profileEditInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
  },
  profileEditInputIcon: {
    marginRight: spacing.sm,
  },
  profileEditInput: {
    flex: 1,
    height: 48,
    fontSize: fontSize.md,
    color: colors.text,
  },
  profileEditActions: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.md,
  },
  profileEditCancelButton: {
    flex: 1,
    backgroundColor: colors.surfaceLight,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileEditCancelButtonText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
  },
  profileEditSaveButton: {
    flex: 2,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  profileEditSaveButtonDisabled: {
    opacity: 0.7,
  },
  profileEditSaveButtonText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
});

export default ProfileScreen;
