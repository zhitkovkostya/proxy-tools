// Apple binary property list (bplist00) encoder.
//
// Ported from bplist-creator (MIT) and reworked to run in the browser with
// Uint8Array instead of Node Buffer. Supports the subset needed for routing
// payloads: dict, array, string (ASCII + UTF-16 BE for Cyrillic), int, float,
// boolean. Verified byte-for-byte against Python's plistlib and against a real
// deep link exported from the Streisand app.

type PlistValue =
  | string
  | number
  | boolean
  | readonly PlistValue[]
  | { readonly [key: string]: PlistValue | undefined };

type Entry =
  | { type: "string" | "stringref"; value: string; id?: number }
  | { type: "number"; value: number; id?: number }
  | { type: "boolean"; value: boolean; id?: number }
  | { type: "array"; entries: Entry[]; id?: number }
  | { type: "dict"; entryKeys: Entry[]; entryValues: Entry[]; id?: number };

const asciiBytes = (str: string): Uint8Array => {
  const a = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) a[i] = str.charCodeAt(i);
  return a;
};

const mustBeUtf16 = (str: string): boolean => {
  for (let i = 0; i < str.length; i++) if (str.charCodeAt(i) > 0x7f) return true;
  return false;
};

const utf16BEBytes = (str: string): Uint8Array => {
  const a = new Uint8Array(str.length * 2);
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i);
    a[i * 2] = (c >> 8) & 0xff;
    a[i * 2 + 1] = c & 0xff;
  }
  return a;
};

const bytesForValue = (
  value: number,
  bytes: number,
  isSignedNegative = false,
): Uint8Array => {
  const buf = new Uint8Array(bytes);
  let z = 0;
  let b = bytes;
  while (b > 4) {
    buf[z++] = isSignedNegative ? 0xff : 0;
    b--;
  }
  for (let i = b - 1; i >= 0; i--) buf[z++] = (value >> (8 * i)) & 0xff;
  return buf;
};

// Flatten a value tree into a linear list of entries, appending in the order
// the reference implementation produces so offsets match byte-for-byte.
function toEntries(val: PlistValue): Entry[] {
  if (Array.isArray(val)) {
    const results: Entry[] = [{ type: "array", entries: [] }];
    const root = results[0] as Extract<Entry, { type: "array" }>;
    val.forEach((v) => {
      const entry = toEntries(v);
      root.entries.push(entry[0]);
      results.push(...entry);
    });
    return results;
  }
  if (val !== null && typeof val === "object") {
    // Array.isArray already returned above; narrow the readonly union to a dict.
    const dict = val as { readonly [key: string]: PlistValue | undefined };
    const results: Entry[] = [{ type: "dict", entryKeys: [], entryValues: [] }];
    const root = results[0] as Extract<Entry, { type: "dict" }>;
    const keys = Object.keys(dict).filter((k) => dict[k] !== undefined);
    keys.forEach((key) => {
      const ek = toEntries(key);
      root.entryKeys.push(ek[0]);
      results.push(ek[0]);
    });
    keys.forEach((key) => {
      const ev = toEntries(dict[key]!);
      root.entryValues.push(ev[0]);
      results.push(...ev);
    });
    return results;
  }
  if (typeof val === "string") return [{ type: "string", value: val }];
  if (typeof val === "number") return [{ type: "number", value: val }];
  if (typeof val === "boolean") return [{ type: "boolean", value: val }];
  throw new Error(`bplistEncode: unhandled value ${String(val)}`);
}

// Assign object ids, deduplicating identical strings (bplist stores each unique
// string once and references it by id).
function assignIds(entries: Entry[]): Entry[] {
  const strings: Record<string, number> = {};
  let entryId = 0;
  entries.forEach((entry) => {
    if (entry.id !== undefined) return;
    if (entry.type === "string") {
      if (Object.prototype.hasOwnProperty.call(strings, entry.value)) {
        entry.type = "stringref";
        entry.id = strings[entry.value];
      } else {
        strings[entry.value] = entry.id = entryId++;
      }
    } else {
      entry.id = entryId++;
    }
  });
  return entries.filter((e) => e.type !== "stringref");
}

const idSize = (n: number): number => (n < 256 ? 1 : n < 65536 ? 2 : 4);
const offsetSize = (maxOffset: number): number =>
  maxOffset < 256 ? 1 : maxOffset < 65536 ? 2 : maxOffset < 4294967296 ? 4 : 8;

export function bplistEncode(rootObj: PlistValue): Uint8Array {
  const chunks: Uint8Array[] = [];
  let size = 0;
  const pushBytes = (b: Uint8Array) => {
    chunks.push(b);
    size += b.length;
  };
  const pushByte = (b: number) => pushBytes(new Uint8Array([b & 0xff]));

  const entries = assignIds(toEntries(rootObj));
  const idSizeInBytes = idSize(entries.length);
  const writeID = (id: number) => pushBytes(bytesForValue(id, idSizeInBytes));

  const writeIntHeader = (kind: number, value: number) => {
    if (value < 15) {
      pushByte((kind << 4) + value);
    } else if (value < 256) {
      pushByte((kind << 4) + 15);
      pushByte(0x10);
      pushBytes(bytesForValue(value, 1));
    } else if (value < 65536) {
      pushByte((kind << 4) + 15);
      pushByte(0x11);
      pushBytes(bytesForValue(value, 2));
    } else {
      pushByte((kind << 4) + 15);
      pushByte(0x12);
      pushBytes(bytesForValue(value, 4));
    }
  };

  const write = (entry: Entry) => {
    switch (entry.type) {
      case "dict":
        writeIntHeader(0xd, entry.entryKeys.length);
        entry.entryKeys.forEach((e) => writeID(e.id!));
        entry.entryValues.forEach((e) => writeID(e.id!));
        return;
      case "array":
        writeIntHeader(0xa, entry.entries.length);
        entry.entries.forEach((e) => writeID(e.id!));
        return;
      case "string":
        if (mustBeUtf16(entry.value)) {
          writeIntHeader(0x6, entry.value.length);
          pushBytes(utf16BEBytes(entry.value));
        } else {
          writeIntHeader(0x5, entry.value.length);
          pushBytes(asciiBytes(entry.value));
        }
        return;
      case "boolean":
        pushByte(entry.value ? 0x09 : 0x08);
        return;
      case "number": {
        const v = entry.value;
        if (Number.isInteger(v)) {
          if (v < 0) {
            pushByte(0x13);
            pushBytes(bytesForValue(v, 8, true));
          } else if (v <= 0xff) {
            pushByte(0x10);
            pushBytes(bytesForValue(v, 1));
          } else if (v <= 0xffff) {
            pushByte(0x11);
            pushBytes(bytesForValue(v, 2));
          } else if (v <= 0xffffffff) {
            pushByte(0x12);
            pushBytes(bytesForValue(v, 4));
          } else {
            pushByte(0x13);
            pushBytes(bytesForValue(v, 8));
          }
        } else {
          pushByte(0x23);
          const buf = new Uint8Array(8);
          new DataView(buf.buffer).setFloat64(0, v, false);
          pushBytes(buf);
        }
        return;
      }
      default:
        throw new Error(`bplistEncode: unhandled entry type`);
    }
  };

  pushBytes(asciiBytes("bplist00"));
  const offsets: number[] = [];
  entries.forEach((entry, idx) => {
    offsets[idx] = size;
    write(entry);
  });

  const offsetTableOffset = size;
  const offsetSizeInBytes = offsetSize(offsetTableOffset);
  offsets.forEach((offset) => pushBytes(bytesForValue(offset, offsetSizeInBytes)));

  // trailer
  pushBytes(new Uint8Array(6));
  pushByte(offsetSizeInBytes);
  pushByte(idSizeInBytes);
  pushBytes(bytesForValue(entries.length, 8));
  pushBytes(bytesForValue(0, 8));
  pushBytes(bytesForValue(offsetTableOffset, 8));

  const out = new Uint8Array(size);
  let pos = 0;
  for (const c of chunks) {
    out.set(c, pos);
    pos += c.length;
  }
  return out;
}
