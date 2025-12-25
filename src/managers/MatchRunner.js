import { Chess } from "chess.js";

export class MatchRunner {
  constructor(id, whiteEngine, blackEngine, onUpdate) {
    this.id = id;
    this.whiteEngine = whiteEngine;
    this.blackEngine = blackEngine;
    this.game = new Chess();
    this.onUpdate = onUpdate; // Callback for UI updates
    this.history = [];
    this.status = "pending"; // pending, active, completed
    this.result = null; // 1-0, 0-1, 1/2-1/2
    this.winner = null; // white, black, draw
    this.moveCount = 0;
    this.analysis = {
      white: { good: 0, bad: 0, blunders: 0, totalMoves: 0 },
      black: { good: 0, bad: 0, blunders: 0, totalMoves: 0 },
    };
    this.performance = null;
  }

  async start() {
    this.status = "active";
    this.notifyUpdate();

    try {
      while (!this.game.isGameOver()) {
        const turn = this.game.turn();
        const engine = turn === "w" ? this.whiteEngine : this.blackEngine;

        let move;
        if (engine.constructor.name === "StockfishEngine") {
          // Stockfish returns UCI (e.g., "e2e4")
          const uciMove = await engine.getBestMove(this.game.fen());
          move = {
            from: uciMove.substring(0, 2),
            to: uciMove.substring(2, 4),
            promotion: uciMove.length > 4 ? uciMove.substring(4, 5) : "q",
          };
        } else {
          // LLM returns SAN (e.g., "Nf3")
          const sanMove = await engine.getMove(
            this.game.fen(),
            this.game.pgn(),
            this.game.moves(),
            turn
          );
          move = sanMove;
        }

        try {
          const result = this.game.move(move);
          if (result) {
            this.history.push(result.san);
            this.moveCount++;
            this.notifyUpdate();

            // Optional: Analyze move quality here if we have a reference engine (Stockfish)
            // For now, we skip real-time analysis to save resources, or we could add it later.
          } else {
            console.error(`Match ${this.id}: Invalid move ${move} by ${turn}`);
            break; // End game on invalid move
          }
        } catch (e) {
          console.error(`Match ${this.id}: Move error`, e);
          break;
        }

        // Small delay to prevent freezing UI if running many sync tasks (though engines are async)
        await new Promise((r) => setTimeout(r, 100));
      }

      this.finish();
    } catch (e) {
      console.error(`Match ${this.id} failed:`, e);
      this.status = "error";
      this.notifyUpdate();
    }
  }

  finish() {
    this.status = "completed";
    if (this.game.isCheckmate()) {
      this.winner = this.game.turn() === "w" ? "black" : "white";
      this.result = this.winner === "white" ? "1-0" : "0-1";
    } else if (this.game.isDraw()) {
      this.winner = "draw";
      this.result = "1/2-1/2";
    } else {
      // Unknown end (e.g. invalid move)
      this.winner = this.game.turn() === "w" ? "black" : "white"; // Assume loss on invalid
      this.result = this.winner === "white" ? "1-0" : "0-1";
    }

    // Calculate performance statistics
    this.calculatePerformance();

    this.notifyUpdate();
  }

  calculatePerformance() {
    // Simple performance calculation based on move count and result
    // In a real implementation, you'd analyze move quality with an engine

    const totalMoves = this.moveCount;
    if (totalMoves === 0) return;

    // Assign moves to each player
    const whiteMoves = Math.ceil(totalMoves / 2);
    const blackMoves = Math.floor(totalMoves / 2);

    // Base score on result
    let whiteBaseScore = 50;
    let blackBaseScore = 50;

    if (this.winner === "white") {
      whiteBaseScore = 70;
      blackBaseScore = 30;
    } else if (this.winner === "black") {
      whiteBaseScore = 30;
      blackBaseScore = 70;
    }

    // Adjust for game length (shorter wins = better performance)
    const lengthFactor = Math.max(0, (50 - totalMoves) / 50);

    if (this.winner === "white") {
      whiteBaseScore += lengthFactor * 20;
    } else if (this.winner === "black") {
      blackBaseScore += lengthFactor * 20;
    }

    // Ensure scores are in valid range
    const whiteScore = Math.min(95, Math.max(5, Math.round(whiteBaseScore)));
    const blackScore = Math.min(95, Math.max(5, Math.round(blackBaseScore)));

    this.performance = {
      whiteScore,
      blackScore,
      advantage: whiteScore - blackScore,
    };
  }

  notifyUpdate() {
    if (this.onUpdate) {
      this.onUpdate({
        id: this.id,
        fen: this.game.fen(),
        status: this.status,
        winner: this.winner,
        moveCount: this.moveCount,
        history: this.history,
        performance: this.performance,
      });
    }
  }

  terminate() {
    if (this.whiteEngine.terminate) this.whiteEngine.terminate();
    if (this.blackEngine.terminate) this.blackEngine.terminate();
  }
}
