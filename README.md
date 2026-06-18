# NEXOR Planner V10

Versão com financeiro usando seletor de mês nativo, responsividade, notificações por prioridade e preparação para Supabase/Vercel.

## Rodar local

```bash
npm install
npm run dev
```

## Financeiro

No topo da página Financeiro, o campo de mês agora é um seletor de data do tipo `month`. Ao clicar na caixa, o navegador abre o seletor de mês/ano. Os cards e lançamentos são filtrados pelo mês selecionado.

## Supabase

1. Crie um projeto no Supabase.
2. Vá em SQL Editor.
3. Cole e execute o arquivo `supabase_nexor_planner.sql`.
4. Copie `.env.example` para `.env.local`.
5. Preencha:

```env
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=SUA_CHAVE_ANON_PUBLICA
```

O SQL usa prefixo `nexor_planner_` e `np_` em tabelas, policies, triggers e função para evitar conflito com outros projetos.

## Vercel

1. Suba o projeto para o GitHub.
2. Importe na Vercel.
3. Configure as mesmas variáveis de ambiente do `.env.example`.
4. Build command: `npm run build`.
5. Output directory: `dist`.

O arquivo `vercel.json` já está incluído para rotas SPA.
