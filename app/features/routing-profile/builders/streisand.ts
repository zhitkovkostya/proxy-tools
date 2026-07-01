import { bplistEncode } from "~/lib/bplist";
import { bytesToBase64, utf8ToBase64, uuidv4 } from "~/lib/encoding";
import type { GeneratedOutput, ProfileState } from "../types";
import { ruleToXrayRule, withPrivateRule } from "./shared";

// Streisand imports a plain {name, uuid, rules[]} object. DNS / engine params
// are not part of this payload — they are set inside the app.
export function buildStreisandProfile(state: ProfileState) {
  return {
    name: state.name || "New Profile",
    uuid: uuidv4(),
    rules: withPrivateRule(state.rules, state.privateDirect).map(ruleToXrayRule),
  };
}

// Double base64: binary plist → base64 → `import/route://<inner>` → base64 again.
export function buildStreisandOutput(state: ProfileState): GeneratedOutput {
  const profile = buildStreisandProfile(state);
  const innerB64 = bytesToBase64(bplistEncode(profile));
  const outerB64 = utf8ToBase64(`import/route://${innerB64}`);
  return {
    kind: "deeplink",
    deepLink: `streisand://${outerB64}`,
    text: JSON.stringify(profile, null, 2),
    copyLabel: "JSON",
  };
}
