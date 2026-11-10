# E-Ticaret Modülü: Güvenli Mağaza ve Pazaryeri API Bağlantı Paneli

Kullanıcıların Trendyol, Hepsiburada, Amazon TR, N11, Çiçeksepeti ve Shopify/Web Mağaza gibi pazaryeri platformlarına ait API Anahtarlarını (API Key, API Secret, Satıcı/Merchant ID) güvenle girebilecekleri, bağlantı testi yapabilecekleri ve aktif mağazalarını yönetebilecekleri gelişmiş bir entegrasyon paneli tasarlanmıştır.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> Kullanıcının onayladığı tercihler doğrultusunda sistem mimarisi aşağıdaki temeller üzerine kurulmuştur:

- **Desteklenen Platformlar**: Trendyol, Hepsiburada, Amazon TR, N11, Çiçeksepeti ve Shopify / WooCommerce platformları için dinamik alanlara sahip hazır API şablonları sunulacaktır.
- **Kullanıcı Arayüzü Formatı**: Hem boş durumlarda yönlendirici bir karşılama alanı hem de liste üzerinde konumlandırılan "+ Yeni Mağaza Bağla" aksiyonu ile açılan detaylı ve güvenli bir Modal/Panel mimarisi uygulanacaktır.
- **Güvenlik & Maskeleme**: API Secret ve özel anahtarlar varsayılan olarak `password` tipinde maskelenecek, görünürlük göz butonu ile isteğe bağlı açılıp kapatılabilecek ve anlık "Bağlantıyı Test Et" doğrulama simülasyonu sunulacaktır.
- **Veri Senkronizasyonu**: Kaydedilen mağazalar `muavin_ecommerce_v2_{companyId}_stores` anahtarı üzerinden anında güncellenecek, hem E-Ticaret modülü hem de Admin Yönetici Paneli eşleştirme sekmesiyle kusursuz çift yönlü uyum korunacaktır.

---

## 1. Overview & Core Concept

- **Amaç**: Kullanıcıların üçüncü taraf pazaryerlerindeki satış mağazalarını Muavin Ön Muhasebe platformuna doğrudan bağlayabilmelerini, sipariş ve stok entegrasyonlarının çalışması için zorunlu olan API kimlik bilgilerini tek bir güvenli panelden yönetebilmelerini sağlamak.
- **Kullanıcı Profili**: Ön muhasebe ve e-ticaret operasyonlarını tek merkezden yürüten şirket yöneticileri, e-ticaret sorumluları ve muhasebe uzmanları.
- **Temel Değer**: Karmaşık API dokümantasyonlarına gerek kalmadan, platforma özel doğru alanları (Supplier ID, Merchant ID, Access Token vb.) kolayca doldurarak dakikalar içinde mağaza bağlantısını tamamlayabilme ve bağlantı durumunu anlık doğrulayabilme.

---

## 2. User Experience & Visual Design

### A. Kullanıcı Akışları & Arayüz Mimarisi

```
[ Mağaza Entegrasyonları Sekmesi ]
             │
   ┌─────────┴─────────┐
   ▼                   ▼
(Mağaza Yoksa)      (Mağazalar Varsa)
Boş Durum Kartı     Üst Bar: [ + Yeni Mağaza Bağla ] & Metrikler
"İlk Mağazanızı      Grid Kartlar:
 Bağlayın" butonu   ├── Platform Logosu & Durum Rozeti (Bağlı / Pasif)
   │                ├── Satıcı / Mağaza ID & Maskeli API Bilgisi
   │                ├── Komisyon & Kargo Parametreleri
   │                └── [Düzenle] [Test Et] [Senkronize Et] [Kaldır]
   │
   └─────────► [ GÜVENLİ API BAĞLANTI MODALI ]
               ├── 1. Adım: Pazaryeri Platformu Seçimi (Hızlı Grid)
               ├── 2. Adım: Mağaza Adı & Hesap Bilgileri
               ├── 3. Adım: Güvenli API Bilgileri (Dinamik Form)
               │    ├── Satıcı / Tedarikçi / Merchant ID
               │    ├── API Key (Göz ikonuyla göster/gizle)
               │    └── API Secret / Token (Maskeli + Kopyalama)
               ├── 4. Adım: Ticari Parametreler (Komisyon %, Kargo Maliyeti ₺)
               ├── Otomatik Fatura & Stok Eşitleme Seçenekleri
               ├── [ Bağlantıyı Test Et (Ping) ] -> Başarılı Doğrulama
               └── [ Kaydet ve Entegrasyonu Başlat ]
```

### B. Görsel Kimlik & Arayüz Standartları
- **Kart Tasarımları**: Her pazaryeri için marka kimliğine uygun renk vurguları (Trendyol turuncusu `#f27a1a`, Hepsiburada turuncusu `#ff6000`, Amazon koyu laciverti `#232f3e`, N11 kırmızısı `#e20a17`, Çiçeksepeti mavisi `#0059b3`, Shopify yeşili `#059669`).
- **Zero-Pill Disiplini**: Statik etiketlerde aşırı pill/rozet kirliliği yerine temiz tipografik ayırıcılar (`·`), canlı durumlar için yeşil/kehribar durum gösterge noktaları.
- **Güvenlik Göstergeleri**: API anahtarları için `••••••••••••••••` maskelemesi, kopyalama geri bildirimi ve yeşil kalkan ("Uçtan Uca Güvenli Depolama") rozeti.
- **Rakam Formatları**: Tabular figures (`tabular-nums font-mono`) kullanımıyla komisyon ve parasal tutarların kayması önlenir.

---

## 3. Key Product Decisions & Trade-Offs

- **Karar 1: Platforma Özel Dinamik Form Alanları**
  - *Seçilen Yol*: Kullanıcı platform seçtiğinde (ör. Trendyol vs. Shopify) form otomatik olarak o platformun gerektirdiği özel alanları gösterir (Shopify için Store URL + Access Token; Trendyol için Satıcı ID + API Key + API Secret).
  - *Gerekçe*: Kullanıcıların hangi anahtarı nereye yazacağını şaşırmasını önler ve hata payını sıfıra indirir.
- **Karar 2: Yerleşik Bağlantı Testi (Connection Ping Simulation)**
  - *Seçilen Yol*: Kullanıcı mağazayı kaydetmeden önce "Bağlantıyı Test Et" butonuna basarak API formatını ve erişilebilirliğini anında simüle edebilecektir.
  - *Gerekçe*: Hatalı girilen satıcı kodları veya eksik karakterli API secret problemlerini anında tespit ederek kullanıcı güvenini pekiştirir.
- **Karar 3: Düzenleme ve Mağaza Başına İptal/Silme Yeteneği**
  - *Seçilen Yol*: Eklenen her mağaza kartında "Düzenle" (API bilgilerini güncelleme), "Şimdi Eşitle" ve "Bağlantıyı Kaldır" butonları sunulur.

---

## 4. Technical Architecture & Data Strategy

### A. Sistem & Bileşen Hiyerarşisi

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ECommerceModule (src/components/ECommerceModule.tsx)                       │
│                                                                             │
│  ├─ Stores Tab Header (+ Yeni Mağaza Bağla Butonu, İstatistik Özetleri)    │
│  │                                                                         │
│  ├─ Connected Store Cards Grid (Trendyol, HB, Amazon, vb.)                 │
│  │    ├─ Platform İkonu, Bağlantı Durumu, Satıcı ID                         │
│  │    ├─ Güvenli Maskeli Key Gösterimi                                     │
│  │    └─ Aksiyonlar: [Bağlantıyı Test Et] [Düzenle] [Kaldır]               │
│  │                                                                         │
│  └─ MarketplaceConnectionModal (Yeni / Düzenleme Modalı)                   │
│       ├─ Platform Seçici (Tabs / Grid Selector)                            │
│       ├─ Güvenli Form Alanları (Key, Secret, ID, URL)                      │
│       ├─ Görünürlük Kontrolleri (Eye / EyeOff, Copy)                        │
│       ├─ Test State & Loading Indicator (200 OK doğrulama)                 │
│       └─ Kayıt & LocalStorage / Sync State Dispatcher                      │
└─────────────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
           [ localStorage: muavin_ecommerce_v2_{companyId}_stores ]
                                  ▲
                                  │
         [ AdminDashboard / AdminEcommerceMatchPanel Senkronizasyonu ]
```

### B. Veri Modeli Genişletmesi

```typescript
export interface MarketplaceStoreConfig {
  id: MarketplaceId;
  name: string;
  shortCode: string;
  badgeColor: string;
  accentBg: string;
  supplierId: string;
  apiKey: string;
  apiSecret: string;
  storeUrl?: string;
  serviceKey?: string; // Hepsiburada Servis Anahtarı veya Amazon Region için
  commissionRate: number;
  shippingDeductionAvg: number;
  withholdingRate: number;
  autoInvoice: boolean;
  autoStockSync: boolean;
  isConnected: boolean;
  lastSyncAt: string;
  status: "active" | "error" | "paused";
}
```

---

## Doğrulama ve Test Adımları

1. **Bağlantı Paneli Açılışı**: "Mağaza Entegrasyonları" sekmesinde hem boş durumda hem de dolu listede "+ Yeni Mağaza Bağla" butonuna tıklandığında bağlantı modalının kusursuz açıldığının doğrulanması.
2. **Platform Seçimi ve Dinamik Alanlar**: Trendyol, Hepsiburada, Amazon TR, N11, Çiçeksepeti ve Shopify seçildiğinde ilgili alanların anında değiştiğinin doğrulanması.
3. **Güvenlik Alanları**: API Secret alanının `type="password"` olması, göz ikonuna basıldığında metne dönüşmesi, kopyalama butonunun çalışması.
4. **Bağlantı Testi**: "Bağlantıyı Test Et" tıklandığında yükleme animasyonu ve ardından yeşil onay bildiriminin çıkması.
5. **Kayıt ve Kart Görünümü**: Kaydet butonuna basıldığında mağazanın listeye eklenmesi, kartta satıcı ID ve komisyon bilgilerinin doğru yansıması.
6. **Düzenleme ve Silme**: Kart üzerinden bilgilerin güncellenebilmesi ve bağlantının kaldırılabilmesi.
7. **Derleme Doğrulaması**: `compile_applet` ve `lint_applet` ile TypeScript ve derleme hatalarının bulunmadığının teyit edilmesi.
