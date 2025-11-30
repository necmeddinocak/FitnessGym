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
  const { userId, userName, userEmail, logout: logoutUser, refreshUserProfile } = useUser();
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

    if (!editFormData.email.trim()) {
      Alert.alert('Hata', 'Lütfen e-posta adresinizi girin.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(editFormData.email)) {
      Alert.alert('Hata', 'Lütfen geçerli bir e-posta adresi girin.');
      return;
    }

    setProfileSaving(true);
    try {
      // Update email and name
      await updateUserEmailAndName(userId, editFormData.email.trim().toLowerCase(), editFormData.name.trim());

      // Update profile data
      const profileData = {
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
        name: editFormData.name.trim(),
        age: profileData.age,
        height: profileData.height,
        current_weight: profileData.current_weight,
        target_weight: profileData.target_weight,
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
        name: 'Kullanıcı',
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

  const SettingItem = ({ icon, title, onPress, showArrow = true }) => (
    <TouchableOpacity style={styles.settingItem} onPress={onPress}>
      <View style={styles.settingLeft}>
        <View style={styles.settingIcon}>
          <Ionicons name={icon} size={20} color={colors.text} />
        </View>
        <Text style={styles.settingTitle}>{title}</Text>
      </View>
      {showArrow && (
        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
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
          <Text style={styles.userName}>{userProfile.name || 'Kullanıcı'}</Text>
          <Text style={styles.userMemberSince}>
            Üye olma: {userProfile.join_date ? new Date(userProfile.join_date).toLocaleDateString('tr-TR') : '-'}
          </Text>
          <View style={styles.memberBadge}>
            <Ionicons name="trophy" size={16} color={colors.accent} />
            <Text style={styles.memberBadgeText}>{daysSinceJoin} gündür aktif</Text>
          </View>
        </Card>

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
                'Çıkış yapmak istediğinizden emin misiniz?',
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
                    <View style={styles.notificationItemExample}>
                      <Text style={styles.notificationItemExampleText}>
                        "Bu hafta 4 gün antrenman yaptın, harika iş! 💪"
                      </Text>
                    </View>
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
                    <View style={styles.notificationItemExample}>
                      <Text style={styles.notificationItemExampleText}>
                        "Seni özledik! 💪 Antrenmana geri dönmeye hazır mısın?"
                      </Text>
                    </View>
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
                    Bildirimler sadece fiziksel cihazlarda çalışır. Emülatör/simülatörde sınırlı destek vardır.
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

              <View style={styles.modalBody}>
                {/* Data Collection */}
                <View style={styles.privacySection}>
                  <View style={styles.privacySectionHeader}>
                    <Ionicons name="folder-outline" size={20} color={colors.primary} />
                    <Text style={styles.privacySectionTitle}>Veri Toplama</Text>
                  </View>
                  <Text style={styles.privacySectionText}>
                    FitnessGym, fitness deneyiminizi kişiselleştirmek için ad, yaş, boy, kilo gibi temel bilgilerinizi toplar. Bu veriler sadece uygulama içinde kullanılır.
                  </Text>
                </View>

                {/* Data Storage */}
                <View style={styles.privacySection}>
                  <View style={styles.privacySectionHeader}>
                    <Ionicons name="shield-checkmark-outline" size={20} color={colors.success} />
                    <Text style={styles.privacySectionTitle}>Veri Güvenliği</Text>
                  </View>
                  <Text style={styles.privacySectionText}>
                    Tüm verileriniz güvenli sunucularda şifrelenmiş olarak saklanır. Verileriniz asla üçüncü taraflarla paylaşılmaz veya satılmaz.
                  </Text>
                </View>

                {/* Data Usage */}
                <View style={styles.privacySection}>
                  <View style={styles.privacySectionHeader}>
                    <Ionicons name="analytics-outline" size={20} color={colors.secondary} />
                    <Text style={styles.privacySectionTitle}>Veri Kullanımı</Text>
                  </View>
                  <Text style={styles.privacySectionText}>
                    Antrenman verileriniz, ilerlemenizi takip etmek ve size özel öneriler sunmak için kullanılır. Anonim istatistikler uygulama geliştirme için kullanılabilir.
                  </Text>
                </View>

                {/* User Rights */}
                <View style={styles.privacySection}>
                  <View style={styles.privacySectionHeader}>
                    <Ionicons name="person-outline" size={20} color={colors.accent} />
                    <Text style={styles.privacySectionTitle}>Kullanıcı Hakları</Text>
                  </View>
                  <Text style={styles.privacySectionText}>
                    Verilerinizi istediğiniz zaman görüntüleyebilir, düzenleyebilir veya silebilirsiniz. Hesap silme talebiniz 30 gün içinde işlenir.
                  </Text>
                </View>

                {/* Contact */}
                <View style={styles.privacyContact}>
                  <Ionicons name="mail-outline" size={16} color={colors.textMuted} />
                  <Text style={styles.privacyContactText}>
                    Gizlilik hakkında sorularınız için: privacy@fitnessgym.com
                  </Text>
                </View>
              </View>

              <TouchableOpacity 
                style={styles.modalDoneButton}
                onPress={() => setPrivacyModalVisible(false)}
              >
                <Text style={styles.modalDoneButtonText}>Anladım</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Help & Support Modal */}
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

              <View style={styles.modalBody}>
                {/* FAQ Section */}
                <Text style={styles.helpSectionTitle}>📋 Sık Sorulan Sorular</Text>
                
                <View style={styles.faqItem}>
                  <Text style={styles.faqQuestion}>Antrenman programımı nasıl değiştiririm?</Text>
                  <Text style={styles.faqAnswer}>
                    Ana sayfadaki "Programlar" sekmesinden mevcut programınızı değiştirebilir veya yeni bir program seçebilirsiniz.
                  </Text>
                </View>

                <View style={styles.faqItem}>
                  <Text style={styles.faqQuestion}>Kilo takibim nasıl çalışır?</Text>
                  <Text style={styles.faqAnswer}>
                    Profil sayfasından kilonuzu güncelleyebilirsiniz. Uygulama ilerlemenizi grafiklerle gösterir ve hedeflerinize ulaşmanızda yardımcı olur.
                  </Text>
                </View>

                <View style={styles.faqItem}>
                  <Text style={styles.faqQuestion}>Bildirimleri nasıl kapatırım?</Text>
                  <Text style={styles.faqAnswer}>
                    Profil → Ayarlar → Bildirimler menüsünden tüm bildirimleri veya tek tek ayarları yönetebilirsiniz.
                  </Text>
                </View>

                <View style={styles.helpDivider} />

                {/* Contact Options */}
                <Text style={styles.helpSectionTitle}>📞 Bize Ulaşın</Text>

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

                <TouchableOpacity 
                  style={styles.helpContactItem}
                  onPress={() => Linking.openURL('https://instagram.com/fitnessgym')}
                >
                  <View style={[styles.helpContactIcon, { backgroundColor: '#E4405F20' }]}>
                    <Ionicons name="logo-instagram" size={20} color="#E4405F" />
                  </View>
                  <View style={styles.helpContactContent}>
                    <Text style={styles.helpContactTitle}>Instagram</Text>
                    <Text style={styles.helpContactDesc}>@fitnessgym</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.helpContactItem}
                  onPress={() => Linking.openURL('https://twitter.com/fitnessgym')}
                >
                  <View style={[styles.helpContactIcon, { backgroundColor: '#1DA1F220' }]}>
                    <Ionicons name="logo-twitter" size={20} color="#1DA1F2" />
                  </View>
                  <View style={styles.helpContactContent}>
                    <Text style={styles.helpContactTitle}>Twitter</Text>
                    <Text style={styles.helpContactDesc}>@fitnessgym</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                </TouchableOpacity>

                <View style={styles.helpResponseTime}>
                  <Ionicons name="time-outline" size={16} color={colors.textMuted} />
                  <Text style={styles.helpResponseTimeText}>
                    Genellikle 24 saat içinde yanıt veriyoruz
                  </Text>
                </View>
              </View>

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
                {/* App Logo & Name */}
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

                <View style={styles.aboutDivider} />

                {/* Description */}
                <Text style={styles.aboutDescription}>
                  FitnessGym, fitness yolculuğunuzda yanınızda olan kişisel antrenman asistanınızdır. 
                  Antrenmanlarınızı takip edin, ilerlemenizi görün ve hedeflerinize ulaşın!
                </Text>

                {/* Features */}
                <View style={styles.aboutFeatures}>
                  <View style={styles.aboutFeatureItem}>
                    <Ionicons name="barbell-outline" size={20} color={colors.primary} />
                    <Text style={styles.aboutFeatureText}>200+ Egzersiz</Text>
                  </View>
                  <View style={styles.aboutFeatureItem}>
                    <Ionicons name="calendar-outline" size={20} color={colors.secondary} />
                    <Text style={styles.aboutFeatureText}>Antrenman Takibi</Text>
                  </View>
                  <View style={styles.aboutFeatureItem}>
                    <Ionicons name="trending-up-outline" size={20} color={colors.success} />
                    <Text style={styles.aboutFeatureText}>İlerleme Grafikleri</Text>
                  </View>
                  <View style={styles.aboutFeatureItem}>
                    <Ionicons name="trophy-outline" size={20} color={colors.accent} />
                    <Text style={styles.aboutFeatureText}>Başarı Rozetleri</Text>
                  </View>
                </View>

                <View style={styles.aboutDivider} />

                {/* Developer Info */}
                <View style={styles.aboutDeveloper}>
                  <Text style={styles.aboutDeveloperLabel}>Geliştirici</Text>
                  <Text style={styles.aboutDeveloperName}>FitnessGym Team</Text>
                </View>

                {/* Links */}
                <View style={styles.aboutLinks}>
                  <TouchableOpacity 
                    style={styles.aboutLink}
                    onPress={() => Linking.openURL('https://fitnessgym.com/terms')}
                  >
                    <Text style={styles.aboutLinkText}>Kullanım Koşulları</Text>
                  </TouchableOpacity>
                  <Text style={styles.aboutLinkDivider}>•</Text>
                  <TouchableOpacity 
                    style={styles.aboutLink}
                    onPress={() => Linking.openURL('https://fitnessgym.com/privacy')}
                  >
                    <Text style={styles.aboutLinkText}>Gizlilik Politikası</Text>
                  </TouchableOpacity>
                </View>

                {/* Copyright */}
                <Text style={styles.aboutCopyright}>
                  © 2025 FitnessGym. Tüm hakları saklıdır.
                </Text>

                {/* Made with love */}
                <View style={styles.aboutMadeWith}>
                  <Text style={styles.aboutMadeWithText}>Türkiye'de </Text>
                  <Ionicons name="heart" size={14} color={colors.error} />
                  <Text style={styles.aboutMadeWithText}> ile yapıldı</Text>
                </View>
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
                {/* Current Avatar Preview */}
                <View style={styles.avatarPreviewContainer}>
                  <View style={styles.avatarPreview}>
                    {userProfile?.avatar_url ? (
                      <Image 
                        source={{ uri: userProfile.avatar_url }} 
                        style={styles.avatarPreviewImage}
                      />
                    ) : (
                      <Ionicons name="person" size={64} color={colors.textMuted} />
                    )}
                  </View>
                  <Text style={styles.avatarPreviewText}>
                    {userProfile?.avatar_url ? 'Mevcut fotoğrafınız' : 'Henüz fotoğraf eklenmemiş'}
                  </Text>
                </View>

                {/* Photo Options */}
                <View style={styles.avatarOptions}>
                  <TouchableOpacity 
                    style={styles.avatarOptionButton}
                    onPress={handlePickFromGallery}
                  >
                    <View style={[styles.avatarOptionIcon, { backgroundColor: colors.primary + '20' }]}>
                      <Ionicons name="images" size={28} color={colors.primary} />
                    </View>
                    <Text style={styles.avatarOptionTitle}>Galeriden Seç</Text>
                    <Text style={styles.avatarOptionDesc}>Fotoğraf galerinizden seçin</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.avatarOptionButton}
                    onPress={handleTakePhoto}
                  >
                    <View style={[styles.avatarOptionIcon, { backgroundColor: colors.secondary + '20' }]}>
                      <Ionicons name="camera" size={28} color={colors.secondary} />
                    </View>
                    <Text style={styles.avatarOptionTitle}>Fotoğraf Çek</Text>
                    <Text style={styles.avatarOptionDesc}>Kameranızla fotoğraf çekin</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.avatarModalInfo}>
                  <Ionicons name="information-circle-outline" size={16} color={colors.textMuted} />
                  <Text style={styles.avatarModalInfoText}>
                    Fotoğrafınız kare formatta kırpılacaktır. Maksimum dosya boyutu 5MB'dır.
                  </Text>
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
                {/* Personal Info Section */}
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

                <View style={styles.profileEditInputGroup}>
                  <Text style={styles.profileEditLabel}>E-posta *</Text>
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

                {/* Body Measurements Section */}
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

                <View style={styles.profileEditInfo}>
                  <Ionicons name="information-circle-outline" size={16} color={colors.textMuted} />
                  <Text style={styles.profileEditInfoText}>
                    * ile işaretli alanlar zorunludur. Vücut ölçüleriniz BMI hesaplaması için kullanılır.
                  </Text>
                </View>
              </ScrollView>

              {/* Action Buttons */}
              <View style={styles.profileEditActions}>
                <TouchableOpacity 
                  style={[styles.profileEditCancelButton]}
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
  settingTitle: {
    fontSize: fontSize.md,
    color: colors.text,
    fontWeight: fontWeight.medium,
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
  notificationItemExample: {
    backgroundColor: colors.surfaceLight,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    marginTop: spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  notificationItemExampleText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    fontStyle: 'italic',
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
  // Privacy Modal Styles
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
  privacyContact: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  privacyContactText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  // Help Modal Styles
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
  helpDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.lg,
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
  helpResponseTime: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
    gap: spacing.xs,
  },
  helpResponseTimeText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  // About Modal Styles
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
  aboutDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  aboutDescription: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  aboutFeatures: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  aboutFeatureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
  },
  aboutFeatureText: {
    fontSize: fontSize.xs,
    color: colors.text,
    fontWeight: fontWeight.medium,
  },
  aboutDeveloper: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  aboutDeveloperLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginBottom: spacing.xs / 2,
  },
  aboutDeveloperName: {
    fontSize: fontSize.md,
    color: colors.text,
    fontWeight: fontWeight.semibold,
  },
  aboutLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  aboutLink: {
    paddingHorizontal: spacing.sm,
  },
  aboutLinkText: {
    fontSize: fontSize.sm,
    color: colors.primary,
  },
  aboutLinkDivider: {
    color: colors.textMuted,
  },
  aboutCopyright: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  aboutMadeWith: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  aboutMadeWithText: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
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
  avatarPreviewContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  avatarPreview: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.primary,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  avatarPreviewImage: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
  },
  avatarPreviewText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
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
    marginBottom: spacing.xs / 2,
  },
  avatarOptionDesc: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  avatarModalInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surfaceLight,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  avatarModalInfoText: {
    flex: 1,
    fontSize: fontSize.xs,
    color: colors.textMuted,
    lineHeight: 16,
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
  profileEditInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surfaceLight,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  profileEditInfoText: {
    flex: 1,
    fontSize: fontSize.xs,
    color: colors.textMuted,
    lineHeight: 16,
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

