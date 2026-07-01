import { useCallback, useState } from "react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { Check, Copy } from "lucide-react";

export function PrimaryButton(props: ComponentPropsWithoutRef<"button">) {
  return (
    <button
      {...props}
      className="flex-1 rounded-2xl bg-stone-900 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-stone-800 active:bg-stone-950"
    />
  );
}

export function SecondaryButton({
  className = "",
  ...props
}: ComponentPropsWithoutRef<"button">) {
  return (
    <button
      {...props}
      className={`rounded-2xl bg-stone-100 px-4 py-3 text-sm font-medium text-stone-600 ring-1 ring-stone-200 transition-colors hover:bg-stone-200 hover:text-stone-800 ${className}`}
    />
  );
}

// Copies text to the clipboard with a graceful fallback for insecure contexts.
async function copyText(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
    return;
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
  }
}

export function CopyButton({ text, label }: { text: string; label: ReactNode }) {
  const [copied, setCopied] = useState(false);
  const doCopy = useCallback(async () => {
    await copyText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  }, [text]);

  return (
    <SecondaryButton
      onClick={doCopy}
      className="flex w-full items-center justify-center gap-2"
    >
      {copied ? <Check size={14} className="text-orange-600" /> : <Copy size={14} />}
      {copied ? "Скопировано" : <>Скопировать {label}</>}
    </SecondaryButton>
  );
}
