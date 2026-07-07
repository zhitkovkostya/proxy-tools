import { linesOf, nonEmpty } from "~/lib/encoding";
import { PRIVATE_RANGES } from "../constants";
import type { GeneratedOutput, OutboundTag, ProfileState } from "../types";
import { withPrivateRule } from "./shared";

type SrPolicy = "REJECT" | "DIRECT" | "PROXY";

function srPolicyFor(tag: OutboundTag): SrPolicy {
  if (tag === "block") return "REJECT";
  if (tag === "direct") return "DIRECT";
  return "PROXY";
}

// Translate one Xray domain token into a Shadowrocket [Rule] line.
function srDomainToken(token: string, policy: SrPolicy): string {
  if (token.startsWith("domain:")) {
    const d = token.slice("domain:".length).replace(/^\./, "");
    return `DOMAIN-SUFFIX,${d},${policy}`;
  }
  if (token.startsWith("geosite:")) {
    return `# geosite:${token.slice("geosite:".length)} — нет точного аналога в Shadowrocket, добавьте RULE-SET вручную, политика ${policy}`;
  }
  if (token.startsWith("regexp:")) {
    return `USER-AGENT,${token.slice("regexp:".length)},${policy}`;
  }
  return `DOMAIN-SUFFIX,${token.replace(/^\./, "")},${policy}`;
}

function srIpToken(token: string, policy: SrPolicy): string {
  if (token.startsWith("geoip:")) {
    return `GEOIP,${token.slice("geoip:".length).toUpperCase()},${policy}`;
  }
  if (token.includes("/")) return `IP-CIDR,${token},${policy}`;
  return `IP-CIDR,${token}/32,${policy}`;
}

// DoH/DoT URL (if present) is listed before the plain IP so Shadowrocket
// prefers the encrypted transport.
function dnsList(url: string, ip: string, tail: string[] = []): string {
  return [url, ip, ...tail].filter(Boolean).join(",");
}

function buildSkipProxy(state: ProfileState): string {
  const parts = ["localhost", "*.local", "captive.apple.com"];
  if (state.privateDirect) parts.unshift(...PRIVATE_RANGES);
  state.srSkipProxy
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s && !parts.includes(s))
    .forEach((s) => parts.push(s));
  return parts.join(",");
}

// Shadowrocket is the only client that carries the whole config (DNS, network,
// server groups, rules) in a single INI-like .conf file.
export function buildShadowrocketConf(state: ProfileState): string {
  const stamp = new Date().toISOString().replace("T", " ").slice(0, 19);

  const lines: string[] = [];
  lines.push(`# ${state.name}: ${stamp}`, "[General]", "");
  lines.push(`ipv6 = ${state.srIpv6}`);
  lines.push("private-ip-answer = true");
  lines.push("dns-direct-system = false");
  lines.push("dns-fallback-system = false");
  lines.push("dns-direct-fallback-proxy = true");
  const dohOrDot = state.dnsType === "DoH" || state.dnsType === "DoT";
  lines.push(`dns-server = ${dnsList(dohOrDot ? state.dnsPrimaryUrl : "", state.dnsPrimary)}`);
  lines.push(
    `fallback-dns-server = ${dnsList(dohOrDot ? state.dnsFallbackUrl : "", state.dnsFallback, ["system"])}`,
  );
  lines.push("hijack-dns = :53");
  lines.push(`skip-proxy = ${buildSkipProxy(state)}`);
  lines.push(`tun-excluded-routes = ${state.srTunExcluded}`);
  lines.push(`udp-policy-not-supported-behaviour = ${state.srUdpPolicy}`);
  if (state.srUpdateUrl) lines.push(`update-url = ${state.srUpdateUrl}`);

  lines.push("", "[Proxy Group]");
  linesOf(state.srExtraGroups).forEach((line) => {
    const idx = line.indexOf("=");
    if (idx === -1) return;
    const gname = line.slice(0, idx).trim();
    const regex = line.slice(idx + 1).trim();
    lines.push(
      `${gname} = url-test, policy-regex-filter=(${regex}), interval=600, timeout=5, url=http://www.gstatic.com/generate_204`,
    );
  });
  const autoFilter = state.srAutoExclude ? `^(?!.*(${state.srAutoExclude})).*` : ".*";
  lines.push(
    `AUTO = url-test, policy-regex-filter=${autoFilter}, interval=600, timeout=5, url=http://www.gstatic.com/generate_204`,
  );

  lines.push("", "[Rule]");
  withPrivateRule(state.rules, state.privateDirect).forEach((rule) => {
    const policy = srPolicyFor(rule.outboundTag);
    lines.push(`# ${rule.name}`);
    nonEmpty(rule.domains).forEach((d) => lines.push(srDomainToken(d, policy)));
    nonEmpty(rule.ips).forEach((ip) => lines.push(srIpToken(ip, policy)));
  });

  lines.push("", "# Final", "FINAL,PROXY", "");
  return lines.join("\n");
}

export function buildShadowrocketOutput(state: ProfileState): GeneratedOutput {
  return {
    kind: "conf",
    text: buildShadowrocketConf(state),
    copyLabel: ".conf",
    confName: state.name,
  };
}
