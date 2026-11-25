import "server-only";

import Stripe from "stripe";

/** Les deux offres payantes, définies à un seul endroit. */
export const OFFERS = {
  premium: {
    name: "Dating.digital Premium",
    description: "Unlimited openers and profile reviews",
    amountCents: 999, // 9,99 €
  },
  pack: {
    name: "Dating.digital — 10 credits",
    description: "10 extra generations, no subscription",
    amountCents: 299, // 2,99 €
    credits: 10,
  },
} as const;

export const CURRENCY = "eur";

let stripeClient: Stripe | null = null;

/**
 * Renvoie le client Stripe (créé une seule fois).
 * La clé secrète est lue côté serveur uniquement.
 * @returns Le client Stripe prêt à l'emploi.
 */
export function getStripe(): Stripe {
  if (!stripeClient) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("Variable d'environnement STRIPE_SECRET_KEY manquante");
    stripeClient = new Stripe(key);
  }
  return stripeClient;
}

/**
 * Indique si un abonnement Premium est actuellement valable.
 * @param status - Statut Stripe enregistré (active, trialing, canceled…).
 * @param periodEnd - Date de fin de la période payée.
 * @returns true si l'utilisateur est Premium aujourd'hui.
 */
export function isPremiumActive(status: string | null, periodEnd: string | null): boolean {
  if (!status || !periodEnd) return false;
  return ["active", "trialing"].includes(status) && new Date(periodEnd) > new Date();
}
