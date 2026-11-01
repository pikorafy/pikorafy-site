# Copies the live Supabase database (tables, functions, data) into the local Docker database.
# Run from the project folder:  .\docker\import-from-supabase.ps1
#
# It asks for two things:
#  1. The connection string: Supabase dashboard → "Connect" (top bar) → "Session pooler" → copy
#     the URI exactly as shown, WITH [YOUR-PASSWORD] still in it.
#  2. The database password (typed hidden; any characters are fine, the script encodes them).
#
# Safe to re-run: it replaces the local copy each time. Nothing is changed on Supabase.

param([string]$DbUrl)

$ErrorActionPreference = "Stop"
Set-Location (Split-Path $PSScriptRoot -Parent)

function Step($text) { Write-Host "`n== $text" -ForegroundColor Cyan }
function Check($what) { if ($LASTEXITCODE -ne 0) { throw "$what failed (exit code $LASTEXITCODE)" } }

if (-not $DbUrl) { $DbUrl = Read-Host "Connection string (Session pooler URI, with [YOUR-PASSWORD] still in it)" }
$DbUrl = $DbUrl.Trim()
if ($DbUrl -notmatch '^postgres(ql)?://') { throw "That doesn't look like a connection string (it should start with postgresql://)." }
# The password goes to pg_dump on its own (PGPASSWORD), never inside the connection string,
# so no character in it can break anything.
$password = $null
if ($DbUrl -match '\[YOUR-PASSWORD\]') {
  $secure = Read-Host "Database password (hidden)" -AsSecureString
  $password = [Runtime.InteropServices.Marshal]::PtrToStringBSTR([Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure))
  if ($password -ne $password.Trim()) {
    Write-Host "Note: the password had spaces at the start or end; they were removed." -ForegroundColor Yellow
    $password = $password.Trim()
  }
  Write-Host "Password received: $($password.Length) characters." -ForegroundColor DarkGray
  $DbUrl = $DbUrl.Replace(':[YOUR-PASSWORD]', '')
}
$pwArgs = @()
if ($password) { $pwArgs = @('-e', "PGPASSWORD=$password") }

Step "Starting the local database"
docker compose up -d --wait db; Check "Starting the database"

Step "Downloading from Supabase (a minute or two)"
docker compose exec -T @pwArgs db pg_dump "$DbUrl" --schema=public --no-owner --no-privileges --format=custom --file=/backups/supabase.dump
Check "Downloading"

Step "Loading into the local database"
# Warnings about objects that don't exist yet are normal on the first run.
docker compose exec -T db pg_restore -U postgres -d pikorafy --clean --if-exists --no-owner --no-privileges /backups/supabase.dump
if ($LASTEXITCODE -ne 0) { Write-Host "pg_restore reported warnings (usually harmless); continuing." -ForegroundColor Yellow }

Step "Permissions and home-page lists"
docker compose exec -T db psql -U postgres -d pikorafy -v ON_ERROR_STOP=1 -q -f /pikorafy/grants.sql; Check "Permissions"
docker compose exec -T db psql -U postgres -d pikorafy -q -c "select public.refresh_home_lists();"; Check "Refreshing the home lists"

Step "What's in the local database now"
docker compose exec -T db psql -U postgres -d pikorafy -c "select (select count(*) from titles) titles, (select count(*) from games) steam, (select count(*) from xbox_games) xbox, (select count(*) from playstation_games) playstation, (select count(*) from nintendo_games) nintendo, pg_size_pretty(pg_database_size('pikorafy')) size;"

Write-Host "`nDone. Start everything with:  docker compose up -d --build" -ForegroundColor Green
Write-Host "The dump is kept in docker\backups\supabase.dump (git ignores it)."
