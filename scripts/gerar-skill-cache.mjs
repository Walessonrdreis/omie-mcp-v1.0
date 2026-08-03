#!/usr/bin/env node
/**
 * Gera o cache da skill `omie-mcp` (.claude/skills/omie-mcp/cache/) a partir
 * do registro real de ferramentas (`src/tools/registry.ts` + `src/tools/generic.ts`),
 * a mesma fonte usada por `npm run doc-ferramentas`.
 *
 * Diferença pro `docs/FERRAMENTAS.md`: aquele é UM arquivo grande (a
 * referência completa, pra humano ler). Este script quebra a mesma
 * informação em um arquivo por módulo, mais um índice curto — pra a skill
 * carregar só o módulo que precisa numa consulta, em vez do documento
 * inteiro, economizando tokens de contexto.
 *
 * NÃO roda sozinho a cada consulta da skill — só quando chamado
 * explicitamente (`npm run skill-cache`), pra não gastar tempo/tokens
 * regenerando o cache toda hora. Use `--check` pra só conferir se o cache
 * está desatualizado (compara hash do registro atual com o hash salvo no
 * manifest), sem escrever nada.
 *
 * Uso:
 *   npm run skill-cache          # regenera o cache
 *   npm run skill-cache -- --check   # só verifica se está desatualizado (exit code 1 se sim)
 */
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync, rmSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

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

const __dirname = dirname(fileURLToPath(import.meta.url));
const CACHE_DIR = join(__dirname, "..", ".claude", "skills", "omie-mcp", "cache");
const MANIFEST_PATH = join(CACHE_DIR, "manifest.json");

// Mesmo agrupamento de docs/FERRAMENTAS.md — grupo real por módulo (não
// adivinhado pelo nome da tool).
const grupos = [
  ["Ordem de Produção", ordemProducaoModuleTools, "Criar, alterar, excluir e consultar Ordens de Produção (OP)."],
  ["Produtos", produtosModuleTools, "Cadastro de produtos/serviços, famílias e consulta."],
  ["Estoque", estoqueModuleTools, "Saldo e ajustes de estoque, por local."],
  ["Pedido de Venda", pedidoVendaModuleTools, "Pedidos de venda: incluir, alterar, consultar, listar."],
  ["Clientes e Fornecedores", clientesFornecedoresModuleTools, "Cadastro de clientes e fornecedores."],
  ["Contas Correntes", contasCorrentesModuleTools, "Contas correntes e extrato."],
  ["Fluxo de Caixa", fluxoCaixaModuleTools, "Geração de relatório de fluxo de caixa."],
  ["Estrutura de Produtos", estruturaModuleTools, "Estrutura/BOM de produtos (insumos por produto)."],
  ["Notas Fiscais (NF-e)", nfeModuleTools, "Emissão e consulta de NF-e."],
  ["Compras", comprasModuleTools, "Requisições e pedidos de compra."],
  ["PIX", pixModuleTools, "Cobranças e recebimentos via PIX."],
  ["Orçamento de Caixa", orcamentoCaixaModuleTools, "Orçamento de caixa/previsão financeira."],
  ["Serviços", servicosModuleTools, "Cadastro e NFS-e de serviços."],
  ["CRM", crmModuleTools, "Oportunidades, fases, origens e soluções de CRM."],
  ["Cadastros Auxiliares", cadastrosAuxiliaresModuleTools, "Bancos, cidades, países, NCM, unidades, etc."],
  ["Categorias e Departamentos", categoriasDepartamentosModuleTools, "Categorias financeiras e departamentos."],
  ["Características de Produto", caracteristicasProdutoModuleTools, "Características/atributos de produto."],
  ["Nota de Entrada", notaEntradaModuleTools, "Consulta de notas de entrada (somente leitura)."],
  ["Contas a Pagar", contasPagarModuleTools, "Contas a pagar: incluir, alterar, consultar, listar."],
  ["Contas a Receber", contasReceberModuleTools, "Contas a receber: incluir, alterar, consultar, listar."],
];

function slugify(texto) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

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
  const tipo = def.type ?? (def.anyOf ? "misto" : "objeto");
  const desc = def.description ? ` — ${def.description}` : "";
  return `${prefixo}- \`${nome}\` (${tipo}, ${obrig})${desc}`;
}

function paramsResumo(schema) {
  const defs = schema.definitions ?? {};
  const raiz = Object.values(defs)[0] ?? schema;
  const props = raiz.properties ?? {};
  const required = new Set(raiz.required ?? []);

  const paramDef = resolveRef(schema, props.param);
  const isGenerica = !props.param;

  const entradas = isGenerica ? Object.entries(props) : Object.entries(paramDef?.properties ?? {});
  const requiredSet = isGenerica ? required : new Set(paramDef?.required ?? []);

  if (!isGenerica && !paramDef?.properties) {
    return [
      "  - `param` (objeto livre, **obrigatório**) — campos conforme documentação oficial da Omie " +
        "para este método (não tipado no MCP; a ferramenta repassa o objeto direto).",
    ].join("\n");
  }

  const linhas = [];
  for (const [nome, def] of entradas) {
    const resolved = resolveRef(schema, def);
    const obrig = requiredSet.has(nome) ? "**obrigatório**" : "opcional";
    linhas.push(linhaCampo(nome, resolved, obrig, "  "));
  }
  return linhas.length ? linhas.join("\n") : "  - _(sem parâmetros documentados no schema)_";
}

function blocoFerramenta(tool, generica) {
  const destrutiva = tool.destructive === true;
  const cacheavel = tool.cacheable === true;
  const tags = [destrutiva ? "⚠️ destrutiva" : null, cacheavel ? "cacheável (servidor)" : null]
    .filter(Boolean)
    .join(", ");
  const linhas = [];
  linhas.push(`### \`${tool.name}\`${tags ? ` (${tags})` : ""}`);
  linhas.push("");
  linhas.push(tool.description);
  linhas.push("");
  linhas.push("**Parâmetros:**");
  linhas.push("");
  linhas.push(paramsResumo(schemaDaFerramenta(tool)));
  if (!generica) {
    linhas.push("");
    linhas.push(
      `**Tipo:** ${tool.execute ? "use-case (lógica própria)" : `passthrough (\`${tool.resource}\` → \`${tool.call}\`)`}`
    );
  }
  linhas.push("");
  return linhas.join("\n");
}

function construirFerramentasPorModulo() {
  return [["Genérica", [{ ...genericToolDefinition, destructive: false }], "Chamada genérica pra qualquer endpoint da Omie, quando não existe tool específica."], ...grupos];
}

function hashRegistro(gruposCompletos) {
  const hash = createHash("sha256");
  for (const [mod, tools] of gruposCompletos) {
    hash.update(mod);
    for (const tool of tools) {
      hash.update(tool.name);
      hash.update(tool.description);
      hash.update(String(tool.destructive ?? false));
      hash.update(String(tool.cacheable ?? false));
      hash.update(JSON.stringify(schemaDaFerramenta(tool)));
      if (tool.resource) hash.update(tool.resource);
      if (tool.call) hash.update(tool.call);
    }
  }
  return hash.digest("hex");
}

function main() {
  const check = process.argv.includes("--check");
  const gruposCompletos = construirFerramentasPorModulo();
  const hashAtual = hashRegistro(gruposCompletos);

  if (check) {
    if (!existsSync(MANIFEST_PATH)) {
      console.log("Cache da skill omie-mcp não existe ainda. Rode `npm run skill-cache` pra gerar.");
      process.exit(1);
    }
    const manifest = JSON.parse(readFileSync(MANIFEST_PATH, "utf8"));
    if (manifest.hash !== hashAtual) {
      console.log(
        "Cache da skill omie-mcp está DESATUALIZADO (registro de ferramentas mudou desde a última " +
          `geração em ${manifest.geradoEm}). Rode \`npm run skill-cache\` pra atualizar.`
      );
      process.exit(1);
    }
    console.log(`Cache da skill omie-mcp está atualizado (gerado em ${manifest.geradoEm}).`);
    process.exit(0);
  }

  mkdirSync(CACHE_DIR, { recursive: true });
  // Limpa .md antigos (ex: módulo removido/renomeado) antes de regravar.
  for (const arquivo of readdirSync(CACHE_DIR)) {
    if (arquivo.endsWith(".md")) rmSync(join(CACHE_DIR, arquivo));
  }

  const indice = [];
  indice.push("# Índice de ferramentas — omie-mcp (cache da skill)");
  indice.push("");
  indice.push(
    "> Gerado por `npm run skill-cache` a partir de `src/tools/registry.ts`. Não editar à mão. " +
      "Cada linha abaixo é um módulo com arquivo próprio — abra só o(s) módulo(s) relevante(s) " +
      "pra pergunta atual em vez de carregar tudo."
  );
  indice.push("");
  indice.push("| Módulo | Ferramentas | Arquivo | Resumo |");
  indice.push("|---|---|---|---|");

  let totalTools = 0;
  let totalDestrutivas = 0;

  for (const [mod, tools, resumo] of gruposCompletos) {
    const slug = slugify(mod);
    const arquivo = `${slug}.md`;
    totalTools += tools.length;

    const linhasModulo = [];
    linhasModulo.push(`# ${mod}`);
    linhasModulo.push("");
    linhasModulo.push(resumo);
    linhasModulo.push("");
    for (const tool of tools) {
      if (tool.destructive) totalDestrutivas += 1;
      linhasModulo.push(blocoFerramenta(tool, mod === "Genérica"));
    }
    writeFileSync(join(CACHE_DIR, arquivo), linhasModulo.join("\n"));

    indice.push(`| ${mod} | ${tools.length} | \`cache/${arquivo}\` | ${resumo} |`);
  }

  indice.push("");
  indice.push(
    `**Total:** ${totalTools} ferramentas (${totalDestrutivas} destrutivas) em ${gruposCompletos.length} módulos.`
  );
  indice.push("");
  writeFileSync(join(CACHE_DIR, "_index.md"), indice.join("\n"));

  const manifest = {
    geradoEm: new Date().toISOString(),
    hash: hashAtual,
    totalFerramentas: totalTools,
    totalModulos: gruposCompletos.length,
  };
  writeFileSync(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`);

  console.log(
    `Cache da skill omie-mcp gerado: ${totalTools} ferramentas em ${gruposCompletos.length} arquivos ` +
      `(${CACHE_DIR}).`
  );
}

main();
