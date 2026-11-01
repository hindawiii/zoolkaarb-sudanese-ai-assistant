import type { AppLanguage } from "@/store/userStore";

export function getBackNavigation(language: AppLanguage) {
  return language === "ar"
    ? { direction: "right" as const, label: "رجوع" }
    : { direction: "left" as const, label: "Back" };
}