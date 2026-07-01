// Domain model for the routing profile generator. A single client-agnostic
// state shape is translated into each client's native format at build time.

export type ClientId = "happ" | "streisand" | "v2raytun" | "shadowrocket";

export type OutboundTag = "direct" | "proxy" | "block";
export type DnsType = "DoH" | "DoT" | "UDP" | "TCP";
export type DomainStrategy = "AsIs" | "IPIfNonMatch" | "IPOnDemand";
export type DomainMatcher = "hybrid" | "linear";
export type RouteOrder = "block-direct-proxy" | "block-proxy-direct";
export type UdpPolicy = "REJECT" | "DIRECT";

// One routing rule in Xray notation. `domains` and `ips` accept the full Xray
// vocabulary (domain:.example, geosite:name, regexp:…, CIDR, geoip:cc).
export interface Rule {
  name: string;
  domains: string[];
  ips: string[];
  outboundTag: OutboundTag;
}

export interface DnsHost {
  host: string;
  ip: string;
}

export interface ProfileState {
  // shared — never reset when switching clients
  name: string;
  dnsPrimary: string;
  dnsPrimaryUrl: string;
  dnsFallback: string;
  dnsFallbackUrl: string;
  dnsType: DnsType;
  privateDirect: boolean;
  geoipUrl: string;
  geositeUrl: string;
  rules: Rule[];

  // happ only
  domainStrategy: DomainStrategy;
  routeOrder: RouteOrder;
  globalProxy: boolean;
  fakeDns: boolean;
  useChunkFiles: boolean;
  blockSites: string;
  blockIp: string;
  dnsHosts: DnsHost[];

  // v2RayTun only
  v2DomainStrategy: DomainStrategy;
  v2DomainMatcher: DomainMatcher;

  // Shadowrocket only
  srIpv6: string;
  srUdpPolicy: UdpPolicy;
  srTunExcluded: string;
  srSkipProxy: string;
  srUpdateUrl: string;
  srAutoExclude: string;
  srExtraGroups: string;
}

// Result of building a profile for the active client.
export type GeneratedOutput =
  | {
      kind: "deeplink";
      deepLink: string;
      text: string;
      copyLabel: string;
    }
  | {
      kind: "conf";
      text: string;
      copyLabel: string;
      confName: string;
    };
