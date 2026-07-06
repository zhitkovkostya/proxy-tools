import { Download } from "lucide-react";
import { CopyButton, SecondaryButton } from "~/components/ui/buttons";
import { downloadTextFile, sanitizeFilename } from "~/lib/download";
import type { GeneratedOutput } from "../types";

// Renders the generated profile inside the right-hand "output" pane. When
// `singleLine` is set (deeplink/uri view) the payload is collapsed to a single
// line with an ellipsis — the base64 blob isn't worth reading, and it frees up
// vertical space.
export function OutputSection({
  output,
  singleLine,
}: {
  output: GeneratedOutput;
  singleLine?: boolean;
}) {
  const downloadConf = () => {
    if (output.kind !== "conf") return;
    downloadTextFile(output.text, `${sanitizeFilename(output.confName, "shadowrocket")}.conf`);
  };

  return (
    <div className="space-y-3">
      {output.kind === "conf" && (
        <>
          <SecondaryButton
            onClick={downloadConf}
            className="flex w-full items-center justify-center gap-2"
          >
            <Download size={14} /> скачать .conf
          </SecondaryButton>
          <p className="leading-relaxed text-dim">
            После скачивания откройте файл в Файлах (или в шторке загрузок Safari),
            нажмите «Поделиться» → «Shadowrocket» — конфиг подхватится как локальный.
          </p>
        </>
      )}

      {singleLine ? (
        <div className="overflow-hidden text-ellipsis whitespace-nowrap text-fg">
          {output.text}
        </div>
      ) : (
        <pre className="max-h-[52vh] overflow-auto whitespace-pre-wrap break-all text-fg">
          {output.text}
        </pre>
      )}
      <CopyButton text={output.text} label={output.copyLabel} />
    </div>
  );
}
