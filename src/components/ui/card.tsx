import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Carte : conteneur visuel arrondi avec bordure légère (composant shadcn/ui).
 * Les sous-composants ci-dessous structurent son contenu.
 */
function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-2xl border border-border bg-card text-card-foreground shadow-sm", className)}
      {...props}
    />
  );
}

/** En-tête de la carte (zone du titre et de la description). */
function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col gap-1.5 p-6", className)} {...props} />;
}

/** Titre de la carte. */
function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("text-lg font-semibold leading-tight", className)} {...props} />;
}

/** Texte secondaire sous le titre. */
function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm text-muted-foreground", className)} {...props} />;
}

/** Contenu principal de la carte. */
function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-6 pt-0", className)} {...props} />;
}

export { Card, CardHeader, CardTitle, CardDescription, CardContent };
