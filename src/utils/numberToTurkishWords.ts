/**
 * Converts a numerical amount (e.g. 12450.75) to Turkish written currency text.
 * Example: "OnİkiBinDörtYüzElli Türk Lirası YetmişBeş Kuruş"
 */
export function numberToTurkishWords(amount: number): string {
  if (isNaN(amount) || amount === 0) return "Sıfır Türk Lirası";

  const ones = ["", "Bir", "İki", "Üç", "Dört", "Beş", "Altı", "Yedi", "Sekiz", "Dokuz"];
  const tens = ["", "On", "Yirmi", "Otuz", "Kırk", "Elli", "Altmış", "Yetmiş", "Sohsen", "Seksen", "Doksan"];
  const thousands = ["", "Bin", "Milyon", "Milyar", "Trilyon"];

  const absolute = Math.abs(amount);
  const lira = Math.floor(absolute);
  const kurus = Math.round((absolute - lira) * 100);

  function convertGroup(n: number): string {
    let str = "";
    const h = Math.floor(n / 100);
    const t = Math.floor((n % 100) / 10);
    const o = n % 10;

    if (h > 0) {
      if (h === 1) str += "Yüz";
      else str += ones[h] + "Yüz";
    }

    if (t > 0) str += tens[t];
    if (o > 0) str += ones[o];

    return str;
  }

  function convertLira(n: number): string {
    if (n === 0) return "Sıfır";
    let result = "";
    let groupIndex = 0;

    while (n > 0) {
      const group = n % 1000;
      if (group > 0) {
        let groupStr = convertGroup(group);
        if (groupIndex === 1 && group === 1) {
          // Special case for 1000: "Bin" instead of "BirBin"
          groupStr = "Bin";
        } else if (groupIndex > 0) {
          groupStr += thousands[groupIndex];
        }
        result = groupStr + result;
      }
      n = Math.floor(n / 1000);
      groupIndex++;
    }

    return result;
  }

  let text = convertLira(lira) + " Türk Lirası";
  if (kurus > 0) {
    text += " " + convertGroup(kurus) + " Kuruş";
  }

  return text;
}
