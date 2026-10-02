# LUMA HOME — Ecommerce Training Project

A responsive home décor storefront built as a fictional training project. The UI uses React, TypeScript and Vite. Supabase provides Postgres, Auth, Row Level Security, image storage and server-side order processing. Mailgun order confirmations are sent from a Supabase Edge Function.

The design follows the supplied LUMA HOME identity board: forest green `#1B3D2F`, warm gold `#C9A96A`, ivory `#FAF9F6`, sand `#D7C4A7`, charcoal `#333333`, Playfair Display headings and Montserrat UI text. The source attachment is a brand board rather than a standalone logo file, so the header uses a small inline house/leaf symbol with a LUMA HOME wordmark; replace it with approved logo files if they become available.

## Run locally

```sh
npm install
cp .env.example .env.local
# Set VITE_SUPABASE_URL and either VITE_SUPABASE_ANON_KEY or VITE_SUPABASE_PUBLISHABLE_KEY in .env.local
npm run dev
```

Without Supabase settings, the storefront renders the seeded fictional catalog and a cart saved in this browser for preview. The header labels this as preview mode. Account creation, wishlist persistence, database carts, newsletter signup and order submission stay disabled until Supabase is configured; the app never reports a preview order as real.

## Configure Supabase

1. Create a Supabase project and copy its project URL and anon/publishable key into `.env.local` as `VITE_SUPABASE_URL` and either `VITE_SUPABASE_ANON_KEY` or `VITE_SUPABASE_PUBLISHABLE_KEY`. These are browser keys and rely on the migration's RLS policies. Never put a Supabase secret/service key in a `VITE_` variable.
2. Install the Supabase CLI, authenticate, link the project and apply the migration:

   ```sh
   supabase login
   supabase link --project-ref YOUR_PROJECT_REF
   supabase db push
   ```

   This creates the profiles, categories, products, carts, cart items, orders, order items, wishlist and newsletter tables; configures row access, storage and transactional RPCs; and inserts six categories and the twenty fictional products.
3. Enable Email/password in **Authentication → Providers**. Configure the Auth site URL and allowed redirect URLs for local development and the deployed app.
4. Create an admin securely: sign up through the app, then run this once in the Supabase SQL editor as the project owner, using that account's Auth user UUID:

   ```sql
   update public.profiles set is_admin = true where id = 'AUTH_USER_UUID';
   ```

   Do not change the `is_admin` default or add an admin password to source code. The profile update grant only permits a customer to change their own name and avatar.
5. Deploy the order email function after setting its private secrets (see below):

   ```sh
   supabase functions deploy order-confirmation
   ```

### Google sign-in

Google OAuth is implemented with Supabase Auth's hosted OAuth flow. In Google Cloud Console, create an OAuth **Web application** client. Add the Supabase callback URL `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback` to its authorized redirect URIs. In Supabase **Authentication → Providers → Google**, enable Google and enter the Google client ID and client secret there. Add the deployed app origin (and `http://localhost:5173` for local use) to Supabase's allowed redirect URLs. Keep the Google client secret in Supabase's provider settings, never in frontend environment variables.

### Mailgun order email

Verify a Mailgun sending domain and configure a sender address. Set these as Supabase Edge Function secrets; they are intentionally not Vite/browser variables:

```sh
supabase secrets set MAILGUN_API_KEY=YOUR_MAILGUN_API_KEY MAILGUN_DOMAIN=YOUR_MAILGUN_DOMAIN 'MAILGUN_FROM_EMAIL=LUMA HOME <orders@YOUR_VERIFIED_DOMAIN>'
```

The `order-confirmation` function validates the signed-in user, reads only their persisted order using their RLS-scoped Supabase session, and sends text and HTML content through Mailgun. The database transaction completes first; email delivery failure is logged by the function/client but does not erase a successfully placed order. Configure Mailgun's sender/domain to match its verified setup.

## Important implementation details

- `create_order(...)` is a PostgreSQL transaction invoked through Supabase RPC. It validates required fields, locks the user's cart and products, reads current catalog prices, checks stock, calculates NGN subtotal and delivery on the server, allocates a unique `LH-YYYYMMDD-XXXX` number, snapshots order item names/prices, reduces inventory and clears the cart. Empty-cart retries cannot create a duplicate order.
- Delivery is ₦5,000 below ₦100,000 and complimentary at or above ₦100,000. No payment gateway is connected.
- Product reads are public for active products. Customer profile/cart/wishlist/order data is restricted by RLS. Orders can be placed only through the authenticated RPC. Only an account with `profiles.is_admin = true` can manage the catalog, inventory, customer overview and order status.
- Products referenced by past orders are deactivated instead of deleted. Order items preserve name, quantity, unit price and subtotal snapshots.
- Product uploads use the public-read `product-images` Storage bucket. Only admins can write to it; the bucket accepts JPEG, PNG, WebP and AVIF up to 8 MB.
- All customer-facing database/auth failures are translated to readable feedback; detailed errors go to the browser or Edge Function developer console.
- Full-colour, white, monochrome and simplified icon SVG logo assets are in `public/`. The included Vercel rewrite and Netlify `_redirects` preserve direct navigation to product and account routes in SPA hosting.

## Build and verification

```sh
npm run build
```

The build verifies TypeScript and produces the static app in `dist/`. Live database, OAuth and Mailgun checks require a configured Supabase project, a Google OAuth web client and a verified Mailgun domain. Once provisioned, exercise customer signup/login, Google OAuth, cart edits/refresh, checkout, inventory updates, order visibility, email contents, admin product/category changes, uploads, and order status transitions against that project.
# lumahome
