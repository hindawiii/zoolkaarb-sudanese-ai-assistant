// Back-compat shim. The real ledger lives in `zoolCredits.ts`.
// All Studio tools continue to work unchanged through these re-exports.

import {
  FREE_TRIAL,
  DEFAULT_REWARD,
  getCredits,
  consumeCredit,
  grantReward,
  resetCredits,
} from "./zoolCredits";

export const FREE_LIMIT = FREE_TRIAL;
export const AD_REWARD = DEFAULT_REWARD;

export type StudioToolId =
  | "face-swap"
  | "clothes-changer"
  | "anime-hero"
  | "smart-blender";

export const getRemaining = (tool: StudioToolId): number => getCredits(tool);
export const consumeUse = (tool: StudioToolId): number => consumeCredit(tool);
export const grantAdReward = (tool: StudioToolId): number => grantReward(tool);
export const resetQuota = (tool: StudioToolId): void => resetCredits(tool);
