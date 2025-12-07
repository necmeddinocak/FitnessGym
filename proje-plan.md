FitnesGym (Fitness Takip Uygulaması - Proje Gereksinim Dokümanı (PRD))
1. Proje Özeti
Bu proje, kullanıcıların antrenmanlarını planlamasına, ilerlemelerini takip etmesine ve motivasyonlarını yüksek tutmasına yardımcı olan, React Native (Expo) kullanılarak geliştirilecek modern bir mobil fitness uygulamasıdır.
2. Navigasyon Yapısı
Uygulama Bottom Tab Navigator (Alt Menü Çubuğu) kullanacaktır. 4 ana sekme bulunacaktır:
1.	Ana Sayfa 
2.	Antrenman 
3.	Takip 
4.	Profil 
3. Ekran Detayları ve Özellikler
A. Ana Sayfa 
Kullanıcı uygulamayı açtığında karşılayacak olan özet ekranıdır.
•	Motivasyon Kartı: Her gün veya her açılışta değişen motivasyon sözleri.
•	Haftalık Özet: Kullanıcının o hafta kaç gün antrenman yaptığını gösteren mini bir takvim veya sayaç.
•	Hızlı Başlat: "Bugünkü Antrenmana Başla" butonu (Varsa planlanmış antrenmana, yoksa antrenman seçimine yönlendirir).
B. Antrenman Ekranı
Uygulamanın kalbi burasıdır. İki ana bölüme ayrılmalıdır (Segmented Control veya Tab ile):
1.	Programlarım:
o	Kullanıcının kendi oluşturduğu antrenman listeleri.
o	"Yeni Program Oluştur" butonu: Kullanıcı egzersiz adı, set sayısı ve tekrar aralığı girerek program oluşturabilmeli.
2.	Hazır Programlar:
o	Başlangıç, Orta, İleri seviye olarak kategorize edilmiş hazır şablonlar (Örn: Full Body, Push-Pull-Legs).
C. Takip Ekranı (Tracking Screen)
Kullanıcının sayısal verilerini görselleştirdiği ekran.
•	Vücut Ağırlığı Grafiği: Tarih bazlı kilo değişim çizgi grafiği.
•	Egzersiz İlerlemesi: Belirli bir hareketin (örn: Bench Press) zamanla artan ağırlık grafiği (Progressive Overload takibi).
•	Antrenman Geçmişi: Takvim üzerinde hangi günler antrenman yapıldığının işaretlenmesi (Calendar Heatmap benzeri).
D. Profil Ekranı 
•	Kullanıcı Bilgileri: Ad, yaş, boy, güncel kilo, hedef kilo.
•	Vücut Kitle İndeksi (BMI): Girilen verilere göre otomatik hesaplanan değer.
4.Tasarım Kuralları
•	Tema: Koyu tema (Dark Mode) ağırlıklı, spor salonu atmosferine uygun dinamik renkler.
