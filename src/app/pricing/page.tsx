import type { Metadata } from "next";

import { CheckoutBanner } from "@/components/checkout-banner";
import { PricingCards } from "@/components/pricing-cards";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { creditsLabel, getViewer } from "@/lib/viewer";

export const metadata: Metadata = { title: "Pricing — Dating.digital" };

// Page liée à l'utilisateur connecté (boutons d'achat) : générée à chaque visite
export const instant = false;

/**
 * Page /pricing : les trois offres et, si connecté, les crédits restants.
 * @param searchParams - Paramètres d'URL (?checkout=cancel|error après Stripe).
 * @returns La page des prix.
 */
export default async function PricingPage({ searchParams }: PageProps<"/pricing">) {
  const { checkout, reason } = await searchParams;
  const { user, profile, premium } = await getViewer();
  const signedIn = Boolean(user);

  return (
    <>
      <SiteHeader signedIn={signedIn} />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center gap-10 px-5 pb-20 pt-8">
        <CheckoutBanner status={checkout} reason={reason} />
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Simple pricing</h1>
          <p className="mt-3 text-muted-foreground">Start free. Upgrade only if it helps you get more replies.</p>
          {signedIn && profile && (
            <p className="mt-4 inline-block rounded-full bg-muted px-4 py-1.5 text-sm">
              Your balance: {creditsLabel(profile, premium)}
            </p>
          )}
        </div>
        <PricingCards signedIn={signedIn} premium={premium} />
        <p className="max-w-xl text-center text-xs text-muted-foreground">
          Payments are processed securely by Stripe. Premium renews monthly until you cancel.
        </p>
      </main>
      <SiteFooter />
    </>
  );
}
