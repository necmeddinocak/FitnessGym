import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Bildirim ayarları
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Storage keys
const NOTIFICATION_SETTINGS_KEY = 'notification_settings';
const LAST_LOGIN_KEY = 'last_login_date';
const WEEKLY_SUMMARY_SCHEDULED_KEY = 'weekly_summary_scheduled';

// Bildirim izni al
export async function registerForPushNotifications() {
  if (!Device.isDevice) {
    console.log('Bildirimler için fiziksel cihaz gerekli');
    return false;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Bildirim izni verilmedi');
    return false;
  }

  // Android için kanal oluştur
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('workout-reminders', {
      name: 'Antrenman Hatırlatıcıları',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF6B35',
    });

    await Notifications.setNotificationChannelAsync('weekly-summary', {
      name: 'Haftalık Özet',
      importance: Notifications.AndroidImportance.DEFAULT,
      lightColor: '#4CAF50',
    });

    await Notifications.setNotificationChannelAsync('motivation', {
      name: 'Motivasyon Hatırlatıcıları',
      importance: Notifications.AndroidImportance.DEFAULT,
      lightColor: '#FF9800',
    });
  }

  return true;
}

// Son giriş tarihini kaydet
export async function updateLastLoginDate() {
  const today = new Date().toISOString().split('T')[0];
  await AsyncStorage.setItem(LAST_LOGIN_KEY, today);
}

// Son giriş tarihini al
export async function getLastLoginDate() {
  return await AsyncStorage.getItem(LAST_LOGIN_KEY);
}

// Kaç gündür giriş yapılmadığını hesapla
export async function getDaysSinceLastLogin() {
  const lastLogin = await getLastLoginDate();
  if (!lastLogin) return 0;

  const lastDate = new Date(lastLogin);
  const today = new Date();
  const diffTime = Math.abs(today - lastDate);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

// Haftalık özet bildirimini planla (Her Pazar 22:00)
export async function scheduleWeeklySummaryNotification(workoutCount) {
  // Mevcut haftalık özet bildirimlerini iptal et
  const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
  for (const notification of scheduledNotifications) {
    if (notification.content.data?.type === 'weekly-summary') {
      await Notifications.cancelScheduledNotificationAsync(notification.identifier);
    }
  }

  // Bir sonraki Pazar gününü hesapla
  const now = new Date();
  const daysUntilSunday = (7 - now.getDay()) % 7;
  const nextSunday = new Date(now);
  
  // Eğer bugün Pazar ve saat 22:00'yi geçtiyse, bir sonraki Pazar'a planla
  if (daysUntilSunday === 0 && now.getHours() >= 22) {
    nextSunday.setDate(nextSunday.getDate() + 7);
  } else {
    nextSunday.setDate(nextSunday.getDate() + daysUntilSunday);
  }
  
  nextSunday.setHours(22, 0, 0, 0);

  // Mesajı belirle
  let message;
  if (workoutCount === 0) {
    message = 'Bu hafta henüz antrenman yapmadın. Hadi başlayalım! 💪';
  } else if (workoutCount === 1) {
    message = 'Bu hafta 1 gün antrenman yaptın. Gelecek hafta daha fazlasını yapabilirsin! 🎯';
  } else if (workoutCount >= 5) {
    message = `Bu hafta ${workoutCount} gün antrenman yaptın, harika iş! Sen bir şampiyonsun! 🏆`;
  } else {
    message = `Bu hafta ${workoutCount} gün antrenman yaptın, harika iş! 💪`;
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title: '📊 Haftalık Özetin',
      body: message,
      sound: true,
      data: { type: 'weekly-summary' },
    },
    trigger: {
      date: nextSunday,
    },
  });

  // Haftalık tekrarlayan bildirim için (her Pazar 22:00)
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '📊 Haftalık Özetin',
      body: 'Bu haftaki performansını kontrol etmeye ne dersin?',
      sound: true,
      data: { type: 'weekly-summary-recurring' },
    },
    trigger: {
      weekday: 1, // 1 = Pazar (expo-notifications'da)
      hour: 22,
      minute: 0,
      repeats: true,
    },
  });

  await AsyncStorage.setItem(WEEKLY_SUMMARY_SCHEDULED_KEY, 'true');
  console.log('Haftalık özet bildirimi planlandı:', nextSunday.toLocaleString('tr-TR'));
}

// Motivasyon hatırlatıcısı (3 gün giriş yapmayanlara)
export async function scheduleMotivationReminder() {
  // Mevcut motivasyon bildirimlerini iptal et
  const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
  for (const notification of scheduledNotifications) {
    if (notification.content.data?.type === 'motivation') {
      await Notifications.cancelScheduledNotificationAsync(notification.identifier);
    }
  }

  // 3 gün sonrası için bildirim planla
  const triggerDate = new Date();
  triggerDate.setDate(triggerDate.getDate() + 3);
  triggerDate.setHours(18, 0, 0, 0); // Akşam 18:00'de gönder

  const motivationMessages = [
    'Seni özledik! 💪 Antrenmana geri dönmeye hazır mısın?',
    'Hey şampiyon! 🏆 3 gündür görüşemedik. Bugün harika bir antrenman günü!',
    'Hedeflerine ulaşmak için devam et! 🎯 Seni bekliyoruz!',
    'Kasların seni çağırıyor! 💪 Hadi bugün başlayalım!',
  ];
  
  const randomMessage = motivationMessages[Math.floor(Math.random() * motivationMessages.length)];

  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🔥 Seni Özledik!',
      body: randomMessage,
      sound: true,
      data: { type: 'motivation' },
    },
    trigger: {
      date: triggerDate,
    },
  });

  console.log('Motivasyon hatırlatıcısı planlandı:', triggerDate.toLocaleString('tr-TR'));
}

// Motivasyon hatırlatıcısını iptal et (kullanıcı giriş yaptığında)
export async function cancelMotivationReminder() {
  const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
  for (const notification of scheduledNotifications) {
    if (notification.content.data?.type === 'motivation') {
      await Notifications.cancelScheduledNotificationAsync(notification.identifier);
    }
  }
}

// Bildirim ayarlarını kaydet
export async function saveNotificationSettings(settings) {
  await AsyncStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(settings));
}

// Bildirim ayarlarını yükle
export async function loadNotificationSettings() {
  const settings = await AsyncStorage.getItem(NOTIFICATION_SETTINGS_KEY);
  return settings ? JSON.parse(settings) : {
    weeklySummary: true,
    motivationReminder: true,
  };
}

// Tüm bildirimleri etkinleştir/devre dışı bırak
export async function toggleNotifications(enabled) {
  if (enabled) {
    await scheduleWeeklySummaryNotification(0);
    await scheduleMotivationReminder();
  } else {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }
  
  await saveNotificationSettings({
    weeklySummary: enabled,
    motivationReminder: enabled,
  });
}

// Planlanmış bildirimleri listele (debug için)
export async function getScheduledNotifications() {
  return await Notifications.getAllScheduledNotificationsAsync();
}

// Bildirimlerin bugün zaten başlatılıp başlatılmadığını kontrol et
const NOTIFICATIONS_INITIALIZED_TODAY_KEY = 'notifications_initialized_date';

async function isNotificationsInitializedToday() {
  const lastInitDate = await AsyncStorage.getItem(NOTIFICATIONS_INITIALIZED_TODAY_KEY);
  const today = new Date().toISOString().split('T')[0];
  return lastInitDate === today;
}

async function markNotificationsInitialized() {
  const today = new Date().toISOString().split('T')[0];
  await AsyncStorage.setItem(NOTIFICATIONS_INITIALIZED_TODAY_KEY, today);
}

// Bildirimleri başlat (uygulama açıldığında çağrılacak)
export async function initializeNotifications(workoutCount = 0, forceReinitialize = false) {
  // Bugün zaten başlatıldıysa ve zorla başlatma istenmiyorsa, atla
  if (!forceReinitialize && await isNotificationsInitializedToday()) {
    console.log('Bildirimler bugün zaten başlatılmış, atlanıyor...');
    return true;
  }

  const permissionGranted = await registerForPushNotifications();
  
  if (!permissionGranted) {
    return false;
  }

  const settings = await loadNotificationSettings();
  
  // Son giriş tarihini güncelle
  await updateLastLoginDate();
  
  // Motivasyon hatırlatıcısını iptal et (kullanıcı giriş yaptı)
  await cancelMotivationReminder();
  
  // Yeni motivasyon hatırlatıcısı planla (3 gün sonra)
  if (settings.motivationReminder) {
    await scheduleMotivationReminder();
  }
  
  // Haftalık özet bildirimini planla
  if (settings.weeklySummary) {
    await scheduleWeeklySummaryNotification(workoutCount);
  }
  
  // Bugün başlatıldı olarak işaretle
  await markNotificationsInitialized();
  
  return true;
}

