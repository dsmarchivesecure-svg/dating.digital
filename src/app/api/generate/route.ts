import Anthropic from "@anthropic-ai/sdk";
import { NextResponse, type NextRequest } from "next/server";

import { generate, type GenerationKind } from "@/lib/ai";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const MIN_LENGTH = 20;
const MAX_LENGTH = 3000;

/**
 * Réponse d'erreur au format JSON, avec un message lisible par l'utilisateur.
 * @param status - Code HTTP.
 * @param code - Code court (pour l'interface).
 * @param message - Message affiché à l'utilisateur (anglais, comme le site).
 * @returns La réponse HTTP.
 */
function fail(status: number, code: string, message: string) {
  return NextResponse.json({ error: { code, message } }, { status });
}

/**
 * Route POST /api/generate : génère des messages d'ouverture ou une analyse de profil.
 * Corps JSON attendu : { kind: "opener" | "analysis", input: "texte du profil" }.
 * Étapes : 1) connexion obligatoire 2) validation 3) réservation d'un crédit (en base, atomique)
 * 4) appel à Claude 5) enregistrement — ou remboursement du crédit si l'IA échoue.
 * @param request - La requête du navigateur.
 * @returns { result, source } en cas de succès, { error } sinon.
 */
export async function POST(request: NextRequest) {
  // 1. L'utilisateur doit être connecté
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail(401, "auth", "Please sign in to continue.");

  // 2. Validation des données (on ne fait jamais confiance au navigateur)
  let kind: GenerationKind;
  let input: string;
  try {
    const body = await request.json();
    kind = body?.kind;
    input = typeof body?.input === "string" ? body.input.trim() : "";
  } catch {
    return fail(400, "bad_request", "Invalid request.");
  }
  if (kind !== "opener" && kind !== "analysis") return fail(400, "bad_request", "Invalid request.");
  if (input.length < MIN_LENGTH) {
    return fail(400, "too_short", `Please paste at least ${MIN_LENGTH} characters.`);
  }
  if (input.length > MAX_LENGTH) {
    return fail(400, "too_long", `Please keep it under ${MAX_LENGTH} characters.`);
  }

  // 3. Réservation d'un crédit, côté base de données (impossible à contourner)
  const admin = createAdminClient();
  const { data: source, error: creditError } = await admin.rpc("consume_credit", {
    p_user_id: user.id,
    p_kind: kind,
  });
  if (creditError) {
    console.error("[generate] consume_credit :", creditError.message);
    return fail(500, "server", "Something went wrong. Please try again.");
  }
  if (source === "none") {
    return fail(402, "no_credits", "You're out of credits. Go Premium or buy a pack to continue.");
  }

  // 4. Appel à Claude — en cas d'échec, le crédit est rendu
  let result;
  try {
    result = await generate(kind, input);
  } catch (error) {
    console.error(`[generate] Échec IA (${kind}) :`, error);
    const { error: refundError } = await admin.rpc("refund_credit", {
      p_user_id: user.id,
      p_kind: kind,
      p_source: source,
    });
    if (refundError) console.error("[generate] refund_credit :", refundError.message);

    if (error instanceof Error && error.message === "REFUSAL") {
      return fail(422, "refused", "We can't help with this text. Please paste a regular dating profile.");
    }
    if (error instanceof Anthropic.RateLimitError || error instanceof Anthropic.InternalServerError) {
      return fail(503, "busy", "Our AI is busy right now. Please try again in a minute — you weren't charged.");
    }
    return fail(500, "ai", "The AI couldn't answer this time. Please try again — you weren't charged.");
  }

  // 5. Historique (une erreur ici ne doit pas faire perdre le résultat à l'utilisateur)
  const { error: insertError } = await admin
    .from("generations")
    .insert({ user_id: user.id, kind, input, output: result });
  if (insertError) console.error("[generate] Enregistrement de l'historique :", insertError.message);

  return NextResponse.json({ result, source });
}
