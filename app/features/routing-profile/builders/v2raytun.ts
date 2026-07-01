import { utf8ToBase64, uuidv4 } from "~/lib/encoding";
import type { GeneratedOutput, ProfileState } from "../types";
import { withPrivateRule } from "./shared";

// v2RayTun imports an Xray routing object. Each rule carries its own UUID and a
// human-readable __name__. DNS is configured in the app, not here.
export function buildV2RayTunProfile(state: ProfileState) {
  return {
    domainStrategy: state.v2DomainStrategy,
    id: uuidv4(),
    balancers: [] as unknown[],
    domainMatcher: state.v2DomainMatcher,
    rules: withPrivateRule(state.rules, state.privateDirect).map((rule) => {
      const r: Record<string, unknown> = {
        id: uuidv4(),
        outboundTag: rule.outboundTag,
        type: "field",
        __name__: rule.name,
      };
      if (rule.domains.length) r.domain = rule.domains;
      if (rule.ips.length) r.ip = rule.ips;
      return r;
    }),
    name: state.name || "New Profile",
  };
}

export function buildV2RayTunOutput(state: ProfileState): GeneratedOutput {
  const profile = buildV2RayTunProfile(state);
  const b64 = utf8ToBase64(JSON.stringify(profile));
  return {
    kind: "deeplink",
    deepLink: `v2raytun://import_route/${b64}`,
    text: JSON.stringify(profile, null, 2),
    copyLabel: "JSON",
  };
}
