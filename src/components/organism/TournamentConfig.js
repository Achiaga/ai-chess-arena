/**
 * Tournament configuration component
 */
export const TournamentConfig = ({
  whiteType,
  setWhiteType,
  blackType,
  setBlackType,
  numGames,
  setNumGames,
  previewMode,
  setPreviewMode,
  whiteAiConfig,
  blackAiConfig,
  isRunning,
  onStart,
  onStop,
}) => {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-400 uppercase">
            White Player
          </h3>
          <select
            value={whiteType}
            onChange={(e) => setWhiteType(e.target.value)}
            className="w-full bg-slate-900/50 border border-slate-600/50 rounded-lg px-3 py-2 text-sm"
          >
            <option value="llm">LLM ({whiteAiConfig.model})</option>
            <option value="stockfish">Stockfish Engine</option>
          </select>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-400 uppercase">
            Black Player
          </h3>
          <select
            value={blackType}
            onChange={(e) => setBlackType(e.target.value)}
            className="w-full bg-slate-900/50 border border-slate-600/50 rounded-lg px-3 py-2 text-sm"
          >
            <option value="llm">LLM ({blackAiConfig.model})</option>
            <option value="stockfish">Stockfish Engine</option>
          </select>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-400 uppercase">
            Settings
          </h3>
          <div className="flex items-center gap-4">
            <label className="text-sm text-slate-300">Matches:</label>
            <input
              type="number"
              min="1"
              max="50"
              value={numGames}
              onChange={(e) => setNumGames(parseInt(e.target.value))}
              className="w-20 bg-slate-900/50 border border-slate-600/50 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="preview-mode"
              checked={previewMode}
              onChange={(e) => setPreviewMode(e.target.checked)}
              className="w-4 h-4 bg-slate-900/50 border border-slate-600/50 rounded cursor-pointer"
            />
            <label
              htmlFor="preview-mode"
              className="text-sm text-slate-300 cursor-pointer"
            >
              Show Board Previews
            </label>
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        {!isRunning ? (
          <button
            onClick={onStart}
            className="px-6 py-2 bg-green-600 hover:bg-green-500 rounded-lg font-bold transition-all shadow-lg hover:shadow-green-500/20"
          >
            Start Tournament
          </button>
        ) : (
          <button
            onClick={onStop}
            className="px-6 py-2 bg-red-600 hover:bg-red-500 rounded-lg font-bold transition-all shadow-lg hover:shadow-red-500/20"
          >
            Stop All
          </button>
        )}
      </div>
    </>
  );
};
