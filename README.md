# NEXOR Planner V13 — Cliente Inteligente

Senha simples local: `asd123`

## Rodar localmente
```bash
npm install
npm run dev
```

## O que mudou nesta versão
- Modal de cliente redesenhado e mais inteligente.
- Campos de contrato e recorrência:
  - tipo de contrato: recorrente ou serviço único;
  - frequência: serviço único, semanal, quinzenal, mensal, trimestral, semestral ou anual;
  - data de início;
  - tempo de contrato: sem prazo, 1, 3, 6, 12, 24 meses ou data final personalizada;
  - data final calculada automaticamente;
  - dia de vencimento;
  - resumo automático do contrato antes de salvar.
- Página individual do cliente exibe frequência, início, fim e duração do contrato.
- Cards de cliente exibem frequência e contrato.
- CSS ajustado para modal maior, seções internas e responsividade.

## Supabase
Se estiver criando o banco do zero, use:
`supabase_nexor_planner.sql`

Se o banco já existir, rode apenas:
`supabase_nexor_planner_v13_clientes_inteligentes.sql`
