import { Card } from "~/components/ui/Card";
import { Select, Switch, TextInput } from "~/components/ui/inputs";
import type { ActiveId, FieldKey } from "../field-info";
import { DNS_TYPE_OPTIONS } from "../options";
import type { ProfileStore } from "../useProfileState";
import { FieldRow } from "./FieldLabel";
import { RuleEditor } from "./RuleEditor";

interface SectionProps {
  store: ProfileStore;
  activeKey: ActiveId | null;
  onActivate: (id: ActiveId) => void;
}

const SubLabel = ({ children }: { children: string }) => (
  <div className="sep px-2 pt-2 pb-0.5 text-[11px] uppercase tracking-wider text-dim">
    ── {children}
  </div>
);

// Client-agnostic fields — name, DNS, private-IP toggle, geo sources. These
// never reset when switching clients.
export function SharedSection({ store, activeKey, onActivate }: SectionProps) {
  const { state, set } = store;
  const dohOrDot = state.dnsType === "DoH" || state.dnsType === "DoT";
  const rowProps = (key: FieldKey) => ({
    fieldKey: key,
    active: activeKey === key,
    onActivate,
  });
  return (
    <Card title="config: общее" badge="не сбрасывается" accent>
      <FieldRow {...rowProps("name")}>
        <TextInput
          value={state.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder="Мой профиль"
        />
      </FieldRow>

      <SubLabel>DNS</SubLabel>
      <FieldRow {...rowProps("dnsType")}>
        <Select
          value={state.dnsType}
          onChange={(v) => set("dnsType", v)}
          options={DNS_TYPE_OPTIONS}
        />
      </FieldRow>
      <FieldRow {...rowProps("dnsPrimary")}>
        <TextInput
          value={state.dnsPrimary}
          onChange={(e) => set("dnsPrimary", e.target.value)}
          placeholder="8.8.8.8"
        />
      </FieldRow>
      <FieldRow {...rowProps("dnsPrimaryUrl")} disabled={!dohOrDot}>
        <TextInput
          value={state.dnsPrimaryUrl}
          onChange={(e) => set("dnsPrimaryUrl", e.target.value)}
          placeholder="https://dns.google/dns-query"
        />
      </FieldRow>
      <FieldRow {...rowProps("dnsFallback")}>
        <TextInput
          value={state.dnsFallback}
          onChange={(e) => set("dnsFallback", e.target.value)}
          placeholder="1.1.1.1"
        />
      </FieldRow>
      <FieldRow {...rowProps("dnsFallbackUrl")} disabled={!dohOrDot}>
        <TextInput
          value={state.dnsFallbackUrl}
          onChange={(e) => set("dnsFallbackUrl", e.target.value)}
          placeholder="https://cloudflare-dns.com/dns-query"
        />
      </FieldRow>

      <SubLabel>сеть</SubLabel>
      <FieldRow {...rowProps("privateDirect")} label="Приватные IP">
        <Switch
          checked={state.privateDirect}
          onChange={(v) => set("privateDirect", v)}
        />
      </FieldRow>

      <SubLabel>гео-источники</SubLabel>
      <FieldRow {...rowProps("geoipUrl")}>
        <TextInput
          value={state.geoipUrl}
          onChange={(e) => set("geoipUrl", e.target.value)}
          placeholder="https://github.com/v2fly/geoip/releases/latest/download/geoip.dat"
        />
      </FieldRow>
      <FieldRow {...rowProps("geositeUrl")}>
        <TextInput
          value={state.geositeUrl}
          onChange={(e) => set("geositeUrl", e.target.value)}
          placeholder="https://github.com/v2fly/domain-list-community/releases/latest/download/dlc.dat"
        />
      </FieldRow>
    </Card>
  );
}

// The shared rule editor, also never reset on client switch.
export function RulesSection({ store, activeKey, onActivate }: SectionProps) {
  const { state, set } = store;
  return (
    <Card title="config: правила" badge="не сбрасывается" accent>
      <RuleEditor
        rules={state.rules}
        onChange={(updater) => set("rules", updater)}
        activeKey={activeKey}
        onActivate={onActivate}
      />
    </Card>
  );
}
