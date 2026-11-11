-- =====================================================================
-- 멍로그 데이터베이스 (Supabase → SQL Editor 에 통째로 붙여넣고 Run)
-- 구조: 가족방(families) → 강아지(dogs) → 돌봄 기록(care_records)
--       가족 구성원(family_members)이 가족방에 속해요.
-- 여러 번 실행해도 괜찮아요 (이미 있으면 건너뛰거나 다시 만들어요).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. 표(테이블) 만들기
-- ---------------------------------------------------------------------

-- 가족방
create table if not exists public.families (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) between 1 and 20),
  invite_code text not null unique check (invite_code ~ '^[A-Z0-9]{6}$'), -- 6자리 초대 코드
  is_demo     boolean not null default false, -- 연습용 가족방 (STEP 6에서 정리)
  created_at  timestamptz not null default now()
);

-- 가족 구성원 (로그인한 사람 ↔ 가족방 연결 + 표시 이름)
create table if not exists public.family_members (
  id           uuid primary key default gen_random_uuid(),
  family_id    uuid not null references public.families(id) on delete cascade,
  user_id      uuid references auth.users(id) on delete cascade, -- 연습용 구성원은 비어 있어요
  display_name text not null check (char_length(display_name) between 1 and 10),
  is_owner     boolean not null default false, -- 방장
  joined_at    timestamptz not null default now(),
  unique (family_id, user_id) -- 같은 사람이 같은 가족방에 두 번 들어갈 수 없어요
);

-- 강아지 (나중에 한 가족방에 여러 마리 등록 가능)
create table if not exists public.dogs (
  id         uuid primary key default gen_random_uuid(),
  family_id  uuid not null references public.families(id) on delete cascade,
  name       text not null check (char_length(name) between 1 and 20),
  breed      text,
  birthday   date,
  created_at timestamptz not null default now()
);

-- 돌봄 기록 (종류·시간·기록한 사람은 자동, 메모만 선택)
create table if not exists public.care_records (
  id         uuid primary key default gen_random_uuid(),
  dog_id     uuid not null references public.dogs(id) on delete cascade,
  member_id  uuid not null references public.family_members(id) on delete cascade,
  type       text not null check (type in ('walk', 'meal', 'snack')),
  memo       text check (memo is null or char_length(memo) <= 100),
  created_at timestamptz not null default now()
);

-- 자주 찾는 조건에 색인(빠른 검색용)
create index if not exists care_records_dog_time_idx on public.care_records (dog_id, created_at desc);
create index if not exists family_members_user_idx on public.family_members (user_id);
create index if not exists dogs_family_idx on public.dogs (family_id);

-- ---------------------------------------------------------------------
-- 2. 보안 도우미 함수
-- ---------------------------------------------------------------------

-- "지금 로그인한 사람이 이 가족방 구성원인가요?"
create or replace function public.is_family_member(fid uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.family_members
    where family_id = fid and user_id = auth.uid()
  );
$$;

-- "이 가족방은 연습용인가요?"
create or replace function public.is_demo_family(fid uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select coalesce((select is_demo from public.families where id = fid), false);
$$;

-- ---------------------------------------------------------------------
-- 3. 보안 규칙 (RLS): 같은 가족방 사람만 보고 쓸 수 있어요
-- ---------------------------------------------------------------------

alter table public.families       enable row level security;
alter table public.family_members enable row level security;
alter table public.dogs           enable row level security;
alter table public.care_records   enable row level security;

-- 가족방: 구성원만 보기, 방장만 이름 수정
drop policy if exists "families: 구성원만 보기" on public.families;
create policy "families: 구성원만 보기" on public.families
  for select to authenticated
  using (public.is_family_member(id));

drop policy if exists "families: 방장만 수정" on public.families;
create policy "families: 방장만 수정" on public.families
  for update to authenticated
  using (exists (
    select 1 from public.family_members
    where family_id = families.id and user_id = auth.uid() and is_owner
  ));

-- 가족 구성원: 같은 가족방 사람만 보기, 내 표시 이름만 수정
drop policy if exists "members: 같은 가족만 보기" on public.family_members;
create policy "members: 같은 가족만 보기" on public.family_members
  for select to authenticated
  using (public.is_family_member(family_id));

drop policy if exists "members: 내 이름만 수정" on public.family_members;
create policy "members: 내 이름만 수정" on public.family_members
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- 강아지: 같은 가족방 사람만 보기·등록·수정
drop policy if exists "dogs: 같은 가족만 보기" on public.dogs;
create policy "dogs: 같은 가족만 보기" on public.dogs
  for select to authenticated
  using (public.is_family_member(family_id));

drop policy if exists "dogs: 같은 가족만 등록" on public.dogs;
create policy "dogs: 같은 가족만 등록" on public.dogs
  for insert to authenticated
  with check (public.is_family_member(family_id));

drop policy if exists "dogs: 같은 가족만 수정" on public.dogs;
create policy "dogs: 같은 가족만 수정" on public.dogs
  for update to authenticated
  using (public.is_family_member(family_id));

-- 돌봄 기록: 같은 가족방 사람만 보기
drop policy if exists "records: 같은 가족만 보기" on public.care_records;
create policy "records: 같은 가족만 보기" on public.care_records
  for select to authenticated
  using (exists (
    select 1 from public.dogs d
    where d.id = care_records.dog_id and public.is_family_member(d.family_id)
  ));

-- 돌봄 기록: "나"의 이름으로만, 우리 가족 강아지에게만 남길 수 있어요
drop policy if exists "records: 내 이름으로만 남기기" on public.care_records;
create policy "records: 내 이름으로만 남기기" on public.care_records
  for insert to authenticated
  with check (exists (
    select 1
    from public.family_members m
    join public.dogs d on d.family_id = m.family_id
    where m.id = care_records.member_id
      and m.user_id = auth.uid()
      and d.id = care_records.dog_id
  ));

-- 돌봄 기록: 본인이 남긴 기록만 삭제 (수정 기능은 없어요)
drop policy if exists "records: 내 기록만 삭제" on public.care_records;
create policy "records: 내 기록만 삭제" on public.care_records
  for delete to authenticated
  using (exists (
    select 1 from public.family_members m
    where m.id = care_records.member_id and m.user_id = auth.uid()
  ));

-- ---------------------------------------------------------------------
-- 4. ⏳ 임시 규칙: 연습용 가족방은 로그인 없이 "읽기만" 가능
--    STEP 6(로그인)에서 이 4개 규칙은 지울 거예요.
-- ---------------------------------------------------------------------

drop policy if exists "임시: 연습용 가족방 읽기" on public.families;
create policy "임시: 연습용 가족방 읽기" on public.families
  for select to anon, authenticated
  using (is_demo);

drop policy if exists "임시: 연습용 구성원 읽기" on public.family_members;
create policy "임시: 연습용 구성원 읽기" on public.family_members
  for select to anon, authenticated
  using (public.is_demo_family(family_id));

drop policy if exists "임시: 연습용 강아지 읽기" on public.dogs;
create policy "임시: 연습용 강아지 읽기" on public.dogs
  for select to anon, authenticated
  using (public.is_demo_family(family_id));

drop policy if exists "임시: 연습용 기록 읽기" on public.care_records;
create policy "임시: 연습용 기록 읽기" on public.care_records
  for select to anon, authenticated
  using (exists (
    select 1 from public.dogs d
    where d.id = care_records.dog_id and public.is_demo_family(d.family_id)
  ));

-- ---------------------------------------------------------------------
-- 5. 앱에서 표에 접근할 수 있게 허락 (실제로 무엇이 보이는지는 위 보안 규칙이 정해요)
-- ---------------------------------------------------------------------

grant usage on schema public to anon, authenticated;
grant select on public.families, public.family_members, public.dogs, public.care_records to anon, authenticated;
grant update on public.families, public.family_members, public.dogs to authenticated;
grant insert on public.dogs, public.care_records to authenticated;
grant delete on public.care_records to authenticated;
grant execute on function public.is_family_member(uuid), public.is_demo_family(uuid) to anon, authenticated;

-- ---------------------------------------------------------------------
-- 6. 연습용 데이터: 콩이네 가족방 + 땅콩이 + 오늘 기록 6개
--    기록 시각은 "오늘(한국 시간) 0시 ~ 지금" 사이에 골고루 만들어져요.
-- ---------------------------------------------------------------------

insert into public.families (id, name, invite_code, is_demo) values
  ('00000000-0000-0000-0000-00000000f001', '콩이네', 'A3K9P2', true)
on conflict (id) do nothing;

insert into public.family_members (id, family_id, display_name, is_owner) values
  ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-00000000f001', '엄마', true),
  ('00000000-0000-0000-0000-0000000000a2', '00000000-0000-0000-0000-00000000f001', '아빠', false),
  ('00000000-0000-0000-0000-0000000000a3', '00000000-0000-0000-0000-00000000f001', '나',   false),
  ('00000000-0000-0000-0000-0000000000a4', '00000000-0000-0000-0000-00000000f001', '언니', false)
on conflict (id) do nothing;

insert into public.dogs (id, family_id, name, breed, birthday) values
  ('00000000-0000-0000-0000-00000000d001', '00000000-0000-0000-0000-00000000f001', '땅콩이', '말티즈', '2022-04-15')
on conflict (id) do nothing;

-- 연습용 기록은 실행할 때마다 "오늘" 기록으로 새로 만들어요
delete from public.care_records where dog_id = '00000000-0000-0000-0000-00000000d001';

with t as (
  select (date_trunc('day', now() at time zone 'Asia/Seoul') at time zone 'Asia/Seoul') as start_at
)
insert into public.care_records (dog_id, member_id, type, memo, created_at)
select '00000000-0000-0000-0000-00000000d001', v.member_id::uuid, v.type, v.memo,
       t.start_at + (now() - t.start_at) * v.fraction
from t, (values
  ('00000000-0000-0000-0000-0000000000a1', 'meal',  '사료 반 컵',      0.35),
  ('00000000-0000-0000-0000-0000000000a2', 'walk',  '공원 한 바퀴',    0.42),
  ('00000000-0000-0000-0000-0000000000a3', 'snack', null,              0.55),
  ('00000000-0000-0000-0000-0000000000a4', 'snack', '덴탈껌 1개',      0.68),
  ('00000000-0000-0000-0000-0000000000a1', 'meal',  null,              0.80),
  ('00000000-0000-0000-0000-0000000000a3', 'walk',  '비 와서 짧게 🌧️', 0.92)
) as v(member_id, type, memo, fraction);
