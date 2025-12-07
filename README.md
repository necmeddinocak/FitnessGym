# FitnessGym - Fitness Takip Uygulaması 💪

Modern ve kullanıcı dostu bir fitness takip uygulaması. React Native (Expo) ve Supabase ile geliştirilmiştir.

## 🚀 Teknoloji Stack

- **Frontend:** React Native (Expo)
- **Backend:** Supabase (PostgreSQL)
- **State Management:** React Context API
- **Storage:** AsyncStorage (Local) + Supabase (Cloud)
- **UI:** Custom Components with Modern Design

## 🎯 Özellikler

### 📱 Ana Sayfa
- Motivasyon kartları ile günlük ilham
- Haftalık antrenman özeti ve takip
- Hızlı başlat butonuyla antrenmana kolay erişim
- İstatistik kartları ile genel performans görünümü

### 🏋️ Antrenman Ekranı
- Kişiselleştirilmiş antrenman programları oluşturma
- Hazır antrenman şablonları (Başlangıç, Orta, İleri seviye)
- Egzersiz detayları (set, tekrar sayısı)
- Program kategorilendirmesi

### 📊 Takip Ekranı
- Vücut ağırlığı değişim grafiği
- Egzersiz ilerleme takibi (Progressive Overload)
- Antrenman takvimi (Hangi günler çalıştığınız)
- İstatistiksel veri görselleştirme

### 👤 Profil Ekranı
- Kullanıcı bilgileri yönetimi
- BMI (Vücut Kitle İndeksi) hesaplama
- Hedefe ilerleme takibi
- Ayarlar ve özelleştirme seçenekleri

### 🔐 Authentication & User Management
- **Email-based Login:** E-posta ve ad ile güvenli giriş sistemi
- **Auto Account Creation:** İlk giriş yapanlara otomatik hesap oluşturma
- **Multi-user Support:** Farklı kullanıcılar kendi verilerine erişebilir
- **Kalıcı Oturum:** AsyncStorage ile oturum bilgisi saklanır
- **Logout:** Kullanıcılar çıkış yapıp farklı hesaplarla girebilir

### 🗄️ Backend & Database
- **Supabase PostgreSQL:** Güvenli ve ölçeklenebilir veritabanı
- **Kalıcı Veri:** AsyncStorage (local) + Supabase (cloud) dual storage
- **Gerçek Zamanlı:** Tüm veriler anlık olarak database'e kaydedilir
- **5 Ana Tablo:**
  - `users` - Kullanıcı profilleri (email, name, age, height, weight, etc.)
  - `workout_programs` - Antrenman programları (custom + preset)
  - `weight_history` - Kilo takip geçmişi
  - `exercise_progress` - Egzersiz bazlı ilerleme kayıtları
  - `workout_history` - Tamamlanan antrenman geçmişi

## 🏗️ Proje Yapısı

```
FitnessGym/
├── src/
│   ├── features/          # Feature-based modüler yapı
│   │   ├── auth/         # 🆕 Authentication ekranları
│   │   │   └── LoginScreen.js
│   │   ├── home/         # Ana sayfa ekranı
│   │   │   └── HomeScreen.js
│   │   ├── workout/      # Antrenman ekranları
│   │   │   ├── WorkoutScreen.js
│   │   │   └── WorkoutDetailScreen.js  # 🆕 Detaylı takip
│   │   ├── tracking/     # Takip ekranı
│   │   │   └── TrackingScreen.js
│   │   └── profile/      # Profil ekranları
│   │       ├── ProfileScreen.js
│   │       └── ProfileEditScreen.js     # 🆕 Profil düzenleme
│   ├── components/       # Yeniden kullanılabilir bileşenler
│   │   └── common/       # Ortak UI bileşenleri
│   ├── navigation/       # Navigation yapısı
│   │   ├── TabNavigator.js
│   │   ├── WorkoutStackNavigator.js     # 🆕 Workout navigation
│   │   └── ProfileStackNavigator.js     # 🆕 Profile navigation
│   ├── context/         # React Context
│   │   └── UserContext.js              # 🔄 Email-based auth
│   ├── services/        # API & Database servisleri
│   │   ├── userService.js              # 🔄 Email login logic
│   │   ├── supabaseService.js          # CRUD işlemleri
│   │   └── index.js                    # Service exports
│   ├── config/          # Yapılandırma dosyaları
│   │   └── supabase.js                 # Supabase client
│   ├── theme/           # Tema ve stil sabitleri
│   ├── data/            # Mock data (geliştirme)
│   └── utils/           # Yardımcı fonksiyonlar
├── supabase/           # 🆕 Supabase migrations
│   └── migrations/
│       ├── 001_initial_schema.sql
│       ├── 002_preset_programs.sql
│       └── 003_add_user_auth_fields.sql  # 🆕 Email & name
├── assets/              # Resimler ve statik dosyalar
├── App.js              # 🔄 Ana uygulama (auth kontrolü)
├── SETUP.md            # Supabase kurulum rehberi
└── package.json        # Bağımlılıklar
```

## 📦 Bağımlılıklar

```json
{
  "dependencies": {
    "@expo/vector-icons": "^15.0.3",
    "@react-navigation/bottom-tabs": "^7.2.1",
    "@react-navigation/native": "^7.0.13",
    "@react-native-async-storage/async-storage": "latest",
    "@supabase/supabase-js": "latest",
    "expo": "~54.0.25",
    "react": "19.1.0",
    "react-native": "0.81.5"
  }
}
```

## 🚀 Kurulum ve Çalıştırma

### Gereksinimler
- Node.js (v14 veya üzeri)
- npm veya yarn
- Expo CLI
- iOS Simulator (Mac) veya Android Emulator veya fiziksel cihaz

### Adımlar

> **📌 NOT:** Supabase entegrasyonu zaten yapılmış durumda. Detaylar için [SETUP.md](./SETUP.md) dosyasına bakın.

#### 1. Bağımlılıkları Yükleyin
```bash
cd FitnessGym
npm install
```

#### 2. ⚠️ Supabase Migration (ÖNEMLİ!)
Yeni email-based authentication için migration gerekli:

1. [Supabase Dashboard](https://supabase.com/dashboard) → FitnessGym projesi
2. **SQL Editor** bölümüne git
3. `supabase/migrations/003_add_user_auth_fields.sql` içeriğini kopyala-yapıştır
4. **RUN** butonuna tıkla

```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS name TEXT;
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
```

#### 3. Uygulamayı Başlatın
```bash
npm start
```

#### 4. Platform Seçin
- **iOS:** `i` tuşu veya `npm run ios`
- **Android:** `a` tuşu veya `npm run android`
- **Web:** `w` tuşu veya `npm run web`
- **Fiziksel Cihaz:** Expo Go uygulamasıyla QR kod okut

#### 5. İlk Kullanım 🎉
1. Uygulama açıldığında **Login Ekranı** görünür
2. E-posta ve adınızı girin
3. Yeni kullanıcıysanız: **"Hesap Oluştur"** → Otomatik kayıt
4. Eski kullanıcıysanız: Sadece e-posta ile giriş → Verileriniz gelir
5. Çıkış yapıp farklı hesaplarla girebilirsiniz

## 🎨 Tasarım Özellikleri

- **Dark Mode:** Spor salonu atmosferine uygun koyu tema
- **Modern UI:** Minimalist ve kullanıcı dostu arayüz
- **Responsive:** Farklı ekran boyutlarına uyumlu
- **Animasyonlar:** Akıcı geçişler ve etkileşimler

## 🛠️ Kullanılan Teknolojiler

- **React Native** - Mobil uygulama framework'ü
- **Expo** - React Native geliştirme platformu
- **React Navigation** - Sayfa yönlendirme
- **Expo Vector Icons** - İkonlar

## 📦 Bağımlılıklar

```json
{
  "expo": "~54.0.25",
  "react": "19.1.0",
  "react-native": "0.81.5",
  "@react-navigation/native": "^latest",
  "@react-navigation/bottom-tabs": "^latest",
  "react-native-screens": "^latest",
  "react-native-safe-area-context": "^latest",
  "@expo/vector-icons": "^latest"
}
```

## 🎯 Gelecek Özellikler

- [ ] Gerçek backend entegrasyonu
- [ ] Kullanıcı kayıt/giriş sistemi
- [ ] Sosyal özellikler (arkadaş ekleme, paylaşım)
- [ ] Beslenme takibi
- [ ] Egzersiz videoları ve rehberleri
- [ ] Push notification'lar
- [ ] Daha gelişmiş grafik ve analitikler
- [ ] Özel antrenman planı oluşturucu

## 👨‍💻 Geliştirici

FitnessGym - 2025

## 📄 Lisans

Bu proje eğitim amaçlı geliştirilmiştir.

