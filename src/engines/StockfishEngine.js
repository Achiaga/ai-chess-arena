const STOCKFISH_URL =
  "https://cdnjs.cloudflare.com/ajax/libs/stockfish.js/10.0.0/stockfish.js";

export class StockfishEngine {
  constructor(depth = 10) {
    this.worker = null;
    this.isReady = false;
    this.depth = depth;
  }

  async init() {
    if (this.worker) return;

    return new Promise((resolve, reject) => {
      fetch(STOCKFISH_URL)
        .then((response) => response.blob())
        .then((blob) => {
          const blobUrl = URL.createObjectURL(blob);
          this.worker = new Worker(blobUrl);

          this.worker.onmessage = (event) => {
            if (event.data === "uciok") {
              this.isReady = true;
              resolve();
            }
          };

          this.worker.postMessage("uci");
        })
        .catch(reject);
    });
  }

  async getBestMove(fen, depth = null) {
    if (!this.worker) await this.init();

    const searchDepth = depth !== null ? depth : this.depth;

    return new Promise((resolve) => {
      const handler = (event) => {
        const line = event.data;
        if (line.startsWith("bestmove")) {
          this.worker.removeEventListener("message", handler);
          const move = line.split(" ")[1];
          resolve(move);
        }
      };

      this.worker.addEventListener("message", handler);
      this.worker.postMessage(`position fen ${fen}`);
      this.worker.postMessage(`go depth ${searchDepth}`);
    });
  }

  async getEval(fen) {
    if (!this.worker) await this.init();

    return new Promise((resolve) => {
      let score = 0;
      const handler = (event) => {
        const line = event.data;
        if (line.includes("score cp")) {
          const match = line.match(/score cp (-?\d+)/);
          if (match) {
            score = parseInt(match[1]) / 100;
          }
        } else if (line.includes("score mate")) {
          const match = line.match(/score mate (-?\d+)/);
          if (match) {
            score = `M${match[1]}`;
          }
        }

        // We resolve on bestmove to ensure we got the final eval for this search
        if (line.startsWith("bestmove")) {
          this.worker.removeEventListener("message", handler);
          resolve(score);
        }
      };

      this.worker.addEventListener("message", handler);
      this.worker.postMessage(`position fen ${fen}`);
      this.worker.postMessage("go depth 10");
    });
  }

  terminate() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
  }
}
