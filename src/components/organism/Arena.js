import { useState, useRef } from "react";
import { TournamentManager } from "../../managers/TournamentManager";
import { EloEstimator } from "../../managers/EloEstimator";
import { MiniChessBoard } from "../atoms/MiniChessBoard";

export const ArenaView = ({
  whiteAiConfig,
  blackAiConfig,
  groqApiKey,
  openAiApiKey,
}) => {
  const [numGames, setNumGames] = useState(10);
  const [isRunning, setIsRunning] = useState(false);
  const [matches, setMatches] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    whiteWins: 0,
    blackWins: 0,
    draws: 0,
  });

  const managerRef = useRef(null);
  const eloEstimatorRef = useRef(null);

  const [arenaMode, setArenaMode] = useState("tournament");
  const [whiteType, setWhiteType] = useState("llm");
  const [blackType, setBlackType] = useState("llm");
  const [previewMode, setPreviewMode] = useState(true);

  const [eloPlayer, setEloPlayer] = useState("white");
  const [gamesPerLevel, setGamesPerLevel] = useState(3);
  const [eloEstimation, setEloEstimation] = useState(null);
  const [eloProgress, setEloProgress] = useState(null);

  console.log({ eloPlayer });
  console.log({ whiteType });
  console.log({ whiteAiConfig });

  const handleStart = () => {
    const wConfig =
      whiteType === "stockfish"
        ? { type: "stockfish" }
        : {
            type: "llm",
            provider: whiteAiConfig.provider,
            model: whiteAiConfig.model,
            apiKey:
              whiteAiConfig.provider === "groq" ? groqApiKey : openAiApiKey,
          };

    const bConfig =
      blackType === "stockfish"
        ? { type: "stockfish" }
        : {
            type: "llm",
            provider: blackAiConfig.provider,
            model: blackAiConfig.model,
            apiKey:
              blackAiConfig.provider === "groq" ? groqApiKey : openAiApiKey,
          };

    managerRef.current = new TournamentManager(
      { numGames, whiteConfig: wConfig, blackConfig: bConfig },
      (data) => {
        setMatches(data.matches);
        setStats(data.stats);
        if (data.stats.completed === data.stats.total) {
          setIsRunning(false);
        }
      }
    );

    setIsRunning(true);
    managerRef.current.start();
  };

  const handleStartEloEstimation = () => {
    const llmConfig =
      eloPlayer === "white"
        ? {
            type: "llm",
            provider: whiteAiConfig.provider,
            model: whiteAiConfig.model,
            apiKey:
              whiteAiConfig.provider === "groq" ? groqApiKey : openAiApiKey,
          }
        : {
            type: "llm",
            provider: blackAiConfig.provider,
            model: blackAiConfig.model,
            apiKey:
              blackAiConfig.provider === "groq" ? groqApiKey : openAiApiKey,
          };

    eloEstimatorRef.current = new EloEstimator(
      llmConfig,
      gamesPerLevel,
      (data) => {
        if (data.status === "running") {
          setEloProgress(data);
        } else if (data.status === "completed") {
          setEloEstimation(data.estimate);
          setEloProgress(null);
          setIsRunning(false);
        }
      }
    );

    setIsRunning(true);
    setEloEstimation(null);
    setEloProgress({ progress: 0, currentLevel: 0, totalLevels: 8 });
    eloEstimatorRef.current.start();
  };

  const handleStop = () => {
    if (managerRef.current) {
      managerRef.current.stopAll();
    }
    if (eloEstimatorRef.current) {
      eloEstimatorRef.current.stop();
    }
    setIsRunning(false);
  };

  return (
    <div className="flex flex-col gap-6 w-full h-full overflow-y-auto p-2">
      <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50 shadow-xl">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          🏆 Arena
        </h2>

        {/* Mode Selector */}
        <div className="mb-6">
          <label className="text-sm font-bold text-slate-400 uppercase mb-2 block">
            Arena Mode
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setArenaMode("tournament")}
              className={`px-4 py-3 rounded-lg font-bold transition-all ${
                arenaMode === "tournament"
                  ? "bg-blue-600 text-white shadow-lg"
                  : "bg-slate-700/50 text-slate-300 hover:bg-slate-700"
              }`}
            >
              🏆 Tournament
            </button>
            <button
              onClick={() => setArenaMode("elo_estimation")}
              className={`px-4 py-3 rounded-lg font-bold transition-all ${
                arenaMode === "elo_estimation"
                  ? "bg-blue-600 text-white shadow-lg"
                  : "bg-slate-700/50 text-slate-300 hover:bg-slate-700"
              }`}
            >
              📊 ELO Estimation
            </button>
          </div>
        </div>

        {arenaMode === "tournament" ? (
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
                  onClick={handleStart}
                  className="px-6 py-2 bg-green-600 hover:bg-green-500 rounded-lg font-bold transition-all shadow-lg hover:shadow-green-500/20"
                >
                  Start Tournament
                </button>
              ) : (
                <button
                  onClick={handleStop}
                  className="px-6 py-2 bg-red-600 hover:bg-red-500 rounded-lg font-bold transition-all shadow-lg hover:shadow-red-500/20"
                >
                  Stop All
                </button>
              )}
            </div>
          </>
        ) : (
          <>
            {/* ELO Estimation Configuration */}
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
                  <option value="white">
                    White LLM ({whiteAiConfig.model})
                  </option>
                  <option value="black">
                    Black LLM ({blackAiConfig.model})
                  </option>
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
                  onClick={handleStartEloEstimation}
                  className="px-6 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg font-bold transition-all shadow-lg hover:shadow-purple-500/20"
                >
                  Start ELO Estimation
                </button>
              ) : (
                <button
                  onClick={handleStop}
                  className="px-6 py-2 bg-red-600 hover:bg-red-500 rounded-lg font-bold transition-all shadow-lg hover:shadow-red-500/20"
                >
                  Stop
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {/* ELO Estimation Progress */}
      {eloProgress && (
        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50 shadow-xl">
          <h3 className="text-lg font-bold mb-4">Estimation in Progress...</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>
                  Testing Level {eloProgress.currentLevel + 1} of{" "}
                  {eloProgress.totalLevels}
                </span>
                <span>{Math.round(eloProgress.progress)}%</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-3">
                <div
                  className="bg-blue-500 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${eloProgress.progress}%` }}
                ></div>
              </div>
            </div>
            {eloProgress.currentElo && (
              <p className="text-sm text-slate-400">
                Current test: ~{eloProgress.currentElo} ELO
              </p>
            )}
          </div>
        </div>
      )}

      {/* ELO Estimation Results */}
      {eloEstimation && (
        <div className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 rounded-xl p-6 border-2 border-purple-500/30 shadow-2xl">
          <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
            🔮​ ELO Estimation Complete
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-slate-800/50 p-6 rounded-xl text-center">
              <div className="text-sm text-slate-400 uppercase mb-2">
                LLM Model
              </div>
              <div className="text-3xl font-bold text-purple-400">
                {eloPlayer === "white"
                  ? whiteAiConfig.model
                  : blackAiConfig.model}
              </div>
            </div>

            <div className="bg-slate-800/50 p-6 rounded-xl text-center">
              <div className="text-sm text-slate-400 uppercase mb-2">
                Estimated ELO
              </div>
              <div className="text-5xl font-bold text-purple-400">
                {eloEstimation.elo}
              </div>
            </div>

            <div className="bg-slate-800/50 p-6 rounded-xl text-center">
              <div className="text-sm text-slate-400 uppercase mb-2">
                Confidence Range
              </div>
              <div className="text-2xl font-bold text-blue-400">
                ± {eloEstimation.range}
              </div>
              <div className="text-xs text-slate-500 mt-2">
                {eloEstimation.elo - eloEstimation.range} -{" "}
                {eloEstimation.elo + eloEstimation.range}
              </div>
            </div>

            <div className="bg-slate-800/50 p-6 rounded-xl text-center">
              <div className="text-sm text-slate-400 uppercase mb-2">
                Confidence
              </div>
              <div className="text-2xl font-bold text-green-400">
                {Math.round(eloEstimation.confidence)}%
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-slate-800/30 rounded-lg">
            <p className="text-sm text-slate-300 text-center">
              Based on performance across 8 difficulty levels ({gamesPerLevel}{" "}
              games each)
            </p>
          </div>
        </div>
      )}

      {arenaMode === "tournament" && matches.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 text-center">
              <div className="text-2xl font-bold text-blue-400">
                {stats.completed} / {stats.total}
              </div>
              <div className="text-xs text-slate-400 uppercase">Completed</div>
            </div>
            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 text-center">
              <div className="text-2xl font-bold text-white">
                {stats.whiteWins}
              </div>
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
              <div className="text-2xl font-bold text-slate-400">
                {stats.draws}
              </div>
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
                          <span className="text-sm text-slate-400">White:</span>
                          <span className="text-lg font-bold text-white">
                            {avgWhite}%
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-400">Black:</span>
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
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
        {matches.map((match) => (
          <div
            key={match.id}
            className="bg-slate-800/30 p-4 rounded-xl border border-slate-700/30 flex flex-col gap-3"
          >
            <div className="flex justify-between items-center">
              <span className="font-bold text-slate-300">
                Match #{match.id}
              </span>
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

            <div className="text-xs text-slate-400">
              Moves: {match.moveCount}
            </div>

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
                            {match.performance.advantage > 0
                              ? "White"
                              : "Black"}{" "}
                            played {Math.abs(match.performance.advantage)}%
                            better
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
    </div>
  );
};
