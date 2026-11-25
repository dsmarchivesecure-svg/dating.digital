import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Crown, ExternalLink } from "lucide-react";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { getViewer } from "@/lib/viewer";

export const metadata: Metadata = { title: "Account — Dating.digital" };

// Page liée à l'utilisateur connecté : générée à chaque visite (pas de pré-rendu)
export const instant = false;

/** Messages d'erreur de l'espace client Stripe (?portal=error&reason=…). */
const PORTAL_ERRORS: Record<string, string> = {
  "no-customer": "You don't have any payment history yet.",
};

/**
 * Formate une date ISO en texte lisible (ex. "25 December 2026").
 * @param iso - Date au format ISO.
 * @returns La date formatée en anglais.
 */
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

/**
 * Page /account : e-mail, offre en cours, crédits restants, nombre de générations,
 * et accès à l'espace client Stripe (abonnement, carte, factures).
 * @param searchParams - Paramètres d'URL (?portal=error après un échec).
 * @returns La page du compte, ou une redirection vers /login.
 */
export default async function AccountPage({ searchParams }: PageProps<"/account">) {
  const { portal, reason } = await searchParams;
  const { user, profile, premium } = await getViewer();
  if (!user) redirect("/login");

  // Nombre total de générations (lecture via RLS : uniquement les siennes)
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("generations")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);
  if (error) console.error("[account] Comptage des générations impossible :", error.message);

  const hasStripeHistory = Boolean(profile?.subscription_status) || (profile?.pack_credits ?? 0) > 0;
  const portalError =
    portal === "error"
      ? (typeof reason === "string" && PORTAL_ERRORS[reason]) || "We couldn't open the billing portal. Please try again."
      : null;

  return (
    <>
      <SiteHeader signedIn />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-5 pb-16 pt-4">
        <h1 className="text-3xl font-bold tracking-tight">Your account</h1>

        {portalError && (
          <p role="alert" className="rounded-xl bg-secondary p-4 text-sm text-secondary-foreground">
            {portalError}
            {typeof reason === "string" && !PORTAL_ERRORS[reason] && (
              <span className="mt-1 block font-mono text-xs opacity-70">Code: {reason.slice(0, 80)}</span>
            )}
          </p>
        )}

        {/* Identité */}
        <section className="rounded-2xl border border-border p-5">
          <p className="text-sm text-muted-foreground">Email</p>
          <p className="font-medium">{user.email}</p>
        </section>

        {/* Offre */}
        <section className="flex flex-col gap-4 rounded-2xl border border-border p-5">
          <div>
            <p className="text-sm text-muted-foreground">Plan</p>
            {premium ? (
              <p className="inline-flex items-center gap-1.5 text-lg font-semibold text-primary">
                <Crown className="size-5" /> Premium
              </p>
            ) : (
              <p className="text-lg font-semibold">Free</p>
            )}
            {premium && profile?.current_period_end && (
              <p className="text-sm text-muted-foreground">
                Current period ends on {formatDate(profile.current_period_end)}. Renewal and cancellation are
                managed in the billing portal.
              </p>
            )}
          </div>

          {hasStripeHistory ? (
            <form action="/api/portal" method="post">
              <Button type="submit" variant="outline" className="w-full sm:w-auto">
                Manage subscription & invoices <ExternalLink />
              </Button>
            </form>
          ) : null}
          {!premium && (
            <Button asChild className="w-full sm:w-auto">
              <Link href="/pricing">See plans</Link>
            </Button>
          )}
        </section>

        {/* Crédits */}
        {profile && (
          <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Free openers", value: profile.free_opener_left },
              { label: "Free analyses", value: profile.free_analysis_left },
              { label: "Pack credits", value: profile.pack_credits },
              { label: "Generations", value: count ?? 0 },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl bg-muted p-4">
                <p className="text-2xl font-bold">{item.value}</p>
                <p className="text-xs text-muted-foreground">{item.label}</p>
              </div>
            ))}
          </section>
        )}

        <form action="/auth/signout" method="post">
          <Button type="submit" variant="ghost">Sign out</Button>
        </form>
      </main>
      <SiteFooter />
    </>
  );
}
