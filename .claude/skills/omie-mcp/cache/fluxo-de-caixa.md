# Fluxo de Caixa

Geração de relatório de fluxo de caixa.

### `omie_fluxo_caixa_gerar`

Monta o fluxo de caixa (entradas, saídas e saldo) num formato tabular pronto pra leitura ou exportação futura pra planilha — a Omie NÃO tem esse relatório pronto, só lançamento por lançamento de contas a pagar/receber (financas/mf ListarMovimentos), então esta ferramenta busca todos os lançamentos do período, separa REALIZADO (já pago/recebido, pela data de pagamento) de PREVISTO (contas em aberto ainda não liquidadas, pela data de vencimento, excluindo canceladas) e agrega por dia ou mês E por conta corrente (nome já resolvido). Cada linha do resultado traz: período, conta corrente, entradas/saídas realizadas, saldo do período e acumulado, e o mesmo para o previsto (projeção incluindo o que ainda vai vencer). IMPORTANTE: o saldo acumulado é a variação DENTRO do período pedido, não o saldo bancário real (isso vem explicado no campo avisoSaldo da resposta). Períodos longos geram muitas páginas na Omie e podem demorar — prefira períodos de até ~3 meses por chamada.

**Parâmetros:**

  - `data_inicio` (string, **obrigatório**) — Data inicial do período, formato dd/mm/aaaa.
  - `data_fim` (string, **obrigatório**) — Data final do período, formato dd/mm/aaaa.
  - `agrupamento` (string, opcional) — Granularidade das linhas do fluxo: 'dia' (padrão) ou 'mes'.
  - `incluir_previsto` (boolean, opcional) — Se true (padrão), inclui também o que está previsto (contas a pagar/receber em aberto, ainda não liquidadas) além do que já foi realizado (pago/recebido). Se false, mostra só o realizado.
  - `apenas_favoritas` (boolean, opcional) — Se true (padrão), restringe o fluxo às contas correntes marcadas como favoritas pelo usuário (Cartão NuBank, Stone, Banco do Brasil, Wix, iFood, Sicoob, Itaú, Cartão Elo LEANDRO, Amazon, CAIXA LOJA), ignorando as demais dezenas de contas cadastradas na Omie (cartões antigos, adquirentes específicas, etc.). Se false, considera todas as contas.
  - `codigos_conta_corrente` (array, opcional) — Lista explícita de códigos de conta corrente (nCodCC, via omie_contas_correntes_listar) pra restringir o fluxo — sobrepõe apenas_favoritas quando informado.
  - `usar_saldo_real` (boolean, opcional) — Se true, ancora o saldo acumulado no saldo_inicial/saldo_data cadastrado de cada conta corrente (via omie_contas_correntes_listar) — busca os movimentos realizados entre a saldo_data e o início do período pedido e soma ao saldo_inicial, chegando num valor próximo do saldo bancário real (em vez de só a variação dentro do período). Requer que a conta tenha saldo_data/saldo_inicial configurados na Omie (data anterior ou igual a data_inicio) — contas sem isso configurado ficam com saldoRealAcumulado nulo. Pode ser mais lento (busca movimentos extras desde a saldo_data). Padrão: false.

**Tipo:** use-case (lógica própria)
