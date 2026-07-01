import { useState } from "react";
import { Tabs } from "~/components/ui/Tabs";
import { PrimaryButton, SecondaryButton } from "~/components/ui/buttons";
import { generateOutput } from "./builders";
import { CLIENT_ALERTS, CLIENT_TABS } from "./clients";
import { ClientSettings } from "./components/ClientSettings";
import { InfoDrawer } from "./components/InfoDrawer";
import { OutputSection } from "./components/OutputSection";
import { RulesSection, SharedSection } from "./components/SharedSection";
import type { FieldInfo } from "./field-info";
import type { ClientId, GeneratedOutput } from "./types";
import { useProfileState } from "./useProfileState";

export function RoutingProfileGenerator() {
  const store = useProfileState();
  const [activeClient, setActiveClient] = useState<ClientId>("happ");
  const [drawerInfo, setDrawerInfo] = useState<FieldInfo | null>(null);
  const [output, setOutput] = useState<GeneratedOutput | null>(null);

  const selectClient = (id: ClientId) => {
    setActiveClient(id);
    setOutput(null); // output is client-specific; clear on switch
  };

  const generate = () => setOutput(generateOutput(activeClient, store.state));
  const reset = () => {
    store.reset();
    setOutput(null);
  };

  return (
    <div className="min-h-screen bg-stone-100 px-4 py-6 font-sans text-stone-800">
      <div className="mx-auto max-w-xl">
        <header className="mb-5">
          <h1 className="text-lg font-bold tracking-tight text-stone-900">
            routing profile generator
          </h1>
          <p className="text-xs text-stone-500">
            happ · streisand · v2raytun · shadowrocket (iOS)
          </p>
        </header>

        <Tabs tabs={CLIENT_TABS} active={activeClient} onChange={selectClient} />

        <div className="mb-4 rounded-2xl bg-amber-50 px-4 py-3 ring-1 ring-amber-200">
          <ul className="space-y-1">
            {CLIENT_ALERTS[activeClient].map((line, i) => (
              <li
                key={i}
                className="flex gap-2 text-xs leading-relaxed text-amber-900"
              >
                <span className="mt-0.5 shrink-0 text-amber-400">•</span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>

        <SharedSection store={store} onInfo={setDrawerInfo} />
        <RulesSection store={store} onInfo={setDrawerInfo} />
        <ClientSettings client={activeClient} store={store} onInfo={setDrawerInfo} />

        <div className="mb-5 flex gap-2.5">
          <PrimaryButton onClick={generate}>сгенерировать профиль</PrimaryButton>
          <SecondaryButton onClick={reset}>сброс</SecondaryButton>
        </div>

        {output && <OutputSection output={output} />}

        <footer className="mt-4 pb-2" />
      </div>

      <InfoDrawer
        open={!!drawerInfo}
        onClose={() => setDrawerInfo(null)}
        info={drawerInfo}
      />
    </div>
  );
}
