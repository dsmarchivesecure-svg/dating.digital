import Link from "next/link";
import { Crown, MessageCircleHeart, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { isPremiumActive } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";

// Page liée à l'utilisateur connecté : générée à chaque visite (pas de pré-rendu)
export const instant = false;

/** Messages affichés au retour de la page de paiement Stripe (?checkout=…). */
const CHECKOUT_MESSAGES: Record<string, string> = {
  success: "Payment received! Your account will update within a few seconds — refresh if needed.",
  cancel: "Payment cancelled. You have not been charged.",
  "already-premium": "You are already a Premium member.",
  error: "Something went wrong with the payment. Please try again.",
};

/**
 * Page temporaire : vérifie le design (Étape 1), la connexion (Étape 2) et les paiements (Étape 3).
 * Elle sera remplacée par la vraie landing page à l'Étape 6.
 * @param searchParams - Paramètres d'URL (?checkout=success|cancel|…).
 * @returns L'accueil, avec l'état de connexion, les crédits et les boutons d'achat.
 */
export default async function Home({ searchParams }: PageProps<"/">) {
  const { checkout } = await searchParams;
  const checkoutMessage = typeof checkout === "string" ? CHECKOUT_MESSAGES[checkout] : undefined;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Lecture du profil : le RLS garantit qu'on ne voit que le sien
  let profile: {
    free_opener_left: number;
    free_analysis_left: number;
    pack_credits: number;
    subscription_status: string | null;
    current_period_end: string | null;
  } | null = null;
  if (user) {
    const { data, error } = await supabase
      .from("profiles")
      .select("free_opener_left, free_analysis_left, pack_credits, subscription_status, current_period_end")
      .eq("id", user.id)
      .single();
    if (error) console.error("[home] Lecture du profil impossible :", error.message);
    profile = data;
  }
  const premium = profile ? isPremiumActive(profile.subscription_status, profile.current_period_end) : false;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-10 px-6 py-16">
      <div className="text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
          <Sparkles className="size-3.5" /> Setup check — Step 3
        </span>
        <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
          Dating<span className="text-primary">.digital</span>
        </h1>
        <p className="mt-3 text-muted-foreground">Better openers. Better profile. More matches.</p>
      </div>

      {checkoutMessage && (
        <p role="status" className="w-full rounded-lg bg-secondary p-4 text-center text-sm text-secondary-foreground">
          {checkoutMessage}
        </p>
      )}

      <div className="grid w-full gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <MessageCircleHeart className="size-6 text-primary" />
            <CardTitle>Opener generator</CardTitle>
            <CardDescription>3 personalised first messages from any profile.</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <Sparkles className="size-6 text-primary" />
            <CardTitle>Profile analyzer</CardTitle>
            <CardDescription>A score out of 100, 5 tips and a rewritten bio.</CardDescription>
          </CardHeader>
        </Card>
      </div>

      {user ? (
        <div className="flex w-full flex-col items-center gap-3 rounded-lg bg-muted p-5 text-center">
          <p className="text-sm">
            Signed in as <span className="font-semibold">{user.email}</span>
          </p>
          {profile && (
            <p className="text-sm text-muted-foreground">
              Free: {profile.free_opener_left} opener · {profile.free_analysis_left} analysis · Pack credits:{" "}
              {profile.pack_credits}
            </p>
          )}
          {premium ? (
            <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
              <Crown className="size-4" /> Premium active
            </p>
          ) : (
            <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
              <form action="/api/checkout" method="post">
                <input type="hidden" name="offer" value="premium" />
                <Button type="submit" className="w-full">Go Premium — €9.99/month</Button>
              </form>
              <form action="/api/checkout" method="post">
                <input type="hidden" name="offer" value="pack" />
                <Button type="submit" variant="outline" className="w-full">10 credits — €2.99</Button>
              </form>
            </div>
          )}
          <form action="/auth/signout" method="post">
            <Button type="submit" variant="ghost" size="sm">Sign out</Button>
          </form>
        </div>
      ) : (
        <Button size="lg" asChild>
          <Link href="/login">Sign in</Link>
        </Button>
      )}
    </main>
  );
}
