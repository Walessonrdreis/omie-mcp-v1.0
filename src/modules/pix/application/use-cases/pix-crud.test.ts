import { describe, expect, it } from "vitest";
import { PixFakeGateway } from "../../infrastructure/gateways/pix-fake-gateway.js";
import {
  CancelarPixUseCase,
  GerarPixUseCase,
  ListarPixUseCase,
  ObterPixUseCase,
  ObterStatusPixUseCase,
} from "./pix-crud.js";

describe("PIX CRUD", () => {
  it("lista, obtém e consulta status de um PIX existente", async () => {
    const gateway = new PixFakeGateway();

    const listagem = await new ListarPixUseCase(gateway).execute({});
    expect(listagem.totalRegistros).toBe(1);

    const detalhe = await new ObterPixUseCase(gateway).execute({ codigo_titulo: 8001 });
    expect(detalhe.status).toBe("LIQUIDADO");
    expect(detalhe.urlPix).not.toBe("");

    const status = await new ObterStatusPixUseCase(gateway).execute({ codigo_titulo: 8001 });
    expect(status.status).toBe("LIQUIDADO");
  });

  it("gera e cancela um novo PIX", async () => {
    const gateway = new PixFakeGateway();

    const gerado = await new GerarPixUseCase(gateway).execute({
      codigo_titulo: 9999,
      valor: 200,
      codigo_conta_corrente: 111,
    });
    expect(gerado.status).toBe("AGUARDANDO");

    const listagemDepois = await new ListarPixUseCase(gateway).execute({});
    expect(listagemDepois.totalRegistros).toBe(2);

    const cancelado = await new CancelarPixUseCase(gateway).execute({ id_pix: gerado.idPix });
    expect(cancelado.codigoStatus).toBe("0");

    const listagemFinal = await new ListarPixUseCase(gateway).execute({});
    expect(listagemFinal.totalRegistros).toBe(1);
  });

  it("aplica o filtro genérico na listagem", async () => {
    const gateway = new PixFakeGateway();
    const resultado = await new ListarPixUseCase(gateway).execute({
      filtros: [{ campo: "status", operador: "igual", valor: "LIQUIDADO" }],
    });
    expect(resultado.registros).toHaveLength(1);
  });
});
