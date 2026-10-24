-- Aggregated dashboard figures. SECURITY INVOKER (default): row-level security still applies, so
-- inactive or signed-out users get nothing. Dates are evaluated in the clinic's time zone.
create function public.dashboard_summary(p_tz text default 'Asia/Manila') returns jsonb
language sql stable set search_path = public as $$
  with b as (select (now() at time zone p_tz)::date as today)
  select jsonb_build_object(
    'students', (select count(*) from students where not is_archived),
    'visits_today', (select count(*) from clinic_visits, b where (visited_at at time zone p_tz)::date = b.today),
    'monthly', coalesce((select jsonb_agg(jsonb_build_object('month', m, 'count', c) order by m)
      from (select to_char(date_trunc('month', visited_at at time zone p_tz), 'YYYY-MM') m, count(*) c
            from clinic_visits, b where (visited_at at time zone p_tz)::date >= (date_trunc('month', b.today) - interval '5 months')::date
            group by 1) x), '[]'::jsonb),
    'reasons', coalesce((select jsonb_agg(jsonb_build_object('reason', r, 'count', c) order by c desc, r)
      from (select initcap(lower(trim(reason))) r, count(*) c from clinic_visits, b
            where (visited_at at time zone p_tz)::date >= b.today - 29 group by 1 order by 2 desc, 1 limit 5) y), '[]'::jsonb)
  )
$$;
revoke all on function public.dashboard_summary(text) from public, anon;
grant execute on function public.dashboard_summary(text) to authenticated;
