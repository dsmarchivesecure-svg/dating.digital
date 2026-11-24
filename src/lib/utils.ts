import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Fusionne des classes Tailwind sans conflit (utilitaire standard de shadcn/ui).
 * @param inputs - Liste de classes (chaînes, objets conditionnels, tableaux).
 * @returns Une chaîne de classes nettoyée, où la dernière classe l'emporte en cas de conflit
 *          (ex. "p-2 p-4" devient "p-4").
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
