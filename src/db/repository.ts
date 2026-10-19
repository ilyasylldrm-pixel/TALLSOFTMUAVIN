import { eq, and } from 'drizzle-orm';
import { db } from './index.ts';
import {
  accounts,
  contacts,
  products,
  invoices,
  transactions,
  orders,
  cheques,
  promissoryNotes,
  employees,
} from './schema.ts';
import { getOrCreateUser } from './users.ts';

function encodeExtraMeta(notesValue: unknown, rawItem: Record<string, any>): string | null {
  const baseNotes = typeof notesValue === 'string' ? notesValue : '';
  try {
    return JSON.stringify({
      __muavin_meta_v1: true,
      notes: baseNotes,
      raw: rawItem,
    });
  } catch {
    return baseNotes || null;
  }
}

function decodeExtraMeta<T extends Record<string, any>>(
  notesCol: string | null | undefined,
  fallbackObj: T
): T {
  if (!notesCol) return fallbackObj;
  if (notesCol.startsWith('{"__muavin_meta_v1":true')) {
    try {
      const parsed = JSON.parse(notesCol);
      if (parsed && parsed.__muavin_meta_v1 && parsed.raw && typeof parsed.raw === 'object') {
        return {
          ...parsed.raw,
          ...fallbackObj,
          notes: parsed.notes ?? fallbackObj.notes ?? '',
        };
      }
    } catch {
      // fall through
    }
  }
  return fallbackObj;
}

export async function getAllUserAccountingRecords(uid: string) {
  try {
    const [
      userAccounts,
      userContacts,
      userProducts,
      userInvoices,
      userTransactions,
      userOrders,
      userCheques,
      userPromissoryNotes,
      userEmployees,
    ] = await Promise.all([
      db.select().from(accounts).where(eq(accounts.userId, uid)),
      db.select().from(contacts).where(eq(contacts.userId, uid)),
      db.select().from(products).where(eq(products.userId, uid)),
      db.select().from(invoices).where(eq(invoices.userId, uid)),
      db.select().from(transactions).where(eq(transactions.userId, uid)),
      db.select().from(orders).where(eq(orders.userId, uid)),
      db.select().from(cheques).where(eq(cheques.userId, uid)),
      db.select().from(promissoryNotes).where(eq(promissoryNotes.userId, uid)),
      db.select().from(employees).where(eq(employees.userId, uid)),
    ]);

    return {
      accounts: userAccounts.map((a) => ({
        id: a.id,
        name: a.name,
        type: a.type,
        currency: a.currency || 'TRY',
        balance: Number(a.balance || 0),
        accountNumber: a.accountNumber || undefined,
        iban: a.iban || undefined,
        bankName: a.bankName || undefined,
        isDefault: Boolean(a.isDefault),
      })),
      contacts: userContacts.map((c) =>
        decodeExtraMeta(c.notes, {
          id: c.id,
          name: c.name,
          companyTitle: c.companyTitle || undefined,
          type: c.contactType,
          contactType: c.contactType,
          taxOffice: c.taxOffice || '',
          taxNumber: c.taxNumber || '',
          email: c.email || '',
          phone: c.phone || '',
          address: c.address || '',
          city: c.city || undefined,
          district: c.district || undefined,
          neighborhood: c.neighborhood || undefined,
          street: c.street || undefined,
          balance: Number(c.balance || 0),
          balanceType: c.balanceType || 'balanced',
          notes: c.notes || '',
          createdAt: c.createdAt || undefined,
        })
      ),
      products: userProducts.map((p) => {
        const wq = (p.warehouseQuantities || {}) as Record<string, any>;
        const rawMeta = wq && typeof wq.__rawProduct === 'object' ? wq.__rawProduct : {};
        const cleanWq = { ...wq };
        delete cleanWq.__rawProduct;
        return {
          ...rawMeta,
          id: p.id,
          code: p.code,
          name: p.name,
          unit: p.unit || 'Adet',
          buyPrice: Number(p.buyPrice || 0),
          sellPrice: Number(p.sellPrice || 0),
          vatRate: Number(p.vatRate ?? 20),
          stockQuantity: Number(p.stockQuantity || 0),
          minStockAlert: p.minStockAlert !== null ? Number(p.minStockAlert) : 5,
          category: p.category || 'Genel',
          stockType: p.stockType || 'Ticari Mal',
          barcode: p.barcode || undefined,
          imeiOrSerialNo: p.imeiOrSerialNo || undefined,
          warehouseId: p.warehouseId || undefined,
          warehouseName: p.warehouseName || undefined,
          warehouseQuantities: Object.keys(cleanWq).length > 0 ? cleanWq : undefined,
        };
      }),
      invoices: userInvoices.map((inv) =>
        decodeExtraMeta(inv.notes, {
          id: inv.id,
          invoiceNumber: inv.invoiceNumber,
          type: inv.type,
          contactId: inv.contactId,
          contactName: inv.contactName,
          taxNumber: inv.taxNumber || undefined,
          issueDate: inv.issueDate,
          dueDate: inv.dueDate,
          items: Array.isArray(inv.items) ? inv.items : [],
          subtotal: Number(inv.subtotal || 0),
          totalVat: Number(inv.totalVat || 0),
          totalWithholding: Number(inv.totalWithholding || 0),
          grandTotal: Number(inv.grandTotal || 0),
          paidAmount: Number(inv.paidAmount || 0),
          remainingAmount: Number(inv.remainingAmount || 0),
          status: inv.status || 'draft',
          currency: inv.currency || 'TRY',
          notes: inv.notes || undefined,
          terms: inv.terms || undefined,
          createdAt: inv.createdAt || undefined,
        })
      ),
      transactions: userTransactions.map((tx) =>
        decodeExtraMeta(tx.description, {
          id: tx.id,
          date: tx.date,
          type: tx.type,
          amount: Number(tx.amount || 0),
          currency: tx.currency || 'TRY',
          accountId: tx.accountId,
          accountName: tx.accountName,
          contactId: tx.contactId || undefined,
          contactName: tx.contactName || undefined,
          invoiceId: tx.invoiceId || undefined,
          invoiceNumber: tx.invoiceNumber || undefined,
          category: tx.category || 'Genel',
          description: tx.description || '',
          documentNo: tx.documentNo || undefined,
          receiptImage: tx.receiptImage || undefined,
          items: Array.isArray(tx.items) ? tx.items : undefined,
          subtotal: tx.subtotal !== null ? Number(tx.subtotal) : undefined,
          totalVat: tx.totalVat !== null ? Number(tx.totalVat) : undefined,
        })
      ),
      orders: userOrders.map((ord) =>
        decodeExtraMeta(ord.notes, {
          id: ord.id,
          orderNumber: ord.orderNumber,
          type: ord.type,
          contactId: ord.contactId,
          contactName: ord.contactName,
          contactPhone: ord.contactPhone || undefined,
          contactEmail: ord.contactEmail || undefined,
          taxNumber: ord.taxNumber || undefined,
          orderDate: ord.orderDate,
          deliveryDate: ord.deliveryDate || undefined,
          items: Array.isArray(ord.items) ? ord.items : [],
          subtotal: Number(ord.subtotal || 0),
          totalVat: Number(ord.totalVat || 0),
          grandTotal: Number(ord.grandTotal || 0),
          currency: ord.currency || 'TRY',
          status: ord.status || 'pending',
          warehouseId: ord.warehouseId || undefined,
          warehouseName: ord.warehouseName || undefined,
          notes: ord.notes || undefined,
          convertedToInvoiceId: ord.convertedToInvoiceId || undefined,
          convertedToInvoiceNumber: ord.convertedToInvoiceNumber || undefined,
          createdAt: ord.createdAt || undefined,
        })
      ),
      cheques: userCheques.map((ch) => ({
        id: ch.id,
        type: ch.type,
        chequeNumber: ch.chequeNumber,
        bankName: ch.bankName || '',
        branchName: ch.branchName || '',
        drawerName: ch.drawerName || '',
        contactId: ch.contactId || '',
        contactName: ch.contactName || '',
        issueDate: ch.issueDate || '',
        dueDate: ch.dueDate || '',
        amount: Number(ch.amount || 0),
        currency: ch.currency || 'TRY',
        status: ch.status || 'portfolio',
        notes: ch.notes || undefined,
        endorsedToContactId: ch.endorsedToContactId || undefined,
        endorsedToContactName: ch.endorsedToContactName || undefined,
        endorsedDate: ch.endorsedDate || undefined,
      })),
      promissoryNotes: userPromissoryNotes.map((pn) => ({
        id: pn.id,
        type: pn.type,
        noteNumber: pn.noteNumber,
        debtorName: pn.debtorName || '',
        contactId: pn.contactId || '',
        contactName: pn.contactName || '',
        issueDate: pn.issueDate || '',
        dueDate: pn.dueDate || '',
        amount: Number(pn.amount || 0),
        currency: pn.currency || 'TRY',
        status: pn.status || 'portfolio',
        notes: pn.notes || undefined,
        endorsedToContactId: pn.endorsedToContactId || undefined,
        endorsedToContactName: pn.endorsedToContactName || undefined,
        endorsedDate: pn.endorsedDate || undefined,
      })),
      employees: userEmployees.map((emp) =>
        decodeExtraMeta(emp.notes, {
          id: emp.id,
          tckn: emp.tckn,
          fullName: emp.fullName,
          title: emp.title,
          department: emp.department,
          startDate: emp.startDate,
          endDate: emp.endDate || undefined,
          terminationCode: emp.terminationCode || undefined,
          terminationReason: emp.terminationReason || undefined,
          birthDate: emp.birthDate || undefined,
          homeAddress: emp.homeAddress || undefined,
          photoUrl: emp.photoUrl || undefined,
          phone: emp.phone || '',
          email: emp.email || '',
          salaryType: emp.salaryType || 'net',
          salaryAmount: Number(emp.salaryAmount || 0),
          foodAllowance: Number(emp.foodAllowance || 0),
          roadAllowance: Number(emp.roadAllowance || 0),
          hasBes: Boolean(emp.hasBes),
          sgkOccupationCode: emp.sgkOccupationCode || undefined,
          iban: emp.iban || '',
          bankName: emp.bankName || '',
          emergencyContact: emp.emergencyContact || undefined,
          emergencyPhone: emp.emergencyPhone || undefined,
          status: emp.status || 'active',
          annualLeaveAllowance: Number(emp.annualLeaveAllowance ?? 14),
          usedAnnualLeave: Number(emp.usedAnnualLeave ?? 0),
          notes: emp.notes || undefined,
          createdAt: emp.createdAt || undefined,
        })
      ),
    };
  } catch (error) {
    console.error("Database query failed in getAllUserAccountingRecords:", error);
    throw new Error("Database query failed. Please try again later.", { cause: error });
  }
}

export async function upsertProductRecord(uid: string, p: Record<string, any>) {
  try {
    const id = String(p.id || `prod_${Date.now()}`);
    const wqPayload = {
      ...(p.warehouseQuantities && typeof p.warehouseQuantities === 'object' ? p.warehouseQuantities : {}),
      __rawProduct: p,
    };
    const values = {
      id,
      userId: uid,
      code: String(p.code || id),
      name: String(p.name || 'Stok Kartı'),
      unit: String(p.unit || 'Adet'),
      buyPrice: Number(p.buyPrice || 0),
      sellPrice: Number(p.sellPrice || 0),
      vatRate: Number(p.vatRate ?? 20),
      stockQuantity: Number(p.stockQuantity || 0),
      minStockAlert: p.minStockAlert !== undefined ? Number(p.minStockAlert) : 5,
      category: p.category ? String(p.category) : 'Genel',
      stockType: p.stockType ? String(p.stockType) : 'Ticari Mal',
      barcode: p.barcode ? String(p.barcode) : null,
      imeiOrSerialNo: p.imeiOrSerialNo ? String(p.imeiOrSerialNo) : null,
      warehouseId: p.warehouseId ? String(p.warehouseId) : null,
      warehouseName: p.warehouseName ? String(p.warehouseName) : null,
      warehouseQuantities: wqPayload,
    };
    const res = await db
      .insert(products)
      .values(values)
      .onConflictDoUpdate({
        target: products.id,
        set: values,
      })
      .returning();
    return res[0];
  } catch (error) {
    console.error("Database query failed in upsertProductRecord:", error);
    throw new Error("Database query failed. Please try again later.", { cause: error });
  }
}

export async function deleteProductRecord(uid: string, id: string) {
  try {
    await db.delete(products).where(and(eq(products.id, id), eq(products.userId, uid)));
  } catch (error) {
    console.error("Database query failed in deleteProductRecord:", error);
    throw new Error("Database query failed. Please try again later.", { cause: error });
  }
}

export async function upsertInvoiceRecord(uid: string, inv: Record<string, any>) {
  try {
    const id = String(inv.id || `inv_${Date.now()}`);
    const values = {
      id,
      userId: uid,
      invoiceNumber: String(inv.invoiceNumber || id),
      type: String(inv.type || 'sales'),
      contactId: String(inv.contactId || ''),
      contactName: String(inv.contactName || ''),
      taxNumber: inv.taxNumber ? String(inv.taxNumber) : null,
      issueDate: String(inv.issueDate || new Date().toISOString().split('T')[0]),
      dueDate: String(inv.dueDate || inv.issueDate || new Date().toISOString().split('T')[0]),
      items: Array.isArray(inv.items) ? inv.items : [],
      subtotal: Number(inv.subtotal || 0),
      totalVat: Number(inv.totalVat || 0),
      totalWithholding: Number(inv.totalWithholding || 0),
      grandTotal: Number(inv.grandTotal || 0),
      paidAmount: Number(inv.paidAmount || 0),
      remainingAmount: Number(inv.remainingAmount || 0),
      status: String(inv.status || 'draft'),
      currency: String(inv.currency || 'TRY'),
      notes: encodeExtraMeta(inv.notes, inv),
      terms: inv.terms ? String(inv.terms) : null,
      createdAt: inv.createdAt ? String(inv.createdAt) : new Date().toISOString(),
    };
    const res = await db
      .insert(invoices)
      .values(values)
      .onConflictDoUpdate({
        target: invoices.id,
        set: values,
      })
      .returning();
    return res[0];
  } catch (error) {
    console.error("Database query failed in upsertInvoiceRecord:", error);
    throw new Error("Database query failed. Please try again later.", { cause: error });
  }
}

export async function deleteInvoiceRecord(uid: string, id: string) {
  try {
    await db.delete(invoices).where(and(eq(invoices.id, id), eq(invoices.userId, uid)));
  } catch (error) {
    console.error("Database query failed in deleteInvoiceRecord:", error);
    throw new Error("Database query failed. Please try again later.", { cause: error });
  }
}

export async function upsertTransactionRecord(uid: string, tx: Record<string, any>) {
  try {
    const id = String(tx.id || `tx_${Date.now()}`);
    const values = {
      id,
      userId: uid,
      date: String(tx.date || new Date().toISOString().split('T')[0]),
      type: String(tx.type || 'income'),
      amount: Number(tx.amount || 0),
      currency: String(tx.currency || 'TRY'),
      accountId: String(tx.accountId || ''),
      accountName: String(tx.accountName || ''),
      contactId: tx.contactId ? String(tx.contactId) : null,
      contactName: tx.contactName ? String(tx.contactName) : null,
      invoiceId: tx.invoiceId ? String(tx.invoiceId) : null,
      invoiceNumber: tx.invoiceNumber ? String(tx.invoiceNumber) : null,
      category: tx.category ? String(tx.category) : 'Genel',
      description: encodeExtraMeta(tx.description, tx),
      documentNo: tx.documentNo ? String(tx.documentNo) : null,
      receiptImage: tx.receiptImage ? String(tx.receiptImage) : null,
      items: Array.isArray(tx.items) ? tx.items : null,
      subtotal: tx.subtotal !== undefined ? Number(tx.subtotal) : null,
      totalVat: tx.totalVat !== undefined ? Number(tx.totalVat) : null,
    };
    const res = await db
      .insert(transactions)
      .values(values)
      .onConflictDoUpdate({
        target: transactions.id,
        set: values,
      })
      .returning();
    return res[0];
  } catch (error) {
    console.error("Database query failed in upsertTransactionRecord:", error);
    throw new Error("Database query failed. Please try again later.", { cause: error });
  }
}

export async function deleteTransactionRecord(uid: string, id: string) {
  try {
    await db.delete(transactions).where(and(eq(transactions.id, id), eq(transactions.userId, uid)));
  } catch (error) {
    console.error("Database query failed in deleteTransactionRecord:", error);
    throw new Error("Database query failed. Please try again later.", { cause: error });
  }
}

export async function upsertContactRecord(uid: string, c: Record<string, any>) {
  try {
    const id = String(c.id || `cnt_${Date.now()}`);
    const values = {
      id,
      userId: uid,
      name: String(c.name || ''),
      companyTitle: c.companyTitle ? String(c.companyTitle) : null,
      contactType: String(c.type || c.contactType || 'customer'),
      taxOffice: c.taxOffice ? String(c.taxOffice) : null,
      taxNumber: c.taxNumber || c.vkn || c.tckn ? String(c.taxNumber || c.vkn || c.tckn) : null,
      email: c.email ? String(c.email) : null,
      phone: c.phone ? String(c.phone) : null,
      address: c.address ? String(c.address) : null,
      city: c.city ? String(c.city) : null,
      district: c.district ? String(c.district) : null,
      neighborhood: c.neighborhood ? String(c.neighborhood) : null,
      street: c.street ? String(c.street) : null,
      balance: Number(c.balance || 0),
      balanceType: String(c.balanceType || 'balanced'),
      notes: encodeExtraMeta(c.notes, c),
      createdAt: c.createdAt ? String(c.createdAt) : new Date().toISOString(),
    };
    const res = await db
      .insert(contacts)
      .values(values)
      .onConflictDoUpdate({
        target: contacts.id,
        set: values,
      })
      .returning();
    return res[0];
  } catch (error) {
    console.error("Database query failed in upsertContactRecord:", error);
    throw new Error("Database query failed. Please try again later.", { cause: error });
  }
}

export async function upsertAccountRecord(uid: string, a: Record<string, any>) {
  try {
    const id = String(a.id || `acc_${Date.now()}`);
    const values = {
      id,
      userId: uid,
      name: String(a.name || ''),
      type: String(a.type || 'cash'),
      currency: String(a.currency || 'TRY'),
      balance: Number(a.balance || 0),
      accountNumber: a.accountNumber ? String(a.accountNumber) : null,
      iban: a.iban ? String(a.iban) : null,
      bankName: a.bankName ? String(a.bankName) : null,
      isDefault: Boolean(a.isDefault),
    };
    const res = await db
      .insert(accounts)
      .values(values)
      .onConflictDoUpdate({
        target: accounts.id,
        set: values,
      })
      .returning();
    return res[0];
  } catch (error) {
    console.error("Database query failed in upsertAccountRecord:", error);
    throw new Error("Database query failed. Please try again later.", { cause: error });
  }
}

export async function syncUserBatchToPostgres(
  uid: string,
  email: string,
  payload: {
    products?: any[];
    invoices?: any[];
    transactions?: any[];
    contacts?: any[];
    accounts?: any[];
  }
) {
  try {
    await getOrCreateUser(uid, email);

    if (Array.isArray(payload.accounts)) {
      for (const acc of payload.accounts) {
        if (acc && acc.id) await upsertAccountRecord(uid, acc);
      }
    }
    if (Array.isArray(payload.contacts)) {
      for (const cnt of payload.contacts) {
        if (cnt && cnt.id) await upsertContactRecord(uid, cnt);
      }
    }
    if (Array.isArray(payload.products)) {
      for (const prod of payload.products) {
        if (prod && prod.id) await upsertProductRecord(uid, prod);
      }
    }
    if (Array.isArray(payload.invoices)) {
      for (const inv of payload.invoices) {
        if (inv && inv.id) await upsertInvoiceRecord(uid, inv);
      }
    }
    if (Array.isArray(payload.transactions)) {
      for (const tx of payload.transactions) {
        if (tx && tx.id) await upsertTransactionRecord(uid, tx);
      }
    }
    return true;
  } catch (error) {
    console.error("Database query failed in syncUserBatchToPostgres:", error);
    throw new Error("Database query failed. Please try again later.", { cause: error });
  }
}
