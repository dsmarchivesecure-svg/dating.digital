import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";

/**
 * Route POST /auth/signout : déconnecte l'utilisateur.
 * (POST et non GET, pour qu'un simple lien piégé ne puisse pas déconnecter quelqu'un.)
 * @param request - La requête du formulaire "Sign out".
 * @returns Une redirection vers l'accueil.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch (error) {
    console.error("[auth/signout] Déconnexion impossible :", error);
  }
  return NextResponse.redirect(new URL("/", request.url), { status: 303 });
}
