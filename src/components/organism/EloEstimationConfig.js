/**
 * ELO Estimation configuration component
 */
export const EloEstimationConfig = ({
  eloPlayer,
  setEloPlayer,
  gamesPerLevel,
  setGamesPerLevel,
  whiteAiConfig,
  blackAiConfig,
  isRunning,
  onStart,
  onStop,
}) => {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-400 uppercase">
            Player to Estimate
          </h3>
          <select
            value={eloPlayer}
            onChange={(e) => setEloPlayer(e.target.value)}
            className="w-full bg-slate-900/50 border border-slate-600/50 rounded-lg px-3 py-2 text-sm"
          >
            <option value="white">White LLM ({whiteAiConfig.model})</option>
            <option value="black">Black LLM ({blackAiConfig.model})</option>
          </select>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-400 uppercase">
            Games per Level
          </h3>
          <input
            type="number"
            min="1"
            max="10"
            value={gamesPerLevel}
            onChange={(e) => setGamesPerLevel(parseInt(e.target.value))}
            className="w-full bg-slate-900/50 border border-slate-600/50 rounded-lg px-3 py-2 text-sm"
          />
          <p className="text-xs text-slate-500">
            Total games: {gamesPerLevel * 8} (8 difficulty levels)
          </p>
        </div>
      </div>

      <div className="flex gap-4">
        {!isRunning ? (
          <button
            onClick={onStart}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg font-bold transition-all shadow-lg hover:shadow-purple-500/20"
          >
            Start ELO Estimation
          </button>
        ) : (
          <button
            onClick={onStop}
            className="px-6 py-2 bg-red-600 hover:bg-red-500 rounded-lg font-bold transition-all shadow-lg hover:shadow-red-500/20"
          >
            Stop
          </button>
        )}
      </div>
    </>
  );
};
