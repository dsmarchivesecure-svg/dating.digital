/** Messages affichés au retour de la page de paiement Stripe (?checkout=…). */
const MESSAGES: Record<string, string> = {
  success: "Payment received! Your credits or Premium will appear within a few seconds — refresh if needed.",
  cancel: "Payment cancelled. You have not been charged.",
  "already-premium": "You are already a Premium member.",
  error: "Something went wrong with the payment. Please try again.",
};

/**
 * Bandeau d'information après un paiement (succès, annulation, erreur).
 * @param status - Valeur du paramètre ?checkout= dans l'URL.
 * @param reason - Code de diagnostic éventuel (?reason=).
 * @returns Le bandeau, ou rien si aucun message ne correspond.
 */
export function CheckoutBanner({ status, reason }: { status?: string | string[]; reason?: string | string[] }) {
  const message = typeof status === "string" ? MESSAGES[status] : undefined;
  if (!message) return null;
  return (
    <p role="status" className="w-full rounded-xl bg-secondary p-4 text-center text-sm text-secondary-foreground">
      {message}
      {typeof reason === "string" && (
        <span className="mt-1 block font-mono text-xs opacity-70">Code: {reason.slice(0, 80)}</span>
      )}
    </p>
  );
}
