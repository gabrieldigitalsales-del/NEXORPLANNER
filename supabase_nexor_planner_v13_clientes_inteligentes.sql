-- ============================================================
-- NEXOR PLANNER V13 - Campos inteligentes de cliente
-- Rode este SQL se você já criou as tabelas do planner antes.
-- Ele só adiciona colunas que ainda não existem.
-- Não conflita com outros projetos porque altera apenas nexor_planner_clients.
-- ============================================================

alter table public.nexor_planner_clients
  add column if not exists contract_type text not null default 'recorrente',
  add column if not exists billing_frequency text not null default 'mensal',
  add column if not exists start_date date,
  add column if not exists contract_duration text default '12',
  add column if not exists custom_end_date date,
  add column if not exists end_date date,
  add column if not exists auto_billing boolean not null default true;

-- Restrições opcionais de segurança dos valores.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'np_clients_contract_type_check'
  ) then
    alter table public.nexor_planner_clients
      add constraint np_clients_contract_type_check
      check (contract_type in ('recorrente','unico'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'np_clients_billing_frequency_check'
  ) then
    alter table public.nexor_planner_clients
      add constraint np_clients_billing_frequency_check
      check (billing_frequency in ('unico','semanal','quinzenal','mensal','trimestral','semestral','anual'));
  end if;
end $$;

-- ============================================================
-- FIM
-- ============================================================
