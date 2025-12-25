import React, { useState, useEffect, useRef } from "react";
import { TournamentManager } from "../managers/TournamentManager";

const TournamentView = ({
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

  const startTournament = () => {
    if (isRunning) return;

    // Prepare configs
    const wConfig = {
      type: "llm", // Defaulting to LLM for now based on props, but could be selectable
      provider: whiteAiConfig.provider,
      model: whiteAiConfig.model,
      apiKey: whiteAiConfig.provider === "groq" ? groqApiKey : openAiApiKey,
    };

    // Check if user wants Stockfish for one side?
    // For now, let's assume the passed configs are what we use,
    // but we might want to add a selector in this view for "Stockfish" vs "LLM"
    // The current App.js structure has "mode" which implies 1v1.
    // Here we might want to override.

    // Let's add local selectors for the tournament specifically to be safe.
  };

  // Local state for tournament configuration
  const [whiteType, setWhiteType] = useState("llm");
  const [blackType, setBlackType] = useState("llm"); // or 'stockfish'

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

  const handleStop = () => {
    if (managerRef.current) {
      managerRef.current.stopAll();
      setIsRunning(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full h-full overflow-y-auto p-2">
      {/* Configuration Panel */}
      <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50 shadow-xl">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          🏆 Tournament Arena
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* White Config */}
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

          {/* Black Config */}
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

          {/* Settings */}
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
      </div>

      {/* Stats Panel */}
      {matches.length > 0 && (
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
      )}

      {/* Matches Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {matches.map((match) => (
          <div
            key={match.id}
            className="bg-slate-800/30 p-4 rounded-xl border border-slate-700/30 flex flex-col gap-2"
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

            <div className="text-xs text-slate-400">
              Moves: {match.moveCount}
            </div>

            {match.status === "completed" && (
              <div className="mt-2 p-2 bg-slate-900/50 rounded text-center font-bold">
                {match.winner === "white"
                  ? "White Won 1-0"
                  : match.winner === "black"
                  ? "Black Won 0-1"
                  : "Draw 1/2-1/2"}
              </div>
            )}

            {/* Mini Board Visualization could go here, but maybe overkill for 10 matches */}
            <div className="text-[10px] text-slate-500 truncate font-mono">
              {match.fen}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TournamentView;
