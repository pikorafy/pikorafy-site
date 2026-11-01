# Pikorafy on your own computer (Docker)

Everything runs in Docker Desktop: the database, its API, the site and the scheduled imports.
No Vercel, no Supabase.

| Container | What it is | On your PC |
|---|---|---|
| `pikorafy-db-1` | PostgreSQL 17 | `localhost:5533` (user `postgres`, password `pikorafy`, database `pikorafy`) |
| `pikorafy-rest-1` | PostgREST, the API Supabase uses (the code talks to it unchanged) | internal only |
| `pikorafy-api-1` | Supabase-style URLs (`/rest/v1/…`) in front of PostgREST | `http://localhost:3034` |
| `pikorafy-app-1` | The site, production build | `http://localhost:3033` |
| `pikorafy-redis-1` | Redis: the job queues and admin sessions | `localhost:6380` |
| `pikorafy-jobs-1` | The job runner: every importer on a schedule, plus runs started from the admin | — |

The admin is at **http://localhost:3033/admin** (see "Admin" below).

The ports only listen on your own PC. If one clashes with another project, set a different one in
a `.env` file next to `docker-compose.yml` (git ignores it):

```
PIKORAFY_APP_PORT=3033
PIKORAFY_API_PORT=3034
PIKORAFY_DB_PORT=5533
PIKORAFY_REDIS_PORT=6380
```

To see which ports your other containers use: `docker ps --format "table {{.Names}}\t{{.Ports}}"`

## First time

1. **Get the data from Supabase** (from the project folder, in PowerShell):

   ```powershell
   .\docker\import-from-supabase.ps1
   ```

   It asks for the connection string: Supabase dashboard → **Connect** (top bar) → **Session pooler** →
   copy the URI **as shown, with `[YOUR-PASSWORD]` still in it**. Then it asks for the database password
   (typed hidden; any characters work). "Reset database password" is on the same screen. The copy is
   saved in `docker\backups\supabase.dump`.

   If PowerShell refuses to run scripts: `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`.

2. **Importer keys** (optional; without them the site works, only the data stops updating):
   copy `docker\importers.env.example` to `docker\importers.env` and fill in the keys you have.

3. **Start everything:**

   ```powershell
   docker compose up -d --build
   ```

   The site needs a minute or two to build the first time; follow it with
   `docker compose logs -f app` until it says "Ready". Then open http://localhost:3033.

## Admin

http://localhost:3033/admin:

- **Dashboard**: catalog counts, running jobs, matching health, latest runs.
- **Catalog**: search titles; open one to rename it or change its address (the old one
  redirects), move or unlink its store items, add one by its store id, or merge a duplicate
  into another title. "Store items without a title" lists, per store, what has no page yet
  and links it to a title. Corrections are kept in `title_overrides` / `title_edits`, so the
  daily link-titles run never undoes them; **Reset** hands an item back to link-titles.
- **Review queue**: matches the daily link-titles run wasn't sure about: a store item whose
  name fits several IGDB games (pick **This one**, **None of these**, or link it elsewhere),
  and name-only matches whose release years are far apart (**The match is right** or unlink).
  Decisions are corrections too, and an item you decided or dismissed isn't asked again.
- **Jobs**: every job's schedule, last run and log; **Run now**, **Stop**, **Pause**/**Resume**.

Create your account once (it asks for a password of at least 12 characters, typed hidden):

```powershell
docker compose exec -it jobs node scripts/local/create-admin.mts you@example.com "Your name"
```

Run it again with the same email to set a new password. Add `editor` at the end for a
second person with fewer rights (roles take effect as the admin grows).

## Jobs from the command line

The same as the admin's Jobs page:

```powershell
docker compose exec jobs node scripts/local/jobs.mts list
docker compose exec jobs node scripts/local/jobs.mts now steam xbox     # queue runs
docker compose exec jobs node scripts/local/jobs.mts stop steam         # stop a running run
```

A job queued while another job of the same store runs waits its turn. Every run and its
whole log is kept in the `job_runs` table.

## The full catalog

Locally there are no caps: every game the stores list is imported (Steam ~100k+, Xbox ~15k,
PlayStation and Nintendo ~10–15k each). The job runner gets there on its own over a few days.
To fill it sooner, start the big jobs by hand (they run side by side, one per store):

```powershell
docker compose exec jobs node scripts/local/jobs.mts now steam-seed xbox nintendo playstation
```

| Store | First fill | Then |
|---|---|---|
| Steam | `steam-seed` ranks every game (~30 min), then each `steam` run imports 15,000 (every 3 h; **Run now** again to go faster) | popular games daily, the rest weekly |
| Xbox | one run (browse + details for all games, ~30–60 min) | every 6 h |
| Nintendo | one run | every 6 h |
| PlayStation | catalog in one run; store pages 1,000 per run (4 runs a day; `STORE_PAGES=3000` fills faster) | popular daily, the rest every few days |
| Prices (ITAD) | after Steam has filled | every 6 h |

When the stores have filled, link them into titles and refresh the home page:

```powershell
docker compose exec jobs node scripts/local/jobs.mts now link-titles home-lists
```

(It runs daily at 03:37 UTC anyway.) Follow progress on the admin's Jobs page or with
`docker compose logs -f jobs`.

## Everyday

| | |
|---|---|
| Start / stop | `docker compose up -d` / `docker compose down` (the data stays) |
| After `git pull` | `docker compose up -d --build` |
| Logs | `docker compose logs -f app` · `docker compose logs -f jobs` |
| Jobs | http://localhost:3033/admin/jobs, or `docker compose exec jobs node scripts/local/jobs.mts list` |
| Database shell | `docker compose exec db psql -U postgres -d pikorafy` |
| Database in a GUI | connect pgAdmin / DBeaver / TablePlus to `localhost:5533` |
| Start over (deletes the local data) | `docker compose down -v`, then the first-time steps again |

## Developing with live reload

Run only the database side in Docker and the site on your PC:

```powershell
docker compose up -d db redis rest api jobs
npm run dev
```

with this in `.env.local` (git ignores it):

```
DATABASE_URL=postgres://postgres:pikorafy@localhost:5533/pikorafy
REDIS_URL=redis://localhost:6380
SUPABASE_URL=http://localhost:3034
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaXNzIjoicGlrb3JhZnktbG9jYWwifQ.drY33MJKfluApzdA0nOg_II092wtHxmjCG0LlIAM40Y
```

(That key only works with this local setup; it isn't a secret.) If the `app` container is running
too, stop it first (`docker compose stop app`): both use port 3033.

Importers can run from your PC the same way, e.g. `node scripts/import-xbox.mts run 500 0`, with
their API keys set in the PowerShell session.
