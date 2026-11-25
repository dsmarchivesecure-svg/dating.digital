import Stripe from "stripe";
import { NextResponse, type NextRequest } from "next/server";

import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/**
 * Route POST /api/portal : ouvre l'espace client Stripe (gérer ou annuler l'abonnement,
 * changer de carte, télécharger les factures). Stripe héberge cette page : rien à coder côté UI.
 * @param request - La requête du formulaire de la page /account.
 * @returns Une redirection vers l'espace client Stripe, ou vers /account avec un code d'erreur.
 */
export async function POST(request: NextRequest) {
  const origin = new URL(request.url).origin;
  const back = (reason: string) =>
    NextResponse.redirect(`${origin}/account?portal=error&reason=${encodeURIComponent(reason)}`, 303);

  try {
    // 1. L'utilisateur doit être connecté
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.redirect(`${origin}/login`, 303);

    // 2. Son identifiant client Stripe (lu côté serveur uniquement)
    const { data: profile, error } = await createAdminClient()
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .single();
    if (error) {
      console.error("[portal] Lecture du profil impossible :", error.message);
      return back("profile");
    }
    if (!profile?.stripe_customer_id) return back("no-customer");

    // 3. Création d'une session de l'espace client, valable quelques minutes
    const session = await getStripe().billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${origin}/account`,
    });
    return NextResponse.redirect(session.url, 303);
  } catch (error) {
    console.error("[portal] Erreur :", error);
    const reason =
      error instanceof Stripe.errors.StripeError ? `${error.type}${error.code ? `-${error.code}` : ""}` : "unknown";
    return back(reason);
  }
}
