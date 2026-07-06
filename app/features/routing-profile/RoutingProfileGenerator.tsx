import { RotateCcw } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { Tabs } from "~/components/ui/Tabs";
import { SecondaryButton, copyText } from "~/components/ui/buttons";
import { generateOutput } from "./builders";
import { CLIENT_TABS } from "./clients";
import { ClientSettings } from "./components/ClientSettings";
import { FieldInfoPanel } from "./components/FieldInfoPanel";
import { OutputSection } from "./components/OutputSection";
import { RulesSection, SharedSection } from "./components/SharedSection";
import { FIELD_INFO, type FieldKey } from "./field-info";
import type { ClientId } from "./types";
import { useProfileState } from "./useProfileState";
import { useTuiKeyboard } from "./useTuiKeyboard";

// uri  → the ready-to-import deeplink (or the .conf text for Shadowrocket)
// json → the underlying JSON / plist-preview text
type OutFmt = "uri" | "json";

export function RoutingProfileGenerator() {
  const store = useProfileState();
  const [activeClient, setActiveClient] = useState<ClientId>("happ");
  const [activeKey, setActiveKey] = useState<FieldKey | null>(null);
  const [fmt, setFmt] = useState<OutFmt>("uri");
  const rowsRef = useRef<HTMLDivElement>(null);

  const selectClient = (id: ClientId) => setActiveClient(id);

  // Live output: recompute on every state change so the right pane never empties.
  const output = useMemo(
    () => generateOutput(activeClient, store.state),
    [activeClient, store.state],
  );

  // For deeplink clients, `uri` shows the ready deeplink and `json` shows the
  // underlying payload text; Shadowrocket has only the .conf text (toggle hidden).
  const shownText =
    output.kind === "deeplink" && fmt === "uri" ? output.deepLink : output.text;
  const shownOutput = { ...output, text: shownText };

  const copyCurrent = () => void copyText(shownText);
  const toggleFmt = () => setFmt((f) => (f === "uri" ? "json" : "uri"));

  // Keyboard navigation (↑↓ ←→ enter, c/f) ported from the mock.
  useTuiKeyboard({
    containerRef: rowsRef,
    activeKey,
    setActiveKey,
    onCopy: copyCurrent,
    onToggleFormat: toggleFmt,
  });

  const info = activeKey ? FIELD_INFO[activeKey] : null;
  const canToggleFmt = output.kind === "deeplink";

  return (
    <div className="flex h-screen flex-col p-5">
      <div className="relative mx-auto flex min-h-0 w-full max-w-[1120px] flex-col rounded-sm border border-border-hi px-4 pb-2.5 pt-4">
        <div className="absolute -top-[0.72em] left-4 bg-bg px-2 text-blue">
          proxy-config <span className="text-dim">·</span>{" "}
          <span className="text-fg">{activeClient}</span>
        </div>

        <div className="mb-3 mt-1 shrink-0">
          <Tabs tabs={CLIENT_TABS} active={activeClient} onChange={selectClient} />
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-5 lg:grid-cols-[1.05fr_1fr]">
          {/* ── форма ── */}
          <section
            ref={rowsRef}
            className="min-h-0 overflow-auto pr-1 pt-1"
          >
            <SharedSection store={store} activeKey={activeKey} onActivate={setActiveKey} />
            <RulesSection store={store} activeKey={activeKey} onActivate={setActiveKey} />
            <ClientSettings
              client={activeClient}
              store={store}
              activeKey={activeKey}
              onActivate={setActiveKey}
            />
            <div className="px-2 pb-2">
              <SecondaryButton
                onClick={store.reset}
                className="flex w-full items-center justify-center gap-2"
              >
                <RotateCcw size={13} /> сбросить все поля
              </SecondaryButton>
            </div>
          </section>

          {/* ── вывод + info ── */}
          <section className="flex min-h-0 flex-col gap-5 overflow-auto pt-1">
            <div className="relative shrink-0 rounded-sm border border-border bg-pane px-3 pb-3 pt-3.5 pt-1">
              <div className="absolute -top-[0.72em] left-3 bg-pane px-1.5 text-blue text-xs">
                output
              </div>
              {canToggleFmt && (
                <div className="absolute -top-[0.72em] right-3 bg-pane px-1.5 text-xs">
                  <button
                    onClick={() => setFmt("uri")}
                    className={fmt === "uri" ? "text-yellow" : "text-dim"}
                  >
                    uri
                  </button>
                  <span className="text-border-hi"> / </span>
                  <button
                    onClick={() => setFmt("json")}
                    className={fmt === "json" ? "text-yellow" : "text-dim"}
                  >
                    json
                  </button>
                </div>
              )}
              <OutputSection output={shownOutput} singleLine={canToggleFmt && fmt === "uri"} />
            </div>

            <div className="relative shrink-0 rounded-sm border border-border bg-pane px-3 pb-3 pt-3.5">
              <div className="absolute -top-[0.72em] left-3 bg-pane px-1.5 text-blue text-xs">
                info
              </div>
              <FieldInfoPanel info={info} />
            </div>
          </section>
        </div>

        <StatusBar />
      </div>
    </div>
  );
}

function StatusBar() {
  return (
    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-border pt-2 text-dim">
      <span>
        <span className="text-blue">↑↓</span> строка
      </span>
      <span>
        <span className="text-blue">←→</span> сменить
      </span>
      <span>
        <span className="text-yellow">⏎</span> дальше
      </span>
      <span>
        <span className="text-yellow">esc</span> из поля
      </span>
      <span>
        <span className="text-yellow">c</span> копировать
      </span>
      <span>
        <span className="text-yellow">f</span> формат
      </span>
    </div>
  );
}
