-- 攪拌紀錄 · COSPLAY LOG
-- 在你的自有後端（Supabase 專案）的 SQL Editor 執行這整份檔案即可。
-- 內容：使用者暱稱檔（profiles）、Cosplay 紀錄（cosplay_records）、
--       資料列層級安全（RLS）政策、照片儲存空間（cosplay-photos）。

-- ============================================================
-- 1. 使用者暱稱檔
-- ============================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles
  for select to authenticated using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles
  for insert to authenticated with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

-- 註冊時自動建立 profile（暱稱取自註冊表單）
create or replace function public.cosplaylog_handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end $$;

create trigger cosplaylog_on_signup
  after insert on auth.users for each row execute function public.cosplaylog_handle_new_user();

-- ============================================================
-- 2. Cosplay 紀錄
-- ============================================================
create table if not exists public.cosplay_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  record_date date not null,
  character_name text not null,
  series_title text not null default '',
  event_name text not null default '',
  photographer text not null default '',
  shoot_type text not null,
  note text not null default '',
  photo_url text,
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.cosplay_records enable row level security;

-- 較早建立的資料庫若還沒有這些欄位，下面幾行會補上（已存在時完全不會有影響）
alter table public.cosplay_records
  add column if not exists venue text not null default '',
  add column if not exists character_version text not null default '',
  add column if not exists role text not null default 'coser',
  add column if not exists person_count integer not null default 1;

alter table public.profiles
  add column if not exists enabled_roles text[] not null default '{}',
  add column if not exists active_role text not null default 'coser';

create policy "records_select_own" on public.cosplay_records
  for select to authenticated using (auth.uid() = user_id);
create policy "records_insert_own" on public.cosplay_records
  for insert to authenticated with check (auth.uid() = user_id);
create policy "records_update_own" on public.cosplay_records
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "records_delete_own" on public.cosplay_records
  for delete to authenticated using (auth.uid() = user_id);

create index if not exists cosplay_records_user_date_idx
  on public.cosplay_records (user_id, record_date desc);

create or replace function public.cosplaylog_set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

create trigger cosplaylog_records_set_updated_at
  before update on public.cosplay_records for each row execute function public.cosplaylog_set_updated_at();

-- ============================================================
-- 3. 照片儲存空間
-- ============================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'cosplay-photos',
  'cosplay-photos',
  true,
  10485760,
  array['image/jpeg','image/png','image/webp','image/gif']::text[]
)
on conflict (id) do nothing;

create policy "cosplay_photos_read" on storage.objects
  for select to public
  using (bucket_id = 'cosplay-photos');

create policy "cosplay_photos_owner_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'cosplay-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "cosplay_photos_owner_update" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'cosplay-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'cosplay-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "cosplay_photos_owner_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'cosplay-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
