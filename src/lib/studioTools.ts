import { Eraser, Wand2, Sparkles, Palette, Crop, Users, Shirt, Drama, Layers, type LucideIcon } from "lucide-react";
import type { StudioToolId } from "@/lib/studioQuota";

export type ToolMode = "single-edit" | "dual-edit" | "multi-edit";

export interface StudioTool {
  id: StudioToolId | "quick-edit";
  slug: string;
  icon: LucideIcon;
  labelAr: string;
  labelEn: string;
  taglineAr: string;
  taglineEn: string;
  workingMessageAr: string;
  workingMessageEn: string;
  mode: ToolMode;
  // For tools that map to a single AI action
  action?: string;
  // For clothes-changer with multiple sub-actions
  variants?: { id: string; action: string; labelAr: string; labelEn: string; icon: LucideIcon }[];
  accent: "gold" | "nile" | "earth";
  metered: boolean; // counts against quota
}

export const STUDIO_TOOLS: StudioTool[] = [
  {
    id: "face-swap",
    slug: "face-swap",
    icon: Users,
    labelAr: "تبديل الوجوه",
    labelEn: "Face Swap",
    taglineAr: "ركّب وجهك على أي صورة",
    taglineEn: "Swap faces with anyone",
    workingMessageAr: "الخال شغال في المعمل.. بجهز ليك الفزعة",
    workingMessageEn: "Al-Khal is working his magic...",
    mode: "dual-edit",
    action: "face-swap",
    accent: "earth",
    metered: true,
  },
  {
    id: "clothes-changer",
    slug: "clothes-changer",
    icon: Shirt,
    labelAr: "مُغيّر الملابس",
    labelEn: "Clothes Changer",
    taglineAr: "غيّر هدومك بضغطة",
    taglineEn: "Swap outfits instantly",
    workingMessageAr: "الخال شغال على هدومك الجديدة..",
    workingMessageEn: "Tailoring your new look...",
    mode: "single-edit",
    accent: "nile",
    metered: true,
    variants: [
      { id: "formal", action: "clothes-formal", labelAr: "رسمي", labelEn: "Formal", icon: Shirt },
      { id: "traditional", action: "clothes-traditional", labelAr: "تراثي", labelEn: "Traditional", icon: Shirt },
      { id: "casual", action: "clothes-casual", labelAr: "كاجوال", labelEn: "Casual", icon: Shirt },
    ],
  },
  {
    id: "anime-hero",
    slug: "anime-hero",
    icon: Drama,
    labelAr: "بطل الأنمي",
    labelEn: "Anime Hero",
    taglineAr: "حوّل نفسك لبطل أنمي",
    taglineEn: "Become an anime hero",
    workingMessageAr: "الخال شغال على رسمتك الأنمي..",
    workingMessageEn: "Drawing your anime version...",
    mode: "single-edit",
    action: "anime-hero",
    accent: "gold",
    metered: true,
  },
  {
    id: "smart-blender",
    slug: "smart-blender",
    icon: Layers,
    labelAr: "الدمج الذكي",
    labelEn: "Smart Blender",
    taglineAr: "ادمج صورك بانسجام",
    taglineEn: "Blend photos in harmony",
    workingMessageAr: "الخال بدمج الألوان والإضاءة..",
    workingMessageEn: "Harmonizing colors and light...",
    mode: "multi-edit",
    action: "smart-blender",
    accent: "nile",
    metered: true,
  },

];

// Legacy quick-edit tools (the old Studio actions)
export const QUICK_EDIT_ACTIONS = [
  { id: "remove-bg", labelAr: "إزالة الخلفية", labelEn: "Remove BG", icon: Eraser },
  { id: "restore", labelAr: "ترميم", labelEn: "Restore", icon: Wand2 },
  { id: "enhance", labelAr: "تحسين", labelEn: "Enhance", icon: Sparkles },
  { id: "filter-bw", labelAr: "أبيض وأسود", labelEn: "B & W", icon: Palette },
  { id: "filter-warm", labelAr: "دافئ", labelEn: "Warm", icon: Palette },
  { id: "filter-cool", labelAr: "بارد", labelEn: "Cool", icon: Palette },
  { id: "crop", labelAr: "قص", labelEn: "Crop", icon: Crop },
];
