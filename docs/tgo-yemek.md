# TGO Yemek siparişlerini çekme

Muavin'de **E-Ticaret & Pazaryeri Entegrasyon Merkezi → Mağazalar** bölümünden TGO Yemek mağazasını açın. TGO Satıcı Paneli'ndeki **Hesap Bilgilerim → Entegrasyon Bilgileri** sayfasından sayısal Satıcı ID, API Key ve API Secret'ı girin. İşlemi yapan kişinin e-posta adresini de yazın. Eski formda zorunlu görünen entegrasyon referansı ve eşleştirme tokenı TGO'nun bu API'sinde kullanılmıyor.

Önce **Bağlantıyı Test Et**, sonra **Kaydet** ve mağaza kartında **Şimdi Senkronize Et** düğmelerine basın. Senkronizasyon son 14 günde değişen paketleri sayfalayarak alır. Siparişler **E-Ticaret Siparişleri** listesinde görünür. Aynı paket ikinci kez çekilirse mevcut kayıt güncellenir; faturaya ve ana siparişlere aktarım işaretleri korunur. Hata olursa ekranda HTTP durumuna göre açıklama gösterilir, son senkronizasyon zamanı değiştirilmez.

TGO paket yanıtı KDV oranı ve kesin komisyon/hakediş bilgisi sağlamaz. Bu nedenle bu alımlardan otomatik fatura kesilmez; fatura için doğrulanmış veriler Faturalar ekranında kullanılmalıdır. Bağlantı bilgileri e-ticaret modülünün tarayıcı depolamasına ve firmanın bulut senkronizasyonuna kaydedilir.

Sunucu, [TGO yemek paketleri API'sini](https://developers.tgoapps.com/docs/trendyol-go-yemek-entegrasyonu/siparis-entegrasyonu/ymk-siparis-paketlerini.cekme) kullanır. Kimlik doğrulaması ve zorunlu başlıklar [TGO yetkilendirme dokümanına](https://developers.tgoapps.com/docs/authorization) uygundur. `TGO_INTEGRATOR_NAME` ortam değişkeni verilmezse `TallsoftMuavin` kullanılır.
