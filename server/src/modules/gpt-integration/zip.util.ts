const encoder = new TextEncoder();
const UTF8_FLAG = 0x0800;
const STORED_METHOD = 0;
const DOS_DATE_1980_01_01 = 0x0021;

type ZipFile = {
  name: string;
  content: string;
};

type PreparedEntry = {
  nameBytes: Uint8Array;
  contentBytes: Uint8Array;
  crc32: number;
  localOffset: number;
};

const CRC32_TABLE = Uint32Array.from({ length: 256 }, (_, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) {
    value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  }
  return value >>> 0;
});

export function buildStoredZip(files: ZipFile[]): Uint8Array {
  const entries = files.map(prepareEntry);
  const localSize = entries.reduce(
    (total, entry) => total + 30 + entry.nameBytes.length + entry.contentBytes.length,
    0,
  );
  const centralSize = entries.reduce(
    (total, entry) => total + 46 + entry.nameBytes.length,
    0,
  );
  const bytes = new Uint8Array(localSize + centralSize + 22);
  const view = new DataView(bytes.buffer);
  let offset = 0;

  for (const entry of entries) {
    entry.localOffset = offset;
    writeLocalHeader(view, offset, entry);
    offset += 30;
    bytes.set(entry.nameBytes, offset);
    offset += entry.nameBytes.length;
    bytes.set(entry.contentBytes, offset);
    offset += entry.contentBytes.length;
  }

  const centralOffset = offset;
  for (const entry of entries) {
    writeCentralHeader(view, offset, entry);
    offset += 46;
    bytes.set(entry.nameBytes, offset);
    offset += entry.nameBytes.length;
  }
  writeEnd(view, offset, entries.length, offset - centralOffset, centralOffset);
  return bytes;
}

function prepareEntry(file: ZipFile): PreparedEntry {
  const normalized = file.name.replaceAll('\\', '/');
  if (
    !normalized ||
    normalized.startsWith('/') ||
    normalized.split('/').some((part) => part === '..' || part === '.')
  ) {
    throw new Error(`Unsafe ZIP entry name: ${file.name}`);
  }
  const nameBytes = encoder.encode(normalized);
  const contentBytes = encoder.encode(file.content);
  return {
    nameBytes,
    contentBytes,
    crc32: crc32(contentBytes),
    localOffset: 0,
  };
}

function writeLocalHeader(view: DataView, offset: number, entry: PreparedEntry) {
  view.setUint32(offset, 0x04034b50, true);
  view.setUint16(offset + 4, 20, true);
  view.setUint16(offset + 6, UTF8_FLAG, true);
  view.setUint16(offset + 8, STORED_METHOD, true);
  view.setUint16(offset + 10, 0, true);
  view.setUint16(offset + 12, DOS_DATE_1980_01_01, true);
  view.setUint32(offset + 14, entry.crc32, true);
  view.setUint32(offset + 18, entry.contentBytes.length, true);
  view.setUint32(offset + 22, entry.contentBytes.length, true);
  view.setUint16(offset + 26, entry.nameBytes.length, true);
  view.setUint16(offset + 28, 0, true);
}

function writeCentralHeader(view: DataView, offset: number, entry: PreparedEntry) {
  view.setUint32(offset, 0x02014b50, true);
  view.setUint16(offset + 4, 20, true);
  view.setUint16(offset + 6, 20, true);
  view.setUint16(offset + 8, UTF8_FLAG, true);
  view.setUint16(offset + 10, STORED_METHOD, true);
  view.setUint16(offset + 12, 0, true);
  view.setUint16(offset + 14, DOS_DATE_1980_01_01, true);
  view.setUint32(offset + 16, entry.crc32, true);
  view.setUint32(offset + 20, entry.contentBytes.length, true);
  view.setUint32(offset + 24, entry.contentBytes.length, true);
  view.setUint16(offset + 28, entry.nameBytes.length, true);
  view.setUint16(offset + 30, 0, true);
  view.setUint16(offset + 32, 0, true);
  view.setUint16(offset + 34, 0, true);
  view.setUint16(offset + 36, 0, true);
  view.setUint32(offset + 38, 0, true);
  view.setUint32(offset + 42, entry.localOffset, true);
}

function writeEnd(
  view: DataView,
  offset: number,
  count: number,
  centralSize: number,
  centralOffset: number,
) {
  view.setUint32(offset, 0x06054b50, true);
  view.setUint16(offset + 4, 0, true);
  view.setUint16(offset + 6, 0, true);
  view.setUint16(offset + 8, count, true);
  view.setUint16(offset + 10, count, true);
  view.setUint32(offset + 12, centralSize, true);
  view.setUint32(offset + 16, centralOffset, true);
  view.setUint16(offset + 20, 0, true);
}

function crc32(bytes: Uint8Array): number {
  let checksum = 0xffffffff;
  for (const byte of bytes) {
    checksum = CRC32_TABLE[(checksum ^ byte) & 0xff] ^ (checksum >>> 8);
  }
  return (checksum ^ 0xffffffff) >>> 0;
}
