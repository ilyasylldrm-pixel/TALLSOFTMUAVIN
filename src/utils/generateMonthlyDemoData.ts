import {
  Contact,
  Invoice,
  Account,
  Transaction,
  Product,
  Quote,
  Cheque,
  PromissoryNote,
  LeaveRequest,
  AdvanceRequest,
  InvoiceItem
} from "../types";

// Base Demo Accounts
export const demoAccounts: Account[] = [
  {
    id: "acc_cash_tl",
    name: "Merkez TL Kasası",
    type: "cash",
    currency: "TRY",
    balance: 145000,
    isDefault: true,
  },
  {
    id: "acc_bank_garanti",
    name: "Garanti BBVA - Ticari TL Hesabı",
    type: "bank",
    currency: "TRY",
    balance: 1250000,
    bankName: "Garanti BBVA",
    accountNumber: "1029384",
    iban: "TR33 0006 2000 0000 0012 3456 78",
    isDefault: false,
  },
  {
    id: "acc_bank_isbank",
    name: "İş Bankası - Ana Hesap TL",
    type: "bank",
    currency: "TRY",
    balance: 680000,
    bankName: "Türkiye İş Bankası",
    accountNumber: "8472910",
    iban: "TR64 0006 4000 0001 8472 9100 01",
    isDefault: false,
  },
  {
    id: "acc_bank_usd",
    name: "Ziraat Bankası - USD Döviz Hesabı",
    type: "bank",
    currency: "USD",
    balance: 52000,
    bankName: "Ziraat Bankası",
    iban: "TR12 0001 0000 0000 9988 7766 55",
  },
  {
    id: "acc_pos_garanti",
    name: "Garanti Sanal POS Hesabı",
    type: "credit_card",
    currency: "TRY",
    balance: 240000,
    bankName: "Garanti BBVA Sanal POS",
  }
];

const monthInfo = [
  { num: "01", name: "Ocak", days: 31, prefix: "OCAK" },
  { num: "02", name: "Şubat", days: 28, prefix: "SUBAT" },
  { num: "03", name: "Mart", days: 31, prefix: "MART" },
  { num: "04", name: "Nisan", days: 30, prefix: "NISAN" },
  { num: "05", name: "Mayıs", days: 31, prefix: "MAYIS" },
  { num: "06", name: "Haziran", days: 30, prefix: "HAZIRAN" },
  { num: "07", name: "Temmuz", days: 31, prefix: "TEMMUZ" },
  { num: "08", name: "Ağustos", days: 31, prefix: "AGUSTOS" },
  { num: "09", name: "Eylül", days: 30, prefix: "EYLUL" },
  { num: "10", name: "Ekim", days: 31, prefix: "EKIM" },
  { num: "11", name: "Kasım", days: 30, prefix: "KASIM" },
  { num: "12", name: "Aralık", days: 31, prefix: "ARALIK" },
];

const citiesAndDistricts = [
  { city: "İstanbul", district: "Şişli", taxOffice: "Mecidiyeköy V.D." },
  { city: "İstanbul", district: "Kadıköy", taxOffice: "Erenköy V.D." },
  { city: "İstanbul", district: "Maslak", taxOffice: "Maslak V.D." },
  { city: "Ankara", district: "Çankaya", taxOffice: "Kavaklıdere V.D." },
  { city: "Ankara", district: "Yenimahalle", taxOffice: "Ostim V.D." },
  { city: "İzmir", district: "Konak", taxOffice: "Konak V.D." },
  { city: "İzmir", district: "Karşıyaka", taxOffice: "Karşıyaka V.D." },
  { city: "Bursa", district: "Nilüfer", taxOffice: "Nilüfer V.D." },
  { city: "Kocaeli", district: "Gebze", taxOffice: "Uluçınar V.D." },
  { city: "Antalya", district: "Muratpaşa", taxOffice: "Üçkapılar V.D." },
  { city: "Adana", district: "Seyhan", taxOffice: "Seyhan V.D." },
  { city: "Gaziantep", district: "Şehitkamil", taxOffice: "Gazikent V.D." }
];

const companyTypePrefixes = [
  "Teknoloji & Yazılım",
  "Lojistik & Depolama",
  "Endüstriyel Otomasyon",
  "Elektronik & Donanım",
  "Enerji & İnşaat",
  "Gıda & Ambalaj",
  "İletişim & Medya",
  "Makine & Metal Sanayi",
  "Saha Servis & Danışmanlık",
  "Perakende Mağazacılık"
];

// Helper to generate 1,200 Contacts (100 per month)
function generate1200UniqueContacts(): { allContacts: Contact[]; monthlyContactMap: Record<string, Contact[]> } {
  const allContacts: Contact[] = [];
  const monthlyContactMap: Record<string, Contact[]> = {};

  monthInfo.forEach((m, mIndex) => {
    monthlyContactMap[m.num] = [];

    for (let i = 1; i <= 100; i++) {
      const padIdx = i < 10 ? `00${i}` : i < 100 ? `0${i}` : `${i}`;
      const loc = citiesAndDistricts[(i + mIndex) % citiesAndDistricts.length];
      const sector = companyTypePrefixes[(i + mIndex) % companyTypePrefixes.length];
      
      const isCustomer = i % 3 !== 0; // 66% customer, 33% vendor
      const contactType: Contact["contactType"] = isCustomer ? "customer" : "vendor";

      const companyTitle = `${m.name} ${sector} Sanayi ve Ticaret ${i % 2 === 0 ? "A.Ş." : "Ltd. Şti."}`;
      const name = `${m.prefix}-${padIdx} ${companyTitle}`;
      const taxNumber = `${8000000000 + mIndex * 1000 + i}`;
      const phone = `0${loc.city === "İstanbul" ? "212" : loc.city === "Ankara" ? "312" : "232"} ${300 + (i % 50)} ${10 + (i % 80)} ${20 + (i % 70)}`;
      const email = `finans.${m.prefix.toLowerCase()}${padIdx}@${sector.toLowerCase().replace(/[^a-z0-0]/g, "")}.com.tr`;
      
      // Calculate realistic balances
      const isReceivable = isCustomer;
      const rawBal = (i * 1250) + (mIndex * 3500);
      const balance = isReceivable ? rawBal : -rawBal;

      const accountCode = `${contactType === "vendor" ? "320" : "120"}.${taxNumber}`;

      const contact: Contact = {
        id: `c_${m.num}_${padIdx}`,
        accountCode,
        name,
        companyTitle,
        contactType,
        taxOffice: loc.taxOffice,
        taxNumber,
        phone,
        email,
        city: loc.city,
        district: loc.district,
        address: `${loc.district} Organize Sanayi Bölgesi ${i}. Sokak No:${(i % 45) + 1} ${loc.city}`,
        balance,
        balanceType: balance > 0 ? "receivable" : balance < 0 ? "payable" : "balanced",
        createdAt: `2026-${m.num}-01`,
      };

      allContacts.push(contact);
      monthlyContactMap[m.num].push(contact);
    }
  });

  return { allContacts, monthlyContactMap };
}

// Helper to generate 1,200 Stock Items (100 per month)
function generate1200UniqueStockItems(): { allProducts: Product[]; monthlyProductMap: Record<string, Product[]> } {
  const itemTemplates = [
    { baseName: "Dell PowerEdge Sunucu", unit: "Adet", category: "Donanım & Sunucu", type: "Ticari Mal", baseBuy: 28000 },
    { baseName: "HP ProLiant Rack Server", unit: "Adet", category: "Donanım & Sunucu", type: "Ticari Mal", baseBuy: 32000 },
    { baseName: "Lenovo ThinkSystem Workstation", unit: "Adet", category: "Donanım & Sunucu", type: "Ticari Mal", baseBuy: 18000 },
    { baseName: "Muavin ERP Kurumsal Lisans", unit: "Adet", category: "Yazılım Lisansları", type: "Ticari Mal", baseBuy: 5500 },
    { baseName: "Microsoft 365 Yıllık İş Paketi", unit: "Kullanıcı", category: "Yazılım Lisansları", type: "Ticari Mal", baseBuy: 1500 },
    { baseName: "Fortinet FortiGate Firewall", unit: "Adet", category: "Ağ & Güvenlik", type: "Ticari Mal", baseBuy: 12500 },
    { baseName: "Cisco Catalyst 24 Port Switch", unit: "Adet", category: "Ağ & Güvenlik", type: "Ticari Mal", baseBuy: 8200 },
    { baseName: "Aruba Wireless Access Point", unit: "Adet", category: "Ağ & Güvenlik", type: "Ticari Mal", baseBuy: 4400 },
    { baseName: "Zebra ZT230 Barkod Yazıcı", unit: "Adet", category: "POS & Barkod Ekipmanları", type: "Ticari Mal", baseBuy: 5200 },
    { baseName: "Honeywell El Terminali Android", unit: "Adet", category: "POS & Barkod Ekipmanları", type: "Ticari Mal", baseBuy: 7800 },
    { baseName: "Datalogic Karekod Barkod Okuyucu", unit: "Adet", category: "POS & Barkod Ekipmanları", type: "Ticari Mal", baseBuy: 2900 },
    { baseName: "Siemens S7-1200 PLC Modülü", unit: "Adet", category: "Otomasyon & Elektrik", type: "Ticari Mal", baseBuy: 9500 },
    { baseName: "Schneider Elektrik Şalter Panosu", unit: "Set", category: "Otomasyon & Elektrik", type: "Ticari Mal", baseBuy: 11200 },
    { baseName: "Samsung 32 Inç Curved Monitör", unit: "Adet", category: "Ofis Teknolojileri", type: "Ticari Mal", baseBuy: 3800 },
    { baseName: "Logitech MX Master 3S Kablosuz Mouse", unit: "Adet", category: "Ofis Teknolojileri", type: "Ticari Mal", baseBuy: 1400 },
    { baseName: "APC 3KVA Online UPS Güç Kaynağı", unit: "Adet", category: "Ofis Teknolojileri", type: "Ticari Mal", baseBuy: 8800 },
    { baseName: "Kingston 64GB DDR5 Server RAM", unit: "Adet", category: "Yedek Parça & Depolama", type: "Ticari Mal", baseBuy: 2200 },
    { baseName: "Samsung 2TB NVMe M.2 SSD Enterprise", unit: "Adet", category: "Yedek Parça & Depolama", type: "Ticari Mal", baseBuy: 3100 },
    { baseName: "Seagate Exos 16TB Enterprise HDD", unit: "Adet", category: "Yedek Parça & Depolama", type: "Ticari Mal", baseBuy: 4800 },
    { baseName: "Yazılım Geliştirme Danışmanlığı", unit: "Saat", category: "Danışmanlık & Hizmet", type: "Hizmet", baseBuy: 1500 },
  ];

  const allProducts: Product[] = [];
  const monthlyProductMap: Record<string, Product[]> = {};

  monthInfo.forEach((m) => {
    monthlyProductMap[m.num] = [];

    for (let i = 1; i <= 100; i++) {
      const padIdx = i < 10 ? `00${i}` : i < 100 ? `0${i}` : `${i}`;
      const template = itemTemplates[(i - 1) % itemTemplates.length];
      const variantNumber = Math.floor((i - 1) / itemTemplates.length) + 1;

      const code = `STK-${m.prefix}-${padIdx}`;
      const name = `${m.name} - ${template.baseName} Modül-V${variantNumber} (#${padIdx})`;
      const buyPrice = template.baseBuy + (i * 35);
      const sellPrice = Math.round(buyPrice * 1.38);
      const barcode = `869${m.num}2026${padIdx}`;
      const serial = `SN-2026${m.num}-${padIdx}`;

      const totalQty = 150 + (i * 4);
      const gebzeQty = Math.floor(totalQty * 0.5);
      const ikitelliQty = Math.floor(totalQty * 0.3);
      const ankaraQty = totalQty - gebzeQty - ikitelliQty;

      const whId = i % 3 === 0 ? "wh_1" : i % 3 === 1 ? "wh_2" : "wh_3";
      const whName = whId === "wh_1" ? "Gebze Lojistik & Ana Depo" : whId === "wh_2" ? "İkitelli Yedek Parça Deposu" : "Ankara Lojistik Transit Depo";

      const product: Product = {
        id: `p_${m.num}_${padIdx}`,
        code,
        name,
        unit: template.unit,
        buyPrice,
        sellPrice,
        vatRate: 20,
        stockQuantity: totalQty,
        minStockAlert: 15,
        category: template.category,
        stockType: template.type,
        barcode,
        imeiOrSerialNo: serial,
        warehouseId: whId,
        warehouseName: whName,
        warehouseQuantities: {
          wh_1: gebzeQty,
          wh_2: ikitelliQty,
          wh_3: ankaraQty,
        },
      };

      allProducts.push(product);
      monthlyProductMap[m.num].push(product);
    }
  });

  return { allProducts, monthlyProductMap };
}

// Function to generate full monthly integrated data with 100 UNIQUE contacts & 100 UNIQUE stock items per month
export function generateMonthlyIntegratedData() {
  const { allContacts, monthlyContactMap } = generate1200UniqueContacts();
  const { allProducts, monthlyProductMap } = generate1200UniqueStockItems();

  const invoices: Invoice[] = [];
  const transactions: Transaction[] = [];
  const quotes: Quote[] = [];
  const cheques: Cheque[] = [];
  const promissoryNotes: PromissoryNote[] = [];
  const leaveRequests: LeaveRequest[] = [];
  const advanceRequests: AdvanceRequest[] = [];

  let invCounter = 1000;
  let txCounter = 2000;
  let qCounter = 500;
  let chqCounter = 700;
  let noteCounter = 800;

  const categoriesExpense = [
    "Ofis Kirası",
    "Elektrik & Su & Doğalgaz",
    "Personel Maaş & SGK",
    "Yazılım & Sunucu Giderleri",
    "Yemek & Mutfak Gideri",
    "Pazarlama & Reklam",
    "Kargo & Lojistik",
    "Abonelikler & Lisanslar",
    "Temsil & Ağırlama",
    "Saha Servis Giderleri"
  ];

  const categoriesIncome = [
    "Yazılım Satış Geliri",
    "Danışmanlık Geliri",
    "Donanım Satış Geliri",
    "Aylık Bakım Geliri",
    "Sistem Altyapı Desteği",
    "E-Dönüşüm Hizmet Bedeli"
  ];

  monthInfo.forEach((m) => {
    const yearMonth = `2026-${m.num}`;

    // Month m has 100 DISTINCT products and 100 DISTINCT contacts
    const productsForThisMonth = monthlyProductMap[m.num];
    const contactsForThisMonth = monthlyContactMap[m.num];

    // Distribute 100 distinct items into 25 invoices per month (4 unique items per invoice)
    const invoicesInMonth = 25;
    const itemsPerInvoice = 4;

    for (let invIdx = 0; invIdx < invoicesInMonth; invIdx++) {
      invCounter++;
      const day = Math.min(m.days, Math.floor(((invIdx + 1) / invoicesInMonth) * m.days));
      const dayStr = day < 10 ? `0${day}` : `${day}`;
      const issueDate = `${yearMonth}-${dayStr}`;

      const dueDay = Math.min(m.days, day + 15);
      const dueDayStr = dueDay < 10 ? `0${dueDay}` : `${dueDay}`;
      const dueDate = `${yearMonth}-${dueDayStr}`;

      const isSales = invIdx % 4 !== 0; // 75% Sales, 25% Purchase
      // Use contact from this month's 100 contacts!
      const contact = contactsForThisMonth[(invIdx * 4) % contactsForThisMonth.length];

      const items: InvoiceItem[] = [];

      for (let k = 0; k < itemsPerInvoice; k++) {
        const productIndex = invIdx * itemsPerInvoice + k;
        const prod = productsForThisMonth[productIndex];

        const qty = (k % 4) + 1;
        const price = isSales ? prod.sellPrice : prod.buyPrice;
        const totalWithoutVat = qty * price;
        const vatAmount = (totalWithoutVat * prod.vatRate) / 100;
        const totalWithVat = totalWithoutVat + vatAmount;

        items.push({
          id: `item_${m.num}_${invCounter}_${k}`,
          productId: prod.id,
          description: `${prod.name} (${prod.code})`,
          quantity: qty,
          unit: prod.unit,
          unitPrice: price,
          vatRate: prod.vatRate,
          totalWithoutVat,
          vatAmount,
          totalWithVat,
        });
      }

      const subtotal = items.reduce((s, x) => s + x.totalWithoutVat, 0);
      const totalVat = items.reduce((s, x) => s + x.vatAmount, 0);
      const grandTotal = subtotal + totalVat;

      const status: Invoice["status"] = "paid";
      const paidAmount = grandTotal;
      const remainingAmount = 0;

      const inv: Invoice = {
        id: `inv_${invCounter}`,
        invoiceNumber: isSales
          ? `MUV2026${m.num}${invCounter.toString().slice(-4)}`
          : `TED2026${m.num}${invCounter.toString().slice(-4)}`,
        type: isSales ? "sales" : "purchase",
        contactId: contact.id,
        contactName: contact.name,
        taxNumber: contact.taxNumber || "1234567890",
        issueDate,
        dueDate,
        items,
        subtotal,
        totalVat,
        grandTotal,
        paidAmount,
        remainingAmount,
        status,
        currency: "TRY",
        notes: isSales
          ? `Sayın ${contact.name}, ${m.name} 2026 dönemi stok teslim ve hizmet faturasıdır (${items.length} kalem).`
          : `${m.name} 2026 dönemi tedarikçi mal alım faturası (${items.length} kalem).`,
        createdAt: issueDate,
      };

      invoices.push(inv);

      // Financial Transaction linked to paid/partial invoice
      if (paidAmount > 0) {
        txCounter++;
        const acc = demoAccounts[invIdx % demoAccounts.length];
        transactions.push({
          id: `tx_${txCounter}`,
          date: issueDate,
          type: isSales ? "income" : "expense",
          amount: paidAmount,
          currency: "TRY",
          accountId: acc.id,
          accountName: acc.name,
          contactId: contact.id,
          contactName: contact.name,
          invoiceId: inv.id,
          invoiceNumber: inv.invoiceNumber,
          category: isSales ? "Yazılım & Stok Satış Tahsilatı" : "Tedarikçi Mal Alım Ödemesi",
          description: `${inv.invoiceNumber} nolu ${items.length} kalemli faturanın ${isSales ? "tahsilatı" : "ödemesi"} (${acc.name})`,
          documentNo: `DEK-${m.num}-${txCounter}`,
        });
      }
    }

    // Inter-contact transfers (Cariler Arası Virman) integrated into demo data for each month!
    for (let v = 0; v < 3; v++) {
      txCounter++;
      const day = Math.min(m.days, (v + 1) * 8);
      const dayStr = day < 10 ? `0${day}` : `${day}`;
      const vDate = `${yearMonth}-${dayStr}`;

      const cSource = contactsForThisMonth[v * 10];
      const cTarget = contactsForThisMonth[v * 10 + 1];
      const vAmount = 15000 + (v * 5000);

      transactions.push({
        id: `tx_virman_${m.num}_${v}`,
        date: vDate,
        type: "collection",
        amount: vAmount,
        currency: "TRY",
        accountId: demoAccounts[0].id,
        accountName: `Cari Virman (${cSource.name} -> ${cTarget.name})`,
        contactId: cSource.id,
        contactName: cSource.name,
        category: "Cariler Arası Virman",
        description: `Cariler Arası Virman Transferi: Borç Virmanı ${cSource.name} -> ${cTarget.name}`,
        documentNo: `VRM-${m.num}-00${v + 1}`,
      });
    }

    // Additional general monthly operational transactions
    for (let t = 1; t <= 15; t++) {
      txCounter++;
      const day = Math.min(m.days, Math.floor((t / 15) * m.days));
      const dayStr = day < 10 ? `0${day}` : `${day}`;
      const txDate = `${yearMonth}-${dayStr}`;

      const isIncome = t % 3 === 0;
      const acc = demoAccounts[t % demoAccounts.length];
      const category = isIncome
        ? categoriesIncome[t % categoriesIncome.length]
        : categoriesExpense[t % categoriesExpense.length];

      const amount = isIncome
        ? 22000 + (t * 1800)
        : 4500 + (t * 1100);

      const contact = contactsForThisMonth[t % contactsForThisMonth.length];

      transactions.push({
        id: `tx_${txCounter}`,
        date: txDate,
        type: isIncome ? "income" : "expense",
        amount,
        currency: "TRY",
        accountId: acc.id,
        accountName: acc.name,
        contactId: contact.id,
        contactName: contact.name,
        category,
        description: `${m.name} 2026 - ${category} işlemi (${contact.name})`,
        documentNo: `FIS-${m.num}-${txCounter}`,
      });
    }

    // Quotes for Month m
    for (let q = 1; q <= 6; q++) {
      qCounter++;
      const day = Math.min(m.days, Math.floor((q / 6) * m.days));
      const dayStr = day < 10 ? `0${day}` : `${day}`;
      const issueDate = `${yearMonth}-${dayStr}`;
      const validUntil = `${yearMonth}-${m.days}`;

      const contact = contactsForThisMonth[q * 5];
      const prod = productsForThisMonth[q * 12];
      const qty = (q % 5) + 1;
      const totalWithoutVat = qty * prod.sellPrice;
      const vatAmount = (totalWithoutVat * prod.vatRate) / 100;
      const totalWithVat = totalWithoutVat + vatAmount;

      quotes.push({
        id: `q_${qCounter}`,
        quoteNumber: `TEK2026${m.num}${qCounter.toString().slice(-3)}`,
        contactId: contact.id,
        contactName: contact.name,
        issueDate,
        validUntil,
        items: [
          {
            id: `qi_${qCounter}`,
            productId: prod.id,
            description: `${prod.name} - ${m.name} Dönemi Kurumsal Teklifi`,
            quantity: qty,
            unit: prod.unit,
            unitPrice: prod.sellPrice,
            vatRate: prod.vatRate,
            totalWithoutVat,
            vatAmount,
            totalWithVat,
          },
        ],
        grandTotal: totalWithVat,
        status: q % 3 === 0 ? "approved" : "sent",
        notes: `Teklif geçerlilik süresi 30 gündür. Stok tesliminde %50 peşin tahsil edilir.`,
      });
    }

    // Cheques & Promissory Notes for Month m
    for (let c = 1; c <= 4; c++) {
      chqCounter++;
      noteCounter++;
      const day = Math.min(m.days, Math.floor((c / 4) * m.days));
      const dayStr = day < 10 ? `0${day}` : `${day}`;
      const issueDate = `${yearMonth}-${dayStr}`;
      const dueDate = `2026-11-${c < 10 ? '0' + c : c}`;

      const contact = contactsForThisMonth[c * 8];

      cheques.push({
        id: `chq_${chqCounter}`,
        type: c % 2 === 0 ? "received" : "issued",
        chequeNumber: `CHK-2026-${m.num}-${chqCounter}`,
        bankName: c % 2 === 0 ? "Garanti BBVA" : "İş Bankası",
        branchName: "Levent Şubesi",
        drawerName: contact.companyTitle || contact.name,
        contactId: contact.id,
        contactName: contact.name,
        issueDate,
        dueDate,
        amount: 45000 + c * 7500,
        currency: "TRY",
        status: "portfolio",
        notes: `${m.name} 2026 dönemi teminat ve ödeme çeki`,
      });

      promissoryNotes.push({
        id: `note_${noteCounter}`,
        type: c % 2 === 0 ? "received" : "issued",
        noteNumber: `SNT-2026-${m.num}-${noteCounter}`,
        debtorName: contact.companyTitle || contact.name,
        contactId: contact.id,
        contactName: contact.name,
        issueDate,
        dueDate,
        amount: 25000 + c * 5000,
        currency: "TRY",
        status: "portfolio",
        notes: `${m.name} 2026 dönemi müşteri senedi`,
      });
    }

    // HR Requests
    leaveRequests.push({
      id: `lreq_${m.num}`,
      employeeId: "emp_1",
      employeeName: "Kaan Yılmaz",
      type: "Yıllık İzin",
      startDate: `${yearMonth}-10`,
      endDate: `${yearMonth}-14`,
      daysCount: 5,
      reason: `${m.name} dönemi yıllık izin kullanımı`,
      status: "approved",
      createdAt: `${yearMonth}-01`,
    });

    advanceRequests.push({
      id: `areq_${m.num}`,
      employeeId: "emp_2",
      employeeName: "Zeynep Arslan",
      type: "Avans",
      amount: 8500,
      requestDate: `${yearMonth}-15`,
      description: `${m.name} ayı avans talebi`,
      status: "approved",
      createdAt: `${yearMonth}-15`,
    });
  });

  // Generate 100 NEW Vendor Contacts, 100 NEW Customer Contacts & 100 NEW Stock Items
  const newVendorContacts = generate100NewContacts();
  const newCustomerContacts = generate100NewCustomerContacts();
  const newProducts = generate100NewStockItems();

  const combinedContacts = [...allContacts, ...newVendorContacts, ...newCustomerContacts];
  const combinedProducts = [...allProducts, ...newProducts];

  // Generate 1,000 NEW Purchase Invoices (Mal Alış Faturaları)
  const { purchaseInvoices, purchaseTransactions } = generate1000PurchaseInvoices(
    combinedContacts,
    combinedProducts,
    invCounter
  );

  invCounter += 1000;

  // Generate 1,000 NEW Sales Invoices (Mal Satış Faturaları)
  const { salesInvoices, salesTransactions } = generate1000SalesInvoices(
    combinedContacts,
    combinedProducts,
    invCounter
  );

  // Generate 200 NEW Customer Cheques (Alınan Çekler - Alacaklı Müşterilerden)
  const new200Cheques = generate200CustomerCheques(combinedContacts);

  // Generate 250 NEW Customer Promissory Notes (Alınan Senetler - Alacaklı Müşterilerden)
  const new250Notes = generate250CustomerPromissoryNotes(combinedContacts);

  // Generate 150 NEW Virman Transactions (Cariler Arası Virman Dekontu ile Tahsilat)
  const new150VirmanTxs = generate150VirmanTransactions(combinedContacts);

  const allInvoices = [...invoices, ...purchaseInvoices, ...salesInvoices];
  const allTransactions = [...transactions, ...purchaseTransactions, ...salesTransactions, ...new150VirmanTxs];
  const allCheques = [...cheques, ...new200Cheques];
  const allNotes = [...promissoryNotes, ...new250Notes];

  return {
    contacts: combinedContacts, // 1,400 UNIQUE CONTACTS
    products: combinedProducts, // 1,300 UNIQUE STOCK ITEMS
    accounts: demoAccounts,
    invoices: allInvoices, // 2,300 INVOICES (300 monthly + 1,000 purchase + 1,000 sales)
    transactions: allTransactions,
    quotes,
    cheques: allCheques, // 200+ CHEQUES
    promissoryNotes: allNotes, // 250+ PROMISSORY NOTES
    leaveRequests,
    advanceRequests,
  };
}

// Generator function for 100 NEW Contacts (Tedarikçi Carileri)
function generate100NewContacts(): Contact[] {
  const contacts: Contact[] = [];
  const vendorPrefixes = [
    "Endüstriyel Hammadde Sanayi",
    "Teknik Hırdavat & Malzeme",
    "Elektronik Komponent Dağıtım",
    "Lojistik & Ambalaj Hizmetleri",
    "Otomasyon & Makine Parçaları",
    "Yazılım & Donanım Tedarik",
    "Enerji & Kablo Sanayi",
    "Metal & İmalat Çözümleri",
    "Kimya & Plastik Hammadde",
    "Ofis & Kırtasiye Deposu"
  ];

  for (let i = 1; i <= 100; i++) {
    const pad = i < 10 ? `00${i}` : i < 100 ? `0${i}` : `${i}`;
    const loc = citiesAndDistricts[(i - 1) % citiesAndDistricts.length];
    const prefix = vendorPrefixes[(i - 1) % vendorPrefixes.length];
    const companyTitle = `YENİ-${pad} ${prefix} ${i % 2 === 0 ? "A.Ş." : "Ltd. Şti."}`;
    const name = `CARI-YENI-${pad} (${companyTitle})`;
    const taxNumber = `${9000000000 + i * 17}`;
    const accountCode = `320.${taxNumber}`;
    const balance = -(i * 1250 + 1500);

    contacts.push({
      id: `cnt_new_${pad}`,
      accountCode,
      name,
      companyTitle,
      contactType: "vendor",
      taxOffice: loc.taxOffice,
      taxNumber,
      phone: `0${loc.city === "İstanbul" ? "212" : loc.city === "Ankara" ? "312" : "232"} ${400 + (i % 50)} ${10 + (i % 60)} ${20 + (i % 70)}`,
      email: `tedarik.yeni${pad}@${prefix.toLowerCase().replace(/[^a-z0-9]/g, "")}.com.tr`,
      city: loc.city,
      district: loc.district,
      address: `${loc.district} Sanayi Sitesi ${i}. Blok No:${(i % 30) + 1} ${loc.city}`,
      balance,
      balanceType: "payable",
      createdAt: "2026-01-15",
    });
  }

  return contacts;
}

// Generator function for 100 NEW Stock Items (Stok Kartları)
function generate100NewStockItems(): Product[] {
  const products: Product[] = [];
  const templates = [
    { name: "Bosch Profesyonel Şarjlı Matkap Seti", unit: "Set", cat: "Donanım & El Aletleri", buy: 4800, sell: 6500 },
    { name: "Siemens Alçak Gerilim Şalter 100A", unit: "Adet", cat: "Otomasyon & Elektrik", buy: 3200, sell: 4500 },
    { name: "3M Endüstriyel Çift Taraflı Bant 50mm", unit: "Rulo", cat: "Ambalaj & Sarf", buy: 450, sell: 650 },
    { name: "Schneider Elektrik 3 Kutuplu Kontaktör", unit: "Adet", cat: "Otomasyon & Elektrik", buy: 1200, sell: 1750 },
    { name: "Philips LED Endüstriyel Aydınlatma Paneli 60W", unit: "Adet", cat: "Elektrik & Aydınlatma", buy: 850, sell: 1250 },
    { name: "Eaton 10KVA Online UPS Güç Depolama", unit: "Adet", cat: "Ofis & Altyapı", buy: 24500, sell: 32000 },
    { name: "Makita Kırıcı Delici Hilti 800W", unit: "Adet", cat: "Donanım & El Aletleri", buy: 5600, sell: 7800 },
    { name: "Festo Pnömatik Çift Etkili Silindir", unit: "Adet", cat: "Otomasyon & Elektrik", buy: 2100, sell: 2950 },
    { name: "Rittal Pano İklimlendirme Fanı 230V", unit: "Adet", cat: "Otomasyon & Elektrik", buy: 1750, sell: 2400 },
    { name: "Grundfos Santrifüj Su Pompası 2.2kW", unit: "Adet", cat: "Makine & Tesisat", buy: 14200, sell: 18900 },
  ];

  for (let i = 1; i <= 100; i++) {
    const pad = i < 10 ? `00${i}` : i < 100 ? `0${i}` : `${i}`;
    const tpl = templates[(i - 1) % templates.length];
    const variant = Math.floor((i - 1) / templates.length) + 1;
    const code = `STK-YENI-${pad}`;
    const name = `STOK-YENI-${pad} ${tpl.name} Modül-V${variant}`;
    const buyPrice = tpl.buy + (i * 35);
    const sellPrice = Math.round(buyPrice * 1.35);
    const totalQty = 120 + (i * 4);
    const whId = i % 3 === 0 ? "wh_1" : i % 3 === 1 ? "wh_2" : "wh_3";
    const whName = whId === "wh_1" ? "Gebze Lojistik & Ana Depo" : whId === "wh_2" ? "İkitelli Yedek Parça Deposu" : "Ankara Lojistik Transit Depo";

    products.push({
      id: `p_new_${pad}`,
      code,
      name,
      unit: tpl.unit,
      buyPrice,
      sellPrice,
      vatRate: 20,
      stockQuantity: totalQty,
      minStockAlert: 10,
      category: tpl.cat,
      stockType: "Ticari Mal",
      barcode: `8699000${pad}2026`,
      imeiOrSerialNo: `SN-YENI-2026-${pad}`,
      warehouseId: whId,
      warehouseName: whName,
      warehouseQuantities: {
        wh_1: Math.floor(totalQty * 0.5),
        wh_2: Math.floor(totalQty * 0.3),
        wh_3: totalQty - Math.floor(totalQty * 0.5) - Math.floor(totalQty * 0.3),
      },
    });
  }

  return products;
}

// Generator function for 1,000 NEW Purchase Invoices (Mal Alış Faturaları)
function generate1000PurchaseInvoices(
  contacts: Contact[],
  products: Product[],
  startInvCounter: number
): { purchaseInvoices: Invoice[]; purchaseTransactions: Transaction[] } {
  const purchaseInvoices: Invoice[] = [];
  const purchaseTransactions: Transaction[] = [];

  const supplierPool = contacts.filter((c) => c.contactType === "vendor" || c.id.startsWith("cnt_new_"));
  const vendors = supplierPool.length > 0 ? supplierPool : contacts;

  let invCounter = startInvCounter;
  let txCounter = 9000;

  for (let i = 1; i <= 1000; i++) {
    invCounter++;
    const pad = i < 10 ? `0000${i}` : i < 100 ? `000${i}` : i < 1000 ? `00${i}` : `0${i}`;
    
    // Spread evenly across 2026 months
    const monthIndex = (i - 1) % 12;
    const monthObj = monthInfo[monthIndex];
    const day = Math.min(monthObj.days, (i % monthObj.days) + 1);
    const dayStr = day < 10 ? `0${day}` : `${day}`;
    const issueDate = `2026-${monthObj.num}-${dayStr}`;
    const dueDay = Math.min(monthObj.days, day + 14);
    const dueDayStr = dueDay < 10 ? `0${dueDay}` : `${dueDay}`;
    const dueDate = `2026-${monthObj.num}-${dueDayStr}`;

    const contact = vendors[(i - 1) % vendors.length];
    const invoiceNumber = `ALIS2026${monthObj.num}${pad.slice(-4)}`;

    const itemCount = (i % 3) + 2; // 2 to 4 items per invoice
    const items: InvoiceItem[] = [];

    for (let k = 0; k < itemCount; k++) {
      const prod = products[(i * 4 + k) % products.length];
      const quantity = (k % 4) + 1;
      const unitPrice = prod.buyPrice;
      const totalWithoutVat = quantity * unitPrice;
      const vatAmount = (totalWithoutVat * prod.vatRate) / 100;
      const totalWithVat = totalWithoutVat + vatAmount;

      items.push({
        id: `pitem_${i}_${k}`,
        productId: prod.id,
        description: `${prod.name} (${prod.code})`,
        quantity,
        unit: prod.unit,
        unitPrice,
        vatRate: prod.vatRate,
        totalWithoutVat,
        vatAmount,
        totalWithVat,
      });
    }

    const subtotal = items.reduce((s, x) => s + x.totalWithoutVat, 0);
    const totalVat = items.reduce((s, x) => s + x.vatAmount, 0);
    const grandTotal = subtotal + totalVat;

    const statusMod = i % 100;
    let status: Invoice["status"] = "paid";
    let paidAmount = grandTotal;
    let remainingAmount = 0;

    if (statusMod >= 82 && statusMod < 94) {
      status = "sent";
      paidAmount = 0;
      remainingAmount = grandTotal;
    } else if (statusMod >= 94) {
      status = "partial";
      paidAmount = Math.round(grandTotal * 0.5);
      remainingAmount = grandTotal - paidAmount;
    }

    const inv: Invoice = {
      id: `inv_pur_${invCounter}`,
      invoiceNumber,
      type: "purchase",
      contactId: contact.id,
      contactName: contact.name,
      taxNumber: contact.taxNumber || "9000000000",
      issueDate,
      dueDate,
      items,
      subtotal,
      totalVat,
      grandTotal,
      paidAmount,
      remainingAmount,
      status,
      currency: "TRY",
      notes: `Tedarikçi Mal Alış Faturası - Stok Kabul #${i}`,
      createdAt: issueDate,
    };

    purchaseInvoices.push(inv);

    if (paidAmount > 0) {
      txCounter++;
      const acc = demoAccounts[i % demoAccounts.length];
      purchaseTransactions.push({
        id: `tx_pur_${txCounter}`,
        date: issueDate,
        type: "expense",
        amount: paidAmount,
        currency: "TRY",
        accountId: acc.id,
        accountName: acc.name,
        contactId: contact.id,
        contactName: contact.name,
        invoiceId: inv.id,
        invoiceNumber: inv.invoiceNumber,
        category: "Tedarikçi Mal Alım Ödemesi",
        description: `${inv.invoiceNumber} nolu ${items.length} kalemli mal alış faturasının ödemesi (${acc.name})`,
        documentNo: `ALIS-DEK-${txCounter}`,
      });
    }
  }

  return { purchaseInvoices, purchaseTransactions };
}

// Generator function for 100 NEW Customer Contacts (Müşteri Carileri - 120.VKN)
function generate100NewCustomerContacts(): Contact[] {
  const contacts: Contact[] = [];
  const customerPrefixes = [
    "Perakende & Mağazacılık A.Ş.",
    "Bilişim & Yazılım Çözümleri",
    "Gıda & Tüketim Maddeleri",
    "İnşaat & Taahhüt Hizmetleri",
    "Tekstil & Konfeksiyon Sanayi",
    "Otomotiv & Yedek Parça",
    "Sağlık & Medikal Çözümler",
    "Eğitim & Danışmanlık Grubu",
    "Turizm & Otelcilik İşletmeleri",
    "Reklam & Medya Pazarlama"
  ];

  for (let i = 1; i <= 100; i++) {
    const pad = i < 10 ? `00${i}` : i < 100 ? `0${i}` : `${i}`;
    const loc = citiesAndDistricts[(i - 1) % citiesAndDistricts.length];
    const prefix = customerPrefixes[(i - 1) % customerPrefixes.length];
    const companyTitle = `YENİ-MÜŞTERİ-${pad} ${prefix} ${i % 2 === 0 ? "A.Ş." : "Ltd. Şti."}`;
    const name = `CARI-MUSTERI-YENI-${pad} (${companyTitle})`;
    const taxNumber = `${8000000000 + i * 23}`;
    const accountCode = `120.${taxNumber}`;
    const balance = i * 1850 + 2000;

    contacts.push({
      id: `cnt_cust_new_${pad}`,
      accountCode,
      name,
      companyTitle,
      contactType: "customer",
      taxOffice: loc.taxOffice,
      taxNumber,
      phone: `0${loc.city === "İstanbul" ? "212" : loc.city === "Ankara" ? "312" : "232"} ${500 + (i % 50)} ${10 + (i % 60)} ${30 + (i % 70)}`,
      email: `musteri.yeni${pad}@${prefix.toLowerCase().replace(/[^a-z0-9]/g, "")}.com.tr`,
      city: loc.city,
      district: loc.district,
      address: `${loc.district} Merkez Mah. ${i}. Cadde No:${(i % 40) + 1} ${loc.city}`,
      balance,
      balanceType: "receivable",
      createdAt: "2026-01-20",
    });
  }

  return contacts;
}

// Generator function for 1,000 NEW Sales Invoices (Mal Satış Faturaları)
function generate1000SalesInvoices(
  contacts: Contact[],
  products: Product[],
  startInvCounter: number
): { salesInvoices: Invoice[]; salesTransactions: Transaction[] } {
  const salesInvoices: Invoice[] = [];
  const salesTransactions: Transaction[] = [];

  const customerPool = contacts.filter((c) => c.contactType === "customer" || c.id.startsWith("cnt_cust_new_"));
  const buyers = customerPool.length > 0 ? customerPool : contacts;

  let invCounter = startInvCounter;
  let txCounter = 19000;

  for (let i = 1; i <= 1000; i++) {
    invCounter++;
    const pad = i < 10 ? `0000${i}` : i < 100 ? `000${i}` : i < 1000 ? `00${i}` : `0${i}`;

    // Spread evenly across 2026 months
    const monthIndex = (i - 1) % 12;
    const monthObj = monthInfo[monthIndex];
    const day = Math.min(monthObj.days, (i % monthObj.days) + 1);
    const dayStr = day < 10 ? `0${day}` : `${day}`;
    const issueDate = `2026-${monthObj.num}-${dayStr}`;
    const dueDay = Math.min(monthObj.days, day + 14);
    const dueDayStr = dueDay < 10 ? `0${dueDay}` : `${dueDay}`;
    const dueDate = `2026-${monthObj.num}-${dueDayStr}`;

    const contact = buyers[(i - 1) % buyers.length];
    const invoiceNumber = `SATIS2026${monthObj.num}${pad.slice(-4)}`;

    const itemCount = (i % 3) + 2; // 2 to 4 items per invoice
    const items: InvoiceItem[] = [];

    for (let k = 0; k < itemCount; k++) {
      const prod = products[(i * 3 + k) % products.length];
      const quantity = (k % 3) + 1;
      const unitPrice = prod.sellPrice;
      const totalWithoutVat = quantity * unitPrice;
      const vatAmount = (totalWithoutVat * prod.vatRate) / 100;
      const totalWithVat = totalWithoutVat + vatAmount;

      items.push({
        id: `sitem_${i}_${k}`,
        productId: prod.id,
        description: `${prod.name} (${prod.code})`,
        quantity,
        unit: prod.unit,
        unitPrice,
        vatRate: prod.vatRate,
        totalWithoutVat,
        vatAmount,
        totalWithVat,
      });
    }

    const subtotal = items.reduce((s, x) => s + x.totalWithoutVat, 0);
    const totalVat = items.reduce((s, x) => s + x.vatAmount, 0);
    const grandTotal = subtotal + totalVat;

    const statusMod = i % 100;
    let status: Invoice["status"] = "paid";
    let paidAmount = grandTotal;
    let remainingAmount = 0;

    if (statusMod >= 85 && statusMod < 95) {
      status = "sent";
      paidAmount = 0;
      remainingAmount = grandTotal;
    } else if (statusMod >= 95) {
      status = "partial";
      paidAmount = Math.round(grandTotal * 0.5);
      remainingAmount = grandTotal - paidAmount;
    }

    const inv: Invoice = {
      id: `inv_sal_${invCounter}`,
      invoiceNumber,
      type: "sales",
      contactId: contact.id,
      contactName: contact.name,
      taxNumber: contact.taxNumber || "8000000000",
      issueDate,
      dueDate,
      items,
      subtotal,
      totalVat,
      grandTotal,
      paidAmount,
      remainingAmount,
      status,
      currency: "TRY",
      notes: `Müşteri Mal Satış Faturası - Teslimat #${i}`,
      createdAt: issueDate,
    };

    salesInvoices.push(inv);

    if (paidAmount > 0) {
      txCounter++;
      const acc = demoAccounts[i % demoAccounts.length];
      salesTransactions.push({
        id: `tx_sal_${txCounter}`,
        date: issueDate,
        type: "income",
        amount: paidAmount,
        currency: "TRY",
        accountId: acc.id,
        accountName: acc.name,
        contactId: contact.id,
        contactName: contact.name,
        invoiceId: inv.id,
        invoiceNumber: inv.invoiceNumber,
        category: "Müşteri Mal Satış Tahsilatı",
        description: `${inv.invoiceNumber} nolu ${items.length} kalemli mal satış faturasının tahsilatı (${acc.name})`,
        documentNo: `SATIS-DEK-${txCounter}`,
      });
    }
  }

  return { salesInvoices, salesTransactions };
}

// Generator function for 200 NEW Customer Cheques (Alınan Çekler - Alacaklı Müşterilerden)
function generate200CustomerCheques(contacts: Contact[]): Cheque[] {
  const cheques: Cheque[] = [];
  const customerContacts = contacts.filter((c) => c.contactType === "customer" || c.id.startsWith("cnt_cust_"));
  const pool = customerContacts.length > 0 ? customerContacts : contacts;

  const banks = [
    { name: "Garanti BBVA", branch: "Levent Şubesi" },
    { name: "İş Bankası", branch: "Maslak Şubesi" },
    { name: "Akbank", branch: "Kızılay Şubesi" },
    { name: "Yapı Kredi", branch: "Alsancak Şubesi" },
    { name: "Ziraat Bankası", branch: "Ostim Şubesi" },
    { name: "QNB Finansbank", branch: "Güneşli Şubesi" },
    { name: "Halkbank", branch: "Bornova Şubesi" },
    { name: "VakıfBank", branch: "Kadıköy Şubesi" },
  ];

  for (let i = 1; i <= 200; i++) {
    const pad = i < 10 ? `00${i}` : i < 100 ? `0${i}` : `${i}`;
    const contact = pool[(i - 1) % pool.length];
    const bank = banks[(i - 1) % banks.length];

    const monthIdx = (i - 1) % 12;
    const m = monthInfo[monthIdx];
    const day = Math.min(m.days, (i % m.days) + 1);
    const dayStr = day < 10 ? `0${day}` : `${day}`;
    const issueDate = `2026-${m.num}-${dayStr}`;

    const dueMonthIdx = (monthIdx + 2) % 12;
    const dueM = monthInfo[dueMonthIdx];
    const dueDay = Math.min(dueM.days, day);
    const dueDayStr = dueDay < 10 ? `0${dueDay}` : `${dueDay}`;
    const dueDate = `2026-${dueM.num}-${dueDayStr}`;

    const amount = 25000 + ((i * 1250) % 150000);

    cheques.push({
      id: `chq_rec_200_${pad}`,
      type: "received",
      chequeNumber: `CHK-2026-REC-${pad}`,
      bankName: bank.name,
      branchName: bank.branch,
      drawerName: contact.companyTitle || contact.name,
      contactId: contact.id,
      contactName: contact.name,
      issueDate,
      dueDate,
      amount,
      currency: "TRY",
      status: i % 10 === 0 ? "collected" : "portfolio",
      notes: `Alacaklı Müşteri Çek Tahsilatı #${pad} (${contact.name})`,
    });
  }

  return cheques;
}

// Generator function for 250 NEW Customer Promissory Notes (Alınan Senetler - Alacaklı Müşterilerden)
function generate250CustomerPromissoryNotes(contacts: Contact[]): PromissoryNote[] {
  const notes: PromissoryNote[] = [];
  const customerContacts = contacts.filter((c) => c.contactType === "customer" || c.id.startsWith("cnt_cust_"));
  const pool = customerContacts.length > 0 ? customerContacts : contacts;

  for (let i = 1; i <= 250; i++) {
    const pad = i < 10 ? `00${i}` : i < 100 ? `0${i}` : `${i}`;
    const contact = pool[(i - 1) % pool.length];

    const monthIdx = (i - 1) % 12;
    const m = monthInfo[monthIdx];
    const day = Math.min(m.days, (i % m.days) + 1);
    const dayStr = day < 10 ? `0${day}` : `${day}`;
    const issueDate = `2026-${m.num}-${dayStr}`;

    const dueMonthIdx = (monthIdx + 3) % 12;
    const dueM = monthInfo[dueMonthIdx];
    const dueDay = Math.min(dueM.days, day);
    const dueDayStr = dueDay < 10 ? `0${dueDay}` : `${dueDay}`;
    const dueDate = `2026-${dueM.num}-${dueDayStr}`;

    const amount = 18000 + ((i * 950) % 110000);

    notes.push({
      id: `note_rec_250_${pad}`,
      type: "received",
      noteNumber: `SNT-2026-REC-${pad}`,
      debtorName: contact.companyTitle || contact.name,
      contactId: contact.id,
      contactName: contact.name,
      issueDate,
      dueDate,
      amount,
      currency: "TRY",
      status: i % 12 === 0 ? "collected" : "portfolio",
      notes: `Alacaklı Müşteri Senet Tahsilatı #${pad} (${contact.name})`,
    });
  }

  return notes;
}

// Generator function for 150 NEW Virman Transactions (Cariler Arası Virman Dekontu ile Tahsilat)
function generate150VirmanTransactions(contacts: Contact[]): Transaction[] {
  const virmanTxs: Transaction[] = [];
  const customerContacts = contacts.filter((c) => c.contactType === "customer" || c.id.startsWith("cnt_cust_"));
  const vendorContacts = contacts.filter((c) => c.contactType === "vendor" || c.id.startsWith("cnt_ven_"));

  const sources = customerContacts.length > 0 ? customerContacts : contacts;
  const targets = vendorContacts.length > 0 ? vendorContacts : contacts;

  for (let i = 1; i <= 150; i++) {
    const pad = i < 10 ? `00${i}` : i < 100 ? `0${i}` : `${i}`;
    const cSource = sources[(i - 1) % sources.length];
    const cTarget = targets[i % targets.length];

    const monthIdx = (i - 1) % 12;
    const m = monthInfo[monthIdx];
    const day = Math.min(m.days, (i % m.days) + 1);
    const dayStr = day < 10 ? `0${day}` : `${day}`;
    const vDate = `2026-${m.num}-${dayStr}`;

    const amount = 12000 + ((i * 1100) % 85000);

    virmanTxs.push({
      id: `tx_vrm_150_${pad}`,
      date: vDate,
      type: "collection",
      amount,
      currency: "TRY",
      accountId: demoAccounts[0].id,
      accountName: `Cari Virman (${cSource.name} -> ${cTarget.name})`,
      contactId: cSource.id,
      contactName: cSource.name,
      category: "Cariler Arası Virman",
      description: `Cariler Arası Virman Tahsilatı: Virman Dekontu ile ${cSource.name} borcunun ${cTarget.name} hesabından mahsuben tahsilatı`,
      documentNo: `VRM-2026-${pad}`,
    });
  }

  return virmanTxs;
}
