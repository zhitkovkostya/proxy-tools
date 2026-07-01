// Encoding helpers shared by every client builder.

// btoa only handles latin1, so Cyrillic text must be UTF-8 encoded first.
export function utf8ToBase64(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary);
}

export function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary);
}

// Uppercase RFC 4122 v4 UUID. Streisand and v2RayTun require a UUID inside the
// rule objects; generated client-side at profile-build time.
export function uuidv4(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx"
    .replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    })
    .toUpperCase();
}

// Split a textarea value into trimmed, non-empty lines.
export function linesOf(str: string): string[] {
  return str
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}
