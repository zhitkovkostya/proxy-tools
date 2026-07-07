import { Plus, X } from "lucide-react";
import { Card } from "~/components/ui/Card";
import { Select, Switch, TextArea, TextInput } from "~/components/ui/inputs";
import type { ActiveId, FieldKey } from "../field-info";
import {
  DOMAIN_MATCHER_OPTIONS,
  DOMAIN_STRATEGY_OPTIONS,
  ROUTE_ORDER_OPTIONS,
  UDP_POLICY_OPTIONS,
} from "../options";
import type { ClientId } from "../types";
import type { ProfileStore } from "../useProfileState";
import { FieldRow } from "./FieldLabel";

interface SectionProps {
  store: ProfileStore;
  activeKey: ActiveId | null;
  onActivate: (id: ActiveId) => void;
}

function useRowProps(activeKey: ActiveId | null, onActivate: (id: ActiveId) => void) {
  return (key: FieldKey) => ({
    fieldKey: key,
    active: activeKey === key,
    onActivate,
  });
}

function HappSettings({ store, activeKey, onActivate }: SectionProps) {
  const { state, set } = store;
  const rowProps = useRowProps(activeKey, onActivate);
  return (
    <>
      <Card title="happ — движок">
        <FieldRow {...rowProps("domainStrategy")}>
          <Select
            value={state.domainStrategy}
            onChange={(v) => set("domainStrategy", v)}
            options={DOMAIN_STRATEGY_OPTIONS}
          />
        </FieldRow>
        <FieldRow {...rowProps("routeOrder")}>
          <Select
            value={state.routeOrder}
            onChange={(v) => set("routeOrder", v)}
            options={ROUTE_ORDER_OPTIONS}
          />
        </FieldRow>
        <FieldRow {...rowProps("globalProxy")} label="GlobalProxy">
          <Switch checked={state.globalProxy} onChange={(v) => set("globalProxy", v)} />
        </FieldRow>
        <FieldRow {...rowProps("fakeDns")} label="FakeDns">
          <Switch checked={state.fakeDns} onChange={(v) => set("fakeDns", v)} />
        </FieldRow>
        <FieldRow {...rowProps("useChunkFiles")} label="UseChunkFiles">
          <Switch
            checked={state.useChunkFiles}
            onChange={(v) => set("useChunkFiles", v)}
          />
        </FieldRow>
      </Card>

      <Card title="happ — списки">
        <FieldRow {...rowProps("blockSites")}>
          <TextArea
            value={state.blockSites}
            onChange={(e) => set("blockSites", e.target.value)}
            placeholder={"geosite:category-ads-all\ndomain:.doubleclick.net\nexample.com"}
          />
        </FieldRow>
        <FieldRow {...rowProps("blockIp")}>
          <TextArea
            value={state.blockIp}
            onChange={(e) => set("blockIp", e.target.value)}
            placeholder={"geoip:private\n10.0.0.0/8\n192.168.0.0/16"}
          />
        </FieldRow>
        <FieldRow {...rowProps("dnsHosts")}>
          <div className="space-y-1">
            {state.dnsHosts.map((row, idx) => (
              <div key={idx} className="flex items-baseline gap-2">
                <TextInput
                  value={row.host}
                  placeholder="dns.google"
                  onChange={(e) =>
                    set("dnsHosts", (hs) =>
                      hs.map((h, i) => (i === idx ? { ...h, host: e.target.value } : h)),
                    )
                  }
                />
                <span className="text-dim">→</span>
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
                  className="shrink-0 text-dim outline-none hover:text-red"
                >
                  <X size={13} />
                </button>
              </div>
            ))}
            <button
              onClick={() => set("dnsHosts", (hs) => [...hs, { host: "", ip: "" }])}
              className="flex items-center gap-1 text-dim outline-none hover:text-yellow"
            >
              <Plus size={12} /> запись
            </button>
          </div>
        </FieldRow>
      </Card>
    </>
  );
}

function V2RayTunSettings({ store, activeKey, onActivate }: SectionProps) {
  const { state, set } = store;
  const rowProps = useRowProps(activeKey, onActivate);
  return (
    <Card title="v2RayTun — движок">
      <FieldRow {...rowProps("v2DomainStrategy")}>
        <Select
          value={state.v2DomainStrategy}
          onChange={(v) => set("v2DomainStrategy", v)}
          options={DOMAIN_STRATEGY_OPTIONS}
        />
      </FieldRow>
      <FieldRow {...rowProps("v2DomainMatcher")}>
        <Select
          value={state.v2DomainMatcher}
          onChange={(v) => set("v2DomainMatcher", v)}
          options={DOMAIN_MATCHER_OPTIONS}
        />
      </FieldRow>
    </Card>
  );
}

function ShadowrocketSettings({ store, activeKey, onActivate }: SectionProps) {
  const { state, set } = store;
  const rowProps = useRowProps(activeKey, onActivate);
  return (
    <>
      <Card title="Shadowrocket — [General]">
        <FieldRow {...rowProps("srIpv6")}>
          <Switch
            checked={state.srIpv6 === "true"}
            onChange={(v) => set("srIpv6", v ? "true" : "false")}
          />
        </FieldRow>
        <FieldRow {...rowProps("srUdpPolicy")}>
          <Select
            value={state.srUdpPolicy}
            onChange={(v) => set("srUdpPolicy", v)}
            options={UDP_POLICY_OPTIONS}
          />
        </FieldRow>
        <FieldRow {...rowProps("srTunExcluded")}>
          <TextArea
            value={state.srTunExcluded}
            onChange={(e) => set("srTunExcluded", e.target.value)}
            placeholder="10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, 224.0.0.0/4"
          />
        </FieldRow>
        <FieldRow {...rowProps("srSkipProxy")}>
          <TextInput
            value={state.srSkipProxy}
            onChange={(e) => set("srSkipProxy", e.target.value)}
            placeholder="localhost, *.local, 192.168.0.0/16, captive.apple.com"
          />
        </FieldRow>
        <FieldRow {...rowProps("srUpdateUrl")}>
          <TextInput
            value={state.srUpdateUrl}
            onChange={(e) => set("srUpdateUrl", e.target.value)}
            placeholder="https://cdn.jsdelivr.net/gh/USER/REPO@main/конфиг.conf"
          />
        </FieldRow>
      </Card>

      <Card title="Shadowrocket — [Proxy Group]">
        <FieldRow {...rowProps("srAutoExclude")}>
          <TextInput
            value={state.srAutoExclude}
            onChange={(e) => set("srAutoExclude", e.target.value)}
            placeholder="(?i)(инфо|expire|трафик|traffic)"
          />
        </FieldRow>
        <FieldRow {...rowProps("srExtraGroups")}>
          <TextArea
            value={state.srExtraGroups}
            onChange={(e) => set("srExtraGroups", e.target.value)}
            placeholder={"🇩🇪 Германия=(?i)(DE|Germany|Германия)\n🇳🇱 Нидерланды=(?i)(NL|Netherlands)"}
          />
        </FieldRow>
      </Card>
    </>
  );
}

export function ClientSettings({
  client,
  store,
  activeKey,
  onActivate,
}: SectionProps & { client: ClientId }) {
  const props = { store, activeKey, onActivate };
  switch (client) {
    case "happ":
      return <HappSettings {...props} />;
    case "v2raytun":
      return <V2RayTunSettings {...props} />;
    case "shadowrocket":
      return <ShadowrocketSettings {...props} />;
    default:
      return null;
  }
}
