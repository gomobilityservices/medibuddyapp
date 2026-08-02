# Pay-Per-Minute Talk App — Mobile UI

A mobile-first webview UI for a marketplace where customers pay per minute to chat or call service providers. This first pass is UI only, with realistic mock data — no backend, no real audio, no real payments.

## Design direction

- Neon Mint palette: deep navy base `#0d1b2a`, forest surface `#1b4332`, mint accent `#2dd4a8`, bright mint highlight `#73ffb8`.
- Dark theme, high contrast, rounded cards, mint accents for money/status/actions.
- Everything sized for a phone viewport: max-width container, thumb-reachable bottom tab bar, large tap targets, safe-area padding, no hover-only affordances.

## Role switching

A simple mock role switcher (top of profile / dev toggle) flips between Customer and Provider experiences so both can be reviewed without auth.

## Customer screens

1. **Discover** — location chip ("Your area"), search, filter row (language, gender preference, price range, rating). List of available providers only: photo, name, rating, languages, per-minute rate, distance-ish area label, online dot.
2. **Provider detail** — large photo, rating, description, languages, rate, and two CTAs: Chat and Call. Shows "You can talk for ~X min" based on mock wallet balance.
3. **Pre-session sheet** — confirms rate, wallet balance, and computed max duration before starting.
4. **Chat session** — message thread with a persistent top bar showing elapsed time, amount spent, and remaining time countdown; low-balance warning at 2 min left with a Top up action; End session button.
5. **Call session** — full-screen call UI: avatar, remaining-time countdown ring, spent amount, mute/speaker/end controls, low-balance warning.
6. **Session summary** — duration, minutes billed, total charged, new balance, rate-your-provider stars.
7. **Wallet** — balance card, preset top-up amounts (mock instant credit), transaction list (debits per session, credits per top-up).
8. **Profile** — name, gender, avatar, basic settings.

## Provider screens

1. **Dashboard** — Available/Offline toggle front and center, today's earnings, minutes talked, incoming request cards (accept/decline).
2. **Earnings** — total balance, today / this week / this month breakdown, per-transaction list (who-less: customer shown as masked handle, duration, minutes, amount earned), simple bar chart of daily earnings.
3. **Session screens** — chat and call views mirroring the customer ones but showing earnings accruing instead of balance draining.
4. **Provider profile edit** — photo, description, per-minute rate, spoken languages, gender, and connection preference (which genders/audience they accept).

## Privacy constraints in the UI

- No phone numbers or emails anywhere in either role's views.
- Customers appear to providers as a display name + masked ID only; providers appear to customers as display name only.
- Calls and chats are presented as in-app sessions, never a dial-out.

## Technical notes

- TanStack Start file routes: `/` (customer discover), `/provider/:id`, `/session/chat/:id`, `/session/call/:id`, `/session/summary`, `/wallet`, `/profile`, `/provider` (dashboard), `/provider/earnings`, `/provider/settings`.
- Design tokens added to `src/styles.css` in oklch (background, surface, mint primary, mint glow) — no hardcoded color classes in components.
- Mock data + a small client-side store (React context) for wallet balance, provider list, availability toggle, and session state so timers and balance changes feel real across screens.
- Session billing is a client-side ticking timer: remaining time = floor(balance / rate) minutes, counting down and decrementing balance per minute.
- Provider avatars generated as images into `src/assets`.
- Each route gets its own `head()` with unique title/description/og tags.

## Not in this pass

Real auth, real voice/video, real payments, persistence across reloads, matching/queueing logic. All are natural next steps once the UI is approved.
