alter table products add column if not exists stock integer not null default 0 check (stock >= 0);
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'pending',
  payment_status text not null default 'pending',
  payment_provider text,
  customer jsonb not null,
  total integer not null check (total >= 0),
  created_at timestamptz not null default now()
);
create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id),
  product_id uuid not null references products(id),
  name text not null,
  price integer not null check (price >= 0),
  quantity integer not null check (quantity > 0)
);
create index if not exists order_items_order_id_idx on order_items(order_id);

-- Los pedidos contienen datos personales: no exponerlos mediante la API pública.
alter table orders enable row level security;
alter table order_items enable row level security;
