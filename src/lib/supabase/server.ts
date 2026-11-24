import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "./config";

/**
 * Crée un client Supabase côté serveur, lié à l'utilisateur connecté
 * (sa session est lue dans les cookies du navigateur).
 * Le RLS s'applique : ce client ne voit que les données de cet utilisateur.
 * @returns Un client Supabase prêt à l'emploi.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Appelé depuis un Server Component (lecture seule) : sans gravité,
          // le fichier proxy.ts se charge de rafraîchir la session.
        }
      },
    },
  });
}
