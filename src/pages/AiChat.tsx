import BackButton from "@/components/BackButton";
import { useState, useRef, useEffect } from "react";
import { Send, Loader2, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import avatarImg from "@/assets/wad-al-halal-avatar.png";
import { Category } from "@/lib/places";
import { useUser } from "@/store/userStore";
import { t } from "@/lib/i18n";

interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
  action?: { type: "directory"; category: Category; label: string };
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/wad-chat`;

// Detect directory intent from the user message
const detectDirectoryIntent = (text: string): { category: Category; label: string } | null => {
  const t = text.toLowerCase();
  if (/(صيدلي|pharmac)/i.test(text)) return { category: "pharmacy", label: "افتح أقرب الصيدليات" };
  if (/(مستشف|hospital|clinic|عياد)/i.test(text)) return { category: "hospital", label: "افتح أقرب المستشفيات" };
  if (/(مطعم|restaurant|food|أكل|اكل)/i.test(text)) return { category: "restaurant", label: "افتح أقرب المطاعم" };
  if (/(خدم|service|atm|صراف)/i.test(text)) return { category: "service", label: "افتح أقرب مراكز الخدمة" };
  if (/(قريب|أقرب|اقرب|nearest|near me)/i.test(t)) return { category: "pharmacy", label: "افتح الزول يفتش" };
  return null;
};

const AiChat = () => {
  const navigate = useNavigate();
  const { name, language } = useUser();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      role: "assistant",
      content: `حبابك عشرة ${name}! 👋 أنا الخال. اسألني عن أي أداة، أو قول لي "أقرب صيدلية فاتحة وين؟" وأنا أوديك على طول.\n\nHello! I'm Al-Khal. Ask me anything.`,
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (preset?: string) => {
    const text = (preset ?? input).trim();
    if (!text || isLoading) return;

    const userMsg: Message = { id: Date.now(), role: "user", content: text };
    const intent = detectDirectoryIntent(text);
    const history = [...messages, userMsg];
    setMessages(history);
    setInput("");
    setIsLoading(true);

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: history.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!resp.ok || !resp.body) {
        if (resp.status === 429) toast.error("في زحمة، جرب تاني بعد شوية يا غالي.");
        else if (resp.status === 402) toast.error("الرصيد خلص. ضيف كريديتات من إعدادات Lovable AI.");
        else toast.error("ما قدرت أرد عليك الآن.");
        setIsLoading(false);
        return;
      }

      const assistantId = Date.now() + 1;
      let assistantSoFar = "";
      setMessages((prev) => [
        ...prev,
        { id: assistantId, role: "assistant", content: "", action: intent ? { type: "directory", ...intent } : undefined },
      ]);

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let streamDone = false;

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") {
            streamDone = true;
            break;
          }
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantSoFar += content;
              setMessages((prev) =>
                prev.map((m) => (m.id === assistantId ? { ...m, content: assistantSoFar } : m)),
              );
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }
    } catch (err) {
      console.error("chat error:", err);
      toast.error("في مشكلة في الاتصال يا غالي.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background max-w-md mx-auto flex flex-col">
      <header className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card/80 backdrop-blur-xl sticky top-0 z-10">
        <BackButton onClick={() => navigate("/")} />
        <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-gold">
          <img src={avatarImg} alt="Al-Khal" className="w-full h-full object-cover" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold font-cairo text-foreground">الخال</p>
          <p className="text-[10px] text-nile">{isLoading ? t("chat.typing", language) : t("chat.online", language)}</p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-line font-cairo ${
                msg.role === "user"
                  ? "gradient-gold text-primary-foreground rounded-br-md"
                  : "bg-card border border-border text-foreground rounded-bl-md"
              }`}
            >
              {msg.content || <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
            </div>
            {msg.action?.type === "directory" && msg.content && (
              <button
                onClick={() => navigate(`/yafatish?category=${msg.action!.category}`)}
                className="mt-2 px-4 py-2 rounded-full bg-card border border-border text-xs font-semibold flex items-center gap-1.5 active:scale-95 transition-transform hover:bg-muted"
              >
                <MapPin className="w-3.5 h-3.5 text-gold" />
                <span className="font-cairo">{msg.action.label}</span>
              </button>
            )}
          </div>
        ))}
        {messages.length === 1 && !isLoading && (
          <div className="pt-2">
            <p className="text-xs text-muted-foreground font-cairo mb-2">{language === "ar" ? "جرّب تسأل الخال:" : "Try asking Al-Khal:"}</p>
            <div className="flex flex-wrap gap-2">
              {(language === "ar"
                ? ["كيف أغيّر ملابسي في صورة؟", "أعمل حالة جمعة مباركة", "كيف أغيّر صوتي؟", "أقرب صيدلية فاتحة وين؟", "أحوّل صورة لملف PDF", "أرسل ملف لصاحبي بدون نت"]
                : ["How do I change my outfit in a photo?", "Make a Friday status", "How do I change my voice?", "Nearest open pharmacy?", "Turn a photo into a PDF", "Send a file offline"]
              ).map((q) => (
                <button key={q} onClick={() => handleSend(q)}
                  className="px-3 py-2 rounded-full surface-obsidian text-xs font-cairo text-foreground active:scale-95 transition-transform">
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="px-4 py-3 border-t border-border bg-card/80 backdrop-blur-xl sticky bottom-0">
        <div className="flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            disabled={isLoading}
            placeholder={language === "ar" ? "اكتب رسالتك..." : "Type a message..."}
            className="flex-1 h-11 rounded-full bg-muted border-0 px-4 text-sm font-cairo text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
          />
          <button
            onClick={() => handleSend()}
            disabled={isLoading || !input.trim()}
            className="w-11 h-11 rounded-full gradient-gold flex items-center justify-center shrink-0 active:scale-95 transition-transform disabled:opacity-50"
            aria-label="Send"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 text-primary-foreground animate-spin" />
            ) : (
              <Send className="w-4 h-4 text-primary-foreground" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AiChat;
