import { ArrowLeft, ScanLine, FileText, FileType2, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@/store/userStore";
import { useZoolCredits } from "@/lib/zoolCredits";

const Office = () => {
  const navigate = useNavigate();
  const { language } = useUser();
  const isRtl = language === "ar";
  const { credits } = useZoolCredits("office");

  const tools = [
    {
      titleAr: "ماسح المستندات",
      titleEn: "Doc Scanner",
      desc: isRtl ? "صور المستند وحوّله PDF" : "Capture docs as PDF",
      icon: ScanLine,
      route: "/scanner",
      iconBg: "bg-gold/20",
    },
    {
      titleAr: "صور / نص → PDF",
      titleEn: "Image / Text → PDF",
      desc: isRtl ? "اجمع الصور أو اكتب نص" : "Merge images or write text",
      icon: FileText,
      route: "/office/to-pdf",
      iconBg: "bg-nile/20",
    },
    {
      titleAr: "محوّل PDF ↔ Word",
      titleEn: "PDF ↔ Word",
      desc: isRtl ? "بدعم OCR للعربي" : "Arabic-aware OCR",
      icon: FileType2,
      route: "/office/converter",
      iconBg: "bg-earth/20",
    },
  ];

  return (
    <div className="min-h-screen bg-background max-w-md mx-auto pb-12">
      <header className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border bg-card/80 backdrop-blur-xl sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/")}
            className="p-1.5 rounded-xl hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div>
            <h1 className="text-base font-bold font-cairo text-foreground" dir="rtl">
              المكتب الرقمي
            </h1>
            <p className="text-[10px] text-muted-foreground">Madar Digital Office</p>
          </div>
        </div>
        <div
          className="px-2.5 py-1 rounded-full bg-gold/15 border border-gold/30 text-[11px] font-bold text-gold flex items-center gap-1"
          title={isRtl ? "رصيد المكتب" : "Office credits"}
        >
          <Sparkles className="w-3 h-3" />
          {credits}
        </div>
      </header>

      <div className="px-5 mt-5">
        <div className="rounded-3xl p-5 gradient-gold text-primary-foreground shadow-xl glow-gold">
          <p className="text-xs font-semibold opacity-90 font-cairo">
            {isRtl ? "مكتب الخال" : "Al-Khal Office"}
          </p>
          <h2 className="text-xl font-bold font-cairo mt-1 leading-snug" dir="rtl">
            {isRtl ? "ورقك بين إيديك في ثواني" : "Your docs, ready in seconds"}
          </h2>
          <p className="text-xs opacity-90 mt-2 font-cairo" dir="rtl">
            {isRtl
              ? "سكنر، تحويل صور لـ PDF، و PDF ↔ Word بدعم العربي"
              : "Scanner, image→PDF, and Arabic PDF↔Word"}
          </p>
        </div>

        <div className="mt-5 grid gap-3">
          {tools.map((t) => (
            <button
              key={t.titleEn}
              onClick={() => navigate(t.route)}
              className="rounded-2xl bg-card/80 backdrop-blur-xl border border-border p-4 flex items-center gap-3 active:scale-[0.98] transition-transform text-start hover:glow-gold"
            >
              <div className={`w-12 h-12 rounded-2xl ${t.iconBg} flex items-center justify-center shrink-0`}>
                <t.icon className="w-5 h-5 text-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold font-cairo text-foreground" dir="rtl">
                  {isRtl ? t.titleAr : t.titleEn}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5 font-cairo">{t.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Office;
