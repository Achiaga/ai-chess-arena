import { MatchRunner } from "./MatchRunner";
import { StockfishEngine } from "../engines/StockfishEngine";
import { LLMEngine } from "../engines/LLMEngine";

/**
 * Manages a tournament of chess matches between two players
 */
export class TournamentManager {
  /**
   * @param {Object} config - Tournament configuration
   * @param {number} config.numGames - Number of games to play
   * @param {Object} config.whiteConfig - Configuration for white player
   * @param {Object} config.blackConfig - Configuration for black player
   * @param {Function} onTournamentUpdate - Callback for tournament updates
   */
  constructor(config, onTournamentUpdate) {
    this.config = config;
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

  /**
   * Starts the tournament by creating and running all matches
   */
  async start() {
    this.matches = [];
    this.stats = {
      total: this.config.numGames,
      completed: 0,
      whiteWins: 0,
      blackWins: 0,
      draws: 0,
    };

    // Create all match instances
    for (let i = 0; i < this.config.numGames; i++) {
      const whiteEngine = this.createEngine(this.config.whiteConfig);
      const blackEngine = this.createEngine(this.config.blackConfig);

      const match = new MatchRunner(i + 1, whiteEngine, blackEngine, (data) => {
        this.handleMatchUpdate(i, data);
      });

      this.matches.push(match);
    }

    // Start all matches concurrently
    this.matches.forEach((m) => m.start());
  }

  /**
   * Creates an engine instance based on configuration
   * @param {Object} config - Engine configuration
   * @returns {StockfishEngine|LLMEngine} Engine instance
   */
  createEngine(config) {
    if (config.type === "stockfish") {
      return new StockfishEngine(config.depth || 10);
    } else {
      return new LLMEngine(config);
    }
  }

  /**
   * Calculates performance metrics for a completed match
   * @param {string} winner - Match winner ('white', 'black', or 'draw')
   * @returns {Object} Performance metrics
   */
  calculatePerformance(winner) {
    if (winner === "white") {
      return {
        whiteScore: 100,
        blackScore: 0,
        advantage: 100,
      };
    }
    if (winner === "black") {
      return {
        whiteScore: 0,
        blackScore: 100,
        advantage: -100,
      };
    }
    return {
      whiteScore: 50,
      blackScore: 50,
      advantage: 0,
    };
  }

  /**
   * Handles updates from individual matches
   * @param {number} index - Match index
   * @param {Object} data - Match update data
   */
  handleMatchUpdate(index, data) {
    const match = this.matches[index];

    // Update stats when match completes (only once)
    if (data.status === "completed" && match.status !== "completed_recorded") {
      match.status = "completed_recorded";
      match.winner = data.winner;
      match.performance = this.calculatePerformance(data.winner);

      this.stats.completed++;
      if (data.winner === "white") this.stats.whiteWins++;
      else if (data.winner === "black") this.stats.blackWins++;
      else this.stats.draws++;
    }

    // Send update to callback
    this.onTournamentUpdate({
      matches: this.matches.map((m) => ({
        id: m.id,
        fen: m.game.fen(),
        status: m.status === "completed_recorded" ? "completed" : m.status,
        winner: m.winner,
        moveCount: m.moveCount,
        history: m.history,
        performance: m.performance,
      })),
      stats: this.stats,
    });
  }

  /**
   * Stops all running matches
   */
  stopAll() {
    this.matches.forEach((m) => m.terminate());
  }
}
