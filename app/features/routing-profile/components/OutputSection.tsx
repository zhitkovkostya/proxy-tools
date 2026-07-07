import { Download, FileCog } from "lucide-react";
import { AccentButton, CopyButton } from "~/components/ui/buttons";
import { downloadTextFile, sanitizeFilename } from "~/lib/download";
import type { GeneratedOutput } from "../types";

// The output pane's format switch. Its meaning depends on the client kind:
//   deeplink → "uri" (ready deeplink) / "json" (underlying payload)
//   conf     → "uri" (file: download .conf) / "json" (text: raw config)
type OutFmt = "uri" | "json";

// Renders the generated profile inside the right-hand "output" pane. The pane
// is a flex column: the content area scrolls when it overflows while the
// primary action button stays pinned at the bottom. When `singleLine` is set
// (deeplink/uri view) the payload is collapsed to a single line with an
// ellipsis — the base64 blob isn't worth reading, and it frees up space.
export function OutputSection({
  output,
  fmt,
  singleLine,
  copyLabel,
}: {
  output: GeneratedOutput;
  fmt: OutFmt;
  singleLine?: boolean;
  copyLabel: string;
}) {
  if (output.kind === "conf") {
    return <ConfOutput output={output} mode={fmt} />;
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="min-h-0 min-w-0 flex-1 overflow-auto">
        {singleLine ? (
          <div className="overflow-hidden text-ellipsis whitespace-nowrap text-fg">
            {output.text}
          </div>
        ) : (
          <pre className="whitespace-pre-wrap break-all text-fg">{output.text}</pre>
        )}
      </div>
      <CopyButton text={output.text} label={copyLabel} />
    </div>
  );
}

// Shadowrocket's two views, driven by the same corner switch as uri/json:
//   file → an icon + download-the-.conf button (import via the Files app)
//   text → the raw config text + copy button
// Both keep their primary button pinned while the content above scrolls.
function ConfOutput({
  output,
  mode,
}: {
  output: Extract<GeneratedOutput, { kind: "conf" }>;
  mode: OutFmt;
}) {
  const downloadConf = () => {
    downloadTextFile(output.text, `${sanitizeFilename(output.confName, "shadowrocket")}.conf`);
  };

  if (mode === "uri") {
    return (
      <div className="flex h-full min-h-0 flex-col gap-3">
        <div className="min-h-0 min-w-0 flex-1 space-y-3 overflow-auto">
          <div className="flex justify-center py-4 text-border-hi">
            <FileCog size={72} strokeWidth={1.25} />
          </div>
          <p className="leading-relaxed text-dim">
            После скачивания откройте файл в Файлах,
            нажмите «Поделиться» → «Shadowrocket» — конфиг подхватится как локальный.
          </p>
        </div>
        <AccentButton
          onClick={downloadConf}
          className="flex w-full items-center justify-center gap-2"
        >
          <Download size={14} /> скачать .conf
        </AccentButton>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="min-h-0 min-w-0 flex-1 overflow-auto">
        <pre className="whitespace-pre-wrap break-all text-fg">{output.text}</pre>
      </div>
      <CopyButton text={output.text} label="конфиг" />
    </div>
  );
}
