-- Add section_id to comments so each <section> on a mockup gets its own thread.
alter table public.comments add column if not exists section_id text;
alter table public.comments add column if not exists section_label text;

create index if not exists idx_comments_mockup_section
  on public.comments(mockup_id, section_id);
