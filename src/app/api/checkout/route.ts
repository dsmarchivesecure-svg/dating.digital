import Stripe from "stripe";
import { NextResponse, type NextRequest } from "next/server";

import { CURRENCY, OFFERS, getStripe, isPremiumActive } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/**
 * Route POST /api/checkout : envoie l'utilisateur vers la page de paiement Stripe.
 * Le formulaire envoie "offer" = "premium" (abonnement) ou "pack" (10 crédits).
 * @param request - La requête du formulaire.
 * @returns Une redirection vers Stripe Checkout, ou vers l'accueil avec un message d'erreur.
 */
export async function POST(request: NextRequest) {
  const origin = new URL(request.url).origin;
  const back = (status: string, reason?: string) =>
    NextResponse.redirect(
      `${origin}/?checkout=${status}${reason ? `&reason=${encodeURIComponent(reason)}` : ""}`,
      303,
    );
  // Étape en cours : affichée (sans aucune donnée secrète) en cas d'erreur, pour le diagnostic
  let step = "auth";

  try {
    // 1. L'utilisateur doit être connecté
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.email) return NextResponse.redirect(`${origin}/login`, 303);

    const offer = String((await request.formData()).get("offer") ?? "");
    if (offer !== "premium" && offer !== "pack") return back("error");

    // 2. Lecture du profil (côté serveur, jamais depuis le navigateur)
    step = "profile";
    const admin = createAdminClient();
    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("stripe_customer_id, subscription_status, current_period_end")
      .eq("id", user.id)
      .single();
    if (profileError || !profile) {
      console.error("[checkout] Profil introuvable :", profileError?.message);
      return back("error", `profile-${profileError?.code ?? "missing"}`);
    }

    // Pas de double abonnement
    if (offer === "premium" && isPremiumActive(profile.subscription_status, profile.current_period_end)) {
      return back("already-premium");
    }

    // 3. Client Stripe : créé une fois, puis réutilisé
    step = "customer";
    const stripe = getStripe();
    let customerId = profile.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { user_id: user.id },
      });
      customerId = customer.id;
      const { error } = await admin
        .from("profiles")
        .update({ stripe_customer_id: customerId })
        .eq("id", user.id);
      if (error) console.error("[checkout] Enregistrement du client Stripe impossible :", error.message);
    }

    // 4. Création de la session de paiement
    step = "session";
    const common = {
      customer: customerId,
      client_reference_id: user.id,
      metadata: { user_id: user.id, offer },
      success_url: `${origin}/?checkout=success`,
      cancel_url: `${origin}/?checkout=cancel`,
    };

    const session =
      offer === "premium"
        ? await stripe.checkout.sessions.create({
            ...common,
            mode: "subscription",
            line_items: [
              {
                quantity: 1,
                price_data: {
                  currency: CURRENCY,
                  unit_amount: OFFERS.premium.amountCents,
                  recurring: { interval: "month" },
                  product_data: { name: OFFERS.premium.name, description: OFFERS.premium.description },
                },
              },
            ],
            subscription_data: { metadata: { user_id: user.id } },
          })
        : await stripe.checkout.sessions.create({
            ...common,
            mode: "payment",
            line_items: [
              {
                quantity: 1,
                price_data: {
                  currency: CURRENCY,
                  unit_amount: OFFERS.pack.amountCents,
                  product_data: { name: OFFERS.pack.name, description: OFFERS.pack.description },
                },
              },
            ],
          });

    if (!session.url) throw new Error("Stripe n'a pas renvoyé d'URL de paiement");
    return NextResponse.redirect(session.url, 303);
  } catch (error) {
    console.error(`[checkout] Erreur à l'étape ${step} :`, error);
    const detail =
      error instanceof Stripe.errors.StripeError
        ? `${error.type}${error.code ? `-${error.code}` : ""}`
        : error instanceof Error && error.message.includes("manquante")
          ? "missing-env"
          : "unknown";
    return back("error", `${step}-${detail}`);
  }
}
