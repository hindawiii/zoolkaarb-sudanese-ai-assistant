import { beforeEach, describe, expect, it } from "vitest";
import { consumeCredit, getCredits, grantReward } from "@/lib/zoolCredits";

describe("preserved initial per-tool credits", () => {
  beforeEach(() => localStorage.clear());
  it("starts each new tool with exactly 3 free operations", () => {
    expect(getCredits("test-tool-a")).toBe(3);
    expect(getCredits("test-tool-b")).toBe(3);
  });
  it("never consumes below zero", () => {
    for (let i = 0; i < 4; i++) consumeCredit("test-tool");
    expect(getCredits("test-tool")).toBe(0);
  });
  it("preserves the existing mock reward for anime", () => {
    getCredits("anime-hero");
    expect(grantReward("anime-hero")).toBe(8);
  });
});