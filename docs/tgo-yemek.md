# TGO Yemek sipariş senkronizasyonu

E-Ticaret & Pazaryeri Entegrasyon Merkezi'nden **Trendyol Go (TGO Yemek)** mağazasını açın. TGO Satıcı Paneli'ndeki **Hesap Bilgilerim → Entegrasyon Bilgileri** ekranından sayısal Satıcı ID, API Key ve API Secret bilgilerini girin. TGO API'sinin zorunlu `x-executor-user` başlığı için işlemi yapan kişinin e-posta adresini de girin.

**Bağlantıyı Test Et** gerçek TGO API'sine istek gönderir. **Şimdi Senkronize Et** son 14 günde değişen paketleri sayfalayarak alır ve siparişleri E-Ticaret Siparişleri listesine kaydeder. Aynı paket tekrar çekildiğinde mevcut sipariş güncellenir.

TGO paket yanıtı KDV oranı ve kesin komisyon/hakediş bilgisi sağlamadığından bu alanlar otomatik olarak varsayılmaz; fatura öncesi doğrulanmalıdır. Kimlik bilgileri uygulamanın mevcut mağaza/cloud-sync kayıt mekanizmasıyla saklanır.

Sunucu, TGO Yemek paket API'sini kullanır. `TGO_INTEGRATOR_NAME` ortam değişkeni verilmezse `TallsoftMuavin` kullanılır.
