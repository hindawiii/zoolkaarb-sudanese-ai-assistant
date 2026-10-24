import { useId, useRef, useState } from "react";
import { Check, ChevronDown, Copy, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUser } from "@/store/userStore";

const AppShareInline = () => {
  const { language } = useUser();
  const isAr = language === "ar";
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const panelId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const url = window.location.origin;
  const text = isAr ? "جرّب رسمة — أدوات إبداعية بروح سودانية 🇸🇩" : "Try Rasma — creative tools with a Sudanese spirit 🇸🇩";
  const encoded = encodeURIComponent(`${text} ${url}`);
  const channels = [
    { name: "WhatsApp", className: "share-whatsapp", href: `https://wa.me/?text=${encoded}`, path: "M20.5 3.5A11.8 11.8 0 0 0 12 0C5.4 0 .1 5.3.1 11.9c0 2.1.5 4.1 1.6 5.9L0 24l6.3-1.7a12 12 0 0 0 5.7 1.5c6.6 0 11.9-5.3 11.9-11.9 0-3.2-1.2-6.2-3.4-8.4ZM12 21.8a9.9 9.9 0 0 1-5-1.4l-.4-.2-3.7 1 1-3.7-.2-.4a9.9 9.9 0 1 1 8.3 4.7Zm5.5-7.4-2-.9c-.3-.1-.5-.1-.7.1l-.9 1.2c-.2.2-.4.2-.7.1a8 8 0 0 1-4-3.5c-.2-.3 0-.5.1-.6l.4-.5c.2-.2.2-.3.3-.5.1-.2.1-.4 0-.5L9.1 7c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.4 0 1.5 1.1 2.9 1.2 3.1.2.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.5-.1 1.7-.7 2-1.4.2-.7.2-1.3.1-1.4-.1-.1-.2-.2-.5-.4Z" },
    { name: "Facebook", className: "share-facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, path: "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" },
    { name: "X", className: "share-x", href: `https://twitter.com/intent/tweet?text=${encoded}`, path: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" },
  ];

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setCopyError(false);
    } catch {
      setCopyError(true);
    }
  };

  return (
    <section className="home-share shrink-0 border-t border-border pt-2" aria-label={isAr ? "مشاركة التطبيق" : "Share app"}
      onKeyDown={(event) => {
        if (event.key === "Escape" && open) { setOpen(false); triggerRef.current?.focus(); }
      }}>
      <Button ref={triggerRef} variant="ghost" className="w-full h-11 justify-between text-muted-foreground hover:text-foreground rounded-full px-4"
        aria-expanded={open} aria-controls={panelId} onClick={() => { setOpen(!open); setCopied(false); setCopyError(false); }}>
        <span className="flex items-center gap-2"><Share2 className="text-gold" />{isAr ? "شارك رسمة مع أصحابك" : "Share Rasma with friends"}</span>
        <ChevronDown className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </Button>
      <div id={panelId} className="share-expansion" data-open={open} inert={open ? undefined : ""} aria-hidden={!open}>
        <div className="overflow-hidden">
          <div className="grid grid-cols-4 gap-1 py-3">
            {channels.map((channel) => (
              <Button key={channel.name} asChild variant="ghost" className="h-auto flex-col gap-2 px-1 py-1 text-[10px] rounded-lg">
                <a href={channel.href} target="_blank" rel="noopener noreferrer" aria-label={`${isAr ? "المشاركة عبر" : "Share via"} ${channel.name}`}>
                  <span className={`share-channel ${channel.className}`}><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="h-5 w-5"><path d={channel.path} /></svg></span>
                  {channel.name}
                </a>
              </Button>
            ))}
            <Button variant="ghost" onClick={copyLink} className="h-auto flex-col gap-2 px-1 py-1 text-[10px] rounded-lg" aria-label={isAr ? "نسخ رابط التطبيق" : "Copy app link"}>
              <span className="share-channel bg-muted text-foreground">{copied ? <Check /> : <Copy />}</span>
              {copied ? (isAr ? "تم النسخ" : "Copied") : (isAr ? "نسخ الرابط" : "Copy link")}
            </Button>
          </div>
          <p role="status" className="text-center text-xs text-muted-foreground">{copyError ? (isAr ? "تعذر النسخ؛ اختر إحدى وسائل المشاركة." : "Copy unavailable; choose a sharing channel.") : copied ? (isAr ? "تم نسخ رابط التطبيق" : "App link copied") : ""}</p>
        </div>
      </div>
    </section>
  );
};

export default AppShareInline;