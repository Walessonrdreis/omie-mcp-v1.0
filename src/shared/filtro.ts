import { z } from "zod";

/**
 * Filtro genérico aplicado client-side sobre um resultado JÁ enriquecido
 * (depois de resolver nome de cliente/produto etc.) — complementa os filtros
 * nativos da Omie, que só existem pra alguns campos crus de cada endpoint.
 * Serve pra "filtrar por qualquer campo do retorno", mesmo os que a Omie não
 * tem filtro nativo (ex: nome do cliente já resolvido, valor total calculado).
 */
export const criterioFiltroSchema = z.object({
  campo: z
    .string()
    .describe(
      "Caminho do campo no item do resultado (dot-path pra campos aninhados), ex: " +
        "'descricaoProduto' ou 'total_pedido.valor_total_pedido'."
    ),
  operador: z.enum(["igual", "diferente", "contem", "maior_que", "menor_que", "entre"]),
  valor: z
    .union([z.string(), z.number(), z.boolean(), z.tuple([z.number(), z.number()]), z.tuple([z.string(), z.string()])])
    .describe("Para 'entre', envie uma tupla [min, max]. Para 'contem', a comparação ignora maiúsculas/acentos."),
});

export type CriterioFiltro = z.infer<typeof criterioFiltroSchema>;

export const filtrosParamSchema = z
  .array(criterioFiltroSchema)
  .optional()
  .describe(
    "Filtros adicionais sobre o resultado já enriquecido desta ferramenta (qualquer campo do " +
      "retorno, não só os filtros nativos da Omie). Todos os critérios precisam bater (AND). " +
      "Ex: [{ campo: 'descricaoProduto', operador: 'contem', valor: 'kg' }]."
  );

function obterValorPorCaminho(item: unknown, caminho: string): unknown {
  return caminho.split(".").reduce<unknown>((atual, chave) => {
    if (atual && typeof atual === "object") {
      return (atual as Record<string, unknown>)[chave];
    }
    return undefined;
  }, item);
}

function normalizarTexto(valor: unknown): string {
  return String(valor ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

function bateCriterio(item: unknown, criterio: CriterioFiltro): boolean {
  const valorCampo = obterValorPorCaminho(item, criterio.campo);

  switch (criterio.operador) {
    case "igual":
      return valorCampo === criterio.valor;
    case "diferente":
      return valorCampo !== criterio.valor;
    case "contem":
      return normalizarTexto(valorCampo).includes(normalizarTexto(criterio.valor));
    case "maior_que":
      return Number(valorCampo) > Number(criterio.valor);
    case "menor_que":
      return Number(valorCampo) < Number(criterio.valor);
    case "entre": {
      const [minimo, maximo] = criterio.valor as [number, number];
      const numero = Number(valorCampo);
      return numero >= Number(minimo) && numero <= Number(maximo);
    }
    default:
      return true;
  }
}

/** Aplica todos os critérios (AND) sobre a lista; sem critérios, devolve a lista intacta. */
export function aplicarFiltros<T>(itens: T[], criterios?: CriterioFiltro[]): T[] {
  if (!criterios || criterios.length === 0) return itens;
  return itens.filter((item) => criterios.every((criterio) => bateCriterio(item, criterio)));
}
