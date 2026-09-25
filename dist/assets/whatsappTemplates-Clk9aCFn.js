import{l as c,o as s}from"./index-DDRJGfqm.js";import"./vendor-pdf-excel-5HTmcpzv.js";function k(a,e,i){const n=e?.companyTitle||e?.companyName||"Şirketimiz",r=i?.name||a.contactName||"Sayın Müşterimiz",m=a.invoiceNumber||"Fatura",l=c(a.issueDate||new Date),t=a.dueDate?c(a.dueDate):"Peşin / Vadesiz",o=s(a.grandTotal||0,a.currency||"TRY"),u=s(a.remainingAmount??a.grandTotal??0,a.currency||"TRY");return`Sayın *${r}*,

*${n}* tarafından düzenlenen *${m}* numaralı e-Belgeniz / Faturanız ekte bilgilerinize sunulmuştur.

💰 *Genel Toplam:* ${o}
📅 *Fatura Tarihi:* ${l}
⏳ *Son Ödeme / Vade:* ${t}
💵 *Kalan Açık Bakiye:* ${u}

📄 Fatura belgesi bu mesaj ile birlikte PDF olarak iletilmiştir.
İyi çalışmalar dileriz.`}function T(a,e,i){const n=e?.companyTitle||e?.companyName||"Şirketimiz",r=i?.name||a.contactName||"Sayın Müşterimiz",m=a.quoteNumber||"TEK-2026",l=c(a.issueDate),t=a.validUntil?c(a.validUntil):"15 Gün",o=s(a.grandTotal,a.currency||"TRY");return`Sayın *${r}*,

*${n}* tarafından firmanıza özel hazırlanan *${m}* numaralı Fiyat Teklifi / Proforma Faturamız ekte yer almaktadır.

💼 *Teklif Tutarı:* ${o}
📅 *Düzenlenme Tarihi:* ${l}
⏳ *Geçerlilik Tarihi:* ${t}

Teklifi onaylamak veya siparişe dönüştürmek için lütfen bu mesaja *ONAY* yazarak yanıtlayınız.
İyi çalışmalar dileriz.`}function z(a,e,i){const n=e?.companyTitle||e?.companyName||"Şirketimiz",r=i?.name||a.contactName||"Sayın İlgili",m=a.orderNumber||"SIP-2026",l=a.type==="sales"?"Satış Siparişi":"Satın Alma Siparişi",t=c(a.orderDate),o=a.deliveryDate?c(a.deliveryDate):"En Kısa Sürede",u=s(a.grandTotal,a.currency||"TRY"),d=a.warehouseName?` (${a.warehouseName})`:"";return`Sayın *${r}*,

*${n}* bünyesinde oluşturulan *${m}* numaralı *${l}* kaydınız alınmıştır.

📦 *Sipariş Tutarı:* ${u}
📅 *Sipariş Tarihi:* ${t}
🚚 *Tahmini Teslimat:* ${o}${d}

Sipariş formunuz ekte PDF olarak iletilmiştir.
İyi çalışmalar dileriz.`}function N(a,e,i){const n=e?.companyTitle||e?.companyName||"Şirketimiz",r=i?.name||a.contactName||"Sayın Müşterimiz",m=a.waybillNumber||"IRS-2026",l=c(a.dispatchDate||a.waybillDate),t=a.driverName?`*${a.driverName}*`:"Şirket Sevkiyat Aracı",o=a.vehiclePlate?` (${a.vehiclePlate})`:"";return`Sayın *${r}*,

*${n}* tarafından hazırlanan *${m}* numaralı Sevk İrsaliyesi düzenlenmiş ve ürünleriniz yola çıkmıştır.

🚚 *Taşıyıcı / Şoför:* ${t}${o}
📅 *Sevk Tarihi:* ${l}
📦 *Kalem Sayısı:* ${a.items?.length||1} Kalem

Resmi Sevk İrsaliyesi belgeniz ekte PDF olarak yer almaktadır.
İyi çalışmalar dileriz.`}function p(a,e,i){const n=i?.companyTitle||i?.companyName||"Şirketimiz",r=a?.monthYear||"Cari Ay",m=s(a?.payableNetSalary??a?.netSalary??a?.grossSalary??e.salaryAmount??0,"TRY"),l=s(a?.grossSalary||e.salaryAmount||0,"TRY"),t=[];a?.unpaidLeaveDays&&a.unpaidLeaveDays>0&&t.push(`📄 SGK Eksik Gün Bildirim Formu (${a.unpaidLeaveDays} Gün - Kod ${a.missingDayCode||"21"}: ${a.missingDayReason||"Ücretsiz İzin"})`);const o=(a?.advanceDeduction||0)+(a?.executionDeduction||0)+(a?.alimonyDeduction||0)+(a?.otherDeductions||0);o>0&&t.push(`📋 Personel Ücret Kesinti ve Avans Mahsup Formu (${s(o,"TRY")})`);const u=a?.overtimePay&&a.overtimePay>0?`
⏱️ *Fazla Mesai Hakedişi:* ${s(a.overtimePay,"TRY")}`:"",d=t.length>0?`

📌 *Bordroya Eklenen Resmi Formlar:*
${t.join(`
`)}`:"";return`Sayın *${e.fullName}* (T.C.: ${e.tckn}),

*${n}* bünyesindeki *${r}* dönemine ait Resmi Maaş Bordronuz (Ücret Hesap Pusulası - 4857 S.K. Md. 37) düzenlenmiştir.

💵 *Net Ele Geçen Maaş:* ${m}
📊 *Brüt Ücret:* ${l}${u}${d}

Maaş bordronuz ve ilgili ek formlar bu mesaj ile birlikte PDF olarak iletilmiştir. Lütfen inceleyip tebellüğ ediniz.
İyi çalışmalar dileriz.`}function D(a,e,i,n=!1){const r=i?.companyTitle||i?.companyName||"Şirketimiz",m=e?.fullName||a.employeeName||"Personelimiz",l=n?"Zimmet İade ve İbra Tutanağı":"Zimmet Teslim ve Tesellüm Tutanağı",t=a.barcodeNumber||a.id,o=a.assetName,u=a.serialNumber||a.vehicleDetails?.plateNumber||a.barcodeNumber||"Kayıtlı";return`Sayın *${m}*,

*${r}* tarafından adınıza tanzim edilen *${t}* numaralı *${l}* ekte bilgilerinize sunulmuştur.

💻 *Demirbaş:* ${o}
🏷️ *Seri No / Plaka:* ${u}
📅 *Tarih:* ${c(new Date)}

İlgili resmi tutanak PDF eki olarak bu mesaja eklenmiştir.
İyi çalışmalar dileriz.`}function f(a,e,i){const n=e?.companyTitle||e?.companyName||"Şirketimiz",r=i?.name||a.contactName||"Sayın İlgili",m=a.documentNo||"MAKBUZ",l=a.type==="collection"?"Tahsilat Makbuzu":a.type==="payment"?"Tediye / Ödeme Makbuzu":a.type==="income"?"Gelir Fişi":"Gider Fişi",t=s(a.amount,a.currency||"TRY");return`Sayın *${r}*,

*${n}* mali kayıtlarında gerçekleştirilen *${m}* numaralı *${l}* düzenlenmiştir.

💵 *İşlem Tutarı:* ${t}
📅 *İşlem Tarihi:* ${c(a.date)}
🏛️ *Hesap / Kasa:* ${a.accountName}
📝 *Açıklama:* ${a.description}

İşlem dekontunuz ekte yer almaktadır.
İyi çalışmalar dileriz.`}function h(a,e){const i=e?.companyTitle||e?.companyName||"Şirketimiz",n=a.legalDeadlineDate?Math.max(0,Math.ceil((new Date(a.legalDeadlineDate).getTime()-new Date().getTime())/(1e3*60*60*24))):30;return`⚠️ *ACİL: Resmi Elektronik Tebligat Bildirimi*

Sayın Şirket Yetkilisi,
*${i}* tüzel kişiliği adına *${a.authority} (${a.senderUnit})* tarafından yeni bir elektronik tebligat düzenlenmiştir.

📄 *Belge Başlığı:* ${a.documentTitle}
📌 *Barkod No:* ${a.barcodeNumber}
📅 *Tebellüğ Tarihi:* ${c(a.deliveryDate||a.sentDate)}
⏳ *Kalan Yasal İtiraz Süresi:* ${n} Gün

Resmi mazbata ve tebligat ayrıntılarını lütfen yasal hak düşürücü süre geçmeden inceleyiniz.`}function b(a,e){const i=e?.companyTitle||e?.companyName||"Şirketimiz",n=s(a.sellPrice||0,"TRY"),r=s((a.sellPrice||0)*(1+(a.vatRate??20)/100),"TRY");return`Sayın Müşterimiz,

*${i}* ürün kataloğumuzdaki *${a.name}* (Kod: ${a.code}) hakkında bilgiler aşağıdadır:

📦 *Ürün:* ${a.name}
💰 *Fiyat:* ${n} + KDV (${r} KDV Dahil)
📊 *Mevcut Stok:* ${a.stockQuantity} ${a.unit||"Adet"}

Sipariş vermek için lütfen bu mesaja dönüş yapınız.`}export{T as a,z as b,N as c,f as d,b as e,k as f,h as g,p as h,D as i};
