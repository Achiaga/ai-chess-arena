import { useState, useRef } from "react";
import { Chess } from "chess.js";

/**
 * Custom hook for managing chess game state and moves
 */
export const useChessGame = () => {
  const [game, setGame] = useState(new Chess());
  const [fen, setFen] = useState(game.fen());
  const [status, setStatus] = useState("White to move");
  const [lastMove, setLastMove] = useState(null);
  const [checkSquare, setCheckSquare] = useState(null);
  const [moveHistory, setMoveHistory] = useState([]);
  const [capturedPieces, setCapturedPieces] = useState({ w: [], b: [] });

  const gameRef = useRef(game);

  /**
   * Updates game state and derived values
   */
  const updateGameState = (newGame) => {
    setGame(newGame);
    setFen(newGame.fen());
    gameRef.current = newGame;

    // Update status message
    let s = "";
    if (newGame.isCheckmate())
      s = `Checkmate! ${newGame.turn() === "w" ? "Black" : "White"} wins! 🏆`;
    else if (newGame.isDraw()) s = "Draw! 🤝";
    else if (newGame.isCheck())
      s = `${newGame.turn() === "w" ? "White" : "Black"} is in check! ⚠️`;
    else s = `${newGame.turn() === "w" ? "White" : "Black"} to move`;
    setStatus(s);

    // Update check square
    if (newGame.inCheck()) {
      const board = newGame.board();
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const p = board[r][c];
          if (p && p.type === "k" && p.color === newGame.turn()) {
            const file = String.fromCharCode(97 + c);
            const rank = 8 - r;
            setCheckSquare(`${file}${rank}`);
            break;
          }
        }
      }
    } else {
      setCheckSquare(null);
    }
  };

  /**
   * Makes a move on the board
   */
  const makeMove = (move) => {
    const newGame = new Chess(gameRef.current.fen());
    try {
      const result = newGame.move(move);
      if (result) {
        setLastMove({ from: result.from, to: result.to });

        // Track captured pieces
        if (result.captured) {
          setCapturedPieces((prev) => ({
            ...prev,
            [result.color === "w" ? "b" : "w"]: [
              ...prev[result.color === "w" ? "b" : "w"],
              result.captured,
            ],
          }));
        }

        // Update move history
        setMoveHistory((prev) => [...prev, result.san]);

        updateGameState(newGame);
        return true;
      }
    } catch (e) {
      console.error("Move error:", e);
      return false;
    }
    return false;
  };

  /**
   * Resets the game to initial state
   */
  const resetGame = () => {
    const newGame = new Chess();
    updateGameState(newGame);
    setLastMove(null);
    setMoveHistory([]);
    setCapturedPieces({ w: [], b: [] });
  };

  return {
    game,
    gameRef,
    fen,
    status,
    lastMove,
    setLastMove,
    checkSquare,
    setCheckSquare,
    moveHistory,
    setMoveHistory,
    capturedPieces,
    setCapturedPieces,
    makeMove,
    resetGame,
    updateGameState,
  };
};
