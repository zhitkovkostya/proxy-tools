// Select option lists, typed against the state so a stray value fails to
// compile rather than silently rendering a broken dropdown.
import type {
  DnsType,
  DomainStrategy,
  DomainMatcher,
  RouteOrder,
  UdpPolicy,
} from "./types";

export interface SelectOption<T extends string> {
  value: T;
  label: string;
}

export const DNS_TYPE_OPTIONS: SelectOption<DnsType>[] = [
  { value: "DoH", label: "DoH" },
  { value: "DoT", label: "DoT" },
  { value: "UDP", label: "UDP" },
  { value: "TCP", label: "TCP" },
];

export const DOMAIN_STRATEGY_OPTIONS: SelectOption<DomainStrategy>[] = [
  { value: "AsIs", label: "AsIs" },
  { value: "IPIfNonMatch", label: "IPIfNonMatch" },
  { value: "IPOnDemand", label: "IPOnDemand" },
];

export const ROUTE_ORDER_OPTIONS: SelectOption<RouteOrder>[] = [
  { value: "block-direct-proxy", label: "block-direct-proxy" },
  { value: "block-proxy-direct", label: "block-proxy-direct" },
];

export const DOMAIN_MATCHER_OPTIONS: SelectOption<DomainMatcher>[] = [
  { value: "hybrid", label: "hybrid" },
  { value: "linear", label: "linear" },
];

export const BOOL_OPTIONS: SelectOption<"true" | "false">[] = [
  { value: "false", label: "false" },
  { value: "true", label: "true" },
];

export const UDP_POLICY_OPTIONS: SelectOption<UdpPolicy>[] = [
  { value: "REJECT", label: "REJECT" },
  { value: "DIRECT", label: "DIRECT" },
];

export const OUTBOUND_OPTIONS: SelectOption<"direct" | "proxy" | "block">[] = [
  { value: "direct", label: "direct" },
  { value: "proxy", label: "proxy" },
  { value: "block", label: "block" },
];
