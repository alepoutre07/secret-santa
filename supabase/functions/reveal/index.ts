import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return Response.json({ error: "Method not allowed" }, { status: 405, headers: corsHeaders });
  try {
    const { participantId } = await request.json();
    if (typeof participantId !== "string") return Response.json({ error: "Participant not found" }, { status: 400, headers: corsHeaders });
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { error: drawError } = await admin.rpc("draw_once");
    if (drawError) return Response.json({ error: "Le tirage n'est pas prêt. Vérifie la liste des participants." }, { status: 409, headers: corsHeaders });
    const { data, error } = await admin.from("assignments").select("recipient:participants!assignments_recipient_id_fkey(name)").eq("giver_id", participantId).maybeSingle();
    if (error || !data?.recipient?.name) return Response.json({ error: "Participant introuvable." }, { status: 404, headers: corsHeaders });
    return Response.json({ recipientName: data.recipient.name }, { headers: { ...corsHeaders, "Cache-Control": "no-store, private" } });
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400, headers: corsHeaders });
  }
});
