// Generate a contextual Sudanese-dialect call line via Lovable AI.
// Returns { line: string }.
import { corsHeaders, gatewayError, readBody } from "../_shared/request.ts";
import { z } from "npm:zod@3.25.76";

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

const FALLBACK_KHAL = [
  "ألو يا هندسة، وينك يا زول؟ كنت محتاجك ضروري والله!",
  "السلام عليكم.. الخال معاك، عندي ليك خبر بسيط لو ما مشغول.",
];
const FALLBACK_KHALA = [
  "ألو، معاك الخالة. عايزاك في موضوع مهم، رد علي لما تقدر.",
  "يا ولدي، تعال البيت ضروري الناس مستنياك.",
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { voice, callerName, topic } = await readBody(req, z.object({ voice: z.string().max(40).default("khal"), callerName: z.string().max(100).default("الخال"), topic: z.string().max(2000).default("") }));
    const isKhala = voice === "khala";

    if (!LOVABLE_API_KEY) {
      const arr = isKhala ? FALLBACK_KHALA : FALLBACK_KHAL;
      return new Response(JSON.stringify({ line: arr[0] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const persona = isKhala
      ? "أنتِ 'الخالة' — امرأة سودانية حازمة بصوت دافئ ولهجة سودانية أصيلة. تتحدثين بثقة وحنو."
      : "أنت 'الخال' — رجل سوداني ودود بلهجة سودانية أصيلة. تتحدث بطبيعية وحرارة.";

    const sysPrompt =
      `${persona} مهمتك: اكتب جملة واحدة قصيرة (15-25 كلمة) كأنها بداية مكالمة هاتفية حقيقية. ` +
      `استخدم كلمات سودانية عامية (زول، شنو، داير، تمام، الحين، فزعة، يا هندسة). ` +
      `لا تستخدم رموز تعبيرية، ولا علامات اقتباس، ولا تذكر أنك ذكاء اصطناعي. ` +
      `اذكر اسم المتصل به إذا كان مناسباً. أرجع الجملة فقط بدون أي شرح.`;

    const userPrompt =
      `اسم الشخص الذي تتصل به: ${callerName}. ` +
      (topic ? `موضوع المكالمة: ${topic}. ` : "") +
      `اكتب جملة افتتاحية للمكالمة.`;

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: sysPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!resp.ok) return await gatewayError(resp);

    const data = await resp.json();
    let line: string =
      data?.choices?.[0]?.message?.content?.trim() ??
      (isKhala ? FALLBACK_KHALA[0] : FALLBACK_KHAL[0]);
    line = line.replace(/^["'«»]+|["'«»]+$/g, "").trim();

    return new Response(JSON.stringify({ line }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    if (e instanceof Response) return e;
    console.error("fake-call-line error", e);
    return new Response(
      JSON.stringify({ line: FALLBACK_KHAL[0] }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
