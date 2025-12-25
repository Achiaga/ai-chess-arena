/**
 * Tournament results summary component
 */
export const TournamentResults = ({
  stats,
  matches,
  whiteAiConfig,
  blackAiConfig,
}) => {
  if (matches.length === 0) return null;

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 text-center">
          <div className="text-2xl font-bold text-blue-400">
            {stats.completed} / {stats.total}
          </div>
          <div className="text-xs text-slate-400 uppercase">Completed</div>
        </div>
        <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 text-center">
          <div className="text-2xl font-bold text-white">{stats.whiteWins}</div>
          <div className="text-xs text-slate-400 uppercase">White Wins</div>
        </div>
        <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 text-center">
          <div className="text-2xl font-bold text-black bg-slate-200 rounded px-2 inline-block">
            {stats.blackWins}
          </div>
          <div className="text-xs text-slate-400 uppercase mt-1">
            Black Wins
          </div>
        </div>
        <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 text-center">
          <div className="text-2xl font-bold text-slate-400">{stats.draws}</div>
          <div className="text-xs text-slate-400 uppercase">Draws</div>
        </div>
      </div>

      {stats.completed === stats.total && stats.total > 0 && (
        <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 p-6 rounded-xl border-2 border-blue-500/30 shadow-2xl">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            🏆 Tournament Complete!
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-slate-300 uppercase">
                Overall Winner
              </h4>
              <div
                className={`p-4 rounded-lg text-center font-bold text-lg ${
                  stats.whiteWins > stats.blackWins
                    ? "bg-white/20 border-2 border-white/50 text-white"
                    : stats.blackWins > stats.whiteWins
                    ? "bg-slate-900/50 border-2 border-slate-400 text-slate-200"
                    : "bg-slate-700/30 border-2 border-slate-500 text-slate-300"
                }`}
              >
                {stats.whiteWins > stats.blackWins
                  ? `⚪ White (${stats.whiteWins}-${stats.blackWins}-${stats.draws})`
                  : stats.blackWins > stats.whiteWins
                  ? `⚫ Black (${stats.blackWins}-${stats.whiteWins}-${stats.draws})`
                  : `🤝 Tied (${stats.whiteWins}-${stats.blackWins}-${stats.draws})`}
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-bold text-slate-300 uppercase">
                Average Performance
              </h4>
              {(() => {
                const completedMatches = matches.filter(
                  (m) => m.status === "completed" && m.performance
                );
                if (completedMatches.length === 0) return null;

                const avgWhite = Math.round(
                  completedMatches.reduce(
                    (sum, m) => sum + m.performance.whiteScore,
                    0
                  ) / completedMatches.length
                );
                const avgBlack = Math.round(
                  completedMatches.reduce(
                    (sum, m) => sum + m.performance.blackScore,
                    0
                  ) / completedMatches.length
                );

                return (
                  <div className="p-4 bg-slate-900/30 rounded-lg space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-400 capitalize">
                        {whiteAiConfig.model} (White)
                      </span>
                      <span className="text-lg font-bold text-white">
                        {avgWhite}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-400 capitalize">
                        {blackAiConfig.model} (Black)
                      </span>
                      <span className="text-lg font-bold text-slate-200">
                        {avgBlack}%
                      </span>
                    </div>
                    <div className="pt-2 border-t border-slate-700/50 text-center">
                      <span
                        className={`text-sm font-bold ${
                          avgWhite > avgBlack
                            ? "text-green-400"
                            : avgBlack > avgWhite
                            ? "text-red-400"
                            : "text-slate-400"
                        }`}
                      >
                        {avgWhite > avgBlack
                          ? `White performed ${
                              avgWhite - avgBlack
                            }% better overall`
                          : avgBlack > avgWhite
                          ? `Black performed ${
                              avgBlack - avgWhite
                            }% better overall`
                          : "Equal performance"}
                      </span>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
