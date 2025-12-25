import { Chess } from "chess.js";
import { PIECE_SYMBOLS } from "../../../constants";

export const MiniChessBoard = ({ fen }) => {
  const game = new Chess(fen);

  const rows = [];
  for (let i = 0; i < 8; i++) {
    const row = [];
    for (let j = 0; j < 8; j++) {
      const file = String.fromCharCode(97 + j);
      const rank = 8 - i;
      const square = `${file}${rank}`;

      const isLight = (i + j) % 2 === 0;
      const piece = game.get(square);

      const bgClass = isLight ? "bg-[#ebecd0]" : "bg-[#739552]";

      row.push(
        <div
          key={square}
          className={`w-full h-full flex justify-center items-center ${bgClass}`}
        >
          {piece && (
            <span
              className="text-[10px] select-none"
              style={{
                color: piece.color === "w" ? "#ffffff" : "#000000",
                filter:
                  piece.color === "w"
                    ? "drop-shadow(0 1px 1px rgba(0,0,0,0.6))"
                    : "drop-shadow(0 1px 1px rgba(255,255,255,0.4))",
              }}
            >
              {PIECE_SYMBOLS[piece.type]}
            </span>
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
    <div className="w-full aspect-square border-2 border-[#312e2b] rounded overflow-hidden flex flex-col bg-[#312e2b]">
      {rows}
    </div>
  );
};
