-- eClinic initial schema. Run once in the Supabase SQL Editor of a NEW project.
-- Disable public signups first (Authentication > Providers > Email > turn off "Allow new users to sign up").

-- ===== Tables =====
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null check (length(trim(full_name)) > 0),
  role text not null default 'staff' check (role in ('admin','staff')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.students (
  id uuid primary key default gen_random_uuid(),
  student_no text not null unique check (length(trim(student_no)) > 0),
  last_name text not null check (length(trim(last_name)) > 0),
  first_name text not null check (length(trim(first_name)) > 0),
  middle_name text,
  level text not null check (level in ('senior_high','college')),
  grade_or_year text not null,          -- e.g. 'Grade 12' or '2nd year'
  section_or_program text not null,     -- e.g. 'STEM-A' or 'BS Nursing'
  contact_no text,
  guardian_name text,
  guardian_contact text,
  is_archived boolean not null default false,
  created_by uuid default auth.uid() references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index students_name_idx on public.students (lower(last_name), lower(first_name));
create index students_active_idx on public.students (is_archived, level);

create table public.clinic_visits (
  id uuid primary key default gen_random_uuid(),
  visit_no bigint generated always as identity unique,
  student_id uuid not null references public.students(id) on delete restrict,
  visited_at timestamptz not null default now(),
  reason text not null check (length(trim(reason)) > 0),
  observations text,
  action_taken text,
  follow_up text,
  recorded_by uuid not null default auth.uid() references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index visits_student_idx on public.clinic_visits (student_id, visited_at desc);
create index visits_date_idx on public.clinic_visits (visited_at desc);

create table public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) > 0),
  category text not null check (category in ('medicine','supply')),
  unit text not null,
  low_stock_threshold integer not null default 0 check (low_stock_threshold >= 0),
  expiry_date date,
  supplier text,
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index inventory_items_batch_uq on public.inventory_items (lower(name), coalesce(expiry_date, 'infinity'::date));

create table public.inventory_transactions (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.inventory_items(id) on delete restrict,
  kind text not null check (kind in ('in','out')),
  quantity integer not null check (quantity > 0),
  note text,
  idempotency_key uuid not null unique,
  created_by uuid not null default auth.uid() references public.profiles(id),
  created_at timestamptz not null default now()
);
create index inv_tx_item_idx on public.inventory_transactions (item_id, created_at desc);

-- Audit rows record WHO did WHAT to WHICH record and which fields changed, never the values (data minimization).
create table public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid,
  action text not null,
  table_name text not null,
  record_id uuid,
  changed_fields text[] not null default '{}',
  created_at timestamptz not null default now()
);
create index audit_created_idx on public.audit_logs (created_at desc);

create view public.inventory_balances with (security_invoker = true) as
select i.*, coalesce(sum(case t.kind when 'in' then t.quantity else -t.quantity end), 0)::integer as balance
from public.inventory_items i left join public.inventory_transactions t on t.item_id = i.id
group by i.id;

-- ===== Helper functions =====
create function public.is_active_user() returns boolean
language sql stable security definer set search_path = public as
$$ select exists (select 1 from public.profiles where id = auth.uid() and is_active) $$;

create function public.is_admin() returns boolean
language sql stable security definer set search_path = public as
$$ select exists (select 1 from public.profiles where id = auth.uid() and is_active and role = 'admin') $$;

create function public.touch_updated_at() returns trigger
language plpgsql set search_path = public as
$$ begin new.updated_at = now(); return new; end $$;

create function public.audit_row() returns trigger
language plpgsql security definer set search_path = public as
$$
declare rec jsonb; f text[] := '{}';
begin
  rec := to_jsonb(case when tg_op = 'DELETE' then old else new end);
  if tg_op = 'UPDATE' then
    select coalesce(array_agg(n.key), '{}') into f
    from jsonb_each(to_jsonb(new)) n join jsonb_each(to_jsonb(old)) o using (key)
    where n.value is distinct from o.value and n.key <> 'updated_at';
  end if;
  insert into public.audit_logs (actor_id, action, table_name, record_id, changed_fields)
  values (auth.uid(), lower(tg_op), tg_table_name, (rec->>'id')::uuid, f);
  return null;
end $$;

-- Stock changes go through this function only: it locks the item, rejects negative stock,
-- and ignores a repeated idempotency key so double-clicks cannot double-count.
create function public.record_stock_transaction(p_item uuid, p_kind text, p_qty integer, p_note text, p_key uuid)
returns void language plpgsql security definer set search_path = public as
$$
declare bal integer;
begin
  if not public.is_active_user() then raise exception 'Not authorized'; end if;
  if p_kind not in ('in','out') or p_qty is null or p_qty <= 0 then raise exception 'Invalid transaction'; end if;
  perform 1 from public.inventory_items where id = p_item and not is_archived for update;
  if not found then raise exception 'Item not found'; end if;
  if exists (select 1 from public.inventory_transactions where idempotency_key = p_key) then return; end if;
  select coalesce(sum(case kind when 'in' then quantity else -quantity end), 0) into bal
    from public.inventory_transactions where item_id = p_item;
  if p_kind = 'out' and p_qty > bal then raise exception 'Insufficient stock (available: %)', bal; end if;
  insert into public.inventory_transactions (item_id, kind, quantity, note, idempotency_key, created_by)
  values (p_item, p_kind, p_qty, nullif(trim(p_note), ''), p_key, auth.uid());
end $$;

-- ===== Triggers =====
create trigger touch_profiles before update on public.profiles for each row execute function public.touch_updated_at();
create trigger touch_students before update on public.students for each row execute function public.touch_updated_at();
create trigger touch_visits before update on public.clinic_visits for each row execute function public.touch_updated_at();
create trigger touch_items before update on public.inventory_items for each row execute function public.touch_updated_at();
create trigger audit_profiles after insert or update or delete on public.profiles for each row execute function public.audit_row();
create trigger audit_students after insert or update or delete on public.students for each row execute function public.audit_row();
create trigger audit_visits after insert or update or delete on public.clinic_visits for each row execute function public.audit_row();
create trigger audit_items after insert or update or delete on public.inventory_items for each row execute function public.audit_row();
create trigger audit_inv_tx after insert on public.inventory_transactions for each row execute function public.audit_row();

-- ===== Row Level Security =====
alter table public.profiles enable row level security;
alter table public.students enable row level security;
alter table public.clinic_visits enable row level security;
alter table public.inventory_items enable row level security;
alter table public.inventory_transactions enable row level security;
alter table public.audit_logs enable row level security;

-- Start from zero privileges, then grant only what is needed. No DELETE is granted on any table.
revoke all on all tables in schema public from anon, authenticated;
revoke all on all functions in schema public from anon, public;
grant select, insert, update on public.students, public.clinic_visits, public.inventory_items to authenticated;
grant select on public.profiles, public.inventory_transactions, public.audit_logs, public.inventory_balances to authenticated;
grant insert, update on public.profiles to authenticated;
grant execute on function public.is_active_user(), public.is_admin(), public.record_stock_transaction(uuid, text, integer, text, uuid) to authenticated;

create policy profiles_read on public.profiles for select to authenticated using (id = auth.uid() or public.is_admin());
create policy profiles_admin_write on public.profiles for insert to authenticated with check (public.is_admin());
create policy profiles_admin_update on public.profiles for update to authenticated using (public.is_admin()) with check (public.is_admin());

create policy students_read on public.students for select to authenticated using (public.is_active_user());
create policy students_insert on public.students for insert to authenticated with check (public.is_active_user());
create policy students_update on public.students for update to authenticated using (public.is_active_user()) with check (public.is_active_user());

create policy visits_read on public.clinic_visits for select to authenticated using (public.is_active_user());
create policy visits_insert on public.clinic_visits for insert to authenticated with check (public.is_active_user() and recorded_by = auth.uid());
create policy visits_update on public.clinic_visits for update to authenticated using (public.is_active_user()) with check (public.is_active_user());

create policy items_read on public.inventory_items for select to authenticated using (public.is_active_user());
create policy items_insert on public.inventory_items for insert to authenticated with check (public.is_active_user());
create policy items_update on public.inventory_items for update to authenticated using (public.is_active_user()) with check (public.is_active_user());

create policy tx_read on public.inventory_transactions for select to authenticated using (public.is_active_user());
create policy audit_admin_read on public.audit_logs for select to authenticated using (public.is_admin());
