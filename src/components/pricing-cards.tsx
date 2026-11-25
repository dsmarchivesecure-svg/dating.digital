import Link from "next/link";
import { Check, Crown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Plan = {
  id: "free" | "pack" | "premium";
  name: string;
  price: string;
  period: string;
  features: string[];
  highlight?: boolean;
};

const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    price: "€0",
    period: "to try",
    features: ["1 opener generation (3 messages)", "1 profile analysis", "No credit card needed"],
  },
  {
    id: "pack",
    name: "Credit pack",
    price: "€2.99",
    period: "one-time",
    features: ["10 extra generations", "Use them for openers or analyses", "No subscription, credits never expire"],
  },
  {
    id: "premium",
    name: "Premium",
    price: "€9.99",
    period: "per month",
    features: ["Unlimited openers", "Unlimited profile analyses", "Cancel anytime"],
    highlight: true,
  },
];

/**
 * Bouton d'action d'une offre, selon l'état du visiteur.
 * @param plan - L'offre concernée.
 * @param signedIn - true si l'utilisateur est connecté.
 * @param premium - true si l'utilisateur a déjà Premium.
 * @returns Un lien ou un formulaire qui mène au paiement Stripe.
 */
function PlanAction({ plan, signedIn, premium }: { plan: Plan; signedIn: boolean; premium: boolean }) {
  const variant = plan.highlight ? "default" : "outline";

  if (plan.id === "free") {
    return (
      <Button asChild variant="outline" className="w-full">
        <Link href="/app">{signedIn ? "Open the app" : "Start for free"}</Link>
      </Button>
    );
  }
  if (plan.id === "premium" && premium) {
    return (
      <Button variant="secondary" className="w-full" disabled>
        <Crown /> Your current plan
      </Button>
    );
  }
  if (!signedIn) {
    return (
      <Button asChild variant={variant} className="w-full">
        <Link href="/login">Sign in to {plan.id === "premium" ? "subscribe" : "buy"}</Link>
      </Button>
    );
  }
  return (
    <form action="/api/checkout" method="post">
      <input type="hidden" name="offer" value={plan.id} />
      <Button type="submit" variant={variant} className="w-full">
        {plan.id === "premium" ? "Go Premium" : "Buy 10 credits"}
      </Button>
    </form>
  );
}

/**
 * Les trois offres (gratuit, pack, Premium) présentées côte à côte.
 * @param signedIn - true si l'utilisateur est connecté.
 * @param premium - true si l'utilisateur a déjà Premium.
 * @returns La grille des offres.
 */
export function PricingCards({ signedIn, premium }: { signedIn: boolean; premium: boolean }) {
  return (
    <div className="grid w-full gap-4 md:grid-cols-3">
      {PLANS.map((plan) => (
        <div
          key={plan.id}
          className={cn(
            "flex flex-col gap-5 rounded-2xl border bg-card p-6",
            plan.highlight ? "border-primary shadow-lg shadow-primary/10" : "border-border",
          )}
        >
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">{plan.name}</h3>
            {plan.highlight && (
              <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-accent-foreground">
                Most popular
              </span>
            )}
          </div>
          <p>
            <span className="text-3xl font-bold tracking-tight">{plan.price}</span>{" "}
            <span className="text-sm text-muted-foreground">{plan.period}</span>
          </p>
          <ul className="flex flex-1 flex-col gap-2 text-sm">
            {plan.features.map((feature) => (
              <li key={feature} className="flex items-start gap-2">
                <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                {feature}
              </li>
            ))}
          </ul>
          <PlanAction plan={plan} signedIn={signedIn} premium={premium} />
        </div>
      ))}
    </div>
  );
}
