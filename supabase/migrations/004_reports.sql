-- Report aggregates. SECURITY INVOKER: row-level security applies (inactive users get empty results).
create function public.report_visits(p_from date, p_to date, p_group text default 'day', p_tz text default 'Asia/Manila') returns jsonb
language plpgsql stable set search_path = public as $$
declare g text := case when p_group in ('week','month') then p_group else 'day' end; result jsonb;
begin
  if p_from is null or p_to is null or p_from > p_to or p_to - p_from > 366 then raise exception 'Invalid date range'; end if;
  with v as (select (visited_at at time zone p_tz)::date d, initcap(lower(trim(reason))) r from clinic_visits
             where (visited_at at time zone p_tz)::date between p_from and p_to)
  select jsonb_build_object(
    'total', (select count(*) from v),
    'by_reason', coalesce((select jsonb_agg(jsonb_build_object('label', r, 'count', c) order by c desc, r) from (select r, count(*) c from v group by r) x), '[]'::jsonb),
    'by_period', coalesce((select jsonb_agg(jsonb_build_object('label', k, 'count', c) order by k) from
        (select to_char(date_trunc(g, d::timestamp), 'YYYY-MM-DD') k, count(*) c from v group by 1) y), '[]'::jsonb)) into result;
  return result;
end $$;

create function public.report_stock_movements(p_from date, p_to date, p_tz text default 'Asia/Manila')
returns table (item_id uuid, name text, unit text, stock_in bigint, stock_out bigint)
language sql stable set search_path = public as $$
  select i.id, i.name, i.unit,
         coalesce(sum(t.quantity) filter (where t.kind = 'in'), 0)::bigint, coalesce(sum(t.quantity) filter (where t.kind = 'out'), 0)::bigint
  from inventory_items i join inventory_transactions t on t.item_id = i.id and (t.created_at at time zone p_tz)::date between p_from and p_to
  group by i.id order by i.name
$$;

revoke all on function public.report_visits(date, date, text, text), public.report_stock_movements(date, date, text) from public, anon;
grant execute on function public.report_visits(date, date, text, text), public.report_stock_movements(date, date, text) to authenticated;
