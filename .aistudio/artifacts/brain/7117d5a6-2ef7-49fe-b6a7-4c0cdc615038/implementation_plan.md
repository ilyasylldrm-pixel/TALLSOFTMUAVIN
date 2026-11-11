# Bilanço İndir, Gelir/Gider Dökümleri (VKN/TCKN) ve Defter Beyan Sistemi (DBS) Entegrasyon Planı

Mali Müşavir modülündeki dönem icmali butonunun "Bilanço İndir" olarak yapılandırılması; dönem gelir ve gider kayıtlarının VKN/TCKN bilgileriyle birlikte hem Excel (.csv/.xlsx) hem de resmi PDF olarak ayrı ayrı indirilmesi; aynı muhasebe kayıtlarının Gelir İdaresi Başkanlığı (GİB) Defter Beyan Sistemi (DBS) standart sütun yapısına uygun biçimde Gelir ve Gider olarak ayrı dosyalar halinde dışa aktarılmasını sağlayan kapsamlı geliştirme planıdır.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> Kullanıcı ile 1. Aşamada (`ask_question`) netleştirilen ve mutabık kalınan kararlar:

- **Doğrulanan Karar 1 (Dosya Formatları)**: Bilanço ve gelir-gider listeleri için hem **Excel/CSV** veri tabloları hem de **resmi PDF** raporu formatları birlikte sunulacaktır. Kullanıcı açılır menüden veya doğrudan tek tıkla dilediği formatı seçebilecektir.
- **Doğrulanan Karar 2 (Defter Beyan Sistemi Yapısı)**: Defter Beyan Sistemi (DBS) formatındaki kayıtlar, GİB resmi aktarım standartlarına uygun olarak **Gelir Kayıtları** ve **Gider Kayıtları** için iki ayrı özel dosya olarak indirilecektir.
- **Doğrulanan Karar 3 (VKN / TCKN Entegrasyonu)**: Tüm gelir ve gider dökümlerinde ve DBS dosyalarında fatura üzerindeki VKN/TCKN bilgisi öncelikli olarak alınacak; faturada boşsa ilişkili Cari Kart (`contacts`) taranarak VKN/TCKN tam ve doğrulanmış olarak yansıtılacaktır.

---

### 1. Overview & Core Concept

- **Ne Yapıyor?**:
  1. Mali Müşavir Masası üst barında yer alan ve önceden WhatsApp icmali gönderen ana aksiyon butonu **"Bilanço İndir"** olarak güncellenir. Tıklandığında aktif döneme (veya yıla) ait Dönen Varlıklar, Kısa Vadeli Yabancı Kaynaklar, Net İşletme Sermayesi, Gelir Tablosu ve KDV/Vergi durumunu içeren resmi Bilanço İcmali'ni (PDF veya Excel) indirir.
  2. Dönem gelirleri (satış faturaları) ve dönem giderleri (alış & masraf faturaları) için iki ayrı detaylı indirme seçeneği sunulur. Her kayıtta muhatabın **VKN / TCKN** bilgisi, vergi dairesi, matrah, KDV oranları ve genel toplamları eksiksiz listelenir.
  3. GİB Defter Beyan Sistemi (DBS) standart aktarım formatında (Belge Türü, Belge Tarihi, Belge Seri/Sıra No, VKN/TCKN, Unvan, Alış/Satış Türü, Matrah, KDV Oranı, KDV Tutarı, Tevkifat, Stopaj, Toplam Tutar, Açıklama) Gelir ve Gider dosyaları tek tıkla üretilir.
- **Hedef Kitle**: Şirket yöneticileri, ön muhasebe personeli ve şirketin anlaşmalı Serbest Muhasebeci Mali Müşaviri (SMMM / YMM).
- **Temel Değer**: Mali müşavire evrak teslimi ve GİB Defter Beyan Sistemi'ne toplu veri aktarımı dakikalar içinde, sıfır veri kaybı ve tam VKN/TCKN eşleşmesiyle tamamlanır.

---

### 2. User Experience & Visual Design

#### A. Kullanıcı Akışı & Buton Mimarisi
1. **Üst Bar Aksiyon Alanı ("Bilanço İndir")**:
   - `FinancialAdvisorModule.tsx` üst kimlik kartındaki ana mavi buton `"Müşavire Dönem İcmali Gönder"` yerine net ve belirgin biçimde `"Bilanço İndir"` olarak konumlandırılır.
   - Butonun yanında veya tıklandığında açılan şık ve kompakt dropdown / açılır aksiyon menüsünde:
     - 📊 **Bilanço & Gelir Tablosu İndir (Resmi PDF)**
     - 📈 **Bilanço & Dönem Özeti İndir (Excel / CSV)**
     - 💬 *Müşavire WhatsApp Dönem İcmali Gönder (Mevcut mesajlaşma kabiliyeti korunur)*
2. **Gelir & Gider Ayrık İndirme Bölümü (VKN / TCKN Destekli)**:
   - "Dönem Tahakkuk & Ön Muhasebe Özeti" kartının altındaki dışa aktarım barına iki yeni ayrık buton eklenir:
     - 🟢 **Gelirler Listesi İndir (Excel & PDF)**: İlgili dönemdeki tüm satış faturalarını VKN/TCKN, KDV matrahları ve tahsilat durumlarıyla indirir.
     - 🔴 **Giderler Listesi İndir (Excel & PDF)**: İlgili dönemdeki tüm alış ve masraf faturalarını VKN/TCKN, gider kategorisi, KDV ve tevkifat kesintileriyle indirir.
3. **Defter Beyan Sistemi (DBS) Dışa Aktarım Butonları**:
   - 🏛️ **Defter Beyan Sistemi (DBS) Gelir Kayıtları (.CSV / Excel)**
   - 🏛️ **Defter Beyan Sistemi (DBS) Gider Kayıtları (.CSV / Excel)**
   - GİB portalına doğrudan yüklenebilecek UTF-8 BOM destekli Türkçe noktalı virgüllü CSV / Excel formatı.

#### B. Görsel Hiyerarşi & Tasarım Standartları
- **Anti-Slop & Zero-Pill**: Butonlar ve menüler yalın, tek satır (`whitespace-nowrap shrink-0`), net kurumsal simgeler (`Download`, `FileSpreadsheet`, `FileText`, `Building2`) ile donatılır.
- **Tabular Rakamlar**: Tutarlar, oranlar ve VKN/TCKN numaraları `font-mono tabular-nums` ile hizalı gösterilir.
- **Koyu / Açık Tema Uyumu**: Tailwind v4 temasına (`dark:*`) tam uyumlu, kart içi kart oluşturmayan, temiz sınır çizgileri (`border border-slate-200 dark:border-slate-800`).

---

### 3. Key Product Decisions & Trade-Offs

- **Karar 1: VKN / TCKN Veri Çözümleme (Cascade Resolution)**
  - *Yaklaşım*: Fatura nesnesindeki `taxNumber` alanı doluysa doğrudan kullanılır; boş ise faturanın `contactId` veya `contactName` değeri üzerinden aktif firma `contacts` listesi anında taranarak VKN/TCKN bulunur. Hiçbiri yoksa `"Belirtilmedi (Bireysel)"` veya `"-"` yazılır.
  - *Neden*: Kullanıcıların bazı faturaları hızlı keserken carinin vergi numarasını cari kartına kaydetmiş ancak faturaya kopyalamamış olabileceği gerçeği göz önüne alınarak tam veri tutarlılığı sağlanır.
- **Karar 2: Defter Beyan Sistemi (DBS) Standardizasyonu**
  - *Yaklaşım*: Gelir İdaresi Başkanlığı Defter Beyan Sistemi'nin talep ettiği resmi kolon sırası ve başlıkları (Belge Türü, Belge Tarihi GG.AA.YYYY, Belge No, VKN/TCKN, Unvan, Matrah, KDV vb.) birebir uygulanır.
  - *Neden*: Mali müşavirlerin DBS excel yükleme sihirbazında kolon eşleştirmeyle uğraşmadan dosyayı doğrudan yükleyebilmeleri sağlanır.
- **Karar 3: PDF Üretiminde Vektörel jsPDF & Türkçe Karakter Garantisi**
  - *Yaklaşım*: `src/utils/pdfService.ts` içinde yeni `generateBalanceSheetPDF` fonksiyonu oluşturulur. Mevcut `generateCariReconciliationPDF` ve `preloadTurkishFont` altyapısı kullanılarak Türkçe karakter sorunu olmayan kurumsal bir Bilanço ve Gelir/Gider döküm PDF'i üretilir.

---

### 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                   FinancialAdvisorModule.tsx                           │
│                                                                        │
│  [Top Header Actions]                                                  │
│   ├─ [ Müşavir Düzenle ]                                              │
│   ├─ [ Bilanço İndir ▾ ] ──> PDF (Resmi Rapor) / Excel (.CSV)          │
│   └─ [ WhatsApp İcmali (İsteğe Bağlı) ]                                │
│                                                                        │
│  [Dönem Özeti & Dışa Aktarım Barı]                                     │
│   ├─ [ Gelirler Listesi (VKN/TCKN) ] ──> Excel / PDF                   │
│   ├─ [ Giderler Listesi (VKN/TCKN) ] ──> Excel / PDF                   │
│   ├─ [ Defter Beyan (DBS) Gelirler ] ──> GİB Uyumlu CSV/Excel          │
│   ├─ [ Defter Beyan (DBS) Giderler ] ──> GİB Uyumlu CSV/Excel          │
│   └─ [ Tek Düzen Mahsup Fişi (120/320/600/770) ]                       │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │
                                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     src/utils/pdfService.ts                            │
│                                                                        │
│  • generateBalanceSheetPDF(companySettings, periodData, advisorInfo)   │
│  • generateIncomeExpenseListPDF(type, invoices, contacts, period)      │
│  • generateCariReconciliationPDF(...) [Mevcut korunur]                 │
└────────────────────────────────────────────────────────────────────────┘
```

#### Veri Yapıları & Fonksiyonlar:
1. `getResolvedTaxNumber(inv: Invoice, contacts: Contact[]): string`:
   - Fatura veya Cari karttan VKN/TCKN bilgisini çeker.
2. `handleDownloadBalanceSheet(format: "pdf" | "csv")`:
   - Bilanço ve gelir tablosu icmalini üretip indirir.
3. `handleDownloadIncomeExpense(kind: "income" | "expense", format: "pdf" | "csv")`:
   - Gelir ve giderleri ayrı ayrı, VKN/TCKN sütununu göstererek indirir.
4. `handleDownloadDefterBeyan(kind: "gelir" | "gider")`:
   - GİB Defter Beyan Sistemi kolon formatına tam uyumlu UTF-8 CSV dosyasını indirir.
