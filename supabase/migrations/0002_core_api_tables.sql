alter table public.body_profiles
  add column if not exists height text,
  add column if not exists weight text;

create table if not exists public.closet_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source text not null default 'grailed',
  listing_id text not null,
  item_name text not null,
  price int,
  size text,
  image text,
  category text,
  product_url text,
  created_at timestamptz not null default now(),
  unique (user_id, source, listing_id)
);

create index if not exists closet_items_user_created_idx
  on public.closet_items (user_id, created_at desc);

create table if not exists public.saved_outfits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  cover_image text,
  created_at timestamptz not null default now()
);

create index if not exists saved_outfits_user_created_idx
  on public.saved_outfits (user_id, created_at desc);

create table if not exists public.saved_outfit_items (
  outfit_id uuid not null references public.saved_outfits(id) on delete cascade,
  closet_item_id uuid not null references public.closet_items(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (outfit_id, closet_item_id)
);

create table if not exists public.credit_wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  balance int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.credit_transactions (
  id uuid primary key default gen_random_uuid(),
  wallet_id uuid not null references public.credit_wallets(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  amount int not null,
  type text not null,
  description text not null,
  created_at timestamptz not null default now()
);

create index if not exists credit_transactions_user_created_idx
  on public.credit_transactions (user_id, created_at desc);

alter table public.closet_items         enable row level security;
alter table public.saved_outfits        enable row level security;
alter table public.saved_outfit_items   enable row level security;
alter table public.credit_wallets       enable row level security;
alter table public.credit_transactions  enable row level security;

do $$
declare t text;
begin
  foreach t in array array['closet_items','saved_outfits','credit_wallets','credit_transactions'] loop
    execute format($p$
      drop policy if exists %I_owner on public.%I;
      create policy %I_owner on public.%I
        for all to authenticated
        using (user_id = auth.uid())
        with check (user_id = auth.uid());
    $p$, t, t, t, t);
  end loop;
end $$;

drop policy if exists saved_outfit_items_owner on public.saved_outfit_items;
create policy saved_outfit_items_owner on public.saved_outfit_items
  for all to authenticated
  using (exists (
    select 1 from public.saved_outfits o
    where o.id = saved_outfit_items.outfit_id and o.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.saved_outfits o
    where o.id = saved_outfit_items.outfit_id and o.user_id = auth.uid()
  ));
