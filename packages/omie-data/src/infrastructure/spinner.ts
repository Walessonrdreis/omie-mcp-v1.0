const FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
const INTERVALO_MS = 80;

/**
 * Spinner de terminal pra indicar operação em andamento (ex: buscando dado
 * na Omie). Fora de TTY (saída não interativa, ex: pipe pra outro processo)
 * degrada pra uma única linha estática, já que animação com \r não faz
 * sentido nesse contexto.
 */
export class Spinner {
  private intervalId: NodeJS.Timeout | null = null;
  private frameIndex = 0;

  constructor(
    private readonly mensagem: string,
    private readonly stream: NodeJS.WriteStream = process.stdout
  ) {}

  start(): void {
    if (!this.stream.isTTY) {
      this.stream.write(`${this.mensagem}\n`);
      return;
    }

    this.stream.write(`${FRAMES[this.frameIndex]} ${this.mensagem}`);
    this.intervalId = setInterval(() => {
      this.frameIndex = (this.frameIndex + 1) % FRAMES.length;
      this.stream.write(`\r${FRAMES[this.frameIndex]} ${this.mensagem}`);
    }, INTERVALO_MS);
  }

  stop(mensagemFinal?: string): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.stream.write("\r\x1b[K");
    }

    if (mensagemFinal) {
      this.stream.write(`${mensagemFinal}\n`);
    }
  }
}
