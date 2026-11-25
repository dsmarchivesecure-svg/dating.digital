import Link from "next/link";

import { Button } from "@/components/ui/button";

/**
 * En-tête commun : logo, lien vers les prix, et bouton selon l'état de connexion.
 * @param signedIn - true si l'utilisateur est connecté.
 * @returns La barre du haut.
 */
export function SiteHeader({ signedIn }: { signedIn: boolean }) {
  return (
    <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-5 py-5">
      <Link href="/" className="text-lg font-bold tracking-tight">
        Dating<span className="text-primary">.digital</span>
      </Link>
      <nav className="flex items-center gap-1 sm:gap-2">
        <Button asChild variant="ghost" size="sm">
          <Link href="/pricing">Pricing</Link>
        </Button>
        {signedIn ? (
          <>
            <Button asChild variant="ghost" size="sm">
              <Link href="/account">Account</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/app">Open app</Link>
            </Button>
          </>
        ) : (
          <Button asChild variant="outline" size="sm">
            <Link href="/login">Sign in</Link>
          </Button>
        )}
      </nav>
    </header>
  );
}
