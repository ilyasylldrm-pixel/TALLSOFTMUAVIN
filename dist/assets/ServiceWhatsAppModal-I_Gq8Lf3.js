import{r as o,j as e}from"./vendor-react-foEfD2Q1.js";import{D as K,S as G,a6 as X,R as _,c4 as U,al as Y,P as H,k as O,a7 as q,ak as V,W as S}from"./index-BaM5-0IN.js";import{f as J,S as Q,s as Z}from"./whatsappClient-CMMfATGP.js";import{C as R}from"./calendar-rqTe0SDx.js";import{M as L}from"./message-circle-BC4f14vb.js";import{I as ee}from"./info-BA6N0kqe.js";import{S as D}from"./send-A1-nLfBW.js";const me=({isOpen:$,onClose:u,serviceType:c,serviceRecord:t,defaultTemplateType:j,invoiceNumber:h,companySettings:p})=>{const[r,d]=o.useState("completed"),[A,T]=o.useState(""),[m,y]=o.useState(""),[k,w]=o.useState(!1),[N,M]=o.useState(!1);o.useEffect(()=>{if(t){if(j){d(j);return}t.invoiceNumber||t.invoiceId||h?d("invoiced"):t.status==="ready"||t.status==="completed"||t.status==="ready_delivered"||t.status==="delivered"?d("completed"):t.status==="quote_pending"?d("diagnosis_approval"):d("completed")}},[t,j,h]),o.useEffect(()=>{t&&T(t.contactPhone||"")},[t]);const n=o.useMemo(()=>{if(!t)return{title:"",itemSummary:"",partsList:"",laborList:""};let l="",s="",f="",g="";if(c==="auto"){const a=t;l=`${a.plateNumber} (${a.brand} ${a.model})`,s=`Plaka: *${a.plateNumber}* | Araç: *${a.brand} ${a.model} (${a.modelYear})* | KM: *${a.currentKm?.toLocaleString("tr-TR")} KM*`}else if(c==="it"){const a=t;l=`${a.brand} ${a.model}`,s=`Cihaz: *${a.brand} ${a.model}* ${a.serialNumber?`(Seri No: ${a.serialNumber})`:""}`}else if(c==="appliance"){const a=t;l=`${a.brand} ${a.model}`,s=`Cihaz: *${a.brand} ${a.model}* ${a.serviceLocation==="on_site"?"(Adreste Servis)":"(Atölyede Servis)"}`}return"parts"in t&&Array.isArray(t.parts)&&t.parts.length>0&&(f=t.parts.map(a=>`• ${a.partName} (${a.quantity} Adet - ₺${((a.quantity||1)*(a.unitPrice||0)).toLocaleString("tr-TR",{minimumFractionDigits:2})})`).join(`
`)),"labors"in t&&Array.isArray(t.labors)&&t.labors.length>0&&(g=t.labors.map(a=>`• ${a.operationName} (₺${(a.total||0).toLocaleString("tr-TR",{minimumFractionDigits:2})})`).join(`
`)),{title:l,itemSummary:s,partsList:f,laborList:g}},[t,c]);if(o.useEffect(()=>{if(!t)return;const l=p?.companyName||"Teknik Servis Merkezi",s=p?.phone||"",f=p?.defaultBankIban||"",g=p?.defaultBankName||"",a=`₺${(t.grandTotal||0).toLocaleString("tr-TR",{minimumFractionDigits:2})}`,F=h||t.invoiceNumber||t.invoiceId||"E-Fatura";let b="";if(r==="completed")if(c==="auto"){const i=t;b=`Sayın *${i.contactName}*,

*${i.plateNumber}* plakalı *${i.brand} ${i.model}* aracınızın servis bakım ve onarım işlemleri başarıyla tamamlanmış olup test sürüşü yapılmıştır. Aracınız teslime hazırdır. 🚗✨

📋 *Servis Özeti:* [${i.serviceNo}]
• Giriş KM: ${i.currentKm?.toLocaleString("tr-TR")} KM
${n.partsList?`
🔩 *Değişen Parçalar:*
${n.partsList}
`:""}${n.laborList?`
🛠️ *Yapılan İşlemler:*
${n.laborList}
`:""}
💰 *Toplam Tutar:* *${a}*

Aracınızı mesai saatlerimiz içerisinde servisimizden teslim alabilirsiniz. Bizi tercih ettiğiniz için teşekkür eder, iyi yolculuklar dileriz!

🏢 *${l}*${s?`
📞 İletişim: ${s}`:""}`}else if(c==="it"){const i=t;b=`Sayın *${i.contactName}*,

Servisimize bıraktığınız *${i.brand} ${i.model}* cihazınızın teknik onarım, bakım ve laboratuvar testleri başarıyla tamamlanmıştır. Cihazınız teslime hazırdır. 💻✨

📋 *Servis No:* *${i.serviceNo}*
${n.partsList?`
🔩 *Takılan Donanım / Parçalar:*
${n.partsList}
`:""}${n.laborList?`
🛠️ *Yapılan İşlemler:*
${n.laborList}
`:""}
💰 *Toplam Tutar:* *${a}*

Cihazınızı servis merkezimizden teslim fişiniz ile teslim alabilirsiniz.

🏢 *${l}*${s?`
📞 İletişim: ${s}`:""}`}else{const i=t;b=`Sayın *${i.contactName}*,

*${i.brand} ${i.model}* cihazınızın arıza onarım ve periyodik kontrolleri başarıyla tamamlanmıştır. ✅

📋 *Servis Kayıt No:* *${i.serviceNo}*
${n.partsList?`
🔩 *Değişen Parçalar:*
${n.partsList}
`:""}${n.laborList?`
🛠️ *Uygulanan Hizmetler:*
${n.laborList}
`:""}
💰 *Toplam Tutar:* *${a}*
${i.isWarrantyActive?`🛡️ *İşlem Garanti Kapsamındadır.*
`:""}
Cihazınızı iyi günlerde kullanmanızı dileriz.

🏢 *${l}*${s?`
📞 İletişim: ${s}`:""}`}else if(r==="invoiced")b=`Sayın *${t.contactName}*,

*${n.title}* için düzenlenen *${t.serviceNo}* numaralı servis işlemine ait e-faturanız kesilmiştir. 🧾

📄 *Fatura Numarası:* *${F}*
💰 *Genel Toplam:* *${a}*
📅 *Fatura Tarihi:* ${new Date().toLocaleDateString("tr-TR")}
${f?`
🏦 *Banka & IBAN Bilgilerimiz:*
${g?`Banka: ${g}
`:""}IBAN: \`${f}\`
Alıcı: ${l}
`:""}
Faturanız kayıtlı e-posta adresinize gönderilmiştir. Detaylı bilgi ve ödeme dekontu iletimi için bu hat üzerinden bize ulaşabilirsiniz.

🏢 *${l}*${s?`
📞 İletişim: ${s}`:""}`;else if(r==="diagnosis_approval"){let i="";"customerComplaint"in t&&(i=t.customerComplaint),"customerProblemDescription"in t&&(i=t.customerProblemDescription),b=`Sayın *${t.contactName}*,

*${n.title}* için teknik ekibimiz tarafından arıza tespiti ve ekspertiz çalışması tamamlanmıştır. 🔍

📋 *Servis No:* *${t.serviceNo}*
${i?`⚠️ *Mevcut Şikayet:* ${i}
`:""}${n.partsList?`
🔩 *Gereken Yedek Parçalar:*
${n.partsList}
`:""}${n.laborList?`
🛠️ *Planlanan İşçilik:*
${n.laborList}
`:""}
💰 *Tahmini Toplam Maliyet:* *${a}* (KDV Dahil)

Onarım işlemlerine başlamamız için bu mesajı *"ONAYLIYORUM"* yazarak yanıtlayabilir veya servis danışmanımızla iletişime geçebilirsiniz.

🏢 *${l}*${s?`
📞 İletişim: ${s}`:""}`}else r==="reception"&&(b=`Sayın *${t.contactName}*,

*${n.title}* servis kabul ve kayıt işlemleri başarıyla tamamlanmıştır. 📝

📋 *Servis Takip No:* *${t.serviceNo}*
📅 *Kayıt Tarihi:* ${t.entryDate}

Teknik ekibimiz en kısa sürede teşhis ve inceleme çalışmalarına başlayacak olup durum hakkında tarafınıza bilgi verilecektir.

🏢 *${l}*${s?`
📞 İletişim: ${s}`:""}`);y(b)},[r,t,c,n,h,p]),!$||!t)return null;const x=(l=>{let s=l.replace(/[^0-9]/g,"");return s.startsWith("0")?s="90"+s.substring(1):!s.startsWith("90")&&s.length===10&&(s="90"+s),s})(A),P=async()=>{try{await navigator.clipboard.writeText(m),w(!0),setTimeout(()=>w(!1),2500)}catch{w(!1)}},[I,B]=o.useState(null),[v,C]=o.useState(!1);o.useEffect(()=>{$&&J().then(B).catch(()=>{})},[$]);const E=async()=>{if(!x||!m.trim()){S("Lütfen geçerli bir telefon numarası ve mesaj girin.","WhatsApp Form Uyarısı","Telefon / Mesaj");return}C(!0);try{const l=await Z(x,m,t?`${t.contactName} (${t.serviceNo})`:"Servis Müşterisi");l.success?u():S(`WhatsApp doğrudan gönderim hatası: ${l.error||"Bilinmeyen hata"}. Dilerseniz 'WhatsApp'ta Aç ve Gönder' seçeneğini kullanabilirsiniz.`,"WhatsApp İletim Hatası")}catch(l){S("Hata: "+l.message,"WhatsApp Hatası")}finally{C(!1)}},W=()=>{const l=encodeURIComponent(m),s=N?`https://web.whatsapp.com/send?phone=${x}&text=${l}`:`https://wa.me/${x}?text=${l}`;window.open(s,"_blank","noopener,noreferrer")},z=l=>{y(s=>s+" "+l)};return e.jsx(K,{title:"WhatsApp Müşteri Bilgilendirme",subtitle:`${t.contactName} • ${n.title} • Servis No: ${t.serviceNo}`,breadcrumbs:[{label:"Teknik Servis",onClick:u},{label:t.serviceNo,onClick:u},{label:"WhatsApp Bildirimi",active:!0}],onBack:u,statusBadge:e.jsx("span",{className:"bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold px-3 py-1 rounded-xl",children:"WHATSAPP ENTEGRASYONU"}),headerIcon:e.jsx(L,{className:"w-5 h-5 text-emerald-600"}),actions:e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx("button",{type:"button",onClick:u,className:"px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer",children:"Vazgeç"}),e.jsxs("button",{type:"button",onClick:W,disabled:!x||!m.trim(),className:"px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5 active:scale-95",children:[e.jsx(D,{className:"w-4 h-4"}),e.jsx("span",{children:"WhatsApp ile Gönder"})]})]}),children:e.jsxs("div",{className:"bg-white rounded-3xl shadow-sm border border-emerald-200/80 w-full max-w-3xl mx-auto flex flex-col overflow-hidden",children:[e.jsxs("div",{className:"p-6 overflow-y-auto space-y-5 bg-slate-50/50 flex-1",children:[e.jsxs("div",{children:[e.jsxs("label",{className:"block text-xs font-black text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5",children:[e.jsx(G,{className:"w-4 h-4 text-emerald-600"}),"Mesaj Şablonu Seçin:"]}),e.jsxs("div",{className:"grid grid-cols-2 sm:grid-cols-4 gap-2.5",children:[e.jsxs("button",{type:"button",onClick:()=>d("completed"),className:`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${r==="completed"?"bg-emerald-50 border-emerald-500 text-emerald-950 ring-2 ring-emerald-500/20 shadow-xs":"bg-white border-slate-200 text-slate-700 hover:bg-slate-50"}`,children:[e.jsxs("div",{className:"flex items-center justify-between mb-1.5",children:[e.jsx(X,{className:`w-5 h-5 ${r==="completed"?"text-emerald-600":"text-slate-400"}`}),e.jsx("span",{className:"text-[10px] font-black uppercase px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800",children:"Önerilen"})]}),e.jsxs("div",{children:[e.jsx("div",{className:"text-xs font-bold",children:"Servis Tamamlandı"}),e.jsx("div",{className:"text-[10px] text-slate-500 font-medium leading-tight",children:"Teslime hazır bilgisi"})]})]}),e.jsxs("button",{type:"button",onClick:()=>d("invoiced"),className:`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${r==="invoiced"?"bg-purple-50 border-purple-500 text-purple-950 ring-2 ring-purple-500/20 shadow-xs":"bg-white border-slate-200 text-slate-700 hover:bg-slate-50"}`,children:[e.jsxs("div",{className:"flex items-center justify-between mb-1.5",children:[e.jsx(_,{className:`w-5 h-5 ${r==="invoiced"?"text-purple-600":"text-slate-400"}`}),(t.invoiceNumber||t.invoiceId||h)&&e.jsx("span",{className:"text-[10px] font-black uppercase px-1.5 py-0.5 rounded bg-purple-100 text-purple-800",children:"Faturalı"})]}),e.jsxs("div",{children:[e.jsx("div",{className:"text-xs font-bold",children:"Fatura & Ödeme"}),e.jsx("div",{className:"text-[10px] text-slate-500 font-medium leading-tight",children:"Fatura no & IBAN bildirimi"})]})]}),e.jsxs("button",{type:"button",onClick:()=>d("diagnosis_approval"),className:`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${r==="diagnosis_approval"?"bg-amber-50 border-amber-500 text-amber-950 ring-2 ring-amber-500/20 shadow-xs":"bg-white border-slate-200 text-slate-700 hover:bg-slate-50"}`,children:[e.jsx("div",{className:"flex items-center justify-between mb-1.5",children:e.jsx(U,{className:`w-5 h-5 ${r==="diagnosis_approval"?"text-amber-600":"text-slate-400"}`})}),e.jsxs("div",{children:[e.jsx("div",{className:"text-xs font-bold",children:"Teşhis & Fiyat Onayı"}),e.jsx("div",{className:"text-[10px] text-slate-500 font-medium leading-tight",children:"Parça & maliyet onayı"})]})]}),e.jsxs("button",{type:"button",onClick:()=>d("reception"),className:`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${r==="reception"?"bg-blue-50 border-blue-500 text-blue-950 ring-2 ring-blue-500/20 shadow-xs":"bg-white border-slate-200 text-slate-700 hover:bg-slate-50"}`,children:[e.jsx("div",{className:"flex items-center justify-between mb-1.5",children:e.jsx(R,{className:`w-5 h-5 ${r==="reception"?"text-blue-600":"text-slate-400"}`})}),e.jsxs("div",{children:[e.jsx("div",{className:"text-xs font-bold",children:"Kayıt & Kabul"}),e.jsx("div",{className:"text-[10px] text-slate-500 font-medium leading-tight",children:"Giriş / Randevu teyidi"})]})]})]})]}),e.jsxs("div",{className:"grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs",children:[e.jsxs("div",{children:[e.jsxs("label",{className:"block text-xs font-extrabold text-slate-700 mb-1 flex items-center gap-1.5",children:[e.jsx(Y,{className:"w-3.5 h-3.5 text-slate-500"}),"Alıcı Cari Hesap / Müşteri:"]}),e.jsx("div",{className:"text-sm font-bold text-slate-900 px-3 py-2 bg-slate-50 rounded-xl border border-slate-200",children:t.contactName})]}),e.jsxs("div",{children:[e.jsxs("label",{className:"block text-xs font-extrabold text-slate-700 mb-1 flex items-center gap-1.5",children:[e.jsx(H,{className:"w-3.5 h-3.5 text-emerald-600"}),"WhatsApp Telefon Numarası:"]}),e.jsxs("div",{className:"relative",children:[e.jsx("input",{type:"text",value:A,onChange:l=>T(l.target.value),placeholder:"05XX XXX XX XX",className:"w-full px-3 py-2 font-mono text-sm font-bold text-slate-900 bg-white rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none"}),e.jsxs("span",{className:"absolute right-3 top-2.5 text-[11px] font-bold text-emerald-700",children:["+",x||"90"]})]})]})]}),e.jsxs("div",{className:"space-y-2",children:[e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsxs("label",{className:"text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5",children:[e.jsx(L,{className:"w-4 h-4 text-emerald-600"}),"WhatsApp Mesaj Taslağı:"]}),e.jsxs("div",{className:"flex items-center gap-1.5 overflow-x-auto text-[11px]",children:[e.jsx("span",{className:"text-slate-400 font-bold hidden sm:inline",children:"Ekle:"}),e.jsx("button",{type:"button",onClick:()=>z(t.serviceNo),className:"px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-[10px] font-bold cursor-pointer",children:"+ServisNo"}),e.jsx("button",{type:"button",onClick:()=>z(`₺${(t.grandTotal||0).toLocaleString("tr-TR",{minimumFractionDigits:2,maximumFractionDigits:2})}`),className:"px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-[10px] font-bold cursor-pointer",children:"+Tutar"}),p?.defaultBankIban&&e.jsx("button",{type:"button",onClick:()=>z(`IBAN: ${p.defaultBankIban}`),className:"px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-[10px] font-bold cursor-pointer",children:"+IBAN"})]})]}),e.jsxs("div",{className:"relative rounded-2xl border border-emerald-200 overflow-hidden shadow-sm bg-[#EFEAE2]",children:[e.jsxs("div",{className:"bg-[#075E54] text-white px-4 py-2 flex items-center justify-between text-xs font-bold",children:[e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx(Q,{className:"w-4 h-4 text-emerald-300"}),e.jsx("span",{children:"WhatsApp İleti Önizlemesi"})]}),e.jsxs("span",{className:"text-[10px] text-emerald-200 font-mono",children:[m.length," karakter • ",m.split(/\s+/).filter(Boolean).length," kelime"]})]}),e.jsx("div",{className:"p-4",children:e.jsxs("div",{className:"bg-white rounded-2xl p-3 shadow-md border border-emerald-100 relative",children:[e.jsx("textarea",{rows:9,value:m,onChange:l=>y(l.target.value),className:"w-full text-xs sm:text-sm font-sans text-slate-800 bg-transparent border-0 focus:ring-0 focus:outline-none resize-y leading-relaxed font-normal",placeholder:"Mesaj metnini buraya yazın..."}),e.jsxs("div",{className:"flex items-center justify-end gap-1.5 pt-2 border-t border-slate-100 text-[10px] text-slate-400 font-medium",children:[e.jsx("span",{children:new Date().toLocaleTimeString("tr-TR",{hour:"2-digit",minute:"2-digit"})}),e.jsx("span",{className:"text-emerald-600 font-black",children:"✓✓"})]})]})})]})]}),e.jsxs("div",{className:"flex items-center justify-between px-3 py-2 bg-emerald-50/70 rounded-xl border border-emerald-200/60 text-xs",children:[e.jsxs("div",{className:"flex items-center gap-2 text-emerald-950 font-medium",children:[e.jsx(ee,{className:"w-4 h-4 text-emerald-600 shrink-0"}),e.jsx("span",{children:N?"Tarayıcı sekmesinde WhatsApp Web açılacaktır.":"Cihazınızdaki WhatsApp masaüstü/mobil uygulaması açılacaktır."})]}),e.jsx("button",{type:"button",onClick:()=>M(!N),className:"text-xs font-bold text-emerald-700 hover:text-emerald-900 underline cursor-pointer",children:N?"Uygulama Moduna Geç":"WhatsApp Web Moduna Geç"})]})]}),e.jsxs("div",{className:"px-6 py-4 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0",children:[e.jsxs("div",{className:"flex items-center gap-2 w-full sm:w-auto",children:[e.jsxs("button",{type:"button",onClick:P,className:`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border font-bold text-xs transition-all cursor-pointer w-full sm:w-auto ${k?"bg-emerald-100 border-emerald-400 text-emerald-800":"bg-slate-50 hover:bg-slate-100 border-slate-300 text-slate-700"}`,children:[k?e.jsx(O,{className:"w-4 h-4 text-emerald-700"}):e.jsx(q,{className:"w-4 h-4"}),e.jsx("span",{children:k?"Mesaj Kopyalandı!":"Metni Kopyala"})]}),e.jsx("button",{type:"button",onClick:u,className:"px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold text-xs transition-all cursor-pointer",children:"Kapat"})]}),e.jsxs("div",{className:"flex flex-wrap items-center gap-2 w-full sm:w-auto",children:[I?.status==="connected"&&e.jsxs("button",{type:"button",onClick:E,disabled:v||!x||!m.trim(),className:"w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold text-xs shadow-md shadow-emerald-600/25 active:scale-95 transition-all cursor-pointer",children:[e.jsx(D,{className:`w-4 h-4 ${v?"animate-spin":""}`}),e.jsx("span",{children:v?"İletiliyor...":"🟢 Doğrudan WhatsApp ile Gönder"})]}),e.jsxs("button",{type:"button",onClick:W,disabled:!x||!m.trim(),className:"w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white font-bold text-xs shadow-md active:scale-95 transition-all cursor-pointer",children:[e.jsx(V,{className:"w-3.5 h-3.5"}),e.jsx("span",{children:"WhatsApp Web'de Aç"})]})]})]})]})})};export{me as S};
