import { useState } from "react";
import { PIECE_SYMBOLS } from "../../../constants";

export const ChessBoard = ({
  game,
  onMove,
  orientation = "w",
  lastMove,
  checkSquare,
  disabled = false,
}) => {
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [optionSquares, setOptionSquares] = useState({});

  const getMoveOptions = (square) => {
    const moves = game.moves({ square, verbose: true });
    if (moves.length === 0) return false;

    const newOptions = {};
    moves.forEach((move) => {
      newOptions[move.to] = {
        background:
          game.get(move.to) &&
          game.get(move.to).color !== game.get(square).color
            ? "radial-gradient(circle, rgba(239,68,68,0.5) 85%, transparent 85%)"
            : "radial-gradient(circle, rgba(34,197,94,0.5) 30%, transparent 30%)",
        borderRadius: "50%",
      };
    });
    return newOptions;
  };

  const onSquareClick = (square) => {
    if (disabled) return;

    if (selectedSquare) {
      const move = { from: selectedSquare, to: square, promotion: "q" };

      try {
        const result = onMove(move);
        if (result) {
          setSelectedSquare(null);
          setOptionSquares({});
          return;
        }
      } catch (e) {
        console.error(e);
      }
    }

    const piece = game.get(square);
    if (piece && piece.color === game.turn()) {
      const options = getMoveOptions(square);
      if (options) {
        setSelectedSquare(square);
        setOptionSquares(options);
        return;
      }
    }

    setSelectedSquare(null);
    setOptionSquares({});
  };

  const rows = [];
  for (let i = 0; i < 8; i++) {
    const row = [];
    for (let j = 0; j < 8; j++) {
      const r = orientation === "w" ? i : 7 - i;
      const c = orientation === "w" ? j : 7 - j;

      const file = String.fromCharCode(97 + c);
      const rank = 8 - r;
      const square = `${file}${rank}`;

      const isLight = (r + c) % 2 === 0;
      const piece = game.get(square);

      const isSelected = selectedSquare === square;
      const isOption = optionSquares[square];
      const isLastMove =
        lastMove && (lastMove.from === square || lastMove.to === square);
      const isCheck = checkSquare === square;

      let bgClass = isLight ? "bg-[#ebecd0]" : "bg-[#739552]";
      if (isLastMove) bgClass = isLight ? "bg-[#cdd26a]" : "bg-[#aaa23a]";
      if (isCheck) bgClass = "bg-gradient-to-br from-red-500 to-red-600";

      row.push(
        <div
          key={square}
          onClick={() => onSquareClick(square)}
          className={`w-full h-full flex justify-center items-center relative transition-all duration-200 ${
            disabled ? "cursor-not-allowed" : "cursor-pointer"
          } ${bgClass} ${
            isSelected ? "ring-4 ring-yellow-400 ring-inset z-10" : ""
          } hover:brightness-110`}
        >
          {c === 0 && (
            <span
              className={`absolute top-0.5 left-1 text-[11px] font-bold ${
                isLight ? "text-[#739552]" : "text-[#ebecd0]"
              }`}
            >
              {rank}
            </span>
          )}
          {r === 7 && (
            <span
              className={`absolute bottom-0.5 right-1 text-[11px] font-bold ${
                isLight ? "text-[#739552]" : "text-[#ebecd0]"
              }`}
            >
              {file}
            </span>
          )}

          {piece && (
            <span
              className={`text-5xl md:text-6xl select-none transition-transform duration-150 ${
                isSelected ? "scale-110" : "hover:scale-105"
              }`}
              style={{
                filter:
                  piece.color === "w"
                    ? "drop-shadow(0 2px 3px rgba(0,0,0,0.6))"
                    : "drop-shadow(0 2px 3px rgba(255,255,255,0.4))",
                color: piece.color === "w" ? "#ffffff" : "#000000",
              }}
            >
              {PIECE_SYMBOLS[piece.type]}
            </span>
          )}

          {isOption && (
            <div
              className="absolute pointer-events-none transition-all duration-150"
              style={{
                width: piece ? "85%" : "30%",
                height: piece ? "85%" : "30%",
                background: isOption.background,
                borderRadius: isOption.borderRadius,
              }}
            ></div>
          )}
        </div>
      );
    }
    rows.push(
      <div key={i} className="grid grid-cols-8 w-full h-[12.5%]">
        {row}
      </div>
    );
  }

  return (
    <div className="w-full max-w-[640px] aspect-square border-8 border-[#312e2b] rounded-xl overflow-hidden shadow-2xl flex flex-col bg-[#312e2b]">
      {rows}
    </div>
  );
};
