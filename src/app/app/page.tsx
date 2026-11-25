import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { isPremiumActive } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";

import { Generator } from "./generator";

export const metadata: Metadata = { title: "App — Dating.digital" };

// Page liée à l'utilisateur connecté : générée à chaque visite (pas de pré-rendu)
export const instant = false;

/**
 * Page /app : les deux outils IA. Réservée aux utilisateurs connectés.
 * @returns La page avec le générateur, ou une redirection vers /login.
 */
export default async function AppPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Résumé des crédits (lecture via RLS : uniquement son propre profil)
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("free_opener_left, free_analysis_left, pack_credits, subscription_status, current_period_end")
    .eq("id", user.id)
    .single();
  if (error) console.error("[app] Lecture du profil impossible :", error.message);

  let credits = "";
  if (profile) {
    credits = isPremiumActive(profile.subscription_status, profile.current_period_end)
      ? "Premium · unlimited"
      : `Free: ${profile.free_opener_left} opener · ${profile.free_analysis_left} analysis · Pack: ${profile.pack_credits}`;
  }

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-5 py-10">
      <header className="flex items-center justify-between">
        <Link href="/" className="text-xl font-bold tracking-tight">
          Dating<span className="text-primary">.digital</span>
        </Link>
        <span className="text-xs text-muted-foreground">{user.email}</span>
      </header>
      <Generator initialCredits={credits} />
    </main>
  );
}
