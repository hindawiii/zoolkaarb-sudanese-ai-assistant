// Unified "Madar Credits" ledger — one global system inherited by every tool
// (current + future). Persists in localStorage. Auto-initializes any tool the
// first time it's queried with FREE_TRIAL credits. Reward-per-ad varies by tool.

import { useEffect, useState, useCallback } from "react";

export const FREE_TRIAL = 3;
export const DEFAULT_REWARD = 3;

// Tool-specific ad reward overrides. Default is 3.
const REWARD_BY_TOOL: Record<string, number> = {
  "fake-call": 2,
  "voice-changer": 5,
  "anime-hero": 5,
};

const KEY = "zoolkaarb-credits-v1";
const LEGACY_STUDIO_KEY = "zoolkaarb-studio-quota-v1";
const LEGACY_PREMIUM_KEY = "zoolkaarb-premium-text-quota-v1";
const EVT = "zoolkaarb-credits-changed";

type Ledger = Record<string, number>;

const safeParse = (raw: string | null): Ledger => {
  if (!raw) return {};
  try {
    const v = JSON.parse(raw);
    return v && typeof v === "object" ? (v as Ledger) : {};
  } catch {
    return {};
  }
};

const read = (): Ledger => {
  if (typeof window === "undefined") return {};
  return safeParse(localStorage.getItem(KEY));
};

const write = (l: Ledger) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(l));
    window.dispatchEvent(new CustomEvent(EVT));
  } catch {
    /* ignore */
  }
};

// One-time migration: merge old per-tool keys into the unified ledger.
let migrated = false;
const migrateLegacy = () => {
  if (migrated || typeof window === "undefined") return;
  migrated = true;
  try {
    const ledger = read();
    let changed = false;

    // Studio quota: { [toolId]: number }
    const oldStudio = safeParse(localStorage.getItem(LEGACY_STUDIO_KEY));
    for (const [k, v] of Object.entries(oldStudio)) {
      if (ledger[k] === undefined && Number.isFinite(v)) {
        ledger[k] = v as number;
        changed = true;
      }
    }
    if (Object.keys(oldStudio).length) localStorage.removeItem(LEGACY_STUDIO_KEY);

    // Premium text quota: single number
    const oldPremiumRaw = localStorage.getItem(LEGACY_PREMIUM_KEY);
    if (oldPremiumRaw !== null) {
      const n = Number(oldPremiumRaw);
      if (Number.isFinite(n) && ledger["premium-text"] === undefined) {
        ledger["premium-text"] = n;
        changed = true;
      }
      localStorage.removeItem(LEGACY_PREMIUM_KEY);
    }

    if (changed) write(ledger);
  } catch {
    /* ignore */
  }
};

export const getCredits = (toolId: string): number => {
  migrateLegacy();
  const ledger = read();
  if (ledger[toolId] === undefined) {
    ledger[toolId] = FREE_TRIAL;
    write(ledger);
  }
  return ledger[toolId];
};

export const consumeCredit = (toolId: string): number => {
  const ledger = read();
  const current = ledger[toolId] ?? FREE_TRIAL;
  const next = Math.max(0, current - 1);
  ledger[toolId] = next;
  write(ledger);
  return next;
};

export const getRewardAmount = (toolId: string): number =>
  REWARD_BY_TOOL[toolId] ?? DEFAULT_REWARD;

export const grantReward = (toolId: string, amount?: number): number => {
  const ledger = read();
  const reward = amount ?? getRewardAmount(toolId);
  const next = (ledger[toolId] ?? 0) + reward;
  ledger[toolId] = next;
  write(ledger);
  return next;
};

export const resetCredits = (toolId: string): void => {
  const ledger = read();
  ledger[toolId] = FREE_TRIAL;
  write(ledger);
};

// React hook with live updates across components & tabs.
export const useZoolCredits = (toolId: string) => {
  const [credits, setCredits] = useState<number>(() => getCredits(toolId));

  useEffect(() => {
    const sync = () => setCredits(getCredits(toolId));
    sync();
    window.addEventListener(EVT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [toolId]);

  const consume = useCallback(() => {
    const n = consumeCredit(toolId);
    setCredits(n);
    return n;
  }, [toolId]);

  const grant = useCallback(
    (amount?: number) => {
      const n = grantReward(toolId, amount);
      setCredits(n);
      return n;
    },
    [toolId],
  );

  return { credits, consume, grant, rewardAmount: getRewardAmount(toolId) };
};
