import {
  auth,
  getAccessToken,
  setCachedAccessToken,
  googleSignInWithWorkspace,
  clearAccessToken
} from "../lib/firebase";

export interface GoogleSpreadsheetItem {
  id: string;
  name: string;
  modifiedTime: string;
  webViewLink?: string;
  owners?: { displayName: string; emailAddress: string }[];
}

export interface SheetMetadata {
  id: string;
  title: string;
  sheets: { id: number; title: string; rowCount: number; columnCount: number }[];
}

export interface ExportToSheetsParams {
  title: string;
  sheetName?: string;
  headers: string[];
  rows: (string | number | boolean | null | undefined)[][];
}

export interface ExportResult {
  spreadsheetId: string;
  spreadsheetUrl: string;
  title: string;
  rowCount: number;
}

/**
 * Ensures a valid access token is present, or prompts user with Google Workspace OAuth popup.
 */
export async function ensureGoogleToken(): Promise<string> {
  const currentToken = await getAccessToken();
  if (currentToken) {
    return currentToken;
  }

  // If currentUser is logged in, or needs fresh token
  const result = await googleSignInWithWorkspace();
  if (!result?.accessToken) {
    throw new Error("Google Workspace erişim izni alınamadı. Lütfen Google hesabınızla giriş yapınız.");
  }
  return result.accessToken;
}

/**
 * Checks if the user currently has an in-memory Google Workspace token.
 */
export async function isGoogleAuthenticated(): Promise<boolean> {
  const token = await getAccessToken();
  return Boolean(token && auth.currentUser);
}

/**
 * Clears current Google token session.
 */
export function disconnectGoogleSheets(): void {
  clearAccessToken();
}

/**
 * Lists user's spreadsheets from Google Drive.
 */
export async function listGoogleSpreadsheets(): Promise<GoogleSpreadsheetItem[]> {
  const token = await ensureGoogleToken();
  const query = encodeURIComponent("mimeType='application/vnd.google-apps.spreadsheet' and trashed=false");
  const fields = encodeURIComponent("files(id,name,modifiedTime,webViewLink,owners)");
  const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=${fields}&orderBy=modifiedTime%20desc&pageSize=40`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    }
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    if (res.status === 401) {
      clearAccessToken();
      throw new Error("Google oturum süresi doldu. Lütfen yeniden bağlanın.");
    }
    throw new Error(errBody.error?.message || `Google Drive dosyaları alınamadı (Kod: ${res.status})`);
  }

  const data = await res.json();
  return (data.files || []).map((f: any) => ({
    id: f.id,
    name: f.name || "İsimsiz E-Tablo",
    modifiedTime: f.modifiedTime || new Date().toISOString(),
    webViewLink: f.webViewLink || `https://docs.google.com/spreadsheets/d/${f.id}/edit`,
    owners: f.owners || []
  }));
}

/**
 * Fetches metadata and sheet tabs for a given spreadsheet.
 */
export async function getSpreadsheetDetails(spreadsheetId: string): Promise<SheetMetadata> {
  const token = await ensureGoogleToken();
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}?fields=properties.title,sheets.properties`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.error?.message || "E-tablo bilgileri alınamadı.");
  }

  const data = await res.json();
  return {
    id: spreadsheetId,
    title: data.properties?.title || "Google E-Tablo",
    sheets: (data.sheets || []).map((s: any) => ({
      id: s.properties?.sheetId || 0,
      title: s.properties?.title || "Sayfa1",
      rowCount: s.properties?.gridProperties?.rowCount || 1000,
      columnCount: s.properties?.gridProperties?.columnCount || 26
    }))
  };
}

/**
 * Reads values from a specific spreadsheet range (e.g. "Sayfa1!A1:Z500").
 */
export async function readSpreadsheetValues(
  spreadsheetId: string,
  range: string
): Promise<(string | number | boolean)[][]> {
  const token = await ensureGoogleToken();
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
    spreadsheetId
  )}/values/${encodeURIComponent(range)}`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.error?.message || "E-tablodan veri okunamadı.");
  }

  const data = await res.json();
  return data.values || [];
}

/**
 * Creates a brand new Google Spreadsheet and sets initial formatting and frozen row.
 */
export async function createGoogleSpreadsheet(
  title: string,
  sheetName = "Rapor"
): Promise<{ id: string; url: string; sheetId: number }> {
  const token = await ensureGoogleToken();
  const url = "https://sheets.googleapis.com/v4/spreadsheets";

  const payload = {
    properties: {
      title,
      locale: "tr_TR"
    },
    sheets: [
      {
        properties: {
          title: sheetName,
          gridProperties: {
            frozenRowCount: 1
          }
        }
      }
    ]
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.error?.message || "Yeni Google E-Tablo oluşturulamadı.");
  }

  const data = await res.json();
  const sheetId = data.sheets?.[0]?.properties?.sheetId || 0;
  return {
    id: data.spreadsheetId,
    url: data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${data.spreadsheetId}/edit`,
    sheetId
  };
}

/**
 * Formats the header row with clean ERP aesthetics (dark indigo banner, bold white text, subtle gridlines).
 */
export async function formatHeaderRow(
  spreadsheetId: string,
  sheetId: number,
  columnCount: number
): Promise<void> {
  try {
    const token = await ensureGoogleToken();
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}:batchUpdate`;

    const requests = [
      {
        repeatCell: {
          range: {
            sheetId,
            startRowIndex: 0,
            endRowIndex: 1,
            startColumnIndex: 0,
            endColumnIndex: Math.max(1, columnCount)
          },
          cell: {
            userEnteredFormat: {
              backgroundColor: { red: 0.08, green: 0.12, blue: 0.22 }, // #141f38 Slate Dark
              textFormat: {
                foregroundColor: { red: 1.0, green: 1.0, blue: 1.0 },
                bold: true,
                fontSize: 10
              },
              horizontalAlignment: "CENTER",
              verticalAlignment: "MIDDLE",
              padding: { top: 6, bottom: 6, left: 8, right: 8 }
            }
          },
          fields: "userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,verticalAlignment,padding)"
        }
      },
      {
        autoResizeDimensions: {
          dimensions: {
            sheetId,
            dimension: "COLUMNS",
            startIndex: 0,
            endIndex: Math.max(1, columnCount)
          }
        }
      }
    ];

    await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ requests })
    });
  } catch (err) {
    console.warn("Could not apply cosmetic formatting to Google Sheet:", err);
  }
}

/**
 * Appends rows to an existing spreadsheet.
 */
export async function appendSpreadsheetRows(
  spreadsheetId: string,
  range: string,
  rows: (string | number | boolean | null | undefined)[][]
): Promise<number> {
  const token = await ensureGoogleToken();
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
    spreadsheetId
  )}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;

  const cleanRows = rows.map((row) =>
    row.map((val) => (val === null || val === undefined ? "" : val))
  );

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ values: cleanRows })
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.error?.message || "E-Tabloya satır eklenemedi.");
  }

  const data = await res.json();
  return data.updates?.updatedRows || cleanRows.length;
}

/**
 * Overwrites specific range in a spreadsheet.
 */
export async function updateSpreadsheetRange(
  spreadsheetId: string,
  range: string,
  values: (string | number | boolean | null | undefined)[][]
): Promise<number> {
  const token = await ensureGoogleToken();
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
    spreadsheetId
  )}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`;

  const cleanValues = values.map((row) =>
    row.map((val) => (val === null || val === undefined ? "" : val))
  );

  const res = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ values: cleanValues })
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.error?.message || "E-Tablo verisi güncellenemedi.");
  }

  const data = await res.json();
  return data.updatedRows || cleanValues.length;
}

/**
 * High-level helper: Creates a fresh Google Spreadsheet, writes headers & data rows,
 * applies header formatting, and returns URL and details.
 */
export async function exportToGoogleSheets({
  title,
  sheetName = "Veriler",
  headers,
  rows
}: ExportToSheetsParams): Promise<ExportResult> {
  // 1. Create the new spreadsheet
  const created = await createGoogleSpreadsheet(title, sheetName);

  // 2. Prepare payload
  const tableData: (string | number | boolean)[][] = [
    headers,
    ...rows.map((row) =>
      row.map((c) => (c === null || c === undefined ? "" : c))
    )
  ];

  // 3. Write data to range
  const range = `${sheetName}!A1`;
  await updateSpreadsheetRange(created.id, range, tableData);

  // 4. Polish header styling and column widths
  await formatHeaderRow(created.id, created.sheetId, headers.length);

  return {
    spreadsheetId: created.id,
    spreadsheetUrl: created.url,
    title,
    rowCount: rows.length
  };
}
