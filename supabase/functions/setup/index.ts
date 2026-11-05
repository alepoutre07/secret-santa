import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-token",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return Response.json({ error: "Method not allowed" }, { status: 405, headers: corsHeaders });
  const expected = Deno.env.get("ADMIN_TOKEN");
  if (!expected || request.headers.get("x-admin-token") !== expected) return Response.json({ error: "Accès administrateur refusé." }, { status: 401, headers: corsHeaders });
  try {
    const body = await request.json();
    if (!Array.isArray(body.names) || body.names.length < 2 || body.names.length > 100) {
      return Response.json({ error: "Il faut fournir entre 2 et 100 prénoms." }, { status: 400, headers: corsHeaders });
    }
    const names = body.names.map((name: unknown) => typeof name === "string" ? name.trim() : "");
    if (names.some((name: string) => !name || name.length > 60) || new Set(names.map((name: string) => name.toLocaleLowerCase("fr"))).size !== names.length) {
      return Response.json({ error: "Les prénoms doivent être renseignés, uniques et faire au plus 60 caractères." }, { status: 400, headers: corsHeaders });
    }
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { count, error: countError } = await admin.from("assignments").select("giver_id", { count: "exact", head: true });
    if (countError) throw countError;
    if ((count ?? 0) > 0) return Response.json({ error: "Le tirage est déjà effectué : la liste est verrouillée." }, { status: 409, headers: corsHeaders });
    const { error: deleteError } = await admin.from("participants").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (deleteError) throw deleteError;
    const { error: insertError } = await admin.from("participants").insert(names.map((name: string) => ({ name })));
    if (insertError) throw insertError;
    return Response.json({ ok: true, participantCount: names.length }, { headers: { ...corsHeaders, "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "Impossible d'enregistrer la liste." }, { status: 500, headers: corsHeaders });
  }
});
