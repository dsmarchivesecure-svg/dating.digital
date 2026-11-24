import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

import { LoginForm } from "./login-form";

// Page liée à l'utilisateur connecté : générée à chaque visite (pas de pré-rendu)
export const instant = false;

export const metadata: Metadata = { title: "Sign in — Dating.digital" };

/**
 * Page /login : connexion sans mot de passe par lien magique.
 * Si l'utilisateur est déjà connecté, il est renvoyé vers l'accueil.
 * @param searchParams - Paramètres d'URL (ex. ?error=link pour un lien expiré).
 * @returns La page de connexion.
 */
export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/");

  const { error } = await searchParams;

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 px-6 py-16">
      <Link href="/" className="text-center text-2xl font-bold tracking-tight">
        Dating<span className="text-primary">.digital</span>
      </Link>
      <Card>
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>No password needed: we email you a secure link.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {error && (
            <p role="alert" className="rounded-lg bg-secondary p-3 text-sm text-secondary-foreground">
              This login link is invalid or has expired. Please request a new one.
            </p>
          )}
          <LoginForm />
        </CardContent>
      </Card>
    </main>
  );
}
