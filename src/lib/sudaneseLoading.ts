export const SUDANESE_LOADING = [
  "الخال شغال في الرسمة.. ثواني والأمور تظبط",
  "صبراً شوية... المعالج بياكل فول 🫘",
  "ثانية واحدة... الخال بيشتغل 💪",
  "خليك معانا... النت سوداني 📶",
  "لسة شوية... الكهرباء جات 💡",
];

export const pickSudaneseMessage = () =>
  SUDANESE_LOADING[Math.floor(Math.random() * SUDANESE_LOADING.length)];
