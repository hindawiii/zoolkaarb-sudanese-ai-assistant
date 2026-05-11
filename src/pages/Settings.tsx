import { ArrowLeft, User, Globe, Moon, Bell, Shield, Info, ChevronRight, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useUser } from "@/store/userStore";
import { t } from "@/lib/i18n";

const Settings = () => {
  const navigate = useNavigate();
  const { name, language, darkMode, notifications, setName, setLanguage, setDarkMode, setNotifications } = useUser();
  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName] = useState(name);
  const [showOverlay, setShowOverlay] = useState(false);

  // Apply dark mode on mount + whenever toggled
  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  const saveName = () => {
    setName(tempName.trim() || "صديقي");
    setEditingName(false);
  };

  const handleNotificationsToggle = async () => {
    // Turning OFF
    if (notifications) {
      setNotifications(false);
      toast.success(t("toast.notifOff", language));
      return;
    }
    // Turning ON — request browser permission
    if (typeof window === "undefined" || !("Notification" in window)) {
      toast.error(language === "ar" ? "متصفحك ما بدعم الإشعارات." : "Your browser doesn't support notifications.");
      return;
    }
    try {
      let perm = Notification.permission;
      if (perm === "default") perm = await Notification.requestPermission();
      if (perm === "granted") {
        setNotifications(true);
        toast.success(t("toast.notifEnabled", language), { duration: 4000 });
        try {
          new Notification("Madar", {
            body: language === "ar" ? "أبشر، التنبيهات الكاربة حتصلك أول بأول 🇸🇩" : "Notifications enabled!",
          });
        } catch { /* notification may fail silently on some browsers */ }
      } else {
        toast.error(t("toast.notifDenied", language));
      }
    } catch (e) {
      console.error(e);
      toast.error(t("toast.notifDenied", language));
    }
  };

  return (
    <div className="min-h-screen bg-background max-w-md mx-auto pb-8">
      <header className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card/80 backdrop-blur-xl sticky top-0 z-10">
        <button onClick={() => navigate("/")} className="p-1.5 rounded-xl hover:bg-muted transition-colors">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div>
          <h1 className="text-base font-bold font-cairo text-foreground">{t("settings.title", "ar")}</h1>
          <p className="text-[10px] text-muted-foreground">{t("settings.title", "en")}</p>
        </div>
      </header>

      {/* Profile Card */}
      <div className="mx-5 mt-5 rounded-2xl gradient-sand border border-border p-4 flex items-center gap-3">
        <div className="w-14 h-14 rounded-full bg-gold/20 flex items-center justify-center">
          <User className="w-6 h-6 text-gold" />
        </div>
        <div className="flex-1 min-w-0">
          {editingName ? (
            <div className="flex items-center gap-2">
              <input
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && saveName()}
                autoFocus
                className="flex-1 h-9 rounded-lg bg-card border border-border px-3 text-sm font-cairo text-foreground focus:outline-none focus:ring-2 focus:ring-gold/40"
              />
              <button onClick={saveName} className="p-2 rounded-lg gradient-gold text-primary-foreground active:scale-95">
                <Check className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button onClick={() => { setTempName(name); setEditingName(true); }} className="text-start w-full">
              <p className="text-sm font-bold font-cairo text-foreground truncate">{name}</p>
              <p className="text-[11px] text-muted-foreground">{t("settings.editName", language)}</p>
            </button>
          )}
        </div>
      </div>

      {/* Preferences */}
      <div className="mt-5 px-5">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{t("settings.preferences", language)}</p>
        <div className="rounded-2xl bg-card border border-border overflow-hidden divide-y divide-border">
          <div className="w-full flex items-center gap-3 px-4 py-3.5">
            <Globe className="w-4 h-4 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-sm text-foreground">{t("settings.language", language)}</p>
              <p className="text-[10px] font-cairo text-earth-light" dir="rtl">اللغة</p>
            </div>
            <div className="flex rounded-full bg-muted p-0.5">
              {(["ar", "en"] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => setLanguage(l)}
                  className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-colors ${
                    language === l ? "gradient-gold text-primary-foreground" : "text-muted-foreground"
                  }`}
                >
                  {l === "ar" ? "عربي" : "EN"}
                </button>
              ))}
            </div>
          </div>

          <button onClick={() => setDarkMode(!darkMode)} className="w-full flex items-center gap-3 px-4 py-3.5 text-start active:bg-muted/50 transition-colors">
            <Moon className="w-4 h-4 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-sm text-foreground">{t("settings.dark", language)}</p>
              <p className="text-[10px] font-cairo text-earth-light" dir="rtl">الوضع الداكن</p>
            </div>
            <div className={`w-10 h-6 rounded-full transition-colors ${darkMode ? "bg-primary" : "bg-muted"} relative`}>
              <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-background shadow transition-transform ${darkMode ? "translate-x-[18px]" : "translate-x-0.5"}`} />
            </div>
          </button>

          <button onClick={handleNotificationsToggle} className="w-full flex items-center gap-3 px-4 py-3.5 text-start active:bg-muted/50 transition-colors">
            <Bell className="w-4 h-4 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-sm text-foreground">{t("settings.notifications", language)}</p>
              <p className="text-[10px] font-cairo text-earth-light" dir="rtl">الإشعارات</p>
            </div>
            <div className={`w-10 h-6 rounded-full transition-colors ${notifications ? "bg-primary" : "bg-muted"} relative`}>
              <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-background shadow transition-transform ${notifications ? "translate-x-[18px]" : "translate-x-0.5"}`} />
            </div>
          </button>
        </div>
      </div>

      {/* General */}
      <div className="mt-5 px-5">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{t("settings.general", language)}</p>
        <div className="rounded-2xl bg-card border border-border overflow-hidden divide-y divide-border">
          {[
            { label: t("settings.privacy", language), labelAr: "سياسة الخصوصية", icon: Shield },
            { label: t("settings.about", language), labelAr: "عن مدار", icon: Info },
          ].map((item) => (
            <button
              key={item.labelAr}
              onClick={() => setShowOverlay(true)}
              className="w-full flex items-center gap-3 px-4 py-3.5 text-start active:bg-muted/50 transition-colors"
            >
              <item.icon className="w-4 h-4 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm text-foreground">{item.label}</p>
                <p className="text-[10px] font-cairo text-earth-light" dir="rtl">{item.labelAr}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          ))}
        </div>
      </div>

      <p className="text-center text-[10px] text-muted-foreground mt-8">Madar v1.0.0 — Made with ❤️ in Sudan</p>

      {showOverlay && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center" onClick={() => setShowOverlay(false)}>
          <div className="bg-card border border-border rounded-2xl p-8 mx-6 text-center" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold font-cairo text-foreground">قريباً!</h3>
            <p className="text-sm text-muted-foreground mt-2">Coming Soon — This page is under development.</p>
            <button onClick={() => setShowOverlay(false)} className="mt-5 px-6 py-2.5 rounded-full gradient-gold text-primary-foreground text-sm font-semibold active:scale-95 transition-transform">
              Got it!
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
