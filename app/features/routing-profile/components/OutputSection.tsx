import { Download } from "lucide-react";
import { Card } from "~/components/ui/Card";
import { CopyButton, SecondaryButton } from "~/components/ui/buttons";
import { downloadTextFile, sanitizeFilename } from "~/lib/download";
import type { GeneratedOutput } from "../types";

export function OutputSection({ output }: { output: GeneratedOutput }) {
  const downloadConf = () => {
    if (output.kind !== "conf") return;
    downloadTextFile(output.text, `${sanitizeFilename(output.confName, "shadowrocket")}.conf`);
  };

  return (
    <div className="space-y-4">
      {output.kind === "deeplink" && (
        <Card title="deep link">
          <div className="break-all rounded-2xl bg-stone-900 px-4 py-3 font-mono text-[11px] leading-relaxed text-orange-300">
            {output.deepLink}
          </div>
          <CopyButton text={output.deepLink} label="ссылку" />
        </Card>
      )}

      {output.kind === "conf" && (
        <Card title=".conf файл">
          <SecondaryButton
            onClick={downloadConf}
            className="flex w-full items-center justify-center gap-2"
          >
            <Download size={14} /> скачать .conf
          </SecondaryButton>
          <div className="rounded-2xl bg-orange-50 px-4 py-3 text-[11px] leading-relaxed text-orange-900 ring-1 ring-orange-200">
            После скачивания откройте файл в Файлах (или в шторке загрузок Safari),
            нажмите «Поделиться» → «Shadowrocket» — конфиг подхватится как локальный.
          </div>
        </Card>
      )}

      <Card title={output.kind === "conf" ? ".conf (превью)" : "JSON"}>
        <pre className="max-h-80 overflow-auto whitespace-pre-wrap break-words rounded-2xl bg-stone-900 px-4 py-3 font-mono text-[11px] leading-relaxed text-stone-200">
          {output.text}
        </pre>
        <CopyButton text={output.text} label={output.copyLabel} />
      </Card>
    </div>
  );
}
