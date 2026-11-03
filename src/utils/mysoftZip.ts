/**
 * Extract the first file from a ZIP archive (stored method 0 or deflate method 8).
 * Handles both standard local file headers and .NET ZipArchive streams that use
 * general-purpose bit 3 (data descriptors where compressed size is stored in the
 * Central Directory at the end of the archive).
 */
export async function extractFirstFileFromZip(
  zipBytes: Uint8Array,
): Promise<{ name: string; bytes: Uint8Array } | null> {
  if (!isZipBytes(zipBytes)) return null;

  // Map filenames / offsets from Central Directory (0x02014b50) in case local header has compSize = 0
  const centralEntries = parseCentralDirectory(zipBytes);

  let offset = 0;
  let entryIndex = 0;
  while (offset + 30 <= zipBytes.length) {
    if (
      zipBytes[offset] !== 0x50 ||
      zipBytes[offset + 1] !== 0x4b ||
      zipBytes[offset + 2] !== 0x03 ||
      zipBytes[offset + 3] !== 0x04
    ) {
      break;
    }
    const flags = zipBytes[offset + 6] | (zipBytes[offset + 7] << 8);
    const method = zipBytes[offset + 8] | (zipBytes[offset + 9] << 8);
    let compSize = readUint32LE(zipBytes, offset + 18);
    const nameLen = zipBytes[offset + 26] | (zipBytes[offset + 27] << 8);
    const extraLen = zipBytes[offset + 28] | (zipBytes[offset + 29] << 8);
    const nameStart = offset + 30;
    const name = new TextDecoder().decode(
      zipBytes.slice(nameStart, nameStart + nameLen),
    );
    const dataStart = nameStart + nameLen + extraLen;

    // If bit 3 (data descriptor) is set or compSize is 0, look up size from Central Directory
    if (compSize === 0 || (flags & 0x08) !== 0) {
      const matched =
        centralEntries.find((e) => e.localHeaderOffset === offset || e.name === name) ||
        centralEntries[entryIndex];
      if (matched && matched.compSize > 0) {
        compSize = matched.compSize;
      } else {
        // Fallback: scan forward for next PK signature
        compSize = findNextPkSignature(zipBytes, dataStart) - dataStart;
      }
    }

    entryIndex += 1;

    // Skip directory entries
    if (name.endsWith("/") && compSize === 0) {
      offset = dataStart;
      continue;
    }

    const safeEnd = Math.min(zipBytes.length, dataStart + Math.max(0, compSize));
    const compressed = zipBytes.slice(dataStart, safeEnd);

    if (method === 0) {
      return { name, bytes: compressed };
    }
    if (method === 8 && typeof DecompressionStream !== "undefined") {
      const bytes = await inflateDeflateRaw(compressed);
      return { name, bytes };
    }

    offset = safeEnd;
  }
  return null;
}

function readUint32LE(bytes: Uint8Array, pos: number): number {
  return (
    (bytes[pos] |
      (bytes[pos + 1] << 8) |
      (bytes[pos + 2] << 16) |
      (bytes[pos + 3] << 24)) >>>
    0
  );
}

interface CentralDirectoryEntry {
  name: string;
  method: number;
  compSize: number;
  uncompSize: number;
  localHeaderOffset: number;
}

function parseCentralDirectory(zipBytes: Uint8Array): CentralDirectoryEntry[] {
  const entries: CentralDirectoryEntry[] = [];
  // Scan backwards for End of Central Directory (0x06054b50)
  const minEocdOffset = Math.max(0, zipBytes.length - 65557);
  let eocdOffset = -1;
  for (let i = zipBytes.length - 22; i >= minEocdOffset; i -= 1) {
    if (
      zipBytes[i] === 0x50 &&
      zipBytes[i + 1] === 0x4b &&
      zipBytes[i + 2] === 0x05 &&
      zipBytes[i + 3] === 0x06
    ) {
      eocdOffset = i;
      break;
    }
  }
  if (eocdOffset < 0) return entries;

  const cdOffset = readUint32LE(zipBytes, eocdOffset + 16);
  const totalEntries =
    zipBytes[eocdOffset + 10] | (zipBytes[eocdOffset + 11] << 8);

  let pos = cdOffset;
  for (let idx = 0; idx < totalEntries && pos + 46 <= zipBytes.length; idx += 1) {
    if (
      zipBytes[pos] !== 0x50 ||
      zipBytes[pos + 1] !== 0x4b ||
      zipBytes[pos + 2] !== 0x01 ||
      zipBytes[pos + 3] !== 0x02
    ) {
      break;
    }
    const method = zipBytes[pos + 10] | (zipBytes[pos + 11] << 8);
    const compSize = readUint32LE(zipBytes, pos + 20);
    const uncompSize = readUint32LE(zipBytes, pos + 24);
    const nameLen = zipBytes[pos + 28] | (zipBytes[pos + 29] << 8);
    const extraLen = zipBytes[pos + 30] | (zipBytes[pos + 31] << 8);
    const commentLen = zipBytes[pos + 32] | (zipBytes[pos + 33] << 8);
    const localHeaderOffset = readUint32LE(zipBytes, pos + 42);
    const name = new TextDecoder().decode(
      zipBytes.slice(pos + 46, pos + 46 + nameLen),
    );
    entries.push({ name, method, compSize, uncompSize, localHeaderOffset });
    pos += 46 + nameLen + extraLen + commentLen;
  }
  return entries;
}

function findNextPkSignature(zipBytes: Uint8Array, start: number): number {
  for (let i = start; i + 4 <= zipBytes.length; i += 1) {
    if (
      zipBytes[i] === 0x50 &&
      zipBytes[i + 1] === 0x4b &&
      ((zipBytes[i + 2] === 0x01 && zipBytes[i + 3] === 0x02) ||
        (zipBytes[i + 2] === 0x03 && zipBytes[i + 3] === 0x04) ||
        (zipBytes[i + 2] === 0x05 && zipBytes[i + 3] === 0x06) ||
        (zipBytes[i + 2] === 0x07 && zipBytes[i + 3] === 0x08))
    ) {
      return i;
    }
  }
  return zipBytes.length;
}

/**
 * Decompress raw deflate bytes without stream backpressure deadlocks.
 * Writing and reading MUST run concurrently so outputs > 16KB never stall.
 */
async function inflateDeflateRaw(input: Uint8Array): Promise<Uint8Array> {
  const stream = new DecompressionStream("deflate-raw");
  const writer = stream.writable.getWriter();
  const reader = stream.readable.getReader();

  const writePromise = (async () => {
    try {
      await writer.write(input as unknown as BufferSource);
      await writer.close();
    } catch {
      // Ignore trailing data descriptor bytes if stream finished early
      try {
        await writer.abort();
      } catch {}
    }
  })();

  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        chunks.push(value);
        total += value.length;
      }
    }
  } catch {
    // If we already decompressed valid chunks before hitting a trailing descriptor, keep them
    if (total === 0) throw new Error("ZIP deflate verisi çözümlenemedi.");
  }

  await writePromise;

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
