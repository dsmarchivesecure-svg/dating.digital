import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { CheckoutBanner } from "@/components/checkout-banner";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { creditsLabel, getViewer } from "@/lib/viewer";

import { Generator } from "./generator";

export const metadata: Metadata = { title: "App — Dating.digital" };

// Page liée à l'utilisateur connecté : générée à chaque visite (pas de pré-rendu)
export const instant = false;

/**
 * Page /app : les deux outils IA. Réservée aux utilisateurs connectés.
 * @param searchParams - Paramètres d'URL (?checkout=success au retour de Stripe).
 * @returns La page avec le générateur, ou une redirection vers /login.
 */
export default async function AppPage({ searchParams }: PageProps<"/app">) {
  const { checkout, reason } = await searchParams;
  const { user, profile, premium } = await getViewer();
  if (!user) redirect("/login");

  return (
    <>
      <SiteHeader signedIn />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-5 pb-16 pt-4">
        <CheckoutBanner status={checkout} reason={reason} />
        <Generator initialCredits={creditsLabel(profile, premium)} />
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6 text-sm text-muted-foreground">
          <span className="truncate">Signed in as {user.email}</span>
          <div className="flex gap-2">
            {!premium && (
              <Button asChild variant="outline" size="sm">
                <Link href="/pricing">Get more credits</Link>
              </Button>
            )}
            <form action="/auth/signout" method="post">
              <Button type="submit" variant="ghost" size="sm">Sign out</Button>
            </form>
          </div>
        </div>
      </main>
    </>
  );
}
