import type { Metadata } from "next";
// Police Inter hébergée avec le site (aucun appel à Google Fonts)
import "@fontsource-variable/inter";
import "./globals.css";

/** Informations affichées dans l'onglet du navigateur et sur les moteurs de recherche. */
export const metadata: Metadata = {
  title: "Dating.digital — AI openers & profile reviews",
  description:
    "Write better first messages and get an honest score for your dating profile, powered by AI.",
};

/**
 * Gabarit racine : enveloppe toutes les pages du site.
 * @param children - La page en cours d'affichage.
 * @returns La structure HTML commune (langue, police, fond).
 */
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
