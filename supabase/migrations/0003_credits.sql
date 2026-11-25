-- =========================================================
-- Dating.digital — Étape 4 : décompte des crédits
-- À coller dans Supabase > SQL Editor > Run. Relançable sans erreur.
-- =========================================================

-- Fonction : réserve UN crédit pour une génération, de façon atomique
-- (deux requêtes simultanées ne peuvent pas consommer le même crédit).
-- Ordre : Premium (illimité) > crédit gratuit du bon type > crédit de pack.
-- Retourne : 'premium', 'free', 'pack', ou 'none' s'il ne reste rien.
create or replace function public.consume_credit(p_user_id uuid, p_kind text)
returns text
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  v_profile public.profiles%rowtype;
begin
  if p_kind not in ('opener', 'analysis') then
    raise exception 'invalid kind';
  end if;

  -- Verrouille la ligne du profil le temps de la décision
  select * into v_profile from public.profiles where id = p_user_id for update;
  if not found then
    raise exception 'profile not found';
  end if;

  if v_profile.subscription_status in ('active', 'trialing')
     and v_profile.current_period_end > now() then
    return 'premium';
  end if;

  if p_kind = 'opener' and v_profile.free_opener_left > 0 then
    update public.profiles set free_opener_left = free_opener_left - 1 where id = p_user_id;
    return 'free';
  end if;

  if p_kind = 'analysis' and v_profile.free_analysis_left > 0 then
    update public.profiles set free_analysis_left = free_analysis_left - 1 where id = p_user_id;
    return 'free';
  end if;

  if v_profile.pack_credits > 0 then
    update public.profiles set pack_credits = pack_credits - 1 where id = p_user_id;
    return 'pack';
  end if;

  return 'none';
end;
$fn$;

-- Fonction : rend le crédit si la génération IA a échoué.
-- Paramètre p_source = valeur renvoyée par consume_credit.
create or replace function public.refund_credit(p_user_id uuid, p_kind text, p_source text)
returns void
language plpgsql
security definer
set search_path = ''
as $fn$
begin
  if p_source = 'free' and p_kind = 'opener' then
    update public.profiles set free_opener_left = free_opener_left + 1 where id = p_user_id;
  elsif p_source = 'free' and p_kind = 'analysis' then
    update public.profiles set free_analysis_left = free_analysis_left + 1 where id = p_user_id;
  elsif p_source = 'pack' then
    update public.profiles set pack_credits = pack_credits + 1 where id = p_user_id;
  end if;
end;
$fn$;

-- Seul le serveur (clé secrète) peut appeler ces fonctions
revoke execute on function public.consume_credit(uuid, text) from public, anon, authenticated;
revoke execute on function public.refund_credit(uuid, text, text) from public, anon, authenticated;
grant execute on function public.consume_credit(uuid, text) to service_role;
grant execute on function public.refund_credit(uuid, text, text) to service_role;
