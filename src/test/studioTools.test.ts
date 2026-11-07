import { describe, expect, it } from "vitest";
import { STUDIO_TOOLS } from "@/lib/studioTools";
import { isPhotoEditAction } from "../../supabase/functions/photo-edit/actions";

describe("removed face swap", () => {
  it("cannot resolve the removed tool through the studio registry", () => {
    expect(STUDIO_TOOLS.find((tool) => tool.slug === "face-swap")).toBeUndefined();
  });

  it("rejects the removed server operation", () => {
    expect(isPhotoEditAction("face-swap")).toBe(false);
  });

  it("preserves anime, outfits and blending operations", () => {
    expect(STUDIO_TOOLS.map((tool) => tool.id)).toEqual([
      "clothes-changer", "anime-hero", "smart-blender",
    ]);
    for (const action of ["anime-studio", "anime-scene-swap", "outfitter-studio", "outfit-swatch", "smart-blender"]) {
      expect(isPhotoEditAction(action)).toBe(true);
    }
  });
});