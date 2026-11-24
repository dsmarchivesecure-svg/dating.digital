import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Champ de saisie stylé (style shadcn/ui).
 * @param props - Toutes les propriétés standard d'un <input>.
 * @returns Un champ de saisie aux couleurs du site.
 */
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-11 w-full min-w-0 rounded-lg border border-border bg-background px-3 text-base outline-none transition",
        "placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
