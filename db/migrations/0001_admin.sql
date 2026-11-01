-- Admin: users and job runs (local Docker database).

create table if not exists public.admin_users (
  id            serial primary key,
  email         text not null unique check (email = lower(email)),
  name          text not null,
  password_hash text not null,
  role          text not null default 'admin' check (role in ('admin', 'editor')),
  created_at    timestamptz not null default now(),
  last_login_at timestamptz
);

-- One row per run of a job (scheduled or started by hand), with its whole log.
create table if not exists public.job_runs (
  id             bigserial primary key,
  job            text not null,
  trigger        text not null check (trigger in ('schedule', 'manual')),
  status         text not null check (status in ('queued', 'running', 'succeeded', 'failed', 'stopped')),
  requested_by   text,
  queued_at      timestamptz not null default now(),
  started_at     timestamptz,
  finished_at    timestamptz,
  stop_requested boolean not null default false,
  summary        text,
  log            text not null default ''
);
create index if not exists job_runs_job_idx on public.job_runs (job, queued_at desc);
create index if not exists job_runs_status_idx on public.job_runs (status) where status in ('queued', 'running');

-- Per-job switches from the admin (a paused job's schedule doesn't run; "Run now" still works).
create table if not exists public.job_settings (
  job        text primary key,
  enabled    boolean not null default true,
  updated_at timestamptz not null default now(),
  updated_by text
);
