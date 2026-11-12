# Yemeksepeti Yemek POS bağlantısı

Bu bağlantı, Delivery Hero restoran POS Middleware **Order Report Service** şemasını kullanır. Son 24 saat içindeki `accepted` ve `cancelled` siparişlerin kimliklerini ve detaylarını alır. Ekrandaki **Bağlantıyı test et** ve **Şimdi senkronize et** düğmeleriyle çalışır. Otomatik sipariş kabulü, webhook, stok aktarımı ve fatura kesimi bu bağlantının kapsamında değildir.

## Canlıya alma

1. Yemeksepeti restoran entegrasyon ekibinden Tallsoft Muavin için POS entegrasyon yetkisi ve üretim API adresini isteyin. Yalnızca Local Shops API erişimi restoran siparişleri için yeterli değildir.
2. POS kullanıcı adı ve şifresini, **Chain Code** ve ilgili restoranın **Vendor ID** değerini alın; zincir ile restoranın entegrasyon hesabına eşlendiğini teyit edin.
3. Sunucu ortamına `YEMEKSEPETI_POS_BASE_URL` değerini, onaylanan `https://...restaurant-partners.com` üretim kök adresi olarak girin. Staging adresini canlı ortamda kullanmayın. Sunucuyu yeniden başlatın.
4. Muavin'de **Yemeksepeti Yemek** mağazası açıp dört alanı doldurun. **Bağlantıyı test et** sonrasında **Şimdi senkronize et** seçin. İlk canlı denemede bir siparişin ürün, toplam ve durumunu Yemeksepeti paneliyle karşılaştırın.
5. Her 24 saat içinde en az bir kez senkronize edin; rapor servisi eski siparişleri döndürmez.

Yemeksepeti üretim adresi ve yetkilendirilmiş kimlik bilgileri elimizde olmadığı için canlı bağlantı henüz doğrulanmadı. Erişim sağlanmadan mağazayı “bağlandı” olarak göstermiyoruz.

Kaynaklar: [Yemeksepeti API giriş sayfası](https://developer.yemeksepeti.com/en/documentation/introduction), [Delivery Hero POS belgeleri](https://integration.foodpanda.com/en/documentation/), [POS Middleware OpenAPI](https://integration-middleware.stg.restaurant-partners.com/apidocs/pos-middleware-api).

## Migros Yemek için iletilecek mesaj

“Migros Yemek siparişlerini Muavin'e bağlamak istiyoruz. Restoran/POS entegrasyonu için resmî API dokümanını, test ve üretim adreslerini, kimlik doğrulama yöntemini, sipariş ve iptal akışını, restoran kimliğini ve erişim/onay adımlarını paylaşabilir misiniz? Bu bilgilerle bağlantıyı güvenle tamamlayıp test siparişiyle doğrulayacağız.”
