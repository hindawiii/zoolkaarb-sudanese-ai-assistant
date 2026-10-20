import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const TITLES: Record<string, string> = {
  "/": "مدار — استوديو الذكاء الاصطناعي",
  "/chat": "الخال", "/studio": "استوديو مدار", "/studio/quick": "الأدوات السريعة",
  "/studio/anime-hero": "بطل الأنمي", "/studio/clothes-changer": "غيّر ملابسك",
  "/studio/face-swap": "تبديل الوجوه", "/studio/smart-blender": "الدمج الذكي",
  "/settings": "الإعدادات", "/al-wajib": "مصمم الحالات", "/data-saver": "موفّر البيانات",
  "/zool-share": "مدار شير", "/scanner": "ماسح المستندات", "/yafatish": "دليل الأماكن",
  "/voice-changer": "غيّر صوتك", "/audio-studio": "الصوت والميديا",
  "/audio-studio/media-factory": "مصنع الميديا", "/audio-studio/voice-over": "بصمتي الخاصة",
  "/fake-call": "فزعة الخال", "/fake-call/incoming": "مكالمة واردة",
  "/office": "المكتب الرقمي", "/office/to-pdf": "صور ونص إلى PDF", "/office/converter": "محوّل المستندات",
};

export default function PageMetadata() {
  const { pathname } = useLocation();
  useEffect(() => {
    const label = pathname.startsWith("/al-wajib/editor/") ? "تعديل الحالة" : TITLES[pathname];
    const title = label ? (pathname === "/" ? label : `${label} — مدار`) : "صفحة غير موجودة — مدار";
    document.title = title;
    for (const selector of ['meta[property="og:title"]', 'meta[name="twitter:title"]']) {
      document.querySelector(selector)?.setAttribute("content", title);
    }
  }, [pathname]);
  return null;
}