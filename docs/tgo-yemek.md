# TGO Yemek sipariş senkronizasyonu

E-Ticaret & Pazaryeri Entegrasyon Merkezi'nden **Trendyol Go (TGO Yemek)** mağazasını açın. TGO Satıcı Paneli'ndeki **Hesap Bilgilerim → Entegrasyon Bilgileri** ekranından sayısal Satıcı ID, API Key ve API Secret bilgilerini girin. TGO API'sinin zorunlu `x-executor-user` başlığı için işlemi yapan kişinin e-posta adresini de girin.

**Bağlantıyı Test Et** gerçek TGO API'sine istek gönderir. **Şimdi Senkronize Et** son 14 günde değişen paketleri sayfalayarak alır ve siparişleri E-Ticaret Siparişleri listesine kaydeder. Aynı paket tekrar çekildiğinde mevcut sipariş güncellenir.

TGO paket yanıtı KDV oranı ve kesin komisyon/hakediş bilgisi sağlamadığından bu alanlar otomatik olarak varsayılmaz; fatura öncesi doğrulanmalıdır. Kimlik bilgileri uygulamanın mevcut mağaza/cloud-sync kayıt mekanizmasıyla saklanır.

Sunucu, TGO Yemek paket API'sini kullanır. `TGO_INTEGRATOR_NAME` ortam değişkeni verilmezse `TallsoftMuavin` kullanılır.

## Faturanın TGO siparişine bildirilmesi

Bir TGO siparişi için fatura kesildiğinde (`POST /api/marketplace/tgo-meal/notify-invoiced` üzerinden):

1. **Otomatik bildirim** — E-Ticaret Siparişleri listesindeki "e-Fatura Kes" akışı TGO siparişlerinde de çalışır: KDV oranı kullanıcıdan doğrulanır, fatura kesilir kesilmez TGO'ya bildirim otomatik gönderilir.
2. **Manuel "TGO'ya Yükle" butonu** — Sipariş satırındaki buton, Faturalar ekranından kesilen faturalar için paketi TGO'ya bildirir; tekrar bildirmek için tekrar tıklanabilir.

Bildirim iki TGO servisini kullanır:

- `PUT /integrator/order/meal/suppliers/{supplierId}/packages/invoiced` — paketi **Invoiced** yapar; TGO'nun satıcı ödemesini hesaplaması için zorunludur.
- `POST /integrator/invoice/meal/suppliers/{supplierId}/supplier-invoice-links/4/{orderId}` — fatura linki verilmişse iletilir (`channelId` sabit 4). Gönderilen link yasal olarak **10 yıl** erişilebilir olmalıdır.

Bildirim durumu sipariş kaydında (`tgoInvoiceNotifiedAt`) saklanır ve TGO senkronizasyonunda korunur.
