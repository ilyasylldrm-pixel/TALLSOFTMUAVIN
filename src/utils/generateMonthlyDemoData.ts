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

      const contact: Contact = {
        id: `c_${m.num}_${padIdx}`,
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

  return {
    contacts: allContacts, // 1,200 UNIQUE CONTACTS (100 per month!)
    products: allProducts, // 1,200 UNIQUE STOCK ITEMS (100 per month!)
    accounts: demoAccounts,
    invoices,
    transactions,
    quotes,
    cheques,
    promissoryNotes,
    leaveRequests,
    advanceRequests,
  };
}
