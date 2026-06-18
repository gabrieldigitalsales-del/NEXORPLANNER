-- ============================================================
-- NEXOR PLANNER - SQL ÚNICO SUPABASE
-- Seguro para rodar sem conflito com outros projetos.
-- Todas as tabelas, funções, triggers, policies e bucket usam prefixo nexor_planner_ / np_
-- ============================================================

create extension if not exists pgcrypto;

-- -----------------------------
-- Helpers
-- -----------------------------
create or replace function public.np_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- -----------------------------
-- Perfil do usuário/agência
-- -----------------------------
create table if not exists public.nexor_planner_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  company_name text default 'NEXOR',
  owner_name text,
  logo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- -----------------------------
-- Clientes
-- -----------------------------
create table if not exists public.nexor_planner_clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  contact text,
  phone text,
  email text,
  instagram text,
  service text,
  monthly numeric(12,2) not null default 0,
  due_day int check (due_day between 1 and 31),
  status text not null default 'Ativo',
  color text default '#a38955',
  notes text,
  briefing text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- -----------------------------
-- Tarefas
-- -----------------------------
create table if not exists public.nexor_planner_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid references public.nexor_planner_clients(id) on delete set null,
  title text not null,
  description text,
  type text default 'Outro',
  status text not null default 'A Fazer',
  due date,
  priority text default 'Baixa',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- -----------------------------
-- Agenda / Eventos
-- -----------------------------
create table if not exists public.nexor_planner_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid references public.nexor_planner_clients(id) on delete set null,
  title text not null,
  event_date date not null,
  event_time time,
  type text default 'Evento',
  priority text default 'Média',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- -----------------------------
-- Financeiro
-- -----------------------------
create table if not exists public.nexor_planner_finances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid references public.nexor_planner_clients(id) on delete set null,
  type text not null check (type in ('Receita','Gasto')),
  title text not null,
  amount numeric(12,2) not null default 0,
  due date,
  status text not null default 'Pendente',
  category text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- -----------------------------
-- Documentos / arquivos burocráticos
-- Guarda metadados; o arquivo físico vai no Supabase Storage bucket nexor_planner_files.
-- -----------------------------
create table if not exists public.nexor_planner_files (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid references public.nexor_planner_clients(id) on delete cascade,
  name text not null,
  file_path text not null,
  mime_type text,
  size_bytes bigint default 0,
  category text default 'Documento',
  created_at timestamptz not null default now()
);

-- -----------------------------
-- Configurações e mensagens padrão
-- -----------------------------
create table if not exists public.nexor_planner_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  key text not null,
  value jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, key)
);

-- -----------------------------
-- Índices
-- -----------------------------
create index if not exists idx_np_clients_user on public.nexor_planner_clients(user_id);
create index if not exists idx_np_tasks_user_due on public.nexor_planner_tasks(user_id, due);
create index if not exists idx_np_tasks_client on public.nexor_planner_tasks(client_id);
create index if not exists idx_np_events_user_date on public.nexor_planner_events(user_id, event_date);
create index if not exists idx_np_finances_user_due on public.nexor_planner_finances(user_id, due);
create index if not exists idx_np_finances_client on public.nexor_planner_finances(client_id);
create index if not exists idx_np_files_client on public.nexor_planner_files(client_id);

-- -----------------------------
-- Triggers updated_at
-- -----------------------------
drop trigger if exists trg_np_profiles_updated_at on public.nexor_planner_profiles;
create trigger trg_np_profiles_updated_at before update on public.nexor_planner_profiles for each row execute function public.np_set_updated_at();

drop trigger if exists trg_np_clients_updated_at on public.nexor_planner_clients;
create trigger trg_np_clients_updated_at before update on public.nexor_planner_clients for each row execute function public.np_set_updated_at();

drop trigger if exists trg_np_tasks_updated_at on public.nexor_planner_tasks;
create trigger trg_np_tasks_updated_at before update on public.nexor_planner_tasks for each row execute function public.np_set_updated_at();

drop trigger if exists trg_np_events_updated_at on public.nexor_planner_events;
create trigger trg_np_events_updated_at before update on public.nexor_planner_events for each row execute function public.np_set_updated_at();

drop trigger if exists trg_np_finances_updated_at on public.nexor_planner_finances;
create trigger trg_np_finances_updated_at before update on public.nexor_planner_finances for each row execute function public.np_set_updated_at();

drop trigger if exists trg_np_settings_updated_at on public.nexor_planner_settings;
create trigger trg_np_settings_updated_at before update on public.nexor_planner_settings for each row execute function public.np_set_updated_at();

-- -----------------------------
-- Row Level Security
-- -----------------------------
alter table public.nexor_planner_profiles enable row level security;
alter table public.nexor_planner_clients enable row level security;
alter table public.nexor_planner_tasks enable row level security;
alter table public.nexor_planner_events enable row level security;
alter table public.nexor_planner_finances enable row level security;
alter table public.nexor_planner_files enable row level security;
alter table public.nexor_planner_settings enable row level security;

-- Policies idempotentes: removem apenas policies com prefixo np_ nestas tabelas.
drop policy if exists np_profiles_select_own on public.nexor_planner_profiles;
drop policy if exists np_profiles_insert_own on public.nexor_planner_profiles;
drop policy if exists np_profiles_update_own on public.nexor_planner_profiles;
create policy np_profiles_select_own on public.nexor_planner_profiles for select using (auth.uid() = id);
create policy np_profiles_insert_own on public.nexor_planner_profiles for insert with check (auth.uid() = id);
create policy np_profiles_update_own on public.nexor_planner_profiles for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists np_clients_all_own on public.nexor_planner_clients;
create policy np_clients_all_own on public.nexor_planner_clients for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists np_tasks_all_own on public.nexor_planner_tasks;
create policy np_tasks_all_own on public.nexor_planner_tasks for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists np_events_all_own on public.nexor_planner_events;
create policy np_events_all_own on public.nexor_planner_events for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists np_finances_all_own on public.nexor_planner_finances;
create policy np_finances_all_own on public.nexor_planner_finances for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists np_files_all_own on public.nexor_planner_files;
create policy np_files_all_own on public.nexor_planner_files for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists np_settings_all_own on public.nexor_planner_settings;
create policy np_settings_all_own on public.nexor_planner_settings for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- -----------------------------
-- Supabase Storage bucket para documentos
-- -----------------------------
insert into storage.buckets (id, name, public)
values ('nexor_planner_files', 'nexor_planner_files', false)
on conflict (id) do nothing;

-- Policies do Storage. Path recomendado: user_id/client_id/nome-do-arquivo.pdf
-- Exemplo: <auth.uid()>/<client_id>/contrato.pdf

drop policy if exists np_storage_select_own on storage.objects;
drop policy if exists np_storage_insert_own on storage.objects;
drop policy if exists np_storage_update_own on storage.objects;
drop policy if exists np_storage_delete_own on storage.objects;

create policy np_storage_select_own on storage.objects
for select using (
  bucket_id = 'nexor_planner_files'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy np_storage_insert_own on storage.objects
for insert with check (
  bucket_id = 'nexor_planner_files'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy np_storage_update_own on storage.objects
for update using (
  bucket_id = 'nexor_planner_files'
  and auth.uid()::text = (storage.foldername(name))[1]
) with check (
  bucket_id = 'nexor_planner_files'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy np_storage_delete_own on storage.objects
for delete using (
  bucket_id = 'nexor_planner_files'
  and auth.uid()::text = (storage.foldername(name))[1]
);
