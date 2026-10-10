-- 星読みの部屋：ログイン付きマイページ用のテーブル
-- Supabase ダッシュボードの「SQL Editor」に貼り付けて実行してください（何度実行しても安全です）

-- プロフィール（1ユーザー1行）
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  sei text check (char_length(sei) <= 20),
  mei text check (char_length(mei) <= 20),
  birth date,
  time text check (time is null or time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  time_unknown boolean not null default false,
  pref text check (char_length(pref) <= 3),
  type16 jsonb,
  updated_at timestamptz not null default now()
);

-- 占いの履歴
create table if not exists public.fortune_history (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind text not null check (char_length(kind) <= 32),
  title text check (char_length(title) <= 200),
  created_at timestamptz not null default now()
);
create index if not exists fortune_history_user_created on public.fortune_history (user_id, created_at desc);

-- 本人のデータだけ読み書きできるようにする（行レベルセキュリティ）
alter table public.profiles enable row level security;
alter table public.fortune_history enable row level security;

drop policy if exists "own profile" on public.profiles;
create policy "own profile" on public.profiles
  for all to authenticated
  using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "own history" on public.fortune_history;
create policy "own history" on public.fortune_history
  for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 退会：本人のアカウントとデータをすべて削除する
create or replace function public.delete_user()
returns void
language sql
security definer
set search_path = ''
as $$
  delete from auth.users where id = auth.uid();
$$;
revoke execute on function public.delete_user() from public, anon;
grant execute on function public.delete_user() to authenticated;
