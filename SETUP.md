# FitnessGym - Supabase Entegrasyon Kurulum Rehberi

## 🎉 Tebrikler! Supabase Entegrasyonu Tamamlandı

FitnessGym uygulamanız artık **Supabase** backend'i ile tam entegre çalışıyor!

## 📦 Yapılan Değişiklikler

### 1. **Database Yapısı**
Supabase'de aşağıdaki tablolar oluşturuldu:
- ✅ `users` - Kullanıcı profil bilgileri
- ✅ `workout_programs` - Egzersiz programları (custom + preset)
- ✅ `weight_history` - Kilo takibi
- ✅ `exercise_progress` - Egzersiz bazlı ilerleme
- ✅ `workout_history` - Antrenman geçmişi

### 2. **Kurulum Paketler**
```bash
@supabase/supabase-js
@react-native-async-storage/async-storage
```

### 3. **Yeni Dosyalar**
```
src/
├── config/
│   └── supabase.js           # Supabase client yapılandırması
├── context/
│   └── UserContext.js        # User state yönetimi
└── services/
    ├── index.js              # Service exports
    ├── userService.js        # User ID yönetimi & profil işlemleri
    └── supabaseService.js    # Database CRUD işlemleri
```

### 4. **Güncellenen Ekranlar**
- ✅ `HomeScreen.js` - Gerçek istatistikler ve haftalık performans
- ✅ `WorkoutScreen.js` - Database'den programları çeker
- ✅ `ProfileScreen.js` - Kullanıcı profilini gösterir
- ✅ `TrackingScreen.js` - Gerçek kilo ve egzersiz verilerini gösterir

## 🔐 Kullanıcı Kimlik Yönetimi (YENİ: Email-based Authentication)

Uygulama **email-based login** sistemi ile çalışır:
- Kullanıcılar email ve ad bilgisi ile giriş yapar
- Email daha önce kullanılmışsa mevcut hesaba giriş yapar
- Email yoksa yeni hesap oluşturulur
- Her kullanıcı için benzersiz bir ID otomatik oluşturulur: `FG_[timestamp]_[random]`
- Email, ad ve ID, AsyncStorage'da saklanır (kalıcı veri)
- Kullanıcılar çıkış yapabilir ve farklı hesaplarla giriş yapabilir

### Yeni Migration Gerekli! ⚠️
**users** tablosuna `email` ve `name` kolonları eklenmeli:

```sql
-- Migration dosyası: supabase/migrations/003_add_user_auth_fields.sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS name TEXT;
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
```

Bu migration'ı çalıştırmak için:
1. Supabase Dashboard'a git: https://supabase.com/dashboard
2. FitnessGym projesini aç
3. SQL Editor'e git
4. Migration dosyasındaki SQL'i yapıştır ve çalıştır

## 📱 Supabase Proje Bilgileri

**Proje Adı:** FitnessGym  
**Proje ID:** mtbghmonlicoftagncbr  
**Region:** eu-west-1  
**URL:** https://mtbghmonlicoftagncbr.supabase.co  
**Durum:** ✅ Aktif

## 🚀 Nasıl Çalıştırılır?

### 1. Bağımlılıkları Kontrol Et (Zaten Kurulu)
```bash
cd FitnessGym
npm install
```

### 2. Uygulamayı Başlat
```bash
npm start
```

### 3. Platform Seç
- **Android:** `a` tuşuna bas
- **iOS:** `i` tuşuna bas
- **Web:** `w` tuşuna bas

## 📊 Database'e Test Verisi Ekleme

İlk kullanıcı için test verileri eklemek istersen, uygulamada:

1. **Ana Ekran:** Haftalık performans otomatik gösterilir
2. **Workout Ekranı:** Preset programlar zaten mevcut
3. **Tracking Ekranı:** Manuel veri eklemek için servisler hazır:

```javascript
// Örnek: Kilo ekleme
await addWeightEntry(userId, 75.5, '2025-11-22');

// Örnek: Egzersiz progress ekleme
await addExerciseProgress(userId, {
  exercise_name: 'Bench Press',
  weight: 60,
  sets: 3,
  reps: '8-10',
  date: '2025-11-22'
});

// Örnek: Antrenman geçmişi ekleme
await addWorkoutHistory(userId, {
  date: '2025-11-22',
  completed: true,
  duration: 45
});
```

## 🛠️ API Servisleri

### User Service (`userService.js`)
- `getOrCreateUserId()` - User ID al veya oluştur
- `getUserProfile(userId)` - Profil bilgilerini al
- `updateUserProfile(userId, data)` - Profil güncelle

### Supabase Service (`supabaseService.js`)

#### Workout Programs
- `getWorkoutPrograms(userId)` - Tüm programları al
- `getPresetPrograms()` - Preset programları al
- `getCustomPrograms(userId)` - Özel programları al
- `createWorkoutProgram(userId, data)` - Yeni program oluştur
- `updateWorkoutProgram(id, data)` - Program güncelle
- `deleteWorkoutProgram(id)` - Program sil

#### Weight History
- `getWeightHistory(userId, limit)` - Kilo geçmişini al
- `addWeightEntry(userId, weight, date)` - Kilo ekle
- `updateWeightEntry(id, weight)` - Kilo güncelle
- `deleteWeightEntry(id)` - Kilo sil

#### Exercise Progress
- `getExerciseProgress(userId, exerciseName, limit)` - Egzersiz ilerlemesini al
- `addExerciseProgress(userId, data)` - İlerleme ekle
- `updateExerciseProgress(id, data)` - İlerleme güncelle

#### Workout History
- `getWorkoutHistory(userId, limit)` - Antrenman geçmişini al
- `addWorkoutHistory(userId, data)` - Antrenman ekle
- `updateWorkoutHistory(id, data)` - Antrenman güncelle
- `getWorkoutHistoryByDateRange(userId, start, end)` - Tarih aralığında geçmiş
- `getWorkoutStats(userId)` - İstatistikler al

## 🎨 Context Kullanımı

Her component'te user bilgilerine erişebilirsin:

```javascript
import { useUser } from '../context/UserContext';

const MyComponent = () => {
  const { userId, userProfile, refreshUserProfile } = useUser();
  
  // userId ile API çağrıları yap
  // userProfile ile profil bilgilerine eriş
  // refreshUserProfile() ile profili yenile
};
```

## 🔄 Veri Akışı

1. **Uygulama Açılışı**
   - `App.js` → `UserProvider` initialize
   - `getOrCreateUserId()` çalışır
   - User ID AsyncStorage'da saklanır
   - Database'de user kaydı oluşturulur (ilk açılışta)

2. **Ekran Açılışı**
   - `useUser()` hook ile userId alınır
   - API servisleri ile veriler çekilir
   - Loading state gösterilir
   - Veriler render edilir

3. **Veri Güncelleme**
   - Kullanıcı işlem yapar
   - API servisi çağrılır
   - Database güncellenir
   - Local state güncellenir
   - UI otomatik güncellenir

## 🐛 Hata Ayıklama

Konsol loglarını görmek için:
```bash
npx react-native log-android  # Android için
npx react-native log-ios      # iOS için
```

## 📝 Notlar

- ✅ Tüm veriler Supabase'de güvenle saklanır
- ✅ Kullanıcı ID'si cihazda kalıcıdır
- ✅ Veri kaybı olmaz (AsyncStorage + Database)
- ✅ Offline çalışma için AsyncStorage kullanılır
- ✅ Preset programlar tüm kullanıcılara açıktır

## 🎯 Sonraki Adımlar

1. **Profil Düzenleme Ekranı** - Kullanıcı bilgilerini güncelleme
2. **Workout Oluşturma Ekranı** - Custom program oluşturma
3. **Veri Girişi Ekranları** - Kilo, egzersiz progress ekleme
4. **Bildiririmler** - Antrenman hatırlatıcıları
5. **Grafikler** - Daha detaylı charts (react-native-chart-kit)

## 🚀 Başarılar!

Artık uygulamanı çalıştırabilir ve gerçek verilerle test edebilirsin!

---

**Sorular?** README.md dosyasına bakabilir veya Supabase dashboard'unu kontrol edebilirsin:
https://app.supabase.com/project/mtbghmonlicoftagncbr

