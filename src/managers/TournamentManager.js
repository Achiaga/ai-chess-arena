import { MatchRunner } from "./MatchRunner";
import { StockfishEngine } from "../engines/StockfishEngine";
import { LLMEngine } from "../engines/LLMEngine";

export class TournamentManager {
  constructor(config, onTournamentUpdate) {
    this.config = config; // { numGames, whiteConfig, blackConfig }
    this.onTournamentUpdate = onTournamentUpdate;
    this.matches = [];
    this.stats = {
      total: 0,
      completed: 0,
      whiteWins: 0,
      blackWins: 0,
      draws: 0,
    };
  }

  async start() {
    this.matches = [];
    this.stats = {
      total: this.config.numGames,
      completed: 0,
      whiteWins: 0,
      blackWins: 0,
      draws: 0,
    };

    for (let i = 0; i < this.config.numGames; i++) {
      const whiteEngine = this.createEngine(this.config.whiteConfig);
      const blackEngine = this.createEngine(this.config.blackConfig);

      const match = new MatchRunner(i + 1, whiteEngine, blackEngine, (data) => {
        this.handleMatchUpdate(i, data);
      });

      this.matches.push(match);
    }

    // Start all matches
    // Note: For 10 matches, this spawns 10 promises.
    // If using Stockfish, it spawns 10+ workers.
    this.matches.forEach((m) => m.start());
  }

  createEngine(config) {
    if (config.type === "stockfish") {
      return new StockfishEngine();
    } else {
      return new LLMEngine(config);
    }
  }

  handleMatchUpdate(index, data) {
    // Update internal state if needed, but mostly just aggregation
    if (
      data.status === "completed" &&
      this.matches[index].status !== "completed_recorded"
    ) {
      this.matches[index].status = "completed_recorded"; // Prevent double counting
      this.stats.completed++;
      if (data.winner === "white") this.stats.whiteWins++;
      else if (data.winner === "black") this.stats.blackWins++;
      else this.stats.draws++;
    }

    this.onTournamentUpdate({
      matches: this.matches.map((m) => ({
        id: m.id,
        fen: m.game.fen(),
        status: m.status === "completed_recorded" ? "completed" : m.status,
        winner: m.winner,
        moveCount: m.moveCount,
        history: m.history,
      })),
      stats: this.stats,
    });
  }

  stopAll() {
    this.matches.forEach((m) => m.terminate());
  }
}
