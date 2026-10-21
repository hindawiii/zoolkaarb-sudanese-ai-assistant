// Voice Notes edge function: transcribe Sudanese audio + summarize
// Uses Lovable AI Gateway (Gemini multimodal)
import { corsHeaders, gatewayError, readBody } from "../_shared/request.ts";
import { z } from "npm:zod@3.25.76";

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

async function callGateway(body: unknown) {
  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!resp.ok) throw await gatewayError(resp);

  return await resp.json();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");
    const { mode, audioBase64, mimeType, text } = await readBody(req, z.discriminatedUnion("mode", [z.object({ mode: z.literal("transcribe"), audioBase64: z.string().min(1).max(16000000), mimeType: z.string().max(150).optional() }), z.object({ mode: z.literal("summarize"), text: z.string().min(1).max(30000) })]));

    if (mode === "transcribe") {
      const data = await callGateway({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content:
              "أنت مساعد سوداني خبير في فك رموز اللهجة السودانية والعامية. مهمتك: حول التسجيل الصوتي إلى نص عربي مكتوب بالضبط كما قاله المتحدث، مع الحفاظ على الكلمات السودانية العامية (مثل: شنو، داير، كيفنك، زول، الحين، تمام، ياخ). لا تترجم ولا تلخص — فقط فرتق الكلام نصاً.",
          },
          {
            role: "user",
            content: [
              { type: "text", text: "فرتق الكلام ده:" },
              {
                type: "input_audio",
                input_audio: { data: audioBase64, format: mimeType?.includes("webm") ? "webm" : "mp3" },
              },
            ],
          },
        ],
      });
      const transcript = data?.choices?.[0]?.message?.content ?? "";
      return new Response(JSON.stringify({ transcript }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (mode === "summarize") {
      const data = await callGateway({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content:
              "أنت الخال — مساعد سوداني ذكي. لخص النص في نقاط قصيرة (3-5 bullets) بلهجة سودانية ودودة. استخرج أيضاً أي مواعيد أو تواريخ مذكورة (ساعة، يوم، تاريخ) في حقل reminders. أرجع JSON فقط.",
          },
          { role: "user", content: text ?? "" },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "summarize_note",
              description: "Return summary bullets and detected reminders",
              parameters: {
                type: "object",
                properties: {
                  bullets: { type: "array", items: { type: "string" } },
                  reminders: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        text: { type: "string" },
                        when: { type: "string", description: "Time/date phrase as detected, e.g. 'ساعة 4'" },
                      },
                      required: ["text", "when"],
                    },
                  },
                },
                required: ["bullets", "reminders"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "summarize_note" } },
      });
      const args =
        data?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments ?? "{}";
      const parsed = JSON.parse(args);
      return new Response(JSON.stringify(parsed), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown mode" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    if (e instanceof Response) return e;
    console.error("voice-notes error", e);
    return new Response(
      JSON.stringify({ error: "تعذرت المعالجة / Processing failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
