# RollUp — competitive lawn bowls (prototype app)

The training trackers tell you how you practise. RollUp tells you how you
**compete** — and connects the two. This is the full web-view prototype: the
six screens from design, wired to Supabase, deployable on Vercel.

Web-first is a deliberate validation step. The product is native (Expo,
iOS-first) once this is proven with real bowlers. The **Supabase schema is the
durable asset** — manual taps and future computer-vision both write the same
`shots` record, so the data survives the eventual client rewrite.

## Stack
Next.js (App Router) → Vercel · Supabase (Postgres) · no auth (prototype)

## 1. Supabase
1. Create a project at supabase.com.
2. SQL editor → run `supabase/migration.sql`.
3. Settings → API: copy the **Project URL** and the **anon public** key.

## 2. Run locally
```bash
npm install
cp .env.local.example .env.local   # paste URL + anon key
npm run dev                          # http://localhost:3000
```

## 3. Deploy
```bash
git init && git add -A && git commit -m "RollUp prototype"
git remote add origin git@github.com:YOU/rollup-app.git
git push -u origin main
```
Vercel → Add New → Project → import the repo. Add env vars
`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`, then deploy.

## The screens
- **Home** — start a match, start practice, or open reports.
- **Match setup / Practice setup** — write a `sessions` row, route into capture.
- **Capture · practice** — tap finishing positions; each tap persists a `shots`
  row instantly (optimistic UI). Forehand/backhand scatter, draw vs non-draw,
  live length read, and **undo that actually deletes the row**.
- **Capture · match** — per-end shots-for/against steppers; optional shot-bowl
  placement; **Tally end** writes an `ends` row plus any placed `shots`, then
  advances. Running match score in the header.
- **Reports** — heatmap + side-view length profile computed from **real**
  captured data, filterable by hand and jack length. Empty state includes a
  labelled **demo seeder** so the views populate without 40 manual taps.

## Built in this phase (beyond the static design)
- Real persistence of sessions, ends and shots.
- Optimistic capture with row-level undo.
- Reports aggregated live from the database (not sample data).
- Demo-data seeder, clearly labelled, for instant evaluation.
- DM Serif wordmark, mobile shell, sticky nav.

## Honest gaps (still true, by design)
- **No offline-first sync.** Inserts are online-only. The real H1 requirement —
  local-first capture that survives a green with no signal and syncs later — is
  a native-phase job, not built here.
- **No auth; permissive RLS.** Anyone can read/write. Prototype only — see the
  warning in `migration.sql`.
- **No CV.** `capture_method` already distinguishes `manual_tap` from `cv`; the
  CV path is gated behind a separate accuracy spike.
- **Domain items unconfirmed.** Green-speed definition, the match-scoring model,
  jack-length tolerance bands and shot taxonomy need a real coach before any
  external use. Non-draws carry a coarse outcome tag, not a position — on purpose.

## Coordinate convention
Jack = origin (0,0), metres. +x right of the line of play, -x left; +y beyond
the jack (long), -y short. Ranges in `lib/geometry.js` are illustrative and
flagged for Domain Lead confirmation.
