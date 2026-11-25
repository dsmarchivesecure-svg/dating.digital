import type Stripe from "stripe";
import { NextResponse, type NextRequest } from "next/server";

import { OFFERS, getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Route POST /api/stripe/webhook : Stripe appelle cette adresse après chaque
 * paiement ou changement d'abonnement. C'est la SEULE source de vérité :
 * on ne crédite jamais un compte sur la simple parole du navigateur.
 * @param request - La requête envoyée par Stripe (corps brut + signature).
 * @returns 200 si traité (ou ignoré), 400 si la signature est invalide, 500 pour que Stripe réessaie.
 */
export async function POST(request: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = request.headers.get("stripe-signature");
  if (!secret || !signature) {
    console.error("[webhook] Secret ou signature manquant");
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  // 1. Vérification de la signature : prouve que l'appel vient bien de Stripe
  const stripe = getStripe();
  let event: Stripe.Event;
  try {
    const body = await request.text();
    event = await stripe.webhooks.constructEventAsync(body, signature, secret);
  } catch (error) {
    console.error("[webhook] Signature invalide :", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // 2. Traitement selon le type d'événement
  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        if (session.mode === "payment" && session.payment_status === "paid") {
          await grantPack(event, session);
        } else if (session.mode === "subscription" && typeof session.subscription === "string") {
          await syncSubscription(await stripe.subscriptions.retrieve(session.subscription));
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        // On relit l'abonnement chez Stripe : on a toujours son état le plus récent,
        // même si les événements arrivent dans le désordre.
        await syncSubscription(await stripe.subscriptions.retrieve(event.data.object.id));
        break;
      default:
        // Événement non utilisé : on répond OK pour que Stripe ne réessaie pas
        break;
    }
  } catch (error) {
    console.error(`[webhook] Échec du traitement de ${event.type} (${event.id}) :`, error);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

/**
 * Ajoute les 10 crédits du pack, une seule fois par événement (voir grant_pack_credits en SQL).
 * @param event - L'événement Stripe (son id sert à éviter les doublons).
 * @param session - La session de paiement terminée.
 */
async function grantPack(event: Stripe.Event, session: Stripe.Checkout.Session) {
  const userId = session.metadata?.user_id ?? session.client_reference_id;
  if (!userId || session.metadata?.offer !== "pack") {
    console.error("[webhook] Paiement sans utilisateur ou offre inconnue :", session.id);
    return;
  }
  const { data, error } = await createAdminClient().rpc("grant_pack_credits", {
    p_event_id: event.id,
    p_event_type: event.type,
    p_user_id: userId,
    p_amount: OFFERS.pack.credits,
  });
  if (error) throw new Error(`grant_pack_credits : ${error.message}`);
  console.log(`[webhook] Pack ${data ? "crédité" : "déjà traité"} pour ${userId}`);
}

/**
 * Recopie l'état d'un abonnement Stripe dans le profil de l'utilisateur.
 * @param subscription - L'abonnement tel que Stripe le connaît maintenant.
 */
async function syncSubscription(subscription: Stripe.Subscription) {
  const customerId =
    typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
  // Depuis 2025, la date de fin de période est portée par chaque ligne de l'abonnement
  const periodEnd = Math.max(0, ...subscription.items.data.map((item) => item.current_period_end));

  const { data, error } = await createAdminClient()
    .from("profiles")
    .update({
      stripe_subscription_id: subscription.id,
      subscription_status: subscription.status,
      current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
    })
    .eq("stripe_customer_id", customerId)
    .select("id");
  if (error) throw new Error(`Mise à jour de l'abonnement : ${error.message}`);
  if (!data?.length) throw new Error(`Aucun profil pour le client Stripe ${customerId}`);
  console.log(`[webhook] Abonnement ${subscription.id} → ${subscription.status}`);
}
