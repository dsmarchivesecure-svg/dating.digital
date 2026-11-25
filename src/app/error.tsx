"use client"; // Les pages d'erreur doivent s'exécuter dans le navigateur

import { useEffect } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

/**
 * Page affichée si une erreur inattendue survient dans une page du site.
 * L'utilisateur voit un message simple ; le détail technique reste dans la console.
 * @param error - L'erreur survenue.
 * @param retry - Fonction qui recharge la page en erreur.
 * @returns Un écran d'erreur avec "Réessayer" et retour à l'accueil.
 */
export default function Error({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error("[page] Erreur inattendue :", error);
  }, [error]);

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-5 px-6 py-16 text-center">
      <p className="text-5xl">😕</p>
      <h1 className="text-2xl font-bold tracking-tight">Something went wrong</h1>
      <p className="text-muted-foreground">
        Sorry, this page didn&apos;t load properly. Please try again — your credits are safe.
      </p>
      <div className="flex gap-3">
        <Button onClick={() => retry()}>Try again</Button>
        <Button asChild variant="outline">
          <Link href="/">Home</Link>
        </Button>
      </div>
    </main>
  );
}
