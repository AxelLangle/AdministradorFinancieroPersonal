-- Migración inicial: Administrador Financiero Personal (PRD v1.1.2)
-- Proyecto Supabase: beqpktixfijdzjdtrxsz

create schema if not exists private;

-- 1. users table
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  name text not null default '',
  timezone text not null default 'America/Mexico_City',
  currency text not null default 'MXN',
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now()
);

-- 2. workspaces table
create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null default 'personal' check (type in ('personal', 'shared')),
  owner_user_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- 3. workspace_members table
create table public.workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  role text not null default 'owner' check (role in ('owner', 'editor', 'viewer')),
  status text not null default 'active' check (status in ('active', 'invited', 'removed')),
  created_at timestamptz not null default now(),
  unique (workspace_id, user_id)
);

-- 4. accounts table
create table public.accounts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null default 'Cuenta principal',
  type text not null default 'liquida',
  currency text not null default 'MXN',
  opening_balance numeric(14,2) not null default 0,
  opening_balance_date date not null default current_date,
  opening_balance_at timestamptz not null default now(),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 5. categories table
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  kind text not null default 'expense' check (kind in ('expense', 'income', 'both')),
  default_priority text not null default 'essential' check (default_priority in ('essential', 'important', 'flexible')),
  icon text not null default 'receipt_long',
  color_token text not null default 'forest',
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- 6. recurrence_rules table
create table public.recurrence_rules (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  account_id uuid not null references public.accounts(id) on delete cascade,
  type text not null check (type in ('income', 'expense')),
  title text not null,
  category_id uuid references public.categories(id) on delete set null,
  priority text not null default 'essential' check (priority in ('essential', 'important', 'flexible')),
  amount_type text not null default 'fixed' check (amount_type in ('fixed', 'variable')),
  default_amount numeric(14,2),
  frequency text not null check (frequency in ('weekly', 'biweekly', 'semimonthly', 'monthly', 'bimonthly', 'quarterly', 'semiannual', 'annual')),
  interval_count integer not null default 1,
  day_of_month integer,
  semimonthly_days text default '15,last',
  day_of_week integer,
  start_date date not null,
  end_date date,
  status text not null default 'active' check (status in ('active', 'paused')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 7. transactions table
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  account_id uuid not null references public.accounts(id) on delete cascade,
  type text not null check (type in ('income', 'expense')),
  title text not null,
  category_id uuid references public.categories(id) on delete set null,
  priority text not null default 'essential' check (priority in ('essential', 'important', 'flexible')) ,
  status text not null check (status in ('pending', 'paid', 'overdue', 'cancelled', 'scheduled', 'received')),
  amount_type text not null default 'fixed' check (amount_type in ('fixed', 'variable')),
  estimated_amount numeric(14,2),
  actual_amount numeric(14,2),
  expected_date date not null,
  settled_date date,
  settled_at timestamptz,
  recurrence_rule_id uuid references public.recurrence_rules(id) on delete set null,
  occurrence_date date,
  is_exception boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (recurrence_rule_id, occurrence_date)
);

-- 8. budgets table
create table public.budgets (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  month date not null,
  total_limit numeric(14,2) not null default 0,
  alert_threshold_percent numeric(5,2) not null default 80,
  min_cushion_amount numeric(14,2),
  min_cushion_percent numeric(5,2) not null default 10,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, month)
);

-- 9. notifications table
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  type text not null check (type in ('upcoming_due', 'overdue', 'delayed_income', 'budget_threshold', 'low_projected_balance')),
  title text not null,
  body text not null,
  related_transaction_id uuid references public.transactions(id) on delete set null,
  scheduled_for timestamptz not null default now(),
  read_at timestamptz,
  created_at timestamptz not null default now()
);

-- 10. audit_log table
create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  entity_type text not null,
  entity_id uuid not null,
  field_changed text not null,
  old_value text,
  new_value text,
  changed_by uuid references public.users(id) on delete set null,
  changed_at timestamptz not null default now()
);

-- Foreign Key & Query Performance Indexes
create index idx_workspaces_owner_user_id on public.workspaces(owner_user_id);
create index idx_workspace_members_workspace_id on public.workspace_members(workspace_id);
create index idx_workspace_members_user_id on public.workspace_members(user_id);
create index idx_accounts_workspace_id on public.accounts(workspace_id);
create index idx_categories_workspace_id on public.categories(workspace_id);
create index idx_recurrence_rules_workspace_id on public.recurrence_rules(workspace_id);
create index idx_recurrence_rules_account_id on public.recurrence_rules(account_id);
create index idx_recurrence_rules_category_id on public.recurrence_rules(category_id);
create index idx_transactions_workspace_id on public.transactions(workspace_id);
create index idx_transactions_account_id on public.transactions(account_id);
create index idx_transactions_category_id on public.transactions(category_id);
create index idx_transactions_recurrence_rule_id on public.transactions(recurrence_rule_id);
create index idx_transactions_workspace_expected_date on public.transactions(workspace_id, expected_date);
create index idx_transactions_workspace_status on public.transactions(workspace_id, status);
create index idx_budgets_workspace_id on public.budgets(workspace_id);
create index idx_notifications_workspace_id on public.notifications(workspace_id);
create index idx_notifications_user_id on public.notifications(user_id);
create index idx_notifications_related_tx_id on public.notifications(related_transaction_id);
create index idx_audit_log_workspace_id on public.audit_log(workspace_id);
create index idx_audit_log_entity_id on public.audit_log(entity_id);
create index idx_audit_log_changed_by on public.audit_log(changed_by);

-- Security Definer Helper Function for Workspace Membership
create or replace function private.is_workspace_member(target_workspace_id uuid)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = target_workspace_id
      and wm.user_id = (select auth.uid())
      and wm.status = 'active'
  );
$$;

revoke execute on function private.is_workspace_member(uuid) from public, anon;
grant execute on function private.is_workspace_member(uuid) to authenticated;

-- Enable Row Level Security on all tables
alter table public.users enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.accounts enable row level security;
alter table public.categories enable row level security;
alter table public.recurrence_rules enable row level security;
alter table public.transactions enable row level security;
alter table public.budgets enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_log enable row level security;

-- RLS Policies
create policy "Users can view own profile"
  on public.users for select to authenticated using ((select auth.uid()) = id);
create policy "Users can insert own profile"
  on public.users for insert to authenticated with check ((select auth.uid()) = id);
create policy "Users can update own profile"
  on public.users for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create policy "Members can view workspaces"
  on public.workspaces for select to authenticated using (owner_user_id = (select auth.uid()) or (select private.is_workspace_member(id)));
create policy "Users can create own workspaces"
  on public.workspaces for insert to authenticated with check (owner_user_id = (select auth.uid()));
create policy "Owners can update workspaces"
  on public.workspaces for update to authenticated using (owner_user_id = (select auth.uid())) with check (owner_user_id = (select auth.uid()));
create policy "Owners can delete workspaces"
  on public.workspaces for delete to authenticated using (owner_user_id = (select auth.uid()));

create policy "Members can view workspace memberships"
  on public.workspace_members for select to authenticated using (user_id = (select auth.uid()) or (select private.is_workspace_member(workspace_id)));
create policy "Users can insert own membership"
  on public.workspace_members for insert to authenticated with check (user_id = (select auth.uid()) or (select private.is_workspace_member(workspace_id)));
create policy "Members can update memberships"
  on public.workspace_members for update to authenticated using ((select private.is_workspace_member(workspace_id))) with check ((select private.is_workspace_member(workspace_id)));

create policy "Workspace members can manage accounts"
  on public.accounts for all to authenticated using ((select private.is_workspace_member(workspace_id))) with check ((select private.is_workspace_member(workspace_id)));
create policy "Workspace members can manage categories"
  on public.categories for all to authenticated using ((select private.is_workspace_member(workspace_id))) with check ((select private.is_workspace_member(workspace_id)));
create policy "Workspace members can manage recurrence_rules"
  on public.recurrence_rules for all to authenticated using ((select private.is_workspace_member(workspace_id))) with check ((select private.is_workspace_member(workspace_id)));
create policy "Workspace members can manage transactions"
  on public.transactions for all to authenticated using ((select private.is_workspace_member(workspace_id))) with check ((select private.is_workspace_member(workspace_id)));
create policy "Workspace members can manage budgets"
  on public.budgets for all to authenticated using ((select private.is_workspace_member(workspace_id))) with check ((select private.is_workspace_member(workspace_id)));
create policy "Workspace members can manage notifications"
  on public.notifications for all to authenticated using ((select private.is_workspace_member(workspace_id))) with check ((select private.is_workspace_member(workspace_id)));
create policy "Workspace members can view and insert audit_log"
  on public.audit_log for all to authenticated using ((select private.is_workspace_member(workspace_id))) with check ((select private.is_workspace_member(workspace_id)));

-- Trigger function to automatically log changes to transactions into audit_log
create or replace function private.log_transaction_changes()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.estimated_amount is distinct from new.estimated_amount then
    insert into public.audit_log (workspace_id, entity_type, entity_id, field_changed, old_value, new_value, changed_by)
    values (new.workspace_id, 'transaction', new.id, 'estimated_amount', old.estimated_amount::text, new.estimated_amount::text, (select auth.uid()));
  end if;
  if old.actual_amount is distinct from new.actual_amount then
    insert into public.audit_log (workspace_id, entity_type, entity_id, field_changed, old_value, new_value, changed_by)
    values (new.workspace_id, 'transaction', new.id, 'actual_amount', old.actual_amount::text, new.actual_amount::text, (select auth.uid()));
  end if;
  if old.expected_date is distinct from new.expected_date then
    insert into public.audit_log (workspace_id, entity_type, entity_id, field_changed, old_value, new_value, changed_by)
    values (new.workspace_id, 'transaction', new.id, 'expected_date', old.expected_date::text, new.expected_date::text, (select auth.uid()));
  end if;
  if old.settled_date is distinct from new.settled_date then
    insert into public.audit_log (workspace_id, entity_type, entity_id, field_changed, old_value, new_value, changed_by)
    values (new.workspace_id, 'transaction', new.id, 'settled_date', old.settled_date::text, new.settled_date::text, (select auth.uid()));
  end if;
  if old.status is distinct from new.status then
    insert into public.audit_log (workspace_id, entity_type, entity_id, field_changed, old_value, new_value, changed_by)
    values (new.workspace_id, 'transaction', new.id, 'status', old.status, new.status, (select auth.uid()));
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create trigger trg_transactions_audit
  before update on public.transactions
  for each row
  execute function private.log_transaction_changes();

-- Trigger function to provision personal workspace & default account on user signup
create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_workspace_id uuid;
begin
  insert into public.users (id, email, name)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(coalesce(new.email, 'Usuario'), '@', 1))
  );

  insert into public.workspaces (name, type, owner_user_id)
  values ('Mis Finanzas', 'personal', new.id)
  returning id into new_workspace_id;

  insert into public.workspace_members (workspace_id, user_id, role, status)
  values (new_workspace_id, new.id, 'owner', 'active');

  insert into public.accounts (workspace_id, name, type, currency, opening_balance, opening_balance_date, opening_balance_at)
  values (new_workspace_id, 'Cuenta principal', 'liquida', 'MXN', 0, current_date, now());

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function private.handle_new_user();
