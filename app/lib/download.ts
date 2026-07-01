// Trigger a client-side file download via a temporary object URL.
export function downloadTextFile(text: string, filename: string): void {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

// Keep letters/numbers/underscore/hyphen (Unicode-aware), collapse the rest.
export function sanitizeFilename(name: string, fallback: string): string {
  return (name || fallback).replace(/[^\p{L}\p{N}_-]+/gu, "_");
}
