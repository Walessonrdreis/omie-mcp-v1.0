#!/usr/bin/env node
/**
 * Gera docs/FERRAMENTAS.md a partir do registro real de ferramentas
 * (`src/tools/registry.ts` + `src/tools/generic.ts`), lendo nome, descrição,
 * schema de parâmetros (zod → JSON Schema) e a flag `destructive` direto do
 * código — evita a doc dessincronizar do que o servidor realmente expõe.
 *
 * Uso: npm run doc-ferramentas
 */
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { writeFileSync } from "node:fs";
import { genericToolDefinition } from "../dist/tools/generic.js";
import { ordemProducaoModuleTools } from "../dist/modules/ordemProducao/index.js";
import { produtosModuleTools } from "../dist/modules/produtos/index.js";
import { estoqueModuleTools } from "../dist/modules/estoque/index.js";
import { pedidoVendaModuleTools } from "../dist/modules/pedidoVenda/index.js";
import { clientesFornecedoresModuleTools } from "../dist/modules/clientesFornecedores/index.js";
import { contasCorrentesModuleTools } from "../dist/modules/contasCorrentes/index.js";
import { fluxoCaixaModuleTools } from "../dist/modules/fluxoCaixa/index.js";
import { estruturaModuleTools } from "../dist/modules/estrutura/index.js";
import { nfeModuleTools } from "../dist/modules/nfe/index.js";
import { comprasModuleTools } from "../dist/modules/compras/index.js";
import { pixModuleTools } from "../dist/modules/pix/index.js";
import { orcamentoCaixaModuleTools } from "../dist/modules/orcamentoCaixa/index.js";
import { servicosModuleTools } from "../dist/modules/servicos/index.js";
import { crmModuleTools } from "../dist/modules/crm/index.js";
import { cadastrosAuxiliaresModuleTools } from "../dist/modules/cadastrosAuxiliares/index.js";
import { categoriasDepartamentosModuleTools } from "../dist/modules/categoriasDepartamentos/index.js";
import { caracteristicasProdutoModuleTools } from "../dist/modules/caracteristicasProduto/index.js";
import { notaEntradaModuleTools } from "../dist/modules/notaEntrada/index.js";
import { contasPagarModuleTools } from "../dist/modules/contasPagar/index.js";
import { contasReceberModuleTools } from "../dist/modules/contasReceber/index.js";

// Mesma ordem/agrupamento do README.md — grupo real por módulo (não adivinhado a
// partir do nome da tool, que às vezes engana: ex. `omie_fornecedores_listar` é do
// módulo clientesFornecedores, `omie_familias_listar` é do módulo produtos).
const grupos = [
  ["Ordem de Produção", ordemProducaoModuleTools],
  ["Produtos", produtosModuleTools],
  ["Estoque", estoqueModuleTools],
  ["Pedido de Venda", pedidoVendaModuleTools],
  ["Clientes e Fornecedores", clientesFornecedoresModuleTools],
  ["Contas Correntes", contasCorrentesModuleTools],
  ["Fluxo de Caixa", fluxoCaixaModuleTools],
  ["Estrutura de Produtos", estruturaModuleTools],
  ["Notas Fiscais (NF-e)", nfeModuleTools],
  ["Compras", comprasModuleTools],
  ["PIX", pixModuleTools],
  ["Orçamento de Caixa", orcamentoCaixaModuleTools],
  ["Serviços", servicosModuleTools],
  ["CRM", crmModuleTools],
  ["Cadastros Auxiliares", cadastrosAuxiliaresModuleTools],
  ["Categorias e Departamentos", categoriasDepartamentosModuleTools],
  ["Características de Produto", caracteristicasProdutoModuleTools],
  ["Nota de Entrada", notaEntradaModuleTools],
  ["Contas a Pagar", contasPagarModuleTools],
  ["Contas a Receber", contasReceberModuleTools],
];

function schemaDaFerramenta(tool) {
  if (tool.name === genericToolDefinition.name) {
    return zodToJsonSchema(z.object(genericToolDefinition.inputSchema), tool.name);
  }
  return zodToJsonSchema(z.object({ param: tool.inputSchema.param }), tool.name);
}

function resolveRef(schema, node) {
  if (node && node.$ref) {
    const nomeDef = node.$ref.replace("#/definitions/", "");
    return schema.definitions?.[nomeDef] ?? node;
  }
  return node;
}

function linhaCampo(nome, def, obrig, prefixo) {
  const tipo = def.type ?? (def.anyOf ? "misto" : def.allOf ? "objeto" : "objeto");
  const desc = def.description ? ` — ${def.description}` : "";
  return `${prefixo}- \`${nome}\` (${tipo}, ${obrig})${desc}`;
}

function paramsResumo(schema) {
  const defs = schema.definitions ?? {};
  const raiz = Object.values(defs)[0] ?? schema;
  const props = raiz.properties ?? {};
  const required = new Set(raiz.required ?? []);

  // Ferramentas seguem o formato { param: <schema real> } — descer um nível
  // pra mostrar os campos de verdade, não só "param (object)".
  const paramDef = resolveRef(schema, props.param);
  const isGenerica = !props.param; // omie_chamar_api tem shape próprio (resource/call/param)

  const linhas = [];
  const entradas = isGenerica ? Object.entries(props) : Object.entries(paramDef?.properties ?? {});
  const requiredSet = isGenerica ? required : new Set(paramDef?.required ?? []);

  if (!isGenerica && !paramDef?.properties) {
    // Passthrough simples: schema genérico (z.record(unknown())), sem campos fixos —
    // a Omie decide os campos, ver documentação oficial do método.
    linhas.push(
      "  - `param` (objeto livre, **obrigatório**) — campos conforme documentação oficial da Omie " +
        "para este método (não tipado no MCP; a ferramenta repassa o objeto direto)."
    );
    return linhas.join("\n");
  }

  for (const [nome, def] of entradas) {
    const resolved = resolveRef(schema, def);
    const obrig = requiredSet.has(nome) ? "**obrigatório**" : "opcional";
    linhas.push(linhaCampo(nome, resolved, obrig, "  "));
  }
  return linhas.length ? linhas.join("\n") : "  - _(sem parâmetros documentados no schema)_";
}

const linhas = [];
linhas.push("# Ferramentas disponíveis — referência técnica");
linhas.push("");
linhas.push(
  "> Gerado automaticamente a partir do registro real de ferramentas " +
    "(`src/tools/registry.ts`, `src/tools/generic.ts`) via `npm run doc-ferramentas`. " +
    "Não editar à mão — description/parâmetros/`destructive` vêm direto do código, " +
    "então rodar o script de novo após mudar uma tool mantém isso sincronizado. " +
    "Para o que cada ferramenta *faz* em linguagem de negócio, ver `FUNCIONALIDADES.md`; " +
    "para arquitetura/limitações de cada módulo, ver `README.md`."
);
linhas.push("");
linhas.push(
  "**Como chamar:** via MCP (protocolo padrão) ou via API HTTP local " +
    "(`src/httpServer.ts`, ver `docs/SEGURANCA.md`) — `POST /tools/<nome>` com o payload " +
    "abaixo no corpo JSON (sem o wrapper `param`, é liso: `{campo: valor, ...}`). " +
    "Ferramentas marcadas **⚠️ destrutiva** exigem `\"confirmar\": true` no payload " +
    "quando chamadas pela API HTTP."
);
linhas.push("");

const gruposCompletos = [
  ["Genérica", [{ ...genericToolDefinition, destructive: false, __generic: true }]],
  ...grupos,
];
const totalTools =
  1 + grupos.reduce((soma, [, tools]) => soma + tools.length, 0);

linhas.push("## Índice");
linhas.push("");
for (const [mod] of gruposCompletos) {
  const slug = mod
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  linhas.push(`- [${mod}](#${slug})`);
}
linhas.push("");

let totalDestrutivas = 0;
for (const [mod, tools] of gruposCompletos) {
  linhas.push(`## ${mod}`);
  linhas.push("");
  for (const tool of tools) {
    const destrutiva = tool.destructive === true;
    if (destrutiva) totalDestrutivas += 1;
    const tag = destrutiva ? " ⚠️ **destrutiva**" : "";
    linhas.push(`### \`${tool.name}\`${tag}`);
    linhas.push("");
    linhas.push(tool.description);
    linhas.push("");
    linhas.push("**Parâmetros:**");
    linhas.push("");
    linhas.push(paramsResumo(schemaDaFerramenta(tool)));
    linhas.push("");
    if (!tool.__generic) {
      linhas.push(
        `**Tipo:** ${tool.execute ? "use-case (lógica própria, pode combinar mais de uma chamada Omie)" : `passthrough (\`${tool.resource}\` → \`${tool.call}\`)`}`
      );
      linhas.push("");
    }
  }
}

linhas.push("---");
linhas.push("");
linhas.push(
  `**Total:** ${totalTools} ferramentas, sendo ${totalDestrutivas} marcadas como destrutivas ` +
    "(incluem/alteram/excluem dado na Omie) + a ferramenta genérica `omie_chamar_api`, que pode " +
    "chamar qualquer método (incluindo destrutivos — detectados por prefixo do nome do método: " +
    "Incluir/Alterar/Excluir/Cancelar/Deletar, ver `src/httpServer.ts`)."
);
linhas.push("");
linhas.push(
  "## Limitações gerais (valem para todas as ferramentas)"
);
linhas.push("");
linhas.push(
  "- **Rate limit da Omie**: a API tem limite de chamadas por segundo/minuto por App Key — " +
    "ver seção \"Rate limit da Omie\" no `README.md` para o mecanismo de proteção do MCP."
);
linhas.push(
  "- **Rate limit da API HTTP local**: 120 requisições/minuto por processo — ver `docs/SEGURANCA.md`."
);
linhas.push(
  "- **Confirmação obrigatória em destrutivas** (via API HTTP): `\"confirmar\": true` no payload, " +
    "senão `400` — ver `docs/SEGURANCA.md`."
);
linhas.push(
  "- **Campos obrigatórios divergentes da doc pública Omie**: vários módulos descobriram, testando " +
    "ao vivo, campos que a doc da Omie marca como opcionais mas que a API recusa sem eles (ex: " +
    "`codigo_local_estoque` em OP, `intMalha` em Estrutura, `codigo` em Produto). Ver notas de cada " +
    "módulo no `README.md`."
);
linhas.push(
  "- **Nem toda ferramenta tem exclusão real**: Categoria financeira, por exemplo, não tem endpoint " +
    "de exclusão na API Omie — uma vez criada, fica permanentemente ativa."
);
linhas.push(
  "- **Produto com movimentação não pode ser excluído**: qualquer ajuste de estoque, pedido ou nota " +
    "vinculados a um produto bloqueiam a exclusão dele permanentemente, mesmo se o ajuste/pedido " +
    "for excluído depois."
);
linhas.push("");

writeFileSync(new URL("../docs/FERRAMENTAS.md", import.meta.url), linhas.join("\n"));
console.log("docs/FERRAMENTAS.md gerado.");
