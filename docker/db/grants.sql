-- What the API's service_role may do: everything in public (the site and importers use only
-- this role, as on Supabase). Re-run after every restore; docker/import-from-supabase.ps1 does.

grant usage on schema public to service_role;
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
grant execute on all functions in schema public to service_role;
alter default privileges in schema public grant all on tables to service_role;
alter default privileges in schema public grant all on sequences to service_role;
alter default privileges in schema public grant execute on functions to service_role;

-- Tell PostgREST to re-read tables and functions.
notify pgrst, 'reload schema';
