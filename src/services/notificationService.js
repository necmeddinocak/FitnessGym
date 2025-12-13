import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Bildirim ayarları
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
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
// Bu fonksiyon sadece kullanıcı profil ayarlarından bildirimi açtığında çağrılır
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
  const currentDay = now.getDay(); // 0 = Pazar, 1 = Pazartesi, ..., 6 = Cumartesi
  let daysUntilSunday = (7 - currentDay) % 7;
  
  // Eğer bugün Pazar ise, bir sonraki Pazar'a planla
  if (daysUntilSunday === 0) {
    daysUntilSunday = 7;
  }
  
  const nextSunday = new Date(now);
  nextSunday.setDate(nextSunday.getDate() + daysUntilSunday);
  nextSunday.setHours(22, 0, 0, 0);

  // Saniye cinsinden ne kadar sonra bildirim gönderileceğini hesapla
  const secondsUntilNotification = Math.floor((nextSunday.getTime() - Date.now()) / 1000);
  
  // Minimum 1 saat (3600 saniye) olmalı - güvenlik kontrolü
  if (secondsUntilNotification < 3600) {
    console.log('Haftalık özet bildirimi: Süre çok kısa, planlanmadı.');
    return;
  }

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

  // Haftalık özet bildirimi - saniye cinsinden gecikme ile
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '📊 Haftalık Özetin',
      body: message,
      sound: true,
      data: { type: 'weekly-summary' },
    },
    trigger: {
      seconds: secondsUntilNotification,
    },
  });

  await AsyncStorage.setItem(WEEKLY_SUMMARY_SCHEDULED_KEY, 'true');
  const notificationDate = new Date(Date.now() + secondsUntilNotification * 1000);
  console.log('Haftalık özet bildirimi planlandı:', notificationDate.toLocaleString('tr-TR'), `(${Math.floor(secondsUntilNotification / 3600)} saat sonra)`);
}

// Motivasyon hatırlatıcısı (3 gün giriş yapmayanlara)
// Bu fonksiyon sadece kullanıcı profil ayarlarından bildirimi açtığında çağrılır
export async function scheduleMotivationReminder() {
  // Mevcut motivasyon bildirimlerini iptal et
  const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
  for (const notification of scheduledNotifications) {
    if (notification.content.data?.type === 'motivation') {
      await Notifications.cancelScheduledNotificationAsync(notification.identifier);
    }
  }

  // 3 gün sonrası için bildirim planla (akşam 18:00)
  const triggerDate = new Date();
  triggerDate.setDate(triggerDate.getDate() + 3);
  triggerDate.setHours(18, 0, 0, 0);

  // Saniye cinsinden ne kadar sonra bildirim gönderileceğini hesapla
  const secondsUntilNotification = Math.floor((triggerDate.getTime() - Date.now()) / 1000);
  
  // Minimum 1 saat (3600 saniye) olmalı - güvenlik kontrolü
  if (secondsUntilNotification < 3600) {
    console.log('Motivasyon hatırlatıcısı: Süre çok kısa, planlanmadı.');
    return;
  }

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
      seconds: secondsUntilNotification,
    },
  });

  const notificationDate = new Date(Date.now() + secondsUntilNotification * 1000);
  console.log('Motivasyon hatırlatıcısı planlandı:', notificationDate.toLocaleString('tr-TR'), `(${Math.floor(secondsUntilNotification / 3600)} saat sonra)`);
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

// Bildirimleri başlat (uygulama açıldığında çağrılacak)
// NOT: Bu fonksiyon artık otomatik bildirim planlamıyor.
// Bildirimler sadece kullanıcı profil ayarlarından manuel olarak açtığında planlanır.
export async function initializeNotifications(workoutCount = 0, forceReinitialize = false) {
  // Bildirim izinlerini al ve kanalları oluştur
  const permissionGranted = await registerForPushNotifications();
  
  if (!permissionGranted) {
    return false;
  }
  
  // Son giriş tarihini güncelle (motivasyon bildirimi için önemli)
  await updateLastLoginDate();
  
  // Kullanıcı uygulamayı açtı, mevcut motivasyon hatırlatıcısını iptal et
  // (Çünkü artık aktif kullanıcı)
  await cancelMotivationReminder();
  
  console.log('Bildirim sistemi hazır. Bildirimler profil ayarlarından yönetilebilir.');
  
  return true;
}

