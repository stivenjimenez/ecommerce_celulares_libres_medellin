create extension if not exists pgcrypto;

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create unique index if not exists categories_slug_unique_idx
  on categories (slug);
create index if not exists categories_deleted_at_idx
  on categories (deleted_at);

create table if not exists subcategories (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references categories(id),
  slug text not null,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create unique index if not exists subcategories_slug_unique_idx
  on subcategories (slug);
create unique index if not exists subcategories_category_name_unique_idx
  on subcategories (category_id, name);
create index if not exists subcategories_category_id_idx
  on subcategories (category_id);
create index if not exists subcategories_deleted_at_idx
  on subcategories (deleted_at);

create table if not exists brands (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references categories(id),
  slug text not null,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create unique index if not exists brands_slug_unique_idx
  on brands (slug);
create unique index if not exists brands_category_name_unique_idx
  on brands (category_id, name);
create index if not exists brands_category_id_idx
  on brands (category_id);
create index if not exists brands_deleted_at_idx
  on brands (deleted_at);

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  name text not null,
  description text not null default '',
  price integer not null default 0,
  previous_price integer,
  category_id uuid not null references categories(id),
  subcategory_id uuid references subcategories(id),
  brand_id uuid references brands(id),
  featured boolean not null default false,
  draft boolean not null default true,
  images text[] not null default '{}',
  variants jsonb,
  attributes jsonb,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create unique index if not exists products_slug_unique_idx
  on products (slug);
create index if not exists products_category_id_idx
  on products (category_id);
create index if not exists products_subcategory_id_idx
  on products (subcategory_id);
create index if not exists products_brand_id_idx
  on products (brand_id);
create index if not exists products_draft_idx
  on products (draft);
create index if not exists products_featured_idx
  on products (featured);
create index if not exists products_sort_order_idx
  on products (sort_order);
create index if not exists products_deleted_at_idx
  on products (deleted_at);

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists categories_set_updated_at on categories;
create trigger categories_set_updated_at
before update on categories
for each row execute function set_updated_at();

drop trigger if exists subcategories_set_updated_at on subcategories;
create trigger subcategories_set_updated_at
before update on subcategories
for each row execute function set_updated_at();

drop trigger if exists brands_set_updated_at on brands;
create trigger brands_set_updated_at
before update on brands
for each row execute function set_updated_at();

drop trigger if exists products_set_updated_at on products;
create trigger products_set_updated_at
before update on products
for each row execute function set_updated_at();
