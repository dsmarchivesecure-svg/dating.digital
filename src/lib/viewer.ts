import "server-only";

import { isPremiumActive } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";

/** Profil tel qu'affiché dans l'interface. */
export type ViewerProfile = {
  free_opener_left: number;
  free_analysis_left: number;
  pack_credits: number;
  subscription_status: string | null;
  current_period_end: string | null;
};

/**
 * Récupère le visiteur actuel : utilisateur connecté (ou null), son profil et son statut Premium.
 * La lecture passe par le RLS : on ne peut lire que son propre profil.
 * @returns { user, profile, premium }
 */
export async function getViewer() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { user: null, profile: null, premium: false };

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("free_opener_left, free_analysis_left, pack_credits, subscription_status, current_period_end")
    .eq("id", user.id)
    .single<ViewerProfile>();
  if (error) console.error("[viewer] Lecture du profil impossible :", error.message);

  const premium = profile ? isPremiumActive(profile.subscription_status, profile.current_period_end) : false;
  return { user, profile, premium };
}

/**
 * Résume les crédits restants en une ligne lisible.
 * @param profile - Le profil de l'utilisateur.
 * @param premium - true si l'abonnement est actif.
 * @returns Par exemple "Free: 1 opener · 1 analysis · Pack: 10".
 */
export function creditsLabel(profile: ViewerProfile | null, premium: boolean): string {
  if (premium) return "Premium · unlimited";
  if (!profile) return "";
  return `Free: ${profile.free_opener_left} opener · ${profile.free_analysis_left} analysis · Pack: ${profile.pack_credits}`;
}
