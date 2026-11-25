import "server-only";

import { createClient } from "@supabase/supabase-js";

import { SUPABASE_URL } from "./config";

/**
 * Crée un client Supabase "administrateur" (clé secrète).
 * ⚠️ Il ignore le RLS : à utiliser UNIQUEMENT côté serveur, pour les
 * opérations que l'utilisateur ne doit pas pouvoir faire lui-même
 * (ajouter des crédits, enregistrer un abonnement…).
 * L'import "server-only" fait échouer la compilation si ce fichier
 * se retrouve par erreur dans le navigateur.
 * @returns Un client Supabase avec tous les droits.
 */
export function createAdminClient() {
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("Variable d'environnement SUPABASE_SECRET_KEY manquante");
  }
  return createClient(SUPABASE_URL, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
