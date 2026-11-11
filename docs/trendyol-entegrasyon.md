# Trendyol entegrasyonu ve otomatik fatura

Firma kendi Trendyol API bilgilerini Muavin'e girer. Muavin siparişleri çeker,
her sipariş paketi için Mysoft üzerinden **e-Arşiv** (bireysel / e-Fatura
mükellefi olmayan) veya **e-Fatura** (GİB'e kayıtlı kurumsal alıcı) keser ve
fatura PDF'ini Trendyol paketine yükler.

Menü: **Sipariş & Proforma → Trendyol Entegrasyonu**

## Akış

```
Trendyol v2/orders ──► eşleme + tutar mutabakatı ──► GİB mükellef sorgusu
        ▲                                                   │
        │                                     EFATURA (pkAlias) / EARSIVFATURA
        │                                                   ▼
seller-invoice-file ◄── Mysoft PDF ◄── Mysoft invoiceOutbox (deterministik ETTN)
```

Dosyalar (`src/services/trendyol/`):

| Dosya | Görev |
| --- | --- |
| `trendyolClient.ts` | Trendyol API (Basic auth, User-Agent, 429 tekrar, 2 haftalık aralık sınırı) |
| `trendyolInvoiceMapper.ts` | Paket → `Invoice` + `Contact`; KDV dahil → hariç; tutar mutabakatı |
| `trendyolStore.ts` | Şifreli API bilgileri (AES-256-GCM) + paket defteri |
| `trendyolInvoicer.ts` | Faturalama motoru: kes, PDF al, Trendyol'a yükle, kurtarma |
| `trendyolRoutes.ts` | `/api/marketplace/trendyol/*` uç noktaları + zamanlayıcı |
| `src/components/Marketplace/TrendyolIntegration.tsx` | Ekran |

## Çift fatura koruması (3 katman)

1. **Defter:** `delivered` / `invoiced` paketler tekrar kesilmez.
2. **Deterministik ETTN:** ETTN, `firma + paket no`'dan türetilir. Süreç
   Mysoft'a gönderdikten sonra çökse bile yeniden denemede aynı ETTN gider;
   motor önce Mysoft'ta o ETTN'i arar, bulursa yeniden kesmez.
3. **Trendyol kontrolü:** Paket kesimden hemen önce Trendyol'dan taze çekilir;
   `invoiceLink` doluysa (başka programla kesilmişse) dokunulmaz. Trendyol aynı
   pakete ikinci faturayı zaten 409 ile reddeder.

## Tutarlar

- Trendyol fiyatları **KDV dahildir**. Satırda KDV hariç birim fiyat + iskonto +
  KDV ayrıştırılır; toplam kuruşu kuruşuna Trendyol tutarına eşittir.
- Faturalanacak tutarın kaynağı `packageTotalPrice` ("Amount to be invoiced").
  Satırlardan hesaplanan toplam bununla tutmazsa paket **kesilmez**, ekranda
  "inceleme" olarak görünür.
- Trendyol'un karşıladığı indirim (`lineTyDiscount`): kurumsal siparişte
  faturadan düşülür, bireyselde düşülmez. Bu, Trendyol'un `packageTyDiscount`
  açıklamasına dayanıyor ("commercial true ise dolu, false ise 0"). Mutabakat bu
  varsayımı her pakette doğrular. **Mali müşavirle teyit edin.**

## Otomatik kesilmeyen durumlar (inceleme)

Mikro ihracat (`micro=true`), TRY dışı para birimi, iptal/iade paketler, VKN'siz
kurumsal sipariş, KDV oranı olmayan satır (ayarda varsayılan oran seçilmediyse),
tutar mutabakatı tutmayan paket, GİB mükellef sorgusu başarısız.

## Sunucu kurulumu

`.env`:

```env
TRENDYOL_SECRET_KEY=<uzun-rastgele-değer>   # değişirse kayıtlı API bilgileri okunamaz
TRENDYOL_INTEGRATOR_NAME=TallsoftMuavin      # opsiyonel, yoksa SelfIntegration
```

Mysoft erişim anahtarı (`MYSOFT_CLIENT_ID/SECRET`) tanımlı olmalı. Tanımlı
değilse Mysoft istemcisi demo moddadır; Trendyol ekranı siparişleri gösterir
ama **gerçek fatura kesmeyi reddeder** (sahte faturanın Trendyol'a gitmemesi için).

Otomatik çalışma:

- **VPS / PM2:** `TRENDYOL_AUTO_SYNC=true`, `TRENDYOL_SYNC_INTERVAL_MINUTES=15`.
  Cluster modunda yalnızca `NODE_APP_INSTANCE=0` süreci çalıştırır.
- **Cloud Run:** örnek sayısı 0'a indiği için süreç içi zamanlayıcıya
  güvenmeyin. `TRENDYOL_CRON_SECRET` verin ve Cloud Scheduler ile
  `POST /api/marketplace/trendyol/cron` (başlık `x-cron-secret`) çağırın.
  `data/` diski Cloud Run'da kalıcı değildir: `TRENDYOL_STORE_PATH`'i kalıcı bir
  birime bağlayın veya depoyu PostgreSQL'e taşıyın (aşağıda).

## Açık konular / yapılacaklar

1. **İnternet satışı e-Arşiv bilgileri.** GİB, internet satışlarında e-Arşiv
   faturaya web adresi, ödeme şekli/tarihi ve taşıyıcı bilgisini ister. Mysoft
   `InvoiceOutboxModel` içinde bunun alan adını Swagger'dan (v8) teyit edip
   `trendyolInvoicer.ts` içinde `payload` oluşturulduktan sonra ekleyin. Mysoft
   portalında "internet satış" ön ekli seri/XSLT tanımlıysa onu da seçin.
2. **Depo.** JSON dosyası tek sunucu için yeterli. Çok örnekli kurulumda
   `trendyol_connections` ve `trendyol_invoice_ledger` tabloları (PostgreSQL,
   `(company_id, package_id)` üzerinde UNIQUE) açın; `TrendyolStore`
   arayüzü aynı kalır.
3. **İade/iptal.** Kesilmiş faturanın iptali veya iade faturası otomatik değil.
   Yeniden kesim gerekirse defterde `ettnAttempt` artırılmalı.
4. **Kimlik doğrulama.** `requireAuth`, JWT olmayan `Bearer <uid>` ve
   `x-user-id` başlığını doğrulamadan kabul ediyor; `/api/cloud-sync/*` ve
   `/api/mysoft/*` ise kimlik doğrulamasız. Trendyol rotaları bağlantıyı kuran
   kullanıcıya kilitlenir ama gerçek koruma için bu açıkların kapatılması gerekir.
5. **`storeFrontCode`.** Fatura dosyası uç noktası bu başlığı belgeliyor ama
   değerini vermiyor. Yükleme reddedilirse Trendyol'dan değeri isteyip
   bağlantı ayarına girin.

## Test

Eşleyici ve motor, sahte Trendyol/Mysoft yanıtlarıyla test edildi: bireysel
e-Arşiv, kurumsal e-Fatura (pkAlias), tekrar turda çift kesim olmaması, yükleme
hatası sonrası yalnızca iletimin tekrarı, Mysoft zaman aşımında aynı ETTN'in
bulunması, demo modda kesimin reddi ve tutmayan tutarın incelemeye düşmesi.
Canlıya almadan önce Trendyol **stage** ortamı ve Mysoft **test** portalıyla
uçtan uca deneyin.
