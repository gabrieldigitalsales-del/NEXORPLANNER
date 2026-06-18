# NEXOR Planner V12 — CRUD + Base Zerada

## Rodar localmente
```bash
npm install
npm run dev
```

Senha simples local: `asd123`

## Alterações desta versão
- Base inicial zerada, sem clientes, tarefas, eventos, financeiro ou arquivos de exemplo.
- Novo `localStorage` para começar limpo no navegador.
- Botões de adicionar, editar e apagar clientes.
- Botões de editar e apagar tarefas.
- Botões de editar e apagar receitas/gastos.
- Exclusão de cliente remove automaticamente tarefas, eventos, financeiro e arquivos vinculados.
- Modais reutilizados para criar e editar.
- Campos de edição já abrem preenchidos.
- Mantida preparação para Supabase/Vercel.

## Reset operacional no Supabase
Use no SQL Editor para zerar dados do planner sem mexer em outros projetos:

```sql
truncate table public.nexor_planner_files restart identity cascade;
truncate table public.nexor_planner_finances restart identity cascade;
truncate table public.nexor_planner_events restart identity cascade;
truncate table public.nexor_planner_tasks restart identity cascade;
truncate table public.nexor_planner_clients restart identity cascade;
```

Se quiser zerar também configurações e perfis:

```sql
truncate table public.nexor_planner_files restart identity cascade;
truncate table public.nexor_planner_finances restart identity cascade;
truncate table public.nexor_planner_events restart identity cascade;
truncate table public.nexor_planner_tasks restart identity cascade;
truncate table public.nexor_planner_clients restart identity cascade;
truncate table public.nexor_planner_settings restart identity cascade;
truncate table public.nexor_planner_profiles restart identity cascade;
```

Arquivos físicos do Supabase Storage devem ser removidos pela tela Storage ou pela Storage API.
