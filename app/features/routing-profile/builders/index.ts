import type { ClientId, GeneratedOutput, ProfileState } from "../types";
import { buildHappOutput } from "./happ";
import { buildStreisandOutput } from "./streisand";
import { buildV2RayTunOutput } from "./v2raytun";
import { buildShadowrocketOutput } from "./shadowrocket";

const BUILDERS: Record<ClientId, (state: ProfileState) => GeneratedOutput> = {
  happ: buildHappOutput,
  streisand: buildStreisandOutput,
  v2raytun: buildV2RayTunOutput,
  shadowrocket: buildShadowrocketOutput,
};

export function generateOutput(
  client: ClientId,
  state: ProfileState,
): GeneratedOutput {
  return BUILDERS[client](state);
}

export { buildHappProfile } from "./happ";
export { buildStreisandProfile } from "./streisand";
export { buildV2RayTunProfile } from "./v2raytun";
export { buildShadowrocketConf } from "./shadowrocket";
