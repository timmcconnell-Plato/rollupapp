# Deploying RollUp

Roughly ten minutes, mostly clicking in two web dashboards. Everything here
needs your accounts, so these steps are yours to run — but they're copy-paste.

---

## 1. Supabase — the database (~3 min, web)

1. Go to https://supabase.com and create a new project (any name, e.g. `rollup`).
   Pick a region close to you (Sydney is the nearest to NZ). Wait for it to finish
   provisioning.
2. In the left sidebar open **SQL Editor** → **New query**.
3. Open `supabase/migration.sql` from this repo, copy the **whole file**, paste it
   into the query editor, and click **Run**. You should see "Success".
4. Left sidebar → **Project Settings** → **API**. Copy these two values somewhere:
   - **Project URL**  (looks like `https://abcd1234.supabase.co`)
   - **anon public** key  (a long string under "Project API keys")

   The anon key is meant to be public — it's protected by row-level security — so
   it's fine to paste into Vercel. Don't copy the `service_role` key.

---

## 2. Code onto GitHub (~2 min)

Pick ONE path.

### Path A — terminal
First create an **empty** repo on https://github.com/new called `rollup-app`
(no README, no .gitignore). Then:

```bash
cd rollup-app
git init
git add -A
git commit -m "RollUp prototype"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/rollup-app.git
git push -u origin main
```

### Path B — no terminal
On https://github.com/new create the `rollup-app` repo. On the empty repo page
click **"uploading an existing file"**, then drag in the **contents** of the
unzipped `rollup-app` folder (not the folder itself). Commit.

---

## 3. Vercel — deploy (~3 min, web)

1. Go to https://vercel.com and sign in with GitHub.
2. **Add New… → Project** → import the `rollup-app` repo. It auto-detects Next.js;
   leave the build settings as they are.
3. Expand **Environment Variables** and add these two (names exactly as written):

   | Name | Value |
   |------|-------|
   | `NEXT_PUBLIC_SUPABASE_URL` | your Project URL from step 1 |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | your anon public key from step 1 |

4. Click **Deploy**. After a minute you'll get a live URL.

---

## 4. Smoke test

1. Open the URL on your phone.
2. **Set up practice** → **Start practice** → tap a dozen finishing positions,
   switching hands. They should save (the counter ticks up) and undo should work.
3. Go to **Reports**. If you'd rather not tap 40 bowls, hit **Add sample session
   (demo)** and the heatmap + length profile will populate.

---

## Alternative: deploy from terminal only (skip GitHub)

```bash
npm i -g vercel
cd rollup-app
vercel            # follow the prompts; first run links the project
vercel env add NEXT_PUBLIC_SUPABASE_URL        # paste value when asked
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY   # paste value when asked
vercel --prod     # deploy to production
```

---

## If something breaks

- **Vercel build fails** — copy the red error from the build log and send it over.
- **App loads but nothing saves / Reports stays empty** — usually the env vars
  aren't set or the SQL didn't run. Re-check steps 1.3 and 3.3.
- **"new row violates row-level security"** — the migration's RLS policies didn't
  apply; re-run `supabase/migration.sql`.

Paste me any error message and I'll tell you exactly what to change.
