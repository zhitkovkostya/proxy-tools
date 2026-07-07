import { linesOf, nonEmpty, utf8ToBase64 } from "~/lib/encoding";
import { PRIVATE_RANGES } from "../constants";
import type { GeneratedOutput, ProfileState } from "../types";

// happ carries the richest payload: DNS, engine flags, geo sources, separate
// block lists and DnsHosts all live in one flat JSON object.
export function buildHappProfile(state: ProfileState): Record<string, unknown> {
  const { rules } = state;
  const domainsFor = (tag: string) =>
    nonEmpty(rules.filter((r) => r.outboundTag === tag).flatMap((r) => r.domains));
  const ipsFor = (tag: string) =>
    nonEmpty(rules.filter((r) => r.outboundTag === tag).flatMap((r) => r.ips));

  const directIp = ipsFor("direct");
  if (state.privateDirect) directIp.unshift(...PRIVATE_RANGES);

  const hosts: Record<string, string> = {};
  state.dnsHosts.forEach(({ host, ip }) => {
    if (host && ip) hosts[host] = ip;
  });

  return {
    DirectSites: domainsFor("direct"),
    Name: state.name || "New Profile",
    DomesticDNSType: state.dnsType,
    DirectIp: directIp,
    BlockSites: linesOf(state.blockSites).concat(domainsFor("block")),
    FakeDns: state.fakeDns,
    DomesticDNSDomain: state.dnsType === "DoH" || state.dnsType === "DoT" ? state.dnsPrimaryUrl : "",
    ProxySites: domainsFor("proxy"),
    GeoipUrl: state.geoipUrl,
    ProxyIp: ipsFor("proxy"),
    DomainStrategy: state.domainStrategy,
    DnsHosts: hosts,
    GlobalProxy: state.globalProxy,
    BlockIp: linesOf(state.blockIp).concat(ipsFor("block")),
    UseChunkFiles: state.useChunkFiles,
    DomesticDNSIp: state.dnsPrimary,
    RemoteDNSIp: state.dnsFallback,
    RemoteDNSDomain: state.dnsType === "DoH" || state.dnsType === "DoT" ? state.dnsFallbackUrl : "",
    RemoteDNSType: state.dnsType,
    LastUpdated: 0,
    RouteOrder: state.routeOrder,
    GeositeUrl: state.geositeUrl,
  };
}

export function buildHappOutput(state: ProfileState): GeneratedOutput {
  const profile = buildHappProfile(state);
  const b64 = utf8ToBase64(JSON.stringify(profile));
  return {
    kind: "deeplink",
    deepLink: `happ://routing/add/${b64}`,
    text: JSON.stringify(profile, null, 2),
    copyLabel: "JSON",
  };
}
