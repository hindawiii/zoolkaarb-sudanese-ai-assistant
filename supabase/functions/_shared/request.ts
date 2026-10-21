import { z } from "npm:zod@3.25.76";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

export { corsHeaders };
export async function readBody(req: Request, schema: z.ZodTypeAny) {
  if (req.method !== "POST") throw new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  let input: unknown;
  try { input = await req.json(); } catch { throw new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }); }
  const parsed = schema.safeParse(input);
  if (!parsed.success) throw new Response(JSON.stringify({ error: "بيانات الطلب غير صالحة / Invalid request" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  return parsed.data;
}

export async function gatewayError(response: Response) {
  let payload: { message?: unknown; error?: { message?: unknown } } = {};
  try { payload = await response.json(); } catch { /* Invalid upstream body */ }
  const reason = payload.message ?? payload.error?.message;
  const message = typeof reason === "string" ? reason.slice(0, 500) : response.status === 402 ? "AI credits exhausted. Please add credits in Lovable workspace settings." : response.status === 429 ? "طلبات كثيرة، حاول لاحقاً / Please try again later" : "تعذرت خدمة الذكاء الاصطناعي / AI service unavailable";
  return new Response(JSON.stringify({ error: message, ...(response.status === 402 ? { code: "AI_CREDITS_EXHAUSTED" } : {}) }), {
    status: response.status,
    headers: { ...corsHeaders, "Content-Type": "application/json", ...(response.headers.get("Retry-After") ? { "Retry-After": response.headers.get("Retry-After") ?? "" } : {}) },
  });
}