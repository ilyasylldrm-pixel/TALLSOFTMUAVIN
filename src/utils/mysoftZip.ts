/** Extract the first file from a ZIP (stored or deflate). Browser-native. */
export async function extractFirstFileFromZip(
  zipBytes: Uint8Array,
): Promise<{ name: string; bytes: Uint8Array } | null> {
  let offset = 0;
  while (offset + 30 <= zipBytes.length) {
    if (
      zipBytes[offset] !== 0x50 ||
      zipBytes[offset + 1] !== 0x4b ||
      zipBytes[offset + 2] !== 0x03 ||
      zipBytes[offset + 3] !== 0x04
    ) {
      break;
    }
    const method = zipBytes[offset + 8] | (zipBytes[offset + 9] << 8);
    const compSize =
      zipBytes[offset + 18] |
      (zipBytes[offset + 19] << 8) |
      (zipBytes[offset + 20] << 16) |
      (zipBytes[offset + 21] << 24);
    const nameLen = zipBytes[offset + 26] | (zipBytes[offset + 27] << 8);
    const extraLen = zipBytes[offset + 28] | (zipBytes[offset + 29] << 8);
    const nameStart = offset + 30;
    const name = new TextDecoder().decode(
      zipBytes.slice(nameStart, nameStart + nameLen),
    );
    const dataStart = nameStart + nameLen + extraLen;
    const compressed = zipBytes.slice(dataStart, dataStart + compSize);
    let bytes: Uint8Array;
    if (method === 0) {
      bytes = compressed;
    } else if (method === 8 && typeof DecompressionStream !== "undefined") {
      bytes = await inflateDeflateRaw(compressed);
    } else {
      offset = dataStart + compSize;
      continue;
    }
    return { name, bytes };
  }
  return null;
}

async function inflateDeflateRaw(input: Uint8Array): Promise<Uint8Array> {
  const stream = new DecompressionStream("deflate-raw");
  const writer = stream.writable.getWriter();
  await writer.write(input);
  await writer.close();
  const reader = stream.readable.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    total += value.length;
  }
  const out = new Uint8Array(total);
  let pos = 0;
  for (const chunk of chunks) {
    out.set(chunk, pos);
    pos += chunk.length;
  }
  return out;
}

export function isPdfBytes(bytes: Uint8Array): boolean {
  return (
    bytes.length >= 4 &&
    bytes[0] === 0x25 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x44 &&
    bytes[3] === 0x46
  );
}

export function isZipBytes(bytes: Uint8Array): boolean {
  return (
    bytes.length >= 4 &&
    bytes[0] === 0x50 &&
    bytes[1] === 0x4b &&
    (bytes[2] === 0x03 || bytes[2] === 0x05 || bytes[2] === 0x07)
  );
}
