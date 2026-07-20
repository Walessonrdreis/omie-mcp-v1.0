import { z } from "zod";

export const listarPedidosSepararEstoqueParamSchema = z.object({
  pagina: z.number().optional().describe("Página da listagem de pedidos (padrão 1)."),
  registros_por_pagina: z
    .number()
    .optional()
    .describe(
      "Pedidos por página (padrão 20 — cada pedido tem um payload pesado, com todos os campos " +
        "fiscais; evite valores altos)."
    ),
  incluir_cancelados: z
    .boolean()
    .optional()
    .describe(
      "Se true, inclui também os pedidos cancelados (por padrão são removidos — a Omie não " +
        "reseta a etapa de um pedido quando ele é cancelado, então sem esse filtro apareceriam " +
        "pedidos cancelados como se ainda precisassem ser separados)."
    ),
});

export type ListarPedidosSepararEstoqueParam = z.infer<typeof listarPedidosSepararEstoqueParamSchema>;
