#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

/**
 * Valida a doc de `docs/omie-api/` contra os critérios que apodrecem sozinhos:
 * tamanho de arquivo, links relativos e células de tabela vazias. Ver
 * `docs/superpowers/specs/2026-08-10-doc-api-omie-chao-de-fabrica-design.md`.
 */

const LIMITE_DE_LINHAS = 200;

function listarMarkdown(raiz) {
  const encontrados = [];

  function varrer(diretorio) {
    for (const entrada of fs.readdirSync(diretorio, { withFileTypes: true })) {
      const completo = path.join(diretorio, entrada.name);
      if (entrada.isDirectory()) varrer(completo);
      else if (entrada.name.endsWith(".md")) encontrados.push(completo);
    }
  }

  varrer(raiz);
  return encontrados;
}

function relativo(raiz, arquivo) {
  return path.relative(raiz, arquivo).split(path.sep).join("/");
}

function verificarTamanho(raiz, arquivo, linhas, problemas) {
  if (linhas.length <= LIMITE_DE_LINHAS) return;

  problemas.push({
    arquivo: relativo(raiz, arquivo),
    linha: 0,
    tipo: "tamanho",
    mensagem: `${linhas.length} linhas, acima do limite de ${LIMITE_DE_LINHAS}`,
  });
}

function verificarLinks(raiz, arquivo, linhas, problemas) {
  const padrao = /\[[^\]]*\]\(([^)\s]+)\)/g;

  linhas.forEach((linha, indice) => {
    for (const achado of linha.matchAll(padrao)) {
      const alvo = achado[1];
      if (/^(https?:|mailto:|#)/.test(alvo)) continue;

      const semAncora = alvo.split("#")[0];
      if (semAncora === "") continue;

      const destino = path.resolve(path.dirname(arquivo), semAncora);
      if (fs.existsSync(destino)) continue;

      problemas.push({
        arquivo: relativo(raiz, arquivo),
        linha: indice + 1,
        tipo: "link",
        mensagem: `link não resolve: ${alvo}`,
      });
    }
  });
}

/** Linha só de hífens, dois-pontos e pipes — o separador de cabeçalho. */
function ehSeparadora(linha) {
  return /^\|[\s:|-]+\|$/.test(linha.trim());
}

function verificarCelulas(raiz, arquivo, linhas, problemas) {
  let dentroDeCodigo = false;

  linhas.forEach((linha, indice) => {
    const podada = linha.trim();

    if (podada.startsWith("```")) {
      dentroDeCodigo = !dentroDeCodigo;
      return;
    }
    if (dentroDeCodigo) return;
    if (!podada.startsWith("|") || !podada.endsWith("|")) return;
    if (ehSeparadora(podada)) return;

    // Preenchimentos como "—", "📖" ou "✅" passam naturalmente: só a célula
    // literalmente vazia é problema.
    const celulas = podada.slice(1, -1).split("|");
    const temVazia = celulas.some((celula) => celula.trim() === "");

    if (temVazia) {
      problemas.push({
        arquivo: relativo(raiz, arquivo),
        linha: indice + 1,
        tipo: "celula-vazia",
        mensagem: "célula vazia — use — ou uma marca de confiança",
      });
    }
  });
}

export function verificarDocOmie(raiz) {
  if (!fs.existsSync(raiz)) return [];

  const problemas = [];

  for (const arquivo of listarMarkdown(raiz)) {
    const linhas = fs.readFileSync(arquivo, "utf8").split("\n");
    // Um arquivo terminado em "\n" gera um último elemento vazio que não é linha.
    if (linhas.at(-1) === "") linhas.pop();

    verificarTamanho(raiz, arquivo, linhas, problemas);
    verificarLinks(raiz, arquivo, linhas, problemas);
    verificarCelulas(raiz, arquivo, linhas, problemas);
  }

  return problemas;
}

function principal() {
  const raiz = path.resolve(process.argv[2] ?? "docs/omie-api");
  const problemas = verificarDocOmie(raiz);

  if (problemas.length === 0) {
    console.log(`OK — doc em ${raiz} passou na verificação.`);
    return;
  }

  for (const problema of problemas) {
    const local = problema.linha > 0 ? `${problema.arquivo}:${problema.linha}` : problema.arquivo;
    console.error(`[${problema.tipo}] ${local} — ${problema.mensagem}`);
  }
  console.error(`\n${problemas.length} problema(s) encontrado(s).`);
  process.exitCode = 1;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  principal();
}
