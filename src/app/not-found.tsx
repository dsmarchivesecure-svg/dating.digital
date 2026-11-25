import Link from "next/link";

import { Button } from "@/components/ui/button";

/**
 * Page 404 : affichée quand l'adresse demandée n'existe pas.
 * @returns Un message simple avec un retour à l'accueil.
 */
export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-5 px-6 py-16 text-center">
      <p className="text-5xl font-bold text-primary">404</p>
      <h1 className="text-2xl font-bold tracking-tight">Page not found</h1>
      <p className="text-muted-foreground">This page doesn&apos;t exist — but your next great opener might.</p>
      <Button asChild>
        <Link href="/">Back to home</Link>
      </Button>
    </main>
  );
}
