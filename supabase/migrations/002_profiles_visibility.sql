-- Active users may read colleague names so "Recorded by" works. Writes stay admin-only.
drop policy profiles_read on public.profiles;
create policy profiles_read on public.profiles for select to authenticated using (id = auth.uid() or public.is_active_user());
