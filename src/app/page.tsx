import Link from "next/link";
import { MessageCircleHeart, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

// Page liée à l'utilisateur connecté : générée à chaque visite (pas de pré-rendu)
export const instant = false;

/**
 * Page temporaire : vérifie le design (Étape 1) et la connexion (Étape 2).
 * Elle sera remplacée par la vraie landing page à l'Étape 6.
 * @returns L'accueil, avec l'état de connexion et les crédits de l'utilisateur.
 */
export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Lecture du profil : le RLS garantit qu'on ne voit que le sien
  let credits: { free_opener_left: number; free_analysis_left: number } | null = null;
  if (user) {
    const { data, error } = await supabase
      .from("profiles")
      .select("free_opener_left, free_analysis_left")
      .eq("id", user.id)
      .single();
    if (error) console.error("[home] Lecture du profil impossible :", error.message);
    credits = data;
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-10 px-6 py-16">
      <div className="text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
          <Sparkles className="size-3.5" /> Setup check — Step 2
        </span>
        <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
          Dating<span className="text-primary">.digital</span>
        </h1>
        <p className="mt-3 text-muted-foreground">Better openers. Better profile. More matches.</p>
      </div>

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
          {credits && (
            <p className="text-sm text-muted-foreground">
              Free credits: {credits.free_opener_left} opener · {credits.free_analysis_left} analysis
            </p>
          )}
          <form action="/auth/signout" method="post">
            <Button type="submit" variant="outline">Sign out</Button>
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
