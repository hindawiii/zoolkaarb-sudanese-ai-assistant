// Daily Al-Khal Chest — once-per-day reward popup. Uses unified Madar Credits.
import { grantReward } from "@/lib/zoolCredits";

const KEY = "zoolkaarb-daily-chest-v1";

export type ChestBundle = {
  ai: number;
  fakeCall: number;
  office: number;
  audio: number;
};

const todayKey = () => new Date().toISOString().slice(0, 10); // YYYY-MM-DD

export const isChestAvailable = (): boolean => {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(KEY) !== todayKey();
};

export const markChestOpened = (): void => {
  try {
    localStorage.setItem(KEY, todayKey());
  } catch {
    /* ignore */
  }
};

const rand = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

export const rollChestBundle = (): ChestBundle => ({
  ai: rand(1, 3),
  fakeCall: rand(0, 2),
  office: rand(1, 2),
  audio: rand(0, 2),
});

/** Apply the reward to the unified credit ledger. */
export const grantChestBundle = (b: ChestBundle): void => {
  if (b.ai) grantReward("premium-text", b.ai);
  if (b.fakeCall) grantReward("fake-call", b.fakeCall);
  if (b.office) grantReward("office", b.office);
  if (b.audio) grantReward("audio-studio", b.audio);
};
