This is a large multi-step build. I'll ship it in one coordinated pass, grouped by system. Confirm before I start.

## STEP 2 — Product page rebuild (`/products/$slug`)

Layout, top to bottom, matching cortinadz.com:
1. **Gallery**: main image + thumbnail row, click → lightbox with zoom, swipeable on mobile (touch gestures + prev/next).
2. **Title + rating**: average stars + "(N avis)" link that smooth-scrolls to reviews.
3. **Price block** (already built in Step 1).
4. **Variant selector** (already built).
5. **Quantity**: − / + stepper (min 1).
6. **Two CTAs side-by-side**:
   - "Ajouter au panier" → adds to cart (Step 3).
   - "Commander via WhatsApp" → opens `wa.me/<store>` with prefilled text: name, variant, qty, total.
7. **Quick-order form** embedded on page:
   - Full name, phone, wilaya (58), quantity.
   - Live **order summary** box: product line, delivery fee (from wilaya table), grand total; recomputes on variant/qty/wilaya change.
   - "Confirmer la commande" → creates a real order row (COD, same `orders` table), then redirects to confirmation screen.
8. **Description block**.
9. **Reviews**: list (name, date, stars, text, optional photo) + write-a-review form (name, rating, text, optional photo upload to storage).
10. **Related products** row (already built, restyled).

## STEP 3 — Cart & checkout

- **Cart store**: localStorage-backed Zustand (or lightweight context) — id, product_id, variant_id, label, name, price, qty, image.
- **Header cart icon** with live badge; click → mini-cart dropdown (items or empty state) with View Cart / Checkout buttons.
- **`/cart` page**: line items (image, name, variant, qty stepper, remove), subtotal, Checkout button.
- **`/checkout` page**: name, phone, wilaya, city, address, notes; summary with delivery fee + grand total; COD; Place Order → creates order.
- **`/order-confirmation/$number`**: order number, summary, "Nous vous appellerons pour confirmer".

## STEP 4 — Floating WhatsApp

- Persistent bottom-right green circle button on all pages (in `SiteLayout`), separate from the existing wiggling call button. Generic greeting prefill. Keep the call button as-is.

## STEP 5 — Site-wide structure

- **Top ticker bar**: marquee above header with rotating short trust messages; text editable via `settings` table (`ticker_messages` json array).
- **Header nav**: Accueil / Produits / Prendre RDV / Livraison / Contact.
- **Categories wired**: seed/ensure `Rails`, `Accessoires`, `Tissus`; wire filter on `/products` to display them.
- **New pages**: `/shipping`, `/contact`, `/terms`, `/privacy`, `/returns`, `/faq`, `/about`, `/payment-methods` — content-only pages, editable text via settings where reasonable, otherwise static.
- **Footer**: 4 columns as specified with tel: link + social links (Facebook/Instagram/TikTok) from settings.

## Database changes (one migration)

- `wilayas.delivery_fee numeric not null default 0` + `is_free_delivery boolean default false`.
- `reviews` table: `id, product_id, customer_name, rating (1..5), text, photo_url, is_approved, created_at`. Public read approved; anyone insert (unapproved); admin manage.
- `settings`: add `ticker_messages jsonb`, `whatsapp_number`, `social_facebook`, `social_instagram`, `social_tiktok` keys (existing settings table is key/value so just inserts).
- Storage bucket `review-photos` (public).

## Technical notes (dev-only detail)

- Cart: `src/lib/cart.ts` — Zustand with `persist` middleware, exports `useCart()`.
- Product page split into components under `src/components/site/product/`: `Gallery`, `Rating`, `QuantityStepper`, `QuickOrderForm`, `Reviews`, `WhatsAppOrderButton`.
- Lightbox: `yet-another-react-lightbox` (small, SSR-safe with dynamic import).
- Marquee: pure CSS keyframes, no lib.
- Reviews average computed client-side from fetched list; cached via TanStack Query.
- Quick-order + checkout both call a new `createCustomerOrder` server fn (no auth required) with zod validation; reuses `next_order_number()`.
- Floating WhatsApp: new `<FloatingWhatsApp/>` in `SiteLayout` alongside existing `FloatingCall`.

## Out of scope for this pass

- Payment integration beyond COD.
- Review moderation UI in admin (rows will be visible; approve/reject can come later — flagging as `is_approved=false` by default and admin can flip via SQL for now, OR I can add a minimal admin reviews page — say the word).
- SMS/email notifications.

Reply "go" (or with tweaks) and I'll ship it.