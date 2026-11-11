---
name: run-tallsoftmuavin
description: Run, start, launch, log in to and screenshot the Muavin (E-MUAVİN) ön muhasebe web app (Express + Vite on port 3000), and typecheck it. Use when asked to run the app, "uygulamayı çalıştır", take a screenshot of a page, check the UI after a change, or drive it headlessly.
---

Muavin is one Express server (`server.ts`) that also serves the React UI via Vite middleware on **port 3000**. Start it with `npm run dev`, seed a local demo login, then drive it with the headless Playwright driver `.claude/skills/run-tallsoftmuavin/driver.cjs`, which logs in through the real login form and takes a screenshot.

All paths are relative to the repo root.

## Setup

```bash
npm install --no-audit --no-fund
git checkout package-lock.json
```

`npm ci` fails because `package-lock.json` is out of sync with `package.json` (`tsx`). Use `npm install`, then restore the lock file so you don't commit an unrelated change.

Seed a local demo login. Users live in `data/cloud_sync_store.json` (gitignored). The server hashes `loginPasswordPlain` on first login. **Don't overwrite an existing store:**

```bash
[ -e data/cloud_sync_store.json ] || cat > data/cloud_sync_store.json <<'EOF'
{"companiesRegistry":[{"id":"comp_demo","companyName":"Demo Ltd","loginUsername":"demo","loginPasswordPlain":"demo1234","loginRole":"Firma Yöneticisi"}],"usersRegistry":[],"deletedCompanyIds":[],"deletedUserKeys":[],"companiesData":{},"version":1}
EOF
```

## Run (agent path)

Start the server in the background and poll the health endpoint:

```bash
MYSOFT_MOCK_MODE=true nohup npm run dev > /tmp/muavin-dev.log 2>&1 &
timeout 90 bash -c 'until curl -sf localhost:3000/api/health >/dev/null; do sleep 1; done'
```

Then drive it:

```bash
node .claude/skills/run-tallsoftmuavin/driver.cjs login          # log in as demo/demo1234 -> Ana Sayfa dashboard
node .claude/skills/run-tallsoftmuavin/driver.cjs shot           # login page, no auth
```

`driver.cjs login <path>` navigates to `<path>` after logging in. `driver.cjs shot <path>` opens `<path>` without logging in. Each run prints the screenshot path (in `/tmp/muavin-shots/`), the page title, the first 400 characters of the body text and the failed requests. **Look at the screenshot.** Set `MUAVIN_USER` and `MUAVIN_PASS` for other credentials, `MUAVIN_URL` for another host, and `SHOT_DIR` for the output directory.

Login is also possible through the API only:

```bash
curl -s -X POST localhost:3000/api/auth/login -H 'content-type: application/json' -d '{"identifier":"demo","password":"demo1234"}'
```

Stop the server:

```bash
lsof -ti:3000 -sTCP:LISTEN | xargs -r kill
```

## Test

```bash
NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit
```

This exits 0 when it passes. There is no unit test suite.

## Gotchas

- **The port is hard-coded to 3000** in dev. `PORT` is honored only in production (`NODE_ENV=production` or `K_SERVICE`).
- **Expect these console errors in this sandbox:**
  - `ERR_TUNNEL_CONNECTION_FAILED` for `open.er-api.com` (exchange rates) and `cdnjs` pdfmake fonts. The network blocks them.
  - `404` for `fonts.gstatic.com` Roboto files.
  - `401` for `/api/cloud-sync/state` and `/api/auth/preferences`, fired before login.

  None of these block the UI.
- **`403 /api/db/state?companyId=comp_default` after login.** The UI's active company is the built-in test company ("MUAVİN BİLİŞİM TEKN.DAN.A.Ş. (TEST)"), while the session is bound to `comp_demo`. The dashboard still renders with ₺0 values.
- **Google sign-in, Firebase password login, Gemini and real Mysoft** need credentials and network access this container doesn't have. Use the seeded company login and `MYSOFT_MOCK_MODE=true`.
- **The body text proves nothing about login state.** The dashboard's sidebar text is in the DOM even while the login screen covers it, so `driver.cjs shot` prints sidebar text too. The real signal is whether `input[type=password]` is present, which is what `driver.cjs login` waits on, plus the screenshot.
- **Login form selectors:** username placeholder `Kullanıcı adınız veya e-posta adresiniz`, `input[type=password]`, and the last button matching `Giriş Yap`. The "Google ile Giriş Yap" button also matches, hence `.last()`.

## Troubleshooting

- **`npm ci`: "lock file's tsx@4.23.13 does not satisfy tsx@4.23.15"**: use `npm install`, then `git checkout package-lock.json`.
- **`npm run lint` aborts with a V8 heap OOM stack** (its 2 GB heap is too small): run `tsc` with `--max-old-space-size=6144` as in Test.
- **Login returns 401 "Kullanıcı adı/e-posta veya şifre hatalı"**: the seed was skipped because a store file already existed. Inspect `data/cloud_sync_store.json`, or move it aside and re-seed, then restart the server. The store is read only at startup.
