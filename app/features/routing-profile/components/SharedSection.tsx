import { Card } from "~/components/ui/Card";
import { Select, Switch, TextInput } from "~/components/ui/inputs";
import type { FieldInfo } from "../field-info";
import { DNS_TYPE_OPTIONS } from "../options";
import type { ProfileStore } from "../useProfileState";
import { FieldLabel } from "./FieldLabel";
import { RuleEditor } from "./RuleEditor";

interface SectionProps {
  store: ProfileStore;
  onInfo: (info: FieldInfo) => void;
}

const SubLabel = ({ children }: { children: string }) => (
  <div className="pt-1 text-[10px] font-medium uppercase tracking-wide text-stone-400">
    {children}
  </div>
);

// Client-agnostic fields — name, DNS, private-IP toggle, geo sources. These
// never reset when switching clients.
export function SharedSection({ store, onInfo }: SectionProps) {
  const { state, set } = store;
  return (
    <Card title="общее для всех клиентов" badge="не сбрасывается" accent>
      <div>
        <FieldLabel fieldKey="name" onInfo={onInfo} />
        <TextInput value={state.name} onChange={(e) => set("name", e.target.value)} />
      </div>

      <SubLabel>DNS</SubLabel>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <FieldLabel fieldKey="dnsPrimary" onInfo={onInfo} />
          <TextInput
            value={state.dnsPrimary}
            onChange={(e) => set("dnsPrimary", e.target.value)}
          />
        </div>
        <div>
          <FieldLabel fieldKey="dnsPrimaryUrl" onInfo={onInfo} />
          <TextInput
            value={state.dnsPrimaryUrl}
            onChange={(e) => set("dnsPrimaryUrl", e.target.value)}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <FieldLabel fieldKey="dnsFallback" onInfo={onInfo} />
          <TextInput
            value={state.dnsFallback}
            onChange={(e) => set("dnsFallback", e.target.value)}
          />
        </div>
        <div>
          <FieldLabel fieldKey="dnsFallbackUrl" onInfo={onInfo} />
          <TextInput
            value={state.dnsFallbackUrl}
            onChange={(e) => set("dnsFallbackUrl", e.target.value)}
          />
        </div>
      </div>
      <div>
        <FieldLabel fieldKey="dnsType" onInfo={onInfo} />
        <Select
          value={state.dnsType}
          onChange={(v) => set("dnsType", v)}
          options={DNS_TYPE_OPTIONS}
        />
      </div>

      <SubLabel>сеть</SubLabel>
      <div className="flex items-center justify-between rounded-xl bg-stone-50 px-3 py-2.5 ring-1 ring-stone-200">
        <FieldLabel fieldKey="privateDirect" onInfo={onInfo}>
          <span className="text-xs font-medium text-stone-700">Приватные IP напрямую</span>
        </FieldLabel>
        <Switch
          checked={state.privateDirect}
          onChange={(v) => set("privateDirect", v)}
        />
      </div>

      <SubLabel>движок / гео-источники</SubLabel>
      <div>
        <FieldLabel fieldKey="geoipUrl" onInfo={onInfo} />
        <TextInput value={state.geoipUrl} onChange={(e) => set("geoipUrl", e.target.value)} />
      </div>
      <div>
        <FieldLabel fieldKey="geositeUrl" onInfo={onInfo} />
        <TextInput
          value={state.geositeUrl}
          onChange={(e) => set("geositeUrl", e.target.value)}
        />
      </div>
    </Card>
  );
}

// The shared rule editor, also never reset on client switch.
export function RulesSection({ store, onInfo }: SectionProps) {
  const { state, set } = store;
  return (
    <Card title="правила маршрутизации" badge="не сбрасывается" accent>
      <RuleEditor
        rules={state.rules}
        onChange={(updater) => set("rules", updater)}
        onInfo={onInfo}
      />
    </Card>
  );
}
