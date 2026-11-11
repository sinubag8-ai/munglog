-- =====================================================================
-- 멍로그 데이터베이스 (Supabase → SQL Editor 에 통째로 붙여넣고 Run)
-- 구조: 가족방(families) → 강아지(dogs) → 돌봄 기록(care_records)
--       가족 구성원(family_members)이 가족방에 속해요.
-- 새 프로젝트를 처음부터 만들 때 쓰는 "전체 최신본"이에요.
-- 이미 만든 프로젝트는 supabase/changes/ 의 변경 파일만 순서대로 실행해요.
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
-- 4. 앱에서 표에 접근할 수 있게 허락 (실제로 무엇이 보이는지는 위 보안 규칙이 정해요)
-- ---------------------------------------------------------------------

grant usage on schema public to authenticated;
grant select on public.families, public.family_members, public.dogs, public.care_records to authenticated;
grant update on public.families, public.family_members, public.dogs to authenticated;
grant insert on public.dogs, public.care_records to authenticated;
grant delete on public.care_records to authenticated;
grant execute on function public.is_family_member(uuid) to authenticated;

-- ---------------------------------------------------------------------
-- 5. 초대 코드 만들기 (헷갈리는 글자 0·O·1·I 는 빼고 6자리)
-- ---------------------------------------------------------------------

create or replace function public.generate_invite_code()
returns text
language plpgsql volatile set search_path = public
as $$
declare
  chars constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  new_code text;
begin
  loop
    new_code := '';
    for i in 1..6 loop
      new_code := new_code || substr(chars, 1 + floor(random() * length(chars))::int, 1);
    end loop;
    exit when not exists (select 1 from public.families where invite_code = new_code);
  end loop;
  return new_code;
end;
$$;

-- 앱에서 직접 부르지 못하게 해요 (가족방 만들기 함수 안에서만 써요)
revoke execute on function public.generate_invite_code() from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- 6. 가족방 만들기: 가족방 + 나(방장) + 강아지를 한 번에 만들어요
-- ---------------------------------------------------------------------

create or replace function public.create_family(family_name text, dog_name text, my_name text)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  uid uuid := auth.uid();
  fid uuid;
begin
  if uid is null then raise exception 'not_logged_in'; end if;
  -- 지금은 한 사람이 가족방 1개에만 들어갈 수 있어요
  if exists (select 1 from public.family_members where user_id = uid) then
    raise exception 'already_in_family';
  end if;

  insert into public.families (name, invite_code)
  values (trim(family_name), public.generate_invite_code())
  returning id into fid;

  insert into public.family_members (family_id, user_id, display_name, is_owner)
  values (fid, uid, trim(my_name), true);

  insert into public.dogs (family_id, name)
  values (fid, trim(dog_name));

  return fid;
end;
$$;

-- ---------------------------------------------------------------------
-- 7. 초대 코드로 참여하기
-- ---------------------------------------------------------------------

create or replace function public.join_family(code text, my_name text)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  uid uuid := auth.uid();
  fid uuid;
begin
  if uid is null then raise exception 'not_logged_in'; end if;

  select id into fid from public.families where invite_code = upper(trim(code));
  if fid is null then raise exception 'invalid_code'; end if;

  if exists (select 1 from public.family_members where family_id = fid and user_id = uid) then
    raise exception 'already_member';
  end if;
  if exists (select 1 from public.family_members where user_id = uid) then
    raise exception 'already_in_family';
  end if;

  insert into public.family_members (family_id, user_id, display_name)
  values (fid, uid, trim(my_name));

  return fid;
end;
$$;

revoke execute on function public.create_family(text, text, text) from public, anon;
revoke execute on function public.join_family(text, text) from public, anon;
grant execute on function public.create_family(text, text, text) to authenticated;
grant execute on function public.join_family(text, text) to authenticated;
