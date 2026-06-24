# RollUp — cross-browser / device test sequence

Run top to bottom on each target. Tick the device matrix first, then work the sequence.

## Device matrix (priority order)
1. iPhone — Safari (primary capture device)
2. iPhone — Chrome
3. iPad — Safari, both portrait and landscape (capture + desktop-wide reporting)
4. Android — Chrome
5. Desktop — Chrome / Edge (≥1024px, the wide reporting + dashboard layout)
6. Desktop — Safari (macOS)
7. Desktop — Firefox

## A. Smoke (every target)
- [ ] App loads; fonts settle (Plus Jakarta headings, Inter numerals) within ~1s, no permanent fallback.
- [ ] Sign up a throwaway account → profile step → lands on home.
- [ ] Sign out / sign back in → data still there.
- [ ] Start practice → tap several finishing positions → counter ticks → Finish & save → lands on session detail with heatmap.
- [ ] Start match → place bowls (armed), steppers, jack-length toggle → Tally end → scoreboard updates → Finish.
- [ ] Reports populate; Dashboard populates.

## B. Layout & the pills
- [ ] Segmented toggles (discipline/position/length/hand, and the Sessions tabs): even spacing, active pill fully filled, no clipped text, no overflow on a 360px-wide screen.
- [ ] Filter chip rows wrap cleanly; gaps consistent; tap targets ≥40px.
- [ ] Home: greeting, stat card, action grid (2-up), recent rows — all aligned, no overlap.
- [ ] Sessions: notes block readable and clamped to 3 lines; long names truncate with ellipsis, don't push the metric off-screen.
- [ ] Desktop ≥1024px: Sessions list goes 2-column; Reports goes 2-column; Dashboard fills to the wide board. Below 1024px everything is single-column. (This relies on CSS `:has()` — verify on older iOS Safari < 15.4 it simply stays narrow rather than breaking.)

## C. Capture interactions
- [ ] Rink tap lands a dot where you tapped (check near edges and corners).
- [ ] Match: "+ place bowls" stays armed across taps; undo works; "Done placing" disarms.
- [ ] Steppers: + / − don't go below 0; big scoreboard numerals legible.
- [ ] No accidental double-tap zoom on rapid taps (touch-action is set).
- [ ] Inputs (name/notes/email): focusing does NOT zoom the page on iOS (16px font guard).

## D. Data & accounts
- [ ] Two different accounts see only their own sessions (RLS working).
- [ ] Refresh mid-session: already-saved bowls/ends persist.
- [ ] Private/Incognito window: sign-in still works (Supabase session in storage); note it won't persist after closing — expected.

## E. Edge & resilience
- [ ] Rotate iPad/phone mid-session: layout reflows, no lost state.
- [ ] Throttle to Slow 3G (devtools): fonts swap without layout jump; app still usable.
- [ ] Browser back/forward between home → session detail → reports: no blank screens.
- [ ] Notched iPhone: bottom nav clears the home indicator (safe-area inset).
- [ ] Known gap: no offline capture yet — on a green with no signal, saves will fail. This is the native-phase job, not a bug to chase here.

## Known stack-specific watch-points
- Google Fonts FOUT on cold first paint (first visit only).
- `:has()` powers the desktop-wide switch — graceful (stays narrow) on very old browsers.
- `backdrop-filter` on the bottom nav — `-webkit-` prefix included for Safari.
- `100dvh` with a `100vh` + `@supports` fallback for older browsers.
