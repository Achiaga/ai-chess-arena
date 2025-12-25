import { TournamentManager } from "./TournamentManager";
import { StockfishEngine } from "../engines/StockfishEngine";
import { LLMEngine } from "../engines/LLMEngine";
import { STOCKFISH_ELO_LEVELS } from "../constants";

export class EloEstimator {
  constructor(llmConfig, gamesPerLevel, onUpdate) {
    this.llmConfig = llmConfig;
    this.gamesPerLevel = gamesPerLevel;
    this.onUpdate = onUpdate;
    this.results = [];
    this.currentLevel = 0;
    this.isRunning = false;
  }

  async start() {
    this.isRunning = true;
    this.results = [];
    this.currentLevel = 0;

    for (let i = 0; i < STOCKFISH_ELO_LEVELS.length; i++) {
      if (!this.isRunning) break;

      this.currentLevel = i;
      const level = STOCKFISH_ELO_LEVELS[i];

      this.notifyUpdate({
        status: "running",
        currentLevel: i,
        totalLevels: STOCKFISH_ELO_LEVELS.length,
        currentElo: level.elo,
        progress: (i / STOCKFISH_ELO_LEVELS.length) * 100,
      });

      // Run matches at this level
      const levelResult = await this.runLevelMatches(level);
      this.results.push(levelResult);

      this.notifyUpdate({
        status: "running",
        currentLevel: i + 1,
        totalLevels: STOCKFISH_ELO_LEVELS.length,
        currentElo: level.elo,
        progress: ((i + 1) / STOCKFISH_ELO_LEVELS.length) * 100,
        results: this.results,
      });
    }

    // Calculate final ELO estimate
    const estimate = this.calculateEloEstimate();

    this.notifyUpdate({
      status: "completed",
      results: this.results,
      estimate,
      progress: 100,
    });

    this.isRunning = false;
  }

  async runLevelMatches(level) {
    return new Promise((resolve) => {
      const whiteConfig = { type: "stockfish", depth: level.depth };
      const blackConfig = this.llmConfig;

      let completedGames = 0;
      let wins = 0;
      let losses = 0;
      let draws = 0;

      const manager = new TournamentManager(
        { numGames: this.gamesPerLevel, whiteConfig, blackConfig },
        (data) => {
          if (data.stats.completed === data.stats.total) {
            wins = data.stats.blackWins; // LLM is black
            losses = data.stats.whiteWins; // Stockfish is white
            draws = data.stats.draws;

            resolve({
              level: level.elo,
              depth: level.depth,
              label: level.label,
              wins,
              losses,
              draws,
              total: this.gamesPerLevel,
              winRate: (wins / this.gamesPerLevel) * 100,
              score: ((wins + draws * 0.5) / this.gamesPerLevel) * 100,
            });
          }
        }
      );

      manager.start();
    });
  }

  calculateEloEstimate() {
    if (this.results.length === 0) return null;

    // Find the level where performance is closest to 50%
    let closestTo50 = this.results[0];
    let minDiff = Math.abs(closestTo50.score - 50);

    for (const result of this.results) {
      const diff = Math.abs(result.score - 50);
      if (diff < minDiff) {
        minDiff = diff;
        closestTo50 = result;
      }
    }

    // Interpolate if we have adjacent levels
    let estimatedElo = closestTo50.level;
    const idx = this.results.indexOf(closestTo50);

    if (closestTo50.score > 50 && idx < this.results.length - 1) {
      // Performing better than 50%, interpolate upward
      const nextLevel = this.results[idx + 1];
      const ratio = (closestTo50.score - 50) / 50;
      estimatedElo =
        closestTo50.level + ratio * (nextLevel.level - closestTo50.level);
    } else if (closestTo50.score < 50 && idx > 0) {
      // Performing worse than 50%, interpolate downward
      const prevLevel = this.results[idx - 1];
      const ratio = (50 - closestTo50.score) / 50;
      estimatedElo =
        closestTo50.level - ratio * (closestTo50.level - prevLevel.level);
    }

    // Calculate confidence range based on consistency
    const scores = this.results.map((r) => r.score);
    const variance = this.calculateVariance(scores);
    const confidenceRange = Math.round(Math.sqrt(variance) * 50); // Rough estimate

    return {
      elo: Math.round(estimatedElo),
      range: confidenceRange,
      confidence: Math.max(50, 100 - confidenceRange / 10),
    };
  }

  calculateVariance(values) {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squareDiffs = values.map((value) => Math.pow(value - mean, 2));
    return squareDiffs.reduce((a, b) => a + b, 0) / values.length;
  }

  notifyUpdate(data) {
    if (this.onUpdate) {
      this.onUpdate(data);
    }
  }

  stop() {
    this.isRunning = false;
  }
}
