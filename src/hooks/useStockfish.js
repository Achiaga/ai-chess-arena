import { useState, useEffect, useRef } from "react";
import { STOCKFISH_URL } from "../constants";

/**
 * Custom hook for Stockfish engine integration
 */
export const useStockfish = (gameRef) => {
  const [evalScore, setEvalScore] = useState("0.00");
  const [stockfishDepth, setStockfishDepth] = useState(10);
  const stockfishRef = useRef(null);
  const awaitingMoveRef = useRef(false);

  // Initialize Stockfish worker
  useEffect(() => {
    const initStockfish = async () => {
      try {
        const response = await fetch(STOCKFISH_URL);
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);

        const worker = new Worker(blobUrl);
        worker.onmessage = (event) => {
          const line = event.data;

          // Handle best move
          if (line.startsWith("bestmove")) {
            const move = line.split(" ")[1];
            if (move && awaitingMoveRef.current) {
              awaitingMoveRef.current = false;
              // Callback will be set by triggerStockfishMove
              if (stockfishRef.current.moveCallback) {
                stockfishRef.current.moveCallback(move);
              }
            }
          }

          // Handle evaluation score
          if (line.includes("info") && line.includes("score cp")) {
            const match = line.match(/score cp (-?\d+)/);
            if (match) {
              const cp = parseInt(match[1]);
              const score = (gameRef.current.turn() === "w" ? cp : -cp) / 100;
              setEvalScore(score.toFixed(2));
            }
          } else if (line.includes("score mate")) {
            const match = line.match(/score mate (-?\d+)/);
            if (match) setEvalScore(`M${match[1]}`);
          }
        };

        worker.postMessage("uci");
        stockfishRef.current = worker;
      } catch (e) {
        console.error("Stockfish init failed", e);
      }
    };

    initStockfish();

    return () => {
      if (stockfishRef.current) {
        stockfishRef.current.terminate();
      }
    };
  }, [gameRef]);

  /**
   * Updates Stockfish position for evaluation
   */
  const updatePosition = (fen) => {
    if (stockfishRef.current && fen) {
      stockfishRef.current.postMessage(`position fen ${fen}`);
      stockfishRef.current.postMessage("go depth 10");
    }
  };

  /**
   * Triggers Stockfish to make a move
   */
  const triggerStockfishMove = (currGame, onMove) => {
    if (awaitingMoveRef.current || !stockfishRef.current) return;

    awaitingMoveRef.current = true;
    stockfishRef.current.moveCallback = onMove;

    stockfishRef.current.postMessage(`position fen ${currGame.fen()}`);
    stockfishRef.current.postMessage(`go depth ${stockfishDepth}`);
  };

  return {
    evalScore,
    stockfishDepth,
    setStockfishDepth,
    stockfishRef,
    awaitingMoveRef,
    triggerStockfishMove,
    updatePosition,
  };
};
