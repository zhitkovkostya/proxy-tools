import type { ProfileState } from "./types";

// RFC1918 + related private / special-use ranges routed direct when the
// "private IPs direct" toggle is on.
export const PRIVATE_RANGES = [
  "10.0.0.0/8",
  "172.16.0.0/12",
  "192.168.0.0/16",
  "169.254.0.0/16",
  "224.0.0.0/4",
  "255.255.255.255",
] as const;

// Initial / reset state. Kept as a single source of truth so the form and the
// reset button never drift apart.
export const DEFAULT_STATE: ProfileState = {
  name: "RU без VPN с AdBlock",
  dnsPrimary: "8.8.8.8",
  dnsPrimaryUrl: "https://dns.google/dns-query",
  dnsFallback: "1.1.1.1",
  dnsFallbackUrl: "https://cloudflare-dns.com/dns-query",
  dnsType: "DoH",
  privateDirect: true,
  geoipUrl:
    "https://github.com/Loyalsoldier/v2ray-rules-dat/releases/latest/download/geoip.dat",
  geositeUrl:
    "https://github.com/Loyalsoldier/v2ray-rules-dat/releases/latest/download/geosite.dat",
  rules: [
    {
      name: "Direct RU",
      domains: ["domain:.ru", "domain:.su", "domain:.xn--p1ai", "geosite:category-ru"],
      ips: [],
      outboundTag: "direct",
    },
  ],

  domainStrategy: "IPIfNonMatch",
  routeOrder: "block-direct-proxy",
  globalProxy: true,
  fakeDns: false,
  useChunkFiles: true,
  blockSites: "geosite:CATEGORY-ADS",
  blockIp: "",
  dnsHosts: [
    { host: "dns.google", ip: "8.8.8.8" },
    { host: "cloudflare-dns.com", ip: "1.1.1.1" },
  ],

  v2DomainStrategy: "AsIs",
  v2DomainMatcher: "hybrid",

  srIpv6: "false",
  srUdpPolicy: "REJECT",
  srTunExcluded:
    "10.0.0.0/8,100.64.0.0/10,127.0.0.0/8,169.254.0.0/16,172.16.0.0/12,192.0.0.0/24,192.0.2.0/24,192.88.99.0/24,192.168.0.0/16,198.51.100.0/24,203.0.113.0/24,224.0.0.0/4,255.255.255.255/32,239.255.255.250/32",
  srSkipProxy: "localhost,*.local,captive.apple.com,*.ru,*.su,*.рф",
  srUpdateUrl: "",
  srAutoExclude: "YouTube|Россия|🇷🇺",
  srExtraGroups:
    "YouTube-Group=YouTube|Россия|Russia|🇷🇺|🍿\nAI-Group=AI|Нейро|🤖",
};
