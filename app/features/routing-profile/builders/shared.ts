import { nonEmpty } from "~/lib/encoding";
import { PRIVATE_RANGES } from "../constants";
import type { OutboundTag, Rule } from "../types";

// Prepend the auto-generated RFC1918 direct rule when the toggle is on. The
// private-ranges rule is never stored in state — it is derived at build time.
export function withPrivateRule(rules: Rule[], privateDirect: boolean): Rule[] {
  if (!privateDirect) return rules;
  return [
    {
      name: "Private ranges (RFC1918)",
      domains: [],
      ips: [...PRIVATE_RANGES],
      outboundTag: "direct",
    },
    ...rules,
  ];
}

// A minimal Xray RoutingObject rule. `block` maps to Xray's `block` outbound.
// A type alias (not an interface) so it satisfies bplist's structural
// PlistValue index signature when serialised for Streisand.
export type XrayRule = {
  outboundTag: OutboundTag;
  domain?: string[];
  ip?: string[];
};

export function ruleToXrayRule(rule: Rule): XrayRule {
  const r: XrayRule = { outboundTag: rule.outboundTag };
  const domains = nonEmpty(rule.domains);
  const ips = nonEmpty(rule.ips);
  if (domains.length) r.domain = domains;
  if (ips.length) r.ip = ips;
  return r;
}
