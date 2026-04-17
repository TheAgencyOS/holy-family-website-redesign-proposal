-- ════════════════════════════════════════════════════════════════════════
-- Holy Family proposal portal · initial schema
-- Public-write phase: anyone can comment / create tasks without an account.
-- user_id columns are nullable now and will be populated later when auth ships.
-- RLS is enabled with permissive policies for the anon role; tighten when adding auth.
-- ════════════════════════════════════════════════════════════════════════

-- ── Mockups · catalog of pages that can be commented on ──────────────────
create table if not exists public.mockups (
  id          text primary key,            -- e.g. 'hfu-bsn', 'hfu-home'
  name        text not null,               -- 'BSN · Bachelor of Science in Nursing'
  url_path    text not null,               -- 'mockups/hfu-bsn.html'
  description text,
  created_at  timestamptz not null default now()
);

-- ── Comments · anonymous-friendly threaded comments on mockups ───────────
create table if not exists public.comments (
  id          uuid primary key default gen_random_uuid(),
  mockup_id   text references public.mockups(id) on delete cascade,
  parent_id   uuid references public.comments(id) on delete cascade,  -- threaded replies
  user_id     uuid,                                                    -- nullable for now (anon)
  author_name text not null,                                           -- always required
  author_email text,                                                   -- optional, used for notifications
  body        text not null,
  resolved    boolean not null default false,
  selector    text,                                                    -- optional CSS selector for inline pinning
  created_at  timestamptz not null default now()
);
create index if not exists idx_comments_mockup_id on public.comments(mockup_id);
create index if not exists idx_comments_parent_id on public.comments(parent_id);
create index if not exists idx_comments_created_at on public.comments(created_at desc);

-- ── Tasks · lightweight task board ───────────────────────────────────────
create table if not exists public.tasks (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  description  text,
  status       text not null default 'todo' check (status in ('todo','in_progress','done','blocked')),
  priority     text not null default 'normal' check (priority in ('low','normal','high','urgent')),
  assignee_name text,
  assignee_email text,
  created_by_name text,
  created_by_email text,
  related_mockup_id text references public.mockups(id) on delete set null,
  related_comment_id uuid references public.comments(id) on delete set null,
  due_date     date,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists idx_tasks_status on public.tasks(status);
create index if not exists idx_tasks_assignee on public.tasks(assignee_email);
create index if not exists idx_tasks_created_at on public.tasks(created_at desc);

-- Auto-update tasks.updated_at
create or replace function public.touch_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

drop trigger if exists trg_tasks_touch on public.tasks;
create trigger trg_tasks_touch before update on public.tasks
  for each row execute function public.touch_updated_at();

-- ── Notifications queue · email outbox processed by a worker / function ──
create table if not exists public.notifications (
  id           uuid primary key default gen_random_uuid(),
  kind         text not null,                            -- 'new_comment' | 'task_assigned' | 'status_changed' | etc.
  recipient_email text not null,
  payload      jsonb not null default '{}'::jsonb,       -- arbitrary context for the email template
  status       text not null default 'pending' check (status in ('pending','sent','failed','skipped')),
  error        text,
  created_at   timestamptz not null default now(),
  sent_at      timestamptz
);
create index if not exists idx_notifications_status on public.notifications(status, created_at);

-- ── RLS · permissive policies for public phase ───────────────────────────
alter table public.mockups       enable row level security;
alter table public.comments      enable row level security;
alter table public.tasks         enable row level security;
alter table public.notifications enable row level security;

-- Drop existing policies first to keep this idempotent
drop policy if exists "mockups_read_all"   on public.mockups;
drop policy if exists "mockups_write_all"  on public.mockups;
drop policy if exists "comments_read_all"  on public.comments;
drop policy if exists "comments_write_all" on public.comments;
drop policy if exists "tasks_read_all"     on public.tasks;
drop policy if exists "tasks_write_all"    on public.tasks;
drop policy if exists "tasks_update_all"   on public.tasks;
drop policy if exists "notifications_service_only_read"   on public.notifications;
drop policy if exists "notifications_service_only_write"  on public.notifications;

-- Mockups: anyone reads, only service role writes (we seed the catalog server-side)
create policy "mockups_read_all"  on public.mockups for select using (true);

-- Comments: anyone reads + writes (public phase)
create policy "comments_read_all"  on public.comments for select using (true);
create policy "comments_write_all" on public.comments for insert with check (true);
-- Future: add update/delete policies tied to auth.uid()

-- Tasks: anyone reads + creates + updates (public phase)
create policy "tasks_read_all"    on public.tasks for select using (true);
create policy "tasks_write_all"   on public.tasks for insert with check (true);
create policy "tasks_update_all"  on public.tasks for update using (true);

-- Notifications: write goes through the service role only (no anon insert)
-- Reading is restricted to service role too — internal queue, not user-facing
-- (no policies = no access for anon; service_role bypasses RLS by default)

-- ── Seed mockup catalog ──────────────────────────────────────────────────
insert into public.mockups (id, name, url_path, description) values
  ('hfu-home',         'Homepage',                    'mockups/hfu-home.html',         'A Catholic university rooted in family, since 1954'),
  ('hfu-bsn',          'BSN · Nursing flagship',      'mockups/hfu-bsn.html',          'Bachelor of Science in Nursing program page'),
  ('hfu-programs',     'Academic programs',           'mockups/hfu-programs.html',     'Programs hub'),
  ('hfu-admissions',   'Admissions & Aid',            'mockups/hfu-admissions.html',   'Admissions landing'),
  ('hfu-student-life', 'Student Experience',          'mockups/hfu-student-life.html', 'Student experience narrative page'),
  ('hfu-about',        'About HFU',                   'mockups/hfu-about.html',        'About & mission'),
  ('hfu-visit',        'Plan a visit',                'mockups/hfu-visit.html',        'Visit / tour scheduling')
on conflict (id) do update set
  name = excluded.name,
  url_path = excluded.url_path,
  description = excluded.description;
