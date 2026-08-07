#!/usr/bin/env node
import path from "node:path";
import { pathToFileURL } from "node:url";
import { realpathSync } from "node:fs";
import { abrirBanco } from "./infrastructure/database.js";
import { carregarCredencialAtiva } from "./infrastructure/credenciais.js";
import { diretorioDados } from "./infrastructure/caminhos.js";
import { OmieHttpClientReal } from "./infrastructure/http-client-real.js";
import { Spinner } from "./infrastructure/spinner.js";
import { rodarConfigurar } from "./application/rodar-configurar.js";
import { rodarProdutos } from "./modules/produtos/application/rodar-produtos.js";
import { rodarAjudaInterativaEmLoop } from "./modules/produtos/application/rodar-ajuda-interativo.js";
import { FiltrosProdutos, ResultadoConsultaProdutos } from "./modules/produtos/application/consultar-produtos.js";
import { rodarMenuPrincipal } from "./application/rodar-menu-principal.js";

export type ComandoCli =
  | { tipo: "configurar"; appKey: string; appSecret: string }
  | { tipo: "produtos"; atualizar: boolean; ajuda: boolean; filtros: FiltrosProdutos }
  | { tipo: "menu" }
  | { tipo: "desconhecido" };

function valorDaFlag(resto: string[], flag: string): string | undefined {
  const indice = resto.indexOf(flag);
  if (indice === -1) return undefined;
  const valor = resto[indice + 1];
  if (!valor || valor.trim() === "" || valor.startsWith("--")) return undefined;
  return valor;
}

export function parseArgv(argv: string[]): ComandoCli {
  const [sub, ...resto] = argv;

  if (sub === undefined) {
    return { tipo: "menu" };
  }

  if (sub === "configurar") {
    const appKey = valorDaFlag(resto, "--app-key");
    const appSecret = valorDaFlag(resto, "--app-secret");
    if (!appKey || !appSecret) return { tipo: "desconhecido" };
    return { tipo: "configurar", appKey, appSecret };
  }

  if (sub === "produtos") {
    const filtros: FiltrosProdutos = {};

    const busca = valorDaFlag(resto, "--busca");
    if (busca) filtros.busca = busca;

    const categoria = valorDaFlag(resto, "--categoria");
    if (categoria) filtros.categoria = categoria;

    const ativoBruto = valorDaFlag(resto, "--ativo");
    if (ativoBruto !== undefined) {
      const normalizado = ativoBruto.toLowerCase();
      if (normalizado === "sim") filtros.ativo = "Sim";
      else if (normalizado === "nao" || normalizado === "não") filtros.ativo = "Não";
      else return { tipo: "desconhecido" };
    }

    return {
      tipo: "produtos",
      atualizar: resto.includes("--atualizar"),
      ajuda: resto.includes("--ajuda"),
      filtros,
    };
  }

  return { tipo: "desconhecido" };
}

export function textoAjudaProdutos(): string {
  return [
    "Filtros disponíveis em 'produtos':",
    "  --busca <texto>      ex: produtos --busca arroz",
    "  --categoria <texto>  ex: produtos --categoria bebida",
    "  --ativo <sim|nao>    ex: produtos --ativo sim",
    "",
    "Dica: rode 'produtos' sem nenhuma flag num terminal real pra abrir",
    "o menu interativo, sem precisar decorar essas flags.",
  ].join("\n");
}

export function deveAbrirMenuInterativo(
  isTTY: boolean,
  comando: { ajuda: boolean; filtros: FiltrosProdutos }
): boolean {
  if (comando.ajuda) return false;
  if (!isTTY) return false;
  return Object.keys(comando.filtros).length === 0;
}

function formatarDataHoraBrasilia(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date(iso));
}

function formatarDuracaoHms(ms: number): string {
  const totalSegundos = Math.floor(ms / 1000);
  const horas = Math.floor(totalSegundos / 3600);
  const minutos = Math.floor((totalSegundos % 3600) / 60);
  const segundos = totalSegundos % 60;
  const dois = (n: number) => String(n).padStart(2, "0");
  return `${dois(horas)}:${dois(minutos)}:${dois(segundos)}`;
}

export function formatarResultadoProdutos(resultado: ResultadoConsultaProdutos): string {
  if (resultado.status === "sem_dado") {
    return "Nenhum produto encontrado.";
  }

  const infoData = `Dado coletado em ${formatarDataHoraBrasilia(resultado.geradoEm as string)} (horário de Brasília) — há ${formatarDuracaoHms(resultado.idadeMs as number)}`;

  const colunas = ["Nome", "Código", "Categoria", "Valor", "Estoque", "Ativo"];
  const linhas = resultado.produtos.map((produto) => [
    produto.nome,
    produto.codigo,
    produto.categoria,
    produto.valorFormatado,
    `${produto.quantidadeEmEstoque.toFixed(2).replace(".", ",")} ${produto.unidade}`,
    produto.ativo,
  ]);

  const larguras = colunas.map((coluna, indice) =>
    Math.max(coluna.length, ...linhas.map((linha) => linha[indice].length))
  );

  const formatarLinha = (celulas: string[]) =>
    celulas.map((celula, indice) => celula.padEnd(larguras[indice])).join(" | ");

  const tabela = [formatarLinha(colunas), ...linhas.map(formatarLinha)];

  return [infoData, "", ...tabela].join("\n");
}

async function main() {
  const comando = parseArgv(process.argv.slice(2));

  if (comando.tipo === "configurar") {
    try {
      const client = new OmieHttpClientReal(comando.appKey, comando.appSecret);
      const resultado = await rodarConfigurar(comando.appKey, comando.appSecret, client);
      console.log(JSON.stringify(resultado));
      process.exitCode = resultado.status === "ok" ? 0 : 1;
    } catch (erro) {
      console.log(JSON.stringify({ status: "erro", erro: erro instanceof Error ? erro.message : String(erro) }));
      process.exitCode = 1;
    }
    return;
  }

  if (comando.tipo === "produtos") {
    if (comando.ajuda) {
      console.log(textoAjudaProdutos());
      process.exitCode = 0;
      return;
    }

    const credencial = carregarCredencialAtiva();
    if (!credencial) {
      if (process.stdout.isTTY) {
        console.log("Nenhuma credencial configurada. Rode 'omie-data configurar' primeiro.");
      } else {
        console.log(JSON.stringify({ status: "sem_credencial" }));
      }
      process.exitCode = 1;
      return;
    }

    let db;
    try {
      db = abrirBanco(path.join(diretorioDados(), `${credencial.hash}.db`));
      const client = new OmieHttpClientReal(credencial.appKey, credencial.appSecret);

      const abrirMenu = deveAbrirMenuInterativo(!!process.stdout.isTTY, comando);

      if (abrirMenu) {
        await rodarAjudaInterativaEmLoop(db, client, comando.atualizar, comando.filtros, (resultado) =>
          console.log(formatarResultadoProdutos(resultado))
        );
        // "voltar" e "sair" não têm pra onde voltar aqui (invocação direta) — só encerra depois do loop.
      } else {
        const spinner = comando.atualizar ? new Spinner("Atualizando dados da Omie...") : undefined;
        spinner?.start();
        const resultado = await rodarProdutos(db, client, comando.atualizar, comando.filtros);
        spinner?.stop();
        console.log(process.stdout.isTTY ? formatarResultadoProdutos(resultado) : JSON.stringify(resultado));
      }
      process.exitCode = 0;
    } catch (erro) {
      console.log(JSON.stringify({ status: "erro", erro: erro instanceof Error ? erro.message : String(erro) }));
      process.exitCode = 1;
    } finally {
      db?.close();
    }
    return;
  }

  if (comando.tipo === "menu") {
    if (!process.stdout.isTTY) {
      console.error(
        "Comando desconhecido. Uso: cli.js configurar --app-key X --app-secret Y | cli.js produtos [--atualizar] [--busca X] [--categoria X] [--ativo sim|nao] [--ajuda]"
      );
      process.exitCode = 1;
      return;
    }

    for (;;) {
      const resultadoMenu = await rodarMenuPrincipal(
        () => carregarCredencialAtiva() !== null,
        (appKey, appSecret) => new OmieHttpClientReal(appKey, appSecret),
        async () => {
          const credencial = carregarCredencialAtiva();
          const db = abrirBanco(path.join(diretorioDados(), `${credencial!.hash}.db`));
          try {
            const client = new OmieHttpClientReal(credencial!.appKey, credencial!.appSecret);
            return await rodarAjudaInterativaEmLoop(db, client, "perguntar", {}, (resultado) =>
              console.log(formatarResultadoProdutos(resultado))
            );
          } finally {
            db.close();
          }
        }
      );

      if (resultadoMenu.tipo === "sair") {
        break;
      }

      if (resultadoMenu.tipo === "ajuda") {
        console.log(textoAjudaProdutos());
      } else if (resultadoMenu.tipo === "configurar") {
        console.log(
          resultadoMenu.resultado.status === "ok"
            ? "Credencial validada e salva com sucesso."
            : `Credencial inválida: ${resultadoMenu.resultado.erro}`
        );
      } else if (resultadoMenu.tipo === "produtos_sem_credencial") {
        console.log("Nenhuma credencial configurada. Escolha \"Configurar\" primeiro.");
      } else if (resultadoMenu.tipo === "produtos" && resultadoMenu.saida === "sair") {
        break;
      }
      // "produtos" com saida "voltar" não imprime nada — já foi tudo mostrado dentro do
      // loop; só volta pro menu principal na próxima iteração deste loop externo.
    }

    process.exitCode = 0;
    return;
  }

  console.error(
    "Comando desconhecido. Uso: cli.js configurar --app-key X --app-secret Y | cli.js produtos [--atualizar] [--busca X] [--categoria X] [--ativo sim|nao] [--ajuda]"
  );
  process.exitCode = 1;
}

if (import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href) {
  main();
}
