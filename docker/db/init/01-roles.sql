-- Runs once, when the database volume is created.
-- The roles and extension schema the Supabase database has, so its dump restores as-is and
-- PostgREST (the API) can switch to service_role for the site and the importers.

create role anon nologin noinherit;
create role authenticated nologin noinherit;
create role service_role nologin noinherit bypassrls;
create role authenticator login noinherit password 'pikorafy';
grant anon, authenticated, service_role to authenticator;

-- Supabase keeps extensions in their own schema; norm_game_title() calls extensions.unaccent().
create schema extensions;
create extension if not exists unaccent with schema extensions;
create extension if not exists pgcrypto with schema extensions;
create extension if not exists "uuid-ossp" with schema extensions;
grant usage on schema extensions to anon, authenticated, service_role;

\i /pikorafy/grants.sql
