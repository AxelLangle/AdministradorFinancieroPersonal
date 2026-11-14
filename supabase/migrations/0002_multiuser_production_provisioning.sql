-- Migración 0002: Aprovisionamiento multi-usuario para producción
-- Crea categorías iniciales, cuenta principal, espacio de trabajo aislado y presupuesto base automáticamente para cada nuevo usuario registrado (Email o Google OAuth).

create or replace function private.seed_default_categories(target_workspace_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (select 1 from public.categories where workspace_id = target_workspace_id) then
    insert into public.categories (workspace_id, name, kind, default_priority, icon, color_token, sort_order, is_active)
    values
      (target_workspace_id, 'Hogar y Vivienda', 'expense', 'essential', 'home', 'terracotta', 1, true),
      (target_workspace_id, 'Servicios (Luz, Agua, Internet)', 'expense', 'essential', 'bolt', 'terracotta', 2, true),
      (target_workspace_id, 'Despensa y Supermercado', 'expense', 'essential', 'shopping_cart', 'forest', 3, true),
      (target_workspace_id, 'Transporte y Gasolina', 'expense', 'important', 'directions_car', 'amber', 4, true),
      (target_workspace_id, 'Salud y Seguros', 'expense', 'important', 'shield', 'amber', 5, true),
      (target_workspace_id, 'Educación y Cursos', 'expense', 'important', 'school', 'sage', 6, true),
      (target_workspace_id, 'Tarjetas y Créditos', 'expense', 'essential', 'credit_card', 'terracotta', 7, true),
      (target_workspace_id, 'Suscripciones Digitales', 'expense', 'flexible', 'subscriptions', 'slate', 8, true),
      (target_workspace_id, 'Entretenimiento y Salidas', 'expense', 'flexible', 'movie', 'slate', 9, true),
      (target_workspace_id, 'Sueldo y Nómina', 'income', 'essential', 'payments', 'emerald', 10, true),
      (target_workspace_id, 'Freelance y Otros Ingresos', 'income', 'important', 'work', 'emerald', 11, true);
  end if;
end;
$$;

revoke execute on function private.seed_default_categories(uuid) from public, anon;
grant execute on function private.seed_default_categories(uuid) to authenticated;

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_workspace_id uuid;
begin
  insert into public.users (id, email, name, onboarding_completed)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(coalesce(new.email, 'Usuario'), '@', 1)
    ),
    false
  )
  on conflict (id) do update
  set email = excluded.email;

  insert into public.workspaces (name, type, owner_user_id)
  values ('Mis Finanzas', 'personal', new.id)
  returning id into new_workspace_id;

  insert into public.workspace_members (workspace_id, user_id, role, status)
  values (new_workspace_id, new.id, 'owner', 'active');

  insert into public.accounts (workspace_id, name, type, currency, opening_balance, opening_balance_date, opening_balance_at)
  values (new_workspace_id, 'Cuenta principal', 'liquida', 'MXN', 0, current_date, now());

  perform private.seed_default_categories(new_workspace_id);

  insert into public.budgets (workspace_id, month, total_limit, alert_threshold_percent, min_cushion_amount, min_cushion_percent)
  values (new_workspace_id, date_trunc('month', current_date)::date, 0, 80, 0, 10)
  on conflict (workspace_id, month) do nothing;

  return new;
end;
$$;

create or replace function public.ensure_user_workspace()
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_workspace_id uuid;
begin
  v_user_id := (select auth.uid());
  if v_user_id is null then
    raise exception 'No autenticado';
  end if;

  select w.id into v_workspace_id
  from public.workspaces w
  join public.workspace_members wm on wm.workspace_id = w.id
  where wm.user_id = v_user_id and wm.status = 'active'
  order by w.created_at asc
  limit 1;

  if v_workspace_id is null then
    insert into public.workspaces (name, type, owner_user_id)
    values ('Mis Finanzas', 'personal', v_user_id)
    returning id into v_workspace_id;

    insert into public.workspace_members (workspace_id, user_id, role, status)
    values (v_workspace_id, v_user_id, 'owner', 'active')
    on conflict (workspace_id, user_id) do nothing;
  end if;

  if not exists (select 1 from public.accounts where workspace_id = v_workspace_id) then
    insert into public.accounts (workspace_id, name, type, currency, opening_balance, opening_balance_date, opening_balance_at)
    values (v_workspace_id, 'Cuenta principal', 'liquida', 'MXN', 0, current_date, now());
  end if;

  perform private.seed_default_categories(v_workspace_id);

  insert into public.budgets (workspace_id, month, total_limit, alert_threshold_percent, min_cushion_amount, min_cushion_percent)
  values (v_workspace_id, date_trunc('month', current_date)::date, 0, 80, 0, 10)
  on conflict (workspace_id, month) do nothing;

  return v_workspace_id;
end;
$$;

revoke execute on function public.ensure_user_workspace() from public, anon;
grant execute on function public.ensure_user_workspace() to authenticated;
