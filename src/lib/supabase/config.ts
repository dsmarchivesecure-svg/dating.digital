/**
 * Paramètres publics de Supabase.
 * Ces deux valeurs sont PUBLIQUES par conception (visibles dans le navigateur) :
 * la sécurité des données repose sur le RLS, pas sur leur secret.
 * Une variable d'environnement Vercel, si elle existe, est prioritaire.
 * ⚠️ Ne JAMAIS mettre ici la clé "secret" (sb_secret_...).
 */
export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://yoeyofaritdwyvjqitev.supabase.co";

export const SUPABASE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  "sb_publishable_OOnLywhlTCYo_xphbrRWrQ_XvT1Dtcj";
