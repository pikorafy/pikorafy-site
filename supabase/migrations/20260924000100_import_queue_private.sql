-- import_queue is internal to the importer (service role only); hide it from the public API.
revoke all on public.import_queue from anon, authenticated;
