import { Plus, X } from "lucide-react";
import { Card } from "~/components/ui/Card";
import { Select, Switch, TextArea, TextInput } from "~/components/ui/inputs";
import type { FieldInfo } from "../field-info";
import {
  BOOL_OPTIONS,
  DOMAIN_MATCHER_OPTIONS,
  DOMAIN_STRATEGY_OPTIONS,
  ROUTE_ORDER_OPTIONS,
  UDP_POLICY_OPTIONS,
} from "../options";
import type { ClientId } from "../types";
import type { ProfileStore } from "../useProfileState";
import { FieldLabel } from "./FieldLabel";

interface SectionProps {
  store: ProfileStore;
  onInfo: (info: FieldInfo) => void;
}

const toggleRow = "flex items-center justify-between rounded-xl bg-stone-50 px-3 py-2.5 ring-1 ring-stone-200";

function HappSettings({ store, onInfo }: SectionProps) {
  const { state, set } = store;
  return (
    <>
      <Card title="happ — параметры движка">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <FieldLabel fieldKey="domainStrategy" onInfo={onInfo} />
            <Select
              value={state.domainStrategy}
              onChange={(v) => set("domainStrategy", v)}
              options={DOMAIN_STRATEGY_OPTIONS}
            />
          </div>
          <div>
            <FieldLabel fieldKey="routeOrder" onInfo={onInfo} />
            <Select
              value={state.routeOrder}
              onChange={(v) => set("routeOrder", v)}
              options={ROUTE_ORDER_OPTIONS}
            />
          </div>
        </div>
        <div className={toggleRow}>
          <FieldLabel fieldKey="globalProxy" onInfo={onInfo}>
            <span className="text-xs font-medium text-stone-700">GlobalProxy</span>
          </FieldLabel>
          <Switch checked={state.globalProxy} onChange={(v) => set("globalProxy", v)} />
        </div>
        <div className={toggleRow}>
          <FieldLabel fieldKey="fakeDns" onInfo={onInfo}>
            <span className="text-xs font-medium text-stone-700">FakeDns</span>
          </FieldLabel>
          <Switch checked={state.fakeDns} onChange={(v) => set("fakeDns", v)} />
        </div>
        <div className={toggleRow}>
          <FieldLabel fieldKey="useChunkFiles" onInfo={onInfo}>
            <span className="text-xs font-medium text-stone-700">UseChunkFiles</span>
          </FieldLabel>
          <Switch checked={state.useChunkFiles} onChange={(v) => set("useChunkFiles", v)} />
        </div>
      </Card>

      <Card title="happ — дополнительные списки">
        <div>
          <FieldLabel fieldKey="blockSites" onInfo={onInfo} />
          <TextArea
            value={state.blockSites}
            onChange={(e) => set("blockSites", e.target.value)}
          />
        </div>
        <div>
          <FieldLabel fieldKey="blockIp" onInfo={onInfo} />
          <TextArea value={state.blockIp} onChange={(e) => set("blockIp", e.target.value)} />
        </div>
        <div>
          <FieldLabel fieldKey="dnsHosts" onInfo={onInfo} />
          <div className="space-y-2">
            {state.dnsHosts.map((row, idx) => (
              <div key={idx} className="flex gap-2">
                <TextInput
                  value={row.host}
                  placeholder="dns.google"
                  onChange={(e) =>
                    set("dnsHosts", (hs) =>
                      hs.map((h, i) => (i === idx ? { ...h, host: e.target.value } : h)),
                    )
                  }
                />
                <TextInput
                  value={row.ip}
                  placeholder="8.8.8.8"
                  onChange={(e) =>
                    set("dnsHosts", (hs) =>
                      hs.map((h, i) => (i === idx ? { ...h, ip: e.target.value } : h)),
                    )
                  }
                />
                <button
                  onClick={() => set("dnsHosts", (hs) => hs.filter((_, i) => i !== idx))}
                  className="flex shrink-0 items-center justify-center rounded-xl px-2 text-stone-400 hover:bg-red-50 hover:text-red-600"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
            <button
              onClick={() => set("dnsHosts", (hs) => [...hs, { host: "", ip: "" }])}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-stone-300 py-2 text-xs font-medium text-stone-500 hover:border-orange-400 hover:text-orange-600"
            >
              <Plus size={12} /> добавить запись
            </button>
          </div>
        </div>
      </Card>
    </>
  );
}

function V2RayTunSettings({ store, onInfo }: SectionProps) {
  const { state, set } = store;
  return (
    <Card title="v2RayTun — параметры движка">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <FieldLabel fieldKey="v2DomainStrategy" onInfo={onInfo} />
          <Select
            value={state.v2DomainStrategy}
            onChange={(v) => set("v2DomainStrategy", v)}
            options={DOMAIN_STRATEGY_OPTIONS}
          />
        </div>
        <div>
          <FieldLabel fieldKey="v2DomainMatcher" onInfo={onInfo} />
          <Select
            value={state.v2DomainMatcher}
            onChange={(v) => set("v2DomainMatcher", v)}
            options={DOMAIN_MATCHER_OPTIONS}
          />
        </div>
      </div>
    </Card>
  );
}

function ShadowrocketSettings({ store, onInfo }: SectionProps) {
  const { state, set } = store;
  return (
    <>
      <Card title="Shadowrocket — [General]">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <FieldLabel fieldKey="srIpv6" onInfo={onInfo} />
            <Select
              value={state.srIpv6 as "true" | "false"}
              onChange={(v) => set("srIpv6", v)}
              options={BOOL_OPTIONS}
            />
          </div>
          <div>
            <FieldLabel fieldKey="srUdpPolicy" onInfo={onInfo} />
            <Select
              value={state.srUdpPolicy}
              onChange={(v) => set("srUdpPolicy", v)}
              options={UDP_POLICY_OPTIONS}
            />
          </div>
        </div>
        <div>
          <FieldLabel fieldKey="srTunExcluded" onInfo={onInfo} />
          <TextArea
            value={state.srTunExcluded}
            onChange={(e) => set("srTunExcluded", e.target.value)}
          />
        </div>
        <div>
          <FieldLabel fieldKey="srSkipProxy" onInfo={onInfo} />
          <TextInput
            value={state.srSkipProxy}
            onChange={(e) => set("srSkipProxy", e.target.value)}
          />
        </div>
        <div>
          <FieldLabel fieldKey="srUpdateUrl" onInfo={onInfo} />
          <TextInput
            value={state.srUpdateUrl}
            onChange={(e) => set("srUpdateUrl", e.target.value)}
            placeholder="https://cdn.jsdelivr.net/gh/USER/REPO@main/конфиг.conf"
          />
        </div>
      </Card>

      <Card title="Shadowrocket — [Proxy Group]">
        <div>
          <FieldLabel fieldKey="srAutoExclude" onInfo={onInfo} />
          <TextInput
            value={state.srAutoExclude}
            onChange={(e) => set("srAutoExclude", e.target.value)}
          />
        </div>
        <div>
          <FieldLabel fieldKey="srExtraGroups" onInfo={onInfo} />
          <TextArea
            value={state.srExtraGroups}
            onChange={(e) => set("srExtraGroups", e.target.value)}
          />
        </div>
      </Card>
    </>
  );
}

export function ClientSettings({
  client,
  store,
  onInfo,
}: SectionProps & { client: ClientId }) {
  switch (client) {
    case "happ":
      return <HappSettings store={store} onInfo={onInfo} />;
    case "v2raytun":
      return <V2RayTunSettings store={store} onInfo={onInfo} />;
    case "shadowrocket":
      return <ShadowrocketSettings store={store} onInfo={onInfo} />;
    default:
      return null;
  }
}
