import { afterEach, describe, expect, it, vi } from "vitest";
import { OmieHttpClientReal } from "./omie-http-client-real.js";

describe("OmieHttpClientReal", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("monta a URL e o payload corretos e devolve o JSON da resposta", async () => {
    const respostaFake = {
      pagina: 1,
      total_de_paginas: 1,
      produto_servico_cadastro: [{ codigo_produto: 1, codigo: "A", descricao: "Produto A", unidade: "UN", valor_unitario: 10, inativo: "N", codigo_familia: 0 }],
    };

    const fetchMock = vi.fn().mockResolvedValue({
      text: async () => JSON.stringify(respostaFake),
    });
    vi.stubGlobal("fetch", fetchMock);

    const client = new OmieHttpClientReal("minha-key", "meu-secret");
    const resultado = await client.listarProdutosPagina(1, 50);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, opcoes] = fetchMock.mock.calls[0];
    expect(url).toBe("https://app.omie.com.br/api/v1/geral/produtos/");
    const corpo = JSON.parse(opcoes.body);
    expect(corpo.call).toBe("ListarProdutos");
    expect(corpo.app_key).toBe("minha-key");
    expect(corpo.app_secret).toBe("meu-secret");
    expect(corpo.param).toEqual([{ pagina: 1, registros_por_pagina: 50, apenas_importado_api: "N" }]);

    expect(resultado).toEqual(respostaFake);
  });

  it("rejeita com mensagem legível quando a Omie devolve faultstring", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      text: async () => JSON.stringify({ faultstring: "Erro de autenticação", faultcode: "SOAP-ENV:Client-101" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const client = new OmieHttpClientReal("key-invalida", "secret-invalido");

    await expect(client.listarProdutosPagina(1, 50)).rejects.toThrow("Erro de autenticação");
  });
});
