import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "@/lib/supabase/config";

/**
 * S'exécute avant chaque page : rafraîchit la session Supabase si elle
 * arrive à expiration, pour que l'utilisateur reste connecté.
 * @param request - La requête entrante du navigateur.
 * @returns La réponse, avec les cookies de session mis à jour.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  try {
    // Vérifie et rafraîchit la session (ne pas supprimer cet appel)
    await supabase.auth.getUser();
  } catch (error) {
    console.error("[proxy] Rafraîchissement de session impossible :", error);
  }

  return response;
}

// Ne s'exécute pas sur les fichiers statiques (images, icônes…)
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
