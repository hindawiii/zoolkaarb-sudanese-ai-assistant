import { AppLanguage } from "@/store/userStore";

type Dict = Record<string, { ar: string; en: string }>;

// NOTE: Brand category titles (e.g., ستوديو مدار، الواجب، الخال) stay Arabic always.
export const dict: Dict = {
  // Headers / greetings
  "greeting.morning": { ar: "صباح الخير", en: "Good morning" },
  "greeting.afternoon": { ar: "نهارك سعيد", en: "Good afternoon" },
  "greeting.evening": { ar: "مساء الخير", en: "Good evening" },
  "greeting.night": { ar: "ليلة سعيدة", en: "Good night" },

  // Hero
  "hero.subtitle": { ar: "الخال — مساعدك السوداني الذكي", en: "Al-Khal — Your Sudanese AI Assistant" },
  "hero.welcome": { ar: "حبابك عشرة", en: "Welcome" },

  // Sections
  "section.services": { ar: "الخدمات", en: "Services" },
  "section.utilities": { ar: "الأدوات", en: "Utilities" },

  // Service descriptions
  "svc.studio.desc": { ar: "تعديل الصور بالذكاء الاصطناعي", en: "AI Image Processing" },
  "svc.wajib.desc": { ar: "قوالب وتهاني واتس وفيس", en: "WhatsApp & Facebook templates" },
  "svc.recorder.title": { ar: "المسجل الذكي", en: "Smart Recorder" },
  "svc.recorder.desc": { ar: "تسجيل وتغيير الصوت", en: "Record & Voice Changer" },
  "svc.share.title": { ar: "مدار شير", en: "Madar Share" },
  "svc.share.desc": { ar: "مشاركة الملفات و PDF", en: "File Sharing & PDF Scan" },

  // Utilities
  "util.dataSaver.title": { ar: "موفّر البيانات", en: "Data Saver" },
  "util.dataSaver.desc": { ar: "ضغط الصور والملفات", en: "Compress images & files" },
  "util.scanner.title": { ar: "ماسح المستندات", en: "Scanner" },
  "util.scanner.desc": { ar: "مسح المستندات إلى PDF", en: "Scan to PDF" },
  "util.yafatish.title": { ar: "الزول يفتش", en: "Al-Zool Yafatish" },
  "util.yafatish.desc": { ar: "أقرب الأماكن إليك", en: "Find places near you" },
  "util.share.title": { ar: "مدار شير", en: "Madar Share" },
  "util.share.desc": { ar: "شارك عبر واتساب", en: "Share via WhatsApp" },
  "util.rewards.title": { ar: "إعلانات مكافأة", en: "Rewarded Ads" },
  "util.rewards.desc": { ar: "افتح المميزات", en: "Unlock premium" },

  // Bottom nav
  "nav.home": { ar: "الرئيسية", en: "Home" },
  "nav.chat": { ar: "الخال", en: "Al-Khal" },
  "nav.studio": { ar: "الاستوديو", en: "Studio" },
  "nav.settings": { ar: "الإعدادات", en: "Settings" },

  // Settings
  "settings.title": { ar: "الإعدادات", en: "Settings" },
  "settings.preferences": { ar: "التفضيلات", en: "Preferences" },
  "settings.general": { ar: "عام", en: "General" },
  "settings.language": { ar: "اللغة", en: "Language" },
  "settings.dark": { ar: "الوضع الداكن", en: "Dark Mode" },
  "settings.notifications": { ar: "الإشعارات", en: "Notifications" },
  "settings.editName": { ar: "اضغط لتعديل اسمك", en: "Tap to edit your name" },
  "settings.privacy": { ar: "سياسة الخصوصية", en: "Privacy Policy" },
  "settings.about": { ar: "عن مدار", en: "About Madar" },

  // Chat
  "chat.online": { ar: "متصل", en: "Online" },
  "chat.typing": { ar: "بكتب...", en: "Typing..." },
  "chat.placeholder": { ar: "اكتب رسالتك...", en: "Type a message..." },

  // Toasts
  "toast.notifEnabled": { ar: "أبشر، التنبيهات الكاربة حتصلك أول بأول", en: "You're set! Notifications enabled." },
  "toast.notifDenied": { ar: "ما قدرنا نفعّل التنبيهات. فعّلها من إعدادات المتصفح.", en: "Notifications blocked. Enable them in your browser settings." },
  "toast.notifOff": { ar: "تمام، قفلنا التنبيهات.", en: "Notifications turned off." },
};

export const t = (key: string, lang: AppLanguage): string => {
  const entry = dict[key];
  if (!entry) return key;
  return entry[lang] ?? entry.ar;
};

export const useT = () => {
  // Lightweight helper consumers can grab once
  return t;
};
