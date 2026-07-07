import { useCallback, useState } from "react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { Check, Copy } from "lucide-react";

export function PrimaryButton(props: ComponentPropsWithoutRef<"button">) {
  return (
    <button
      {...props}
      className="rounded-sm border border-border-hi bg-pane2 px-3 py-1.5 text-fg outline-none transition-colors hover:border-yellow hover:text-yellow"
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
      className={`rounded-sm border border-border bg-transparent px-3 py-1.5 text-dim outline-none transition-colors hover:border-border-hi hover:text-fg ${className}`}
    />
  );
}

// Filled call-to-action button (yellow fill, dark text). Used for the main
// copy/download action in the output pane.
export function AccentButton({
  className = "",
  ...props
}: ComponentPropsWithoutRef<"button">) {
  return (
    <button
      {...props}
      className={`rounded-sm border border-yellow bg-yellow px-3 py-1.5 font-medium text-bg outline-none transition-colors hover:bg-transparent hover:text-yellow ${className}`}
    />
  );
}

// Copies text to the clipboard with a graceful fallback for insecure contexts.
export async function copyText(text: string): Promise<void> {
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
    <AccentButton
      onClick={doCopy}
      className="flex w-full items-center justify-center gap-2"
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
      {copied ? "скопировано" : <>копировать {label}</>}
    </AccentButton>
  );
}
