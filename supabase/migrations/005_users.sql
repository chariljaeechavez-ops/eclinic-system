-- Account linking and safeguards. Run after 001-004.

-- An admin first creates the login in Supabase (Authentication > Users > Add user), then links it here by email.
-- This keeps the service_role key out of the browser.
create function public.admin_link_user(p_email text, p_full_name text, p_role text) returns void
language plpgsql security definer set search_path = public, auth as $$
declare uid uuid;
begin
  if not public.is_admin() then raise exception 'Not authorized'; end if;
  if p_role not in ('admin','staff') or length(trim(coalesce(p_full_name, ''))) = 0 then raise exception 'Invalid input'; end if;
  select id into uid from auth.users where lower(email) = lower(trim(p_email));
  if uid is null then raise exception 'No login exists with that email'; end if;
  if exists (select 1 from public.profiles where id = uid) then raise exception 'That account is already set up'; end if;
  insert into public.profiles (id, full_name, role) values (uid, trim(p_full_name), p_role);
end $$;
revoke all on function public.admin_link_user(text, text, text) from public, anon;
grant execute on function public.admin_link_user(text, text, text) to authenticated;

-- Never allow the last active administrator to be demoted or deactivated.
create function public.guard_last_admin() returns trigger language plpgsql set search_path = public as $$
begin
  if old.role = 'admin' and old.is_active and (new.role <> 'admin' or not new.is_active)
     and not exists (select 1 from public.profiles where id <> old.id and role = 'admin' and is_active) then
    raise exception 'At least one active administrator is required';
  end if;
  return new;
end $$;
create trigger guard_last_admin before update on public.profiles for each row execute function public.guard_last_admin();
