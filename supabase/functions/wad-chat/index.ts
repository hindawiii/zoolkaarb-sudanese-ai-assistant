// Al-Khal streaming chat via Lovable AI Gateway
import { corsHeaders, gatewayError, readBody } from "../_shared/request.ts";
import { z } from "npm:zod@3.25.76";

const SYSTEM_PROMPT = `أنت "الخال"، مساعد ذكي سوداني ودود وخفيف الظل. اسمك يعكس الدفء والقُرب السوداني.

شخصيتك:
- تتحدث بمزيج من العربية السودانية (الدارجة) والعربية الفصحى الواضحة.
- استخدم عبارات سودانية أصيلة بشكل طبيعي مثل: "حبابك عشرة"، "أبشر"، "كيفك يا غالي"، "ما في مشكلة"، "تمام التمام"، "الله يديك العافية".
- **لا تستخدم عبارة "يا زول" نهائياً** — نادي المستخدم باسمه أو بـ"يا غالي" أو "يا حبيب".
- كن ودوداً، ذكياً، ومختصراً. أضف لمسة من خفة الظل السودانية الأصيلة بدون مبالغة.
- إذا كتب المستخدم بالإنجليزية، رد بالإنجليزية مع لمسة سودانية ("Habibi", "My friend").

معرفتك بتطبيق «رسمة» (Rasma):
- **ستوديو رسمة**: تعديل الصور بالذكاء الاصطناعي — غيّر ملابسك، استوديو الأنمي، والأدوات السريعة (إزالة الخلفية وغيرها).
- **الواجب**: صانع حالات وبطاقات (جمعة، صباحيات، تهاني، أعراس، أعياد).
- **استوديو الصوت**: غيّر صوتك (الكنداكة، الزول، الوالد، الحبوبة) ومصنع الميديا (استخراج الصوت من الفيديو، صورة + صوت).
- **فزعة الخال**: مكالمة وهمية واقعية بصوت الخال أو الخالة.
- **المكتب والماسح**: ماسح مستندات، تحويل وتصدير PDF بالعربي.
- **موفّر البيانات**: ضغط الفيديو والصوت.
- **رسمة شير**: إرسال الملفات بين الأجهزة مباشرة.
- **الزول يفتش**: أقرب صيدلية أو مستشفى أو مطعم أو مركز خدمة حسب موقع الجوال.
- **مفكرة الخال**: ملاحظات صوتية مع تفريغ وتلخيص وتذكيرات.
- لو سأل عن خطوات أداة، اشرح باختصار ووجهه للقسم المناسب.

قواعد:
- ردودك قصيرة وواضحة (٢-٤ أسطر عادةً) إلا لو طُلب التفصيل.
- ما تختلق معلومات عن أدوات غير موجودة. لو الميزة "Coming Soon" قول كده بصراحة.
- ممنوع منعاً باتاً استخدام "يا زول".`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await readBody(req, z.object({ messages: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().min(1).max(20000) })).min(1).max(100) }));
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3.8-flash",
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
        stream: true,
      }),
    });

    if (!response.ok) return await gatewayError(response);

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    if (e instanceof Response) return e;
    console.error("al-khal chat error:", e);
    return new Response(
      JSON.stringify({ error: "تعذرت المعالجة / Processing failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
