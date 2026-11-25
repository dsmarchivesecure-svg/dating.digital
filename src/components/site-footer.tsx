import Link from "next/link";

/**
 * Pied de page commun.
 * @returns Le bas de page avec les liens principaux.
 */
export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-2 px-5 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>© Dating.digital</p>
        <nav className="flex gap-4">
          <Link href="/pricing" className="hover:text-foreground">Pricing</Link>
          <Link href="/app" className="hover:text-foreground">App</Link>
          <Link href="/login" className="hover:text-foreground">Sign in</Link>
        </nav>
      </div>
    </footer>
  );
}
