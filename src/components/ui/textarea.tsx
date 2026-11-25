import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Zone de texte multiligne stylée (style shadcn/ui).
 * @param props - Toutes les propriétés standard d'un <textarea>.
 * @returns Une zone de texte aux couleurs du site.
 */
function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "min-h-40 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-base outline-none transition",
        "placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
