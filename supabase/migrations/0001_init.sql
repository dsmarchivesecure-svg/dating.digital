-- =========================================================
-- Dating.digital — Étape 2 : schéma de base de données
-- À coller tel quel dans Supabase > SQL Editor > Run.
-- Le script peut être relancé sans erreur (idempotent).
-- =========================================================


-- ---------------------------------------------------------
-- 1. Table "profiles" : une ligne par utilisateur inscrit.
--    Contient le plan (gratuit / premium) et les crédits restants.
-- ---------------------------------------------------------
create table if not exists public.profiles (
  -- Même identifiant que le compte Supabase Auth ; supprimé avec lui
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,

  -- Crédits gratuits : 1 message d'ouverture + 1 analyse de profil
  free_opener_left   integer not null default 1 check (free_opener_left >= 0),
  free_analysis_left integer not null default 1 check (free_analysis_left >= 0),

  -- Crédits achetés via le pack à 2,99 € (+10 à chaque achat)
  pack_credits integer not null default 0 check (pack_credits >= 0),

  -- Abonnement Premium (rempli plus tard par le webhook Stripe, Étape 3)
  stripe_customer_id     text unique,
  stripe_subscription_id text unique,
  subscription_status    text,          -- ex. 'active', 'canceled', 'past_due'
  current_period_end     timestamptz,   -- date de fin de la période payée

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


-- ---------------------------------------------------------
-- 2. Table "generations" : historique de chaque génération IA.
-- ---------------------------------------------------------
create table if not exists public.generations (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  kind       text not null check (kind in ('opener', 'analysis')),
  input      text not null check (char_length(input) <= 5000),
  output     jsonb not null,
  created_at timestamptz not null default now()
);

-- Accélère l'affichage de l'historique d'un utilisateur
create index if not exists generations_user_created_idx
  on public.generations (user_id, created_at desc);


-- ---------------------------------------------------------
-- 3. Table "stripe_events" : mémorise les événements Stripe déjà
--    traités, pour ne jamais créditer deux fois le même paiement.
-- ---------------------------------------------------------
create table if not exists public.stripe_events (
  id         text primary key,          -- identifiant de l'événement Stripe (evt_...)
  type       text not null,
  created_at timestamptz not null default now()
);


-- ---------------------------------------------------------
-- 4. Sécurité : RLS (Row Level Security) activé partout.
-- ---------------------------------------------------------
alter table public.profiles      enable row level security;
alter table public.generations   enable row level security;
alter table public.stripe_events enable row level security;

-- Un utilisateur connecté peut LIRE uniquement sa propre ligne de profil.
-- Aucune règle de modification : seul le serveur peut changer crédits et plan.
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select to authenticated
  using ((select auth.uid()) = id);

-- Un utilisateur connecté peut LIRE uniquement son propre historique.
-- Les insertions se font côté serveur (route /api/generate, Étape 4).
drop policy if exists "generations_select_own" on public.generations;
create policy "generations_select_own" on public.generations
  for select to authenticated
  using ((select auth.uid()) = user_id);

-- stripe_events : aucune règle = aucun accès depuis le navigateur.
-- Seul le serveur (clé "service_role") peut y lire et écrire.

-- Ceinture + bretelles : on retire aussi les droits d'écriture au niveau table
revoke insert, update, delete on public.profiles    from anon, authenticated;
revoke insert, update, delete on public.generations from anon, authenticated;
revoke all on public.stripe_events from anon, authenticated;
revoke all on public.profiles    from anon;
revoke all on public.generations from anon;
-- Lecture autorisée (le RLS ci-dessus filtre ensuite ligne par ligne)
grant select on public.profiles    to authenticated;
grant select on public.generations to authenticated;
-- Le serveur (clé secrète service_role) a tous les droits
grant all on public.profiles, public.generations, public.stripe_events to service_role;


-- ---------------------------------------------------------
-- 5. Création automatique du profil à l'inscription.
-- ---------------------------------------------------------

-- Fonction : crée la ligne "profiles" dès qu'un compte Auth est créé.
-- Paramètre : NEW = le nouvel utilisateur de auth.users.
-- Retourne : NEW (obligatoire pour un trigger).
-- "security definer" = s'exécute avec les droits du propriétaire,
-- ce qui lui permet d'écrire dans profiles malgré le RLS.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, coalesce(new.email, ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- Fonction : met à jour la colonne updated_at à chaque modification.
-- Retourne : la ligne modifiée avec la nouvelle date.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Ces fonctions internes ne doivent pas être appelables depuis le navigateur
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.set_updated_at()  from public, anon, authenticated;


-- ---------------------------------------------------------
-- 6. Rattrapage : crée un profil pour les comptes déjà existants
--    (utile si tu t'es déjà inscrit avant de lancer ce script).
-- ---------------------------------------------------------
insert into public.profiles (id, email)
select id, coalesce(email, '') from auth.users
on conflict (id) do nothing;
