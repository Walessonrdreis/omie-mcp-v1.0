import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Spinner } from "./spinner.js";

function criarStreamFalso(isTTY: boolean) {
  return {
    isTTY,
    write: vi.fn(),
  } as unknown as NodeJS.WriteStream;
}

describe("Spinner", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("em TTY, anima frames diferentes a cada tick e limpa a linha ao parar", () => {
    const stream = criarStreamFalso(true);
    const spinner = new Spinner("Atualizando dados da Omie...", stream);

    spinner.start();
    expect(stream.write).toHaveBeenCalledTimes(1);
    const primeiraEscrita = (stream.write as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(primeiraEscrita).toContain("Atualizando dados da Omie...");

    vi.advanceTimersByTime(80);
    const segundaEscrita = (stream.write as ReturnType<typeof vi.fn>).mock.calls[1][0] as string;
    expect(segundaEscrita).not.toBe(primeiraEscrita);
    expect(segundaEscrita).toContain("Atualizando dados da Omie...");

    spinner.stop();
    const ultimaEscrita = (stream.write as ReturnType<typeof vi.fn>).mock.calls.at(-1)?.[0] as string;
    expect(ultimaEscrita).toContain("\r");
  });

  it("em TTY, para de animar depois de stop() (interval limpo)", () => {
    const stream = criarStreamFalso(true);
    const spinner = new Spinner("Atualizando...", stream);

    spinner.start();
    const chamadasAntesDoStop = (stream.write as ReturnType<typeof vi.fn>).mock.calls.length;
    spinner.stop();
    const chamadasLogoAposStop = (stream.write as ReturnType<typeof vi.fn>).mock.calls.length;

    vi.advanceTimersByTime(500);
    const chamadasDepoisDeAvancarTempo = (stream.write as ReturnType<typeof vi.fn>).mock.calls.length;

    expect(chamadasDepoisDeAvancarTempo).toBe(chamadasLogoAposStop);
    expect(chamadasLogoAposStop).toBeGreaterThan(chamadasAntesDoStop - 1);
  });

  it("stop() com mensagem final escreve a mensagem depois de limpar a linha", () => {
    const stream = criarStreamFalso(true);
    const spinner = new Spinner("Atualizando...", stream);

    spinner.start();
    spinner.stop("Pronto!");

    const chamadas = (stream.write as ReturnType<typeof vi.fn>).mock.calls.map((c) => c[0]);
    expect(chamadas.at(-1)).toBe("Pronto!\n");
  });

  it("fora de TTY, não anima — só escreve a mensagem inicial uma vez, sem limpar linha no stop()", () => {
    const stream = criarStreamFalso(false);
    const spinner = new Spinner("Atualizando dados da Omie...", stream);

    spinner.start();
    expect(stream.write).toHaveBeenCalledTimes(1);
    expect(stream.write).toHaveBeenCalledWith("Atualizando dados da Omie...\n");

    vi.advanceTimersByTime(500);
    expect(stream.write).toHaveBeenCalledTimes(1);

    spinner.stop("Pronto!");
    const chamadas = (stream.write as ReturnType<typeof vi.fn>).mock.calls.map((c) => c[0]);
    expect(chamadas).not.toContain("\r\x1b[K");
    expect(chamadas.at(-1)).toBe("Pronto!\n");
  });
});
