import { TournamentManager } from "./TournamentManager";
import { STOCKFISH_ELO_LEVELS } from "../constants";

/**
 * Estimates the ELO rating of an LLM chess player by running matches
 * against Stockfish at various difficulty levels using a binary search approach.
 */
export class EloEstimator {
  /**
   * @param {Object} llmConfig - Configuration for the LLM engine
   * @param {number} gamesPerLevel - Number of games to play at each difficulty level
   * @param {Function} onUpdate - Callback function for progress updates
   */
  constructor(llmConfig, gamesPerLevel, onUpdate) {
    this.llmConfig = llmConfig;
    this.gamesPerLevel = gamesPerLevel;
    this.onUpdate = onUpdate;
    this.results = [];
    this.isRunning = false;
  }

  /**
   * Starts the ELO estimation process
   */
  async start() {
    this.isRunning = true;
    this.results = await this.estimateEloBinary();

    if (this.results.length === 0) {
      this.notifyUpdate({
        status: "completed",
        estimate: null,
      });
      this.isRunning = false;
      return;
    }

    const estimate = this.calculateEloEstimate();

    this.notifyUpdate({
      status: "completed",
      estimate,
      stoppedEarly: false,
    });

    this.isRunning = false;
  }

  /**
   * Calculates the log-likelihood of a given ELO rating based on match results
   * @param {number} elo - The ELO rating to evaluate
   * @param {Array} results - Array of match results
   * @returns {number} Log-likelihood value
   */
  likelihood(elo, results) {
    return results.reduce((logL, r) => {
      const expected = 1 / (1 + Math.pow(10, (r.level - elo) / 400));
      const score = r.score / 100;

      // Avoid log(0) by adding small epsilon
      const epsilon = 1e-10;
      const prob = expected * score + (1 - expected) * (1 - score);
      return logL + Math.log(Math.max(prob, epsilon));
    }, 0);
  }

  /**
   * Estimates ELO using Bayesian maximum likelihood approach
   * @param {Array} results - Array of match results
   * @returns {number} Estimated ELO rating
   */
  estimateBayesianElo(results) {
    let bestElo = 0;
    let bestLikelihood = -Infinity;

    for (let elo = 800; elo <= 2600; elo += 10) {
      const l = this.likelihood(elo, results);
      if (l > bestLikelihood) {
        bestLikelihood = l;
        bestElo = elo;
      }
    }

    return bestElo;
  }

  /**
   * Generates a confidence curve showing likelihood across ELO range
   * @param {Array} results - Array of match results
   * @returns {Array} Array of {elo, likelihood} points
   */
  confidenceCurve(results) {
    const curve = [];

    for (let elo = 800; elo <= 2600; elo += 20) {
      curve.push({
        elo,
        likelihood: this.likelihood(elo, results),
      });
    }

    return curve;
  }

  /**
   * Calculates the final ELO estimate with confidence range
   * @returns {Object} Object containing elo, range, confidence, and confidenceCurve
   */
  calculateEloEstimate() {
    if (this.results.length === 0) return null;

    // Use Bayesian approach for ELO estimation
    const elo = this.estimateBayesianElo(this.results);
    const curve = this.confidenceCurve(this.results);

    // Find plausible range (within 2 log-likelihood units of maximum)
    const maxL = Math.max(...curve.map((c) => c.likelihood));
    const plausible = curve.filter((c) => c.likelihood > maxL - 2);

    // Calculate range as a single number (width of confidence interval)
    const rangeMin = plausible[0]?.elo || elo - 100;
    const rangeMax = plausible[plausible.length - 1]?.elo || elo + 100;
    const rangeWidth = Math.round((rangeMax - rangeMin) / 2);

    // Calculate confidence based on range width (narrower = more confident)
    const confidence = Math.max(50, Math.min(95, 100 - rangeWidth / 10));

    return {
      elo,
      range: rangeWidth,
      confidence,
      confidenceCurve: curve,
    };
  }

  /**
   * Runs matches against a specific Stockfish difficulty level
   * @param {Object} level - Stockfish level configuration
   * @returns {Promise<Object>} Match results for this level
   */
  async runLevelMatches(level) {
    return new Promise((resolve) => {
      const whiteConfig = { type: "stockfish", depth: level.depth };
      const blackConfig = this.llmConfig;

      const manager = new TournamentManager(
        {
          numGames: this.gamesPerLevel,
          whiteConfig,
          blackConfig,
        },
        (data) => {
          // Forward live match preview
          const activeMatch = data.matches?.find(
            (m) => m.status === "active" && m.fen
          );

          if (activeMatch) {
            this.notifyUpdate({
              status: "running",
              preview: {
                fen: activeMatch.fen,
                level: level.elo,
                depth: level.depth,
              },
            });
          }

          // Check for completion
          if (data.stats.completed === data.stats.total) {
            resolve({
              level: level.elo,
              depth: level.depth,
              label: level.label,
              wins: data.stats.blackWins,
              losses: data.stats.whiteWins,
              draws: data.stats.draws,
              total: this.gamesPerLevel,
              winRate: (data.stats.blackWins / this.gamesPerLevel) * 100,
              score:
                ((data.stats.blackWins + data.stats.draws * 0.5) /
                  this.gamesPerLevel) *
                100,
            });
          }
        }
      );

      manager.start();
    });
  }

  /**
   * Uses binary search to efficiently find the appropriate ELO bracket
   * @returns {Promise<Array>} Array of test results
   */
  async estimateEloBinary() {
    let low = 0;
    let high = STOCKFISH_ELO_LEVELS.length - 1;
    const tested = [];

    while (low <= high && this.isRunning) {
      const mid = Math.floor((low + high) / 2);
      const level = STOCKFISH_ELO_LEVELS[mid];

      const result = await this.runLevelMatches(level);
      tested.push(result);

      this.notifyUpdate({
        status: "running",
        currentLevel: tested.length - 1,
        totalLevels: 8,
        currentElo: level.elo,
        results: tested,
        progress: (tested.length / 8) * 100,
      });

      // Binary search logic: adjust search range based on performance
      if (result.score > 55) {
        // LLM is stronger, search higher
        low = mid + 1;
      } else if (result.score < 45) {
        // LLM is weaker, search lower
        high = mid - 1;
      } else {
        // Found approximate bracket, could test adjacent levels for refinement
        break;
      }
    }

    return tested;
  }

  /**
   * Sends update to the callback function
   * @param {Object} data - Update data
   */
  notifyUpdate(data) {
    if (this.onUpdate) {
      this.onUpdate(data);
    }
  }

  /**
   * Stops the estimation process
   */
  stop() {
    this.isRunning = false;
  }
}
