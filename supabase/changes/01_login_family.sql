-- =====================================================================
-- STEP 6-1 변경: 로그인 + 가족방 만들기/참여
-- (Supabase → SQL Editor 에 통째로 붙여넣고 Run, 두 번 실행해도 괜찮아요)
--
-- 1. 연습용 땅콩이네 데이터와 "로그인 없이 읽기" 임시 규칙을 지워요.
-- 2. 가족방 만들기 / 초대 코드로 참여하기 기능(함수)을 만들어요.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. 연습용 데이터와 임시 규칙 정리
-- ---------------------------------------------------------------------

drop policy if exists "임시: 연습용 가족방 읽기" on public.families;
drop policy if exists "임시: 연습용 구성원 읽기" on public.family_members;
drop policy if exists "임시: 연습용 강아지 읽기" on public.dogs;
drop policy if exists "임시: 연습용 기록 읽기" on public.care_records;

-- 연습용 가족방을 지우면 구성원·강아지·기록도 함께 지워져요
-- (두 번 실행해도 오류가 나지 않게, is_demo 칸이 있을 때만 지워요)
do $$
begin
  if exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'families' and column_name = 'is_demo') then
    execute 'delete from public.families where is_demo';
  end if;
end;
$$;

drop function if exists public.is_demo_family(uuid);
alter table public.families drop column if exists is_demo;

-- 이제 로그인 안 한 사람은 아무 표도 볼 수 없어요
revoke select on public.families, public.family_members, public.dogs, public.care_records from anon;

-- ---------------------------------------------------------------------
-- 2. 초대 코드 만들기 (헷갈리는 글자 0·O·1·I 는 빼고 6자리)
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
-- 3. 가족방 만들기: 가족방 + 나(방장) + 강아지를 한 번에 만들어요
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
-- 4. 초대 코드로 참여하기
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
