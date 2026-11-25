-- =========================================================
-- Dating.digital — Étape 3 : crédit des packs achetés via Stripe
-- À coller dans Supabase > SQL Editor > Run. Relançable sans erreur.
-- =========================================================

-- Fonction : ajoute des crédits de pack à un utilisateur, UNE SEULE FOIS
-- par événement Stripe (idempotence : si Stripe renvoie le même
-- événement deux fois, le second appel ne crédite rien).
-- Paramètres :
--   p_event_id  = identifiant de l'événement Stripe (evt_...)
--   p_event_type = type de l'événement (pour l'historique)
--   p_user_id   = l'utilisateur à créditer
--   p_amount    = nombre de crédits à ajouter (10 pour le pack)
-- Retourne : true si les crédits ont été ajoutés, false si déjà traité.
create or replace function public.grant_pack_credits(
  p_event_id text,
  p_event_type text,
  p_user_id uuid,
  p_amount integer
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_amount <= 0 or p_amount > 100 then
    raise exception 'invalid amount';
  end if;

  -- Mémorise l'événement ; s'il existe déjà, on s'arrête là
  insert into public.stripe_events (id, type)
  values (p_event_id, p_event_type)
  on conflict (id) do nothing;
  if not found then
    return false;
  end if;

  -- Ajout atomique (pas de risque de perdre un achat en parallèle)
  update public.profiles
  set pack_credits = pack_credits + p_amount
  where id = p_user_id;
  if not found then
    raise exception 'profile not found';
  end if;

  return true;
end;
$$;

-- Seul le serveur (clé secrète) peut appeler cette fonction
revoke execute on function public.grant_pack_credits(text, text, uuid, integer)
  from public, anon, authenticated;
grant execute on function public.grant_pack_credits(text, text, uuid, integer)
  to service_role;
