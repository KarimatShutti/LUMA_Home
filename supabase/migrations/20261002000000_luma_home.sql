-- LUMA HOME training store: run with `supabase db push` against a new Supabase project.
create extension if not exists pgcrypto with schema extensions;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  email text not null default '',
  avatar_url text,
  auth_provider text not null default 'email',
  is_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  description text not null default '',
  image_url text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id) on delete restrict,
  name text not null,
  slug text not null unique,
  description text not null default '',
  price numeric(12,2) not null check (price >= 0),
  image_url text not null default '',
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  material text not null default '',
  dimensions text not null default '',
  colour text not null default '',
  care_instructions text not null default '',
  featured boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.carts(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  quantity integer not null check (quantity > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (cart_id, product_id)
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete restrict,
  order_number text not null unique,
  customer_name text not null,
  customer_email text not null,
  phone text not null,
  delivery_address text not null,
  city text not null,
  state text not null,
  country text not null,
  subtotal numeric(12,2) not null check (subtotal >= 0),
  delivery_fee numeric(12,2) not null check (delivery_fee >= 0),
  total numeric(12,2) not null check (total = subtotal + delivery_fee),
  status text not null default 'Pending' check (status in ('Pending','Confirmed','Processing','Shipped','Delivered','Cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  quantity integer not null check (quantity > 0),
  unit_price numeric(12,2) not null check (unit_price >= 0),
  subtotal numeric(12,2) not null check (subtotal = unit_price * quantity),
  created_at timestamptz not null default now()
);

create table if not exists public.wishlist_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, product_id)
);

create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz not null default now(),
  is_active boolean not null default true
);

create table if not exists public.order_number_counters (
  order_day date primary key,
  last_number integer not null check (last_number between 1 and 9999)
);

create index if not exists products_category_idx on public.products(category_id);
create index if not exists products_active_featured_idx on public.products(is_active, featured);
create index if not exists cart_items_cart_idx on public.cart_items(cart_id);
create index if not exists orders_user_created_idx on public.orders(user_id, created_at desc);
create index if not exists orders_status_created_idx on public.orders(status, created_at desc);
create index if not exists order_items_order_idx on public.order_items(order_id);

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

do $$
declare t text;
begin
  foreach t in array array['profiles','products','carts','cart_items','orders'] loop
    execute format('drop trigger if exists %I on public.%I', t || '_set_updated_at', t);
    execute format('create trigger %I before update on public.%I for each row execute function public.set_updated_at()', t || '_set_updated_at', t);
  end loop;
end;
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce((select p.is_admin from public.profiles p where p.id = (select auth.uid())), false);
$$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, name, email, avatar_url, auth_provider)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', ''),
    coalesce(new.email, ''),
    new.raw_user_meta_data ->> 'avatar_url',
    coalesce(new.raw_app_meta_data ->> 'provider', 'email')
  ) on conflict (id) do update set email = excluded.email;
  insert into public.carts (user_id) values (new.id) on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_luma on auth.users;
create trigger on_auth_user_created_luma after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.ensure_my_cart()
returns uuid language plpgsql security definer set search_path = '' as $$
declare cart_uuid uuid;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  insert into public.carts(user_id) values (auth.uid()) on conflict(user_id) do update set updated_at = now()
  returning id into cart_uuid;
  return cart_uuid;
end;
$$;

create or replace function public.check_cart_stock()
returns trigger language plpgsql security definer set search_path = '' as $$
declare available integer; active boolean;
begin
  select p.stock_quantity, p.is_active into available, active from public.products p where p.id = new.product_id;
  if not found or not active then raise exception 'This piece is not currently available'; end if;
  if new.quantity > available then raise exception 'Only % available', available; end if;
  return new;
end;
$$;
drop trigger if exists cart_items_check_stock on public.cart_items;
create trigger cart_items_check_stock before insert or update of quantity, product_id on public.cart_items
for each row execute function public.check_cart_stock();

create or replace function public.submit_newsletter(p_email text)
returns void language plpgsql security definer set search_path = '' as $$
declare normalized text := lower(trim(coalesce(p_email, '')));
begin
  if length(normalized) > 254 or normalized !~ '^[A-Za-z0-9.!#$%&''*+/=?^_`{|}~-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' then
    raise exception 'Please enter a valid email address';
  end if;
  insert into public.newsletter_subscribers(email, is_active) values (normalized, true)
  on conflict(email) do update set is_active = true;
end;
$$;

create or replace function public.create_order(
  p_customer_name text,
  p_customer_email text,
  p_phone text,
  p_delivery_address text,
  p_city text,
  p_state text,
  p_country text
)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  current_user_id uuid := auth.uid();
  cart_uuid uuid;
  order_uuid uuid;
  order_num text;
  day_key date := (now() at time zone 'utc')::date;
  day_number integer;
  subtotal_amount numeric(12,2) := 0;
  shipping_amount numeric(12,2);
  item record;
begin
  if current_user_id is null then raise exception 'Sign in to place your order'; end if;
  if length(trim(coalesce(p_customer_name,''))) < 2
    or length(trim(coalesce(p_customer_email,''))) < 5
    or length(trim(coalesce(p_phone,''))) < 6
    or length(trim(coalesce(p_delivery_address,''))) < 5
    or length(trim(coalesce(p_city,''))) < 2
    or length(trim(coalesce(p_state,''))) < 2
    or length(trim(coalesce(p_country,''))) < 2 then
    raise exception 'Please complete all customer and delivery details';
  end if;
  if lower(trim(p_customer_email)) !~ '^[A-Za-z0-9.!#$%&''*+/=?^_`{|}~-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' then
    raise exception 'Please enter a valid email address';
  end if;

  select c.id into cart_uuid from public.carts c where c.user_id = current_user_id for update;
  if cart_uuid is null then raise exception 'Your cart is empty'; end if;

  for item in
    select ci.product_id, ci.quantity, p.name, p.price, p.stock_quantity, p.is_active
    from public.cart_items ci join public.products p on p.id = ci.product_id
    where ci.cart_id = cart_uuid order by p.id for update of p
  loop
    if not item.is_active then raise exception '% is no longer available', item.name; end if;
    if item.quantity > item.stock_quantity then raise exception 'Only % of % remain', item.stock_quantity, item.name; end if;
    subtotal_amount := subtotal_amount + (item.price * item.quantity);
  end loop;
  if subtotal_amount <= 0 then raise exception 'Your cart is empty'; end if;
  shipping_amount := case when subtotal_amount < 100000 then 5000 else 0 end;

  insert into public.order_number_counters(order_day, last_number) values (day_key, 1)
  on conflict(order_day) do update set last_number = public.order_number_counters.last_number + 1
  returning last_number into day_number;
  if day_number > 9999 then raise exception 'Daily order number limit reached'; end if;
  order_num := 'LH-' || to_char(day_key, 'YYYYMMDD') || '-' || lpad(day_number::text, 4, '0');

  insert into public.orders(user_id, order_number, customer_name, customer_email, phone, delivery_address, city, state, country, subtotal, delivery_fee, total)
  values (current_user_id, order_num, trim(p_customer_name), lower(trim(p_customer_email)), trim(p_phone), trim(p_delivery_address), trim(p_city), trim(p_state), trim(p_country), subtotal_amount, shipping_amount, subtotal_amount + shipping_amount)
  returning id into order_uuid;

  for item in
    select ci.product_id, ci.quantity, p.name, p.price
    from public.cart_items ci join public.products p on p.id = ci.product_id
    where ci.cart_id = cart_uuid order by p.id
  loop
    insert into public.order_items(order_id, product_id, product_name, quantity, unit_price, subtotal)
    values (order_uuid, item.product_id, item.name, item.quantity, item.price, item.price * item.quantity);
    update public.products set stock_quantity = stock_quantity - item.quantity where id = item.product_id;
  end loop;
  delete from public.cart_items where cart_id = cart_uuid;

  return jsonb_build_object('id', order_uuid, 'order_number', order_num);
end;
$$;

create or replace function public.restore_cancelled_order_stock()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if old.status <> 'Cancelled' and new.status = 'Cancelled' then
    update public.products p set stock_quantity = p.stock_quantity + oi.quantity
    from public.order_items oi where oi.order_id = new.id and oi.product_id = p.id;
  end if;
  return new;
end;
$$;
create or replace function public.validate_order_status_transition()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.status = old.status then return new; end if;
  if (old.status = 'Pending' and new.status in ('Confirmed','Cancelled'))
    or (old.status = 'Confirmed' and new.status in ('Processing','Cancelled'))
    or (old.status = 'Processing' and new.status in ('Shipped','Cancelled'))
    or (old.status = 'Shipped' and new.status = 'Delivered') then
    return new;
  end if;
  raise exception 'This order status change is not allowed';
end;
$$;
drop trigger if exists orders_validate_status_transition on public.orders;
create trigger orders_validate_status_transition before update of status on public.orders
for each row execute function public.validate_order_status_transition();
drop trigger if exists orders_restore_stock_on_cancel on public.orders;
create trigger orders_restore_stock_on_cancel after update of status on public.orders
for each row execute function public.restore_cancelled_order_stock();

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.carts enable row level security;
alter table public.cart_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.wishlist_items enable row level security;
alter table public.newsletter_subscribers enable row level security;
alter table public.order_number_counters enable row level security;

drop policy if exists "profiles read own or admin" on public.profiles;
create policy "profiles read own or admin" on public.profiles for select to authenticated
using (id = (select auth.uid()) or (select public.is_admin()));
drop policy if exists "profiles update own" on public.profiles;
create policy "profiles update own" on public.profiles for update to authenticated
using (id = (select auth.uid())) with check (id = (select auth.uid()));

drop policy if exists "categories public read" on public.categories;
create policy "categories public read" on public.categories for select to anon, authenticated using (true);
drop policy if exists "categories admin manage" on public.categories;
create policy "categories admin manage" on public.categories for all to authenticated
using ((select public.is_admin())) with check ((select public.is_admin()));

drop policy if exists "active products public read" on public.products;
create policy "active products public read" on public.products for select to anon, authenticated using (is_active or (select public.is_admin()));
drop policy if exists "products admin manage" on public.products;
create policy "products admin manage" on public.products for all to authenticated
using ((select public.is_admin())) with check ((select public.is_admin()));

drop policy if exists "cart owner access" on public.carts;
create policy "cart owner access" on public.carts for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists "cart owner create" on public.carts;
create policy "cart owner create" on public.carts for insert to authenticated with check (user_id = (select auth.uid()));
drop policy if exists "cart owner update" on public.carts;
create policy "cart owner update" on public.carts for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
drop policy if exists "cart item owner access" on public.cart_items;
create policy "cart item owner access" on public.cart_items for all to authenticated
using (exists (select 1 from public.carts c where c.id = cart_id and c.user_id = (select auth.uid())))
with check (exists (select 1 from public.carts c where c.id = cart_id and c.user_id = (select auth.uid())));

drop policy if exists "orders owner or admin read" on public.orders;
create policy "orders owner or admin read" on public.orders for select to authenticated
using (user_id = (select auth.uid()) or (select public.is_admin()));
drop policy if exists "orders admin update" on public.orders;
create policy "orders admin update" on public.orders for update to authenticated
using ((select public.is_admin())) with check ((select public.is_admin()));
drop policy if exists "order items owner or admin read" on public.order_items;
create policy "order items owner or admin read" on public.order_items for select to authenticated
using (exists (select 1 from public.orders o where o.id = order_id and (o.user_id = (select auth.uid()) or (select public.is_admin()))));

drop policy if exists "wishlist owner access" on public.wishlist_items;
create policy "wishlist owner access" on public.wishlist_items for all to authenticated
using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Newsletter writes go through submit_newsletter(); subscriber addresses are never selectable from the client.
revoke all on public.newsletter_subscribers from anon, authenticated;
revoke all on public.order_number_counters from anon, authenticated;
revoke insert, update, delete on public.orders from anon, authenticated;
revoke insert, update, delete on public.order_items from anon, authenticated;
revoke insert, update, delete on public.profiles from anon, authenticated;
revoke update on public.profiles from authenticated;
grant select on public.profiles, public.categories, public.products, public.orders, public.order_items to authenticated;
grant select on public.categories, public.products to anon;
grant insert, update, delete on public.categories, public.products to authenticated;
grant update (name, avatar_url) on public.profiles to authenticated;
grant insert, select, update on public.carts to authenticated;
grant select, insert, update, delete on public.cart_items to authenticated;
grant select, insert, delete on public.wishlist_items to authenticated;
grant update (status) on public.orders to authenticated;

grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.ensure_my_cart() to authenticated;
grant execute on function public.submit_newsletter(text) to anon, authenticated;
grant execute on function public.create_order(text,text,text,text,text,text,text) to authenticated;
revoke all on function public.create_order(text,text,text,text,text,text,text) from public, anon;

-- Product imagery is public to read; authenticated admins alone can write to the bucket.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 8000000, array['image/jpeg','image/png','image/webp','image/avif'])
on conflict (id) do update set public = true, file_size_limit = 8000000, allowed_mime_types = excluded.allowed_mime_types;
drop policy if exists "LUMA product images are public" on storage.objects;
create policy "LUMA product images are public" on storage.objects for select to anon, authenticated
using (bucket_id = 'product-images');
drop policy if exists "LUMA admins upload product images" on storage.objects;
create policy "LUMA admins upload product images" on storage.objects for insert to authenticated
with check (bucket_id = 'product-images' and (select public.is_admin()));
drop policy if exists "LUMA admins update product images" on storage.objects;
create policy "LUMA admins update product images" on storage.objects for update to authenticated
using (bucket_id = 'product-images' and (select public.is_admin()))
with check (bucket_id = 'product-images' and (select public.is_admin()));
drop policy if exists "LUMA admins delete product images" on storage.objects;
create policy "LUMA admins delete product images" on storage.objects for delete to authenticated
using (bucket_id = 'product-images' and (select public.is_admin()));

-- Public category imagery and fictional training catalog. Fixed Unsplash image IDs keep the presentation stable.
insert into public.categories(name, slug, description, image_url) values
('Living Room','living-room','Thoughtful finishing touches for slower, softer living.','https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1000&q=85'),
('Bedroom','bedroom','Comforting layers and considered accents for restful rooms.','https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=1000&q=85'),
('Dining','dining','Natural details made for gathering around the table.','https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1000&q=85'),
('Lighting','lighting','A softer glow for the moments that make a home.','https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=1000&q=85'),
('Storage','storage','Everyday essentials with a place and a purpose.','https://images.unsplash.com/photo-1600210492493-0946911123ea?auto=format&fit=crop&w=1000&q=85'),
('Wall Décor','wall-decor','Artful details that give a room its own character.','https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1000&q=85')
on conflict(slug) do update set name=excluded.name, description=excluded.description, image_url=excluded.image_url;

insert into public.products(category_id,name,slug,description,price,image_url,stock_quantity,material,dimensions,colour,care_instructions,featured,is_active)
select c.id, v.name, v.slug, v.description, v.price::numeric, v.image_url, v.stock, v.material, v.dimensions, v.colour, v.care, v.featured, true
from (values
('living-room','Solis Throw Pillow','solis-throw-pillow','A soft cotton blend in a quiet sand tone, made for layering on the sofa or your favourite reading chair.','18500','https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=1000&q=85',24,'Cotton blend','45 × 45 cm','Sand Beige','Spot clean gently. Air dry away from direct sunlight.',true),
('living-room','Alba Ceramic Vase','alba-ceramic-vase','An understated ceramic silhouette that looks just as lovely with a few stems as it does on its own.','32000','https://images.unsplash.com/photo-1578500494198-246f612d3b3d?auto=format&fit=crop&w=1000&q=85',15,'Ceramic','24 × 12 cm','Ivory','Wipe with a soft, dry cloth. Not intended for food use.',true),
('living-room','Aria Decorative Tray','aria-decorative-tray','A warm oak-look tray that gathers candles, keepsakes and everyday essentials into one considered moment.','27500','https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1000&q=85',18,'Wood composite','38 × 25 × 4 cm','Natural Oak','Wipe clean with a slightly damp cloth; dry promptly.',false),
('living-room','Nola Accent Lamp','nola-accent-lamp','A gentle pool of light, with a forest-green base and soft ivory shade for cosy evenings at home.','52000','https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=1000&q=85',10,'Metal and fabric','42 × 18 cm','Forest Green / Ivory','Dust shade with a dry cloth. Bulb sold separately.',false),
('bedroom','Luna Bedside Lamp','luna-bedside-lamp','A calming ceramic base and softly diffused shade bring a little warmth to your bedside routine.','48000','https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=1000&q=85',12,'Ceramic and fabric','38 × 20 cm','Ivory','Wipe ceramic with a soft cloth. Dust shade regularly.',true),
('bedroom','Haven Cushion','haven-cushion','A linen-blend cushion in a muted sage, ready to add texture to a bed or favourite chair.','16500','https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=1000&q=85',30,'Linen blend','45 × 45 cm','Sage Green','Spot clean or dry clean. Insert included.',false),
('bedroom','Elara Wall Mirror','elara-wall-mirror','A clean framed mirror with a subtle warm-gold edge that brightens the room and opens up a wall.','85000','https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&w=1000&q=85',8,'Glass and metal','70 × 50 cm','Warm Gold','Clean glass with a non-abrasive glass cloth.',false),
('bedroom','Sienna Throw','sienna-throw','A breathable cotton-blend layer in soft sand beige, made for a quiet morning or an extra cosy evening.','35000','https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1000&q=85',16,'Cotton blend','130 × 170 cm','Sand Beige','Machine wash cold on a gentle cycle. Line dry.',true),
('dining','Terra Table Vase','terra-table-vase','Hand-finished stoneware character in a warm terracotta tone, sized for a single stem or a small arrangement.','29000','https://images.unsplash.com/photo-1578500494198-246f612d3b3d?auto=format&fit=crop&w=1000&q=85',14,'Stoneware','22 × 14 cm','Terracotta','Wipe with a soft, dry cloth. Not intended for food use.',false),
('dining','Oakley Serving Tray','oakley-serving-tray','A generous acacia-wood tray for morning coffee, shared plates and those small everyday rituals.','31500','https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1000&q=85',11,'Acacia wood','45 × 30 × 5 cm','Natural Wood','Hand wipe only. Keep dry and condition wood occasionally.',true),
('dining','Maison Candle Holder','maison-candle-holder','A simple metal candle holder with a warm-gold finish that brings a gentle glow to dinner and slow evenings.','22000','https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=1000&q=85',20,'Metal','18 × 8 cm','Warm Gold','Wipe clean when cool. Never leave a lit candle unattended.',false),
('lighting','Lumi Table Lamp','lumi-table-lamp','A considered mix of forest green and warm gold, designed to add a softly sculptural glow to your space.','58000','https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=1000&q=85',9,'Metal and glass','40 × 20 cm','Forest Green / Gold','Wipe with a soft cloth. Bulb sold separately.',true),
('lighting','Halo Pendant Light','halo-pendant-light','A streamlined pendant with a warm metallic finish to bring welcoming light above a dining table or reading nook.','120000','https://images.unsplash.com/photo-1543198126-a8ad8e47fb22?auto=format&fit=crop&w=1000&q=85',5,'Metal and glass','45 × 45 × 30 cm','Warm Gold','Installation by a qualified electrician recommended.',false),
('lighting','Solis Floor Lamp','solis-floor-lamp','Tall, quiet and easy to place, this floor lamp pairs a forest-green stem with an ivory fabric shade.','145000','https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=1000&q=85',6,'Metal and fabric','150 × 35 cm','Forest Green / Ivory','Dust shade and stem with a dry cloth. Bulb sold separately.',false),
('storage','Haven Storage Basket','haven-storage-basket','A woven natural-fibre basket that gives throws, cushions and everyday belongings a handsome home.','26000','https://images.unsplash.com/photo-1600210492493-0946911123ea?auto=format&fit=crop&w=1000&q=85',20,'Woven natural fibre','40 × 30 × 30 cm','Natural Beige','Keep dry. Brush gently to remove dust.',true),
('storage','Riva Organizer','riva-organizer','A tidy bamboo organiser for the small things that make a desk, shelf or bedside feel more considered.','21500','https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1000&q=85',25,'Bamboo','30 × 20 × 10 cm','Natural','Wipe with a dry or slightly damp cloth; do not soak.',false),
('storage','Noma Decorative Box','noma-decorative-box','A forest-green fabric-covered box that keeps small keepsakes tucked away and close at hand.','24500','https://images.unsplash.com/photo-1600210492493-0946911123ea?auto=format&fit=crop&w=1000&q=85',18,'Fabric-covered board','32 × 22 × 14 cm','Forest Green','Dust with a lint-free cloth. Keep away from moisture.',false),
('wall-decor','Solis Abstract Print','solis-abstract-print','A calm abstract composition in beige, charcoal and gold, finished with a natural wood frame.','38000','https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1000&q=85',10,'Fine art paper / wood frame','50 × 70 cm','Beige / Charcoal / Gold','Keep out of direct sunlight. Dust frame with a soft cloth.',false),
('wall-decor','Terra Botanical Art','terra-botanical-art','A softly botanical print in sage and beige that brings an easy connection to nature indoors.','42000','https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&w=1000&q=85',9,'Archival paper / wood frame','50 × 70 cm','Sage / Beige','Keep out of direct sunlight. Dust frame with a soft cloth.',true),
('wall-decor','Luma Minimal Mirror','luma-minimal-mirror','A pared-back charcoal-framed mirror that opens up a wall with simple, modern lines.','72000','https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&w=1000&q=85',7,'Glass and aluminium','60 × 80 cm','Charcoal','Clean glass with a non-abrasive glass cloth.',true)
) as v(category_slug,name,slug,description,price,image_url,stock,material,dimensions,colour,care,featured)
join public.categories c on c.slug = v.category_slug
on conflict(slug) do update set category_id=excluded.category_id, name=excluded.name, description=excluded.description,
price=excluded.price, image_url=excluded.image_url, stock_quantity=excluded.stock_quantity, material=excluded.material,
dimensions=excluded.dimensions, colour=excluded.colour, care_instructions=excluded.care_instructions,
featured=excluded.featured, is_active=true, updated_at=now();
