import { MiniChessBoard } from "../atoms/mini-chess-board";

export const MatchList = ({ matches, previewMode }) => {
  if (matches.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
      {matches.map((match) => (
        <div
          key={match.id}
          className="bg-slate-800/30 p-4 rounded-xl border border-slate-700/30 flex flex-col gap-3"
        >
          <div className="flex justify-between items-center">
            <span className="font-bold text-slate-300">Match #{match.id}</span>
            <span
              className={`text-xs px-2 py-1 rounded-full ${
                match.status === "completed"
                  ? "bg-green-500/20 text-green-400"
                  : match.status === "active"
                  ? "bg-blue-500/20 text-blue-400"
                  : "bg-slate-700 text-slate-400"
              }`}
            >
              {match.status}
            </span>
          </div>

          {previewMode && match.fen && (
            <div className="w-full max-w-[200px] mx-auto">
              <MiniChessBoard fen={match.fen} />
            </div>
          )}

          <div className="text-xs text-slate-400">Moves: {match.moveCount}</div>

          {match.status === "completed" && (
            <>
              <div
                className={`mt-2 p-3 rounded-lg text-center font-bold ${
                  match.winner === "white"
                    ? "bg-white/10 border-2 border-white/30"
                    : match.winner === "black"
                    ? "bg-slate-900/50 border-2 border-slate-500"
                    : "bg-slate-700/30 border-2 border-slate-600"
                }`}
              >
                {match.winner === "white"
                  ? "⚪ White Won 1-0"
                  : match.winner === "black"
                  ? "⚫ Black Won 0-1"
                  : "🤝 Draw 1/2-1/2"}
              </div>

              {match.performance && (
                <div className="mt-2 p-3 bg-slate-900/30 rounded-lg space-y-2">
                  <div className="text-xs font-bold text-slate-300 uppercase">
                    Performance
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="space-y-1">
                      <div className="text-slate-400">White Score:</div>
                      <div className="font-bold text-white">
                        {match.performance.whiteScore}%
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-slate-400">Black Score:</div>
                      <div className="font-bold text-slate-200">
                        {match.performance.blackScore}%
                      </div>
                    </div>
                  </div>
                  {match.performance.advantage && (
                    <div className="pt-2 border-t border-slate-700/50">
                      <div className="text-xs text-center">
                        <span
                          className={`font-bold ${
                            match.performance.advantage > 0
                              ? "text-green-400"
                              : "text-red-400"
                          }`}
                        >
                          {match.performance.advantage > 0 ? "White" : "Black"}{" "}
                          played {Math.abs(match.performance.advantage)}% better
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      ))}
    </div>
  );
};
