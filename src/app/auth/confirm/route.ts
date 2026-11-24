import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";

/**
 * Route GET /auth/confirm : l'utilisateur arrive ici en cliquant sur le lien
 * reçu par email. On échange le code du lien contre une session (connexion).
 * Accepte les deux formats de lien Supabase : "?code=…" ou "?token_hash=…&type=…".
 * @param request - La requête contenant le code dans l'URL.
 * @returns Une redirection vers l'accueil (succès) ou vers /login?error=link (échec).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  try {
    const supabase = await createClient();

    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) return NextResponse.redirect(`${origin}/`);
      console.error("[auth/confirm] Échange du code impossible :", error.message);
    } else if (tokenHash && type) {
      const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
      if (!error) return NextResponse.redirect(`${origin}/`);
      console.error("[auth/confirm] Vérification du lien impossible :", error.message);
    }
  } catch (error) {
    console.error("[auth/confirm] Erreur inattendue :", error);
  }

  return NextResponse.redirect(`${origin}/login?error=link`);
}
