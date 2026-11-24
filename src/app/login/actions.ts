"use server";

import { headers } from "next/headers";

import { createClient } from "@/lib/supabase/server";

/** État renvoyé au formulaire de connexion après l'envoi. */
export type LoginState = { status: "idle" | "sent" | "error"; message: string };

/**
 * Envoie un lien magique de connexion à l'adresse email saisie.
 * Crée automatiquement le compte s'il n'existe pas encore.
 * @param _prev - État précédent du formulaire (non utilisé).
 * @param formData - Données du formulaire (champ "email").
 * @returns Le nouvel état à afficher (succès ou message d'erreur).
 */
export async function sendMagicLink(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  // Validation simple côté serveur (on ne fait jamais confiance au navigateur)
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return { status: "error", message: "Please enter a valid email address." };
  }

  // Adresse du site actuel, pour que le lien ramène au bon endroit
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  const origin = `${proto}://${host}`;

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${origin}/auth/confirm` },
    });

    if (error) {
      console.error("[login] Erreur Supabase :", error.status, error.message);
      if (error.status === 429) {
        return {
          status: "error",
          message: "Too many attempts. Please wait a few minutes and try again.",
        };
      }
      return { status: "error", message: "We couldn't send the link. Please try again." };
    }

    return { status: "sent", message: `Check your inbox: we sent a login link to ${email}.` };
  } catch (error) {
    console.error("[login] Erreur inattendue :", error);
    return { status: "error", message: "Something went wrong. Please try again." };
  }
}
