/**
 * Contas correntes definidas pelo usuário como "favoritas" para
 * acompanhamento de fluxo de caixa (as demais ~39 contas cadastradas na
 * Omie — cartões antigos, adquirentes específicas, etc. — não entram nesse
 * recorte por padrão). Códigos obtidos via omie_contas_correntes_listar.
 *
 * Nota: existem dois cadastros ativos de "iFood" na Omie (9394637695 e
 * 9544495969) — ambos foram incluídos aqui pra não perder movimentação;
 * revisar com o usuário se um deles for duplicado.
 */
export const CONTAS_FAVORITAS: { nCodCC: number; descricao: string }[] = [
  { nCodCC: 9183200875, descricao: "Cartão NuBank" },
  { nCodCC: 9181761228, descricao: "Stone" },
  { nCodCC: 9184282378, descricao: "Banco do Brasil" },
  { nCodCC: 9309456900, descricao: "Wix - Pagar.me" },
  { nCodCC: 9394637695, descricao: "iFood" },
  { nCodCC: 9544495969, descricao: "iFood" },
  { nCodCC: 9460845242, descricao: "Sicoob" },
  { nCodCC: 9522506653, descricao: "Itaú Unibanco" },
  { nCodCC: 9181564142, descricao: "Cartão Elo LEANDRO 9868" },
  { nCodCC: 9426300100, descricao: "Amazon" },
  { nCodCC: 9084171533, descricao: "CAIXA LOJA" },
];

export const CODIGOS_CONTAS_FAVORITAS: number[] = CONTAS_FAVORITAS.map((c) => c.nCodCC);
