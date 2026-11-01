import { describe, expect, it } from "vitest";
import { getBackNavigation } from "@/lib/navigation";

describe("back navigation direction", () => {
  it("points right in Arabic", () => {
    expect(getBackNavigation("ar").direction).toBe("right");
  });

  it("points left in English", () => {
    expect(getBackNavigation("en").direction).toBe("left");
  });
});