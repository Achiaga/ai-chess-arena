import { useState, useRef } from "react";
import { TournamentManager } from "../../managers/TournamentManager";
import { EloEstimator } from "../../managers/EloEstimator";
import { MiniChessBoard } from "../atoms/mini-chess-board";
import { TournamentConfig } from "./TournamentConfig";
import { EloEstimationConfig } from "./EloEstimationConfig";
import { EloEstimationResults } from "./EloEstimationResults";
import { TournamentResults } from "./TournamentResults";
import { MatchList } from "./MatchList";

/**
 * Arena component for running tournaments and ELO estimations
 */
export const ArenaView = ({
  whiteAiConfig,
  blackAiConfig,
  groqApiKey,
  openAiApiKey,
}) => {
  // Tournament state
  const [numGames, setNumGames] = useState(10);
  const [whiteType, setWhiteType] = useState("llm");
  const [blackType, setBlackType] = useState("llm");
  const [matches, setMatches] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    whiteWins: 0,
    blackWins: 0,
    draws: 0,
  });

  // ELO estimation state
  const [eloPlayer, setEloPlayer] = useState("white");
  const [gamesPerLevel, setGamesPerLevel] = useState(3);
  const [eloEstimation, setEloEstimation] = useState(null);
  const [eloProgress, setEloProgress] = useState(null);
  const [eloPreviewFen, setEloPreviewFen] = useState(null);

  // Shared state
  const [isRunning, setIsRunning] = useState(false);
  const [arenaMode, setArenaMode] = useState("tournament");
  const [previewMode, setPreviewMode] = useState(true);

  const managerRef = useRef(null);
  const eloEstimatorRef = useRef(null);

  /**
   * Creates player configuration based on type and AI config
   */
  const createPlayerConfig = (type, aiConfig) => {
    if (type === "stockfish") {
      return { type: "stockfish" };
    }
    return {
      type: "llm",
      provider: aiConfig.provider,
      model: aiConfig.model,
      apiKey: aiConfig.provider === "groq" ? groqApiKey : openAiApiKey,
    };
  };

  /**
   * Starts a tournament
   */
  const handleStartTournament = () => {
    const wConfig = createPlayerConfig(whiteType, whiteAiConfig);
    const bConfig = createPlayerConfig(blackType, blackAiConfig);

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

  /**
   * Starts ELO estimation
   */
  const handleStartEloEstimation = () => {
    const llmConfig = createPlayerConfig(
      "llm",
      eloPlayer === "white" ? whiteAiConfig : blackAiConfig
    );

    eloEstimatorRef.current = new EloEstimator(
      llmConfig,
      gamesPerLevel,
      (data) => {
        // Live board preview
        if (data.preview?.fen) setEloPreviewFen(data.preview.fen);

        // Running update
        if (data.status === "running") setEloProgress(data);

        // Completed
        if (data.status === "completed") {
          setEloEstimation(data.estimate);
          setEloProgress(null);
          setEloPreviewFen(null);
          setIsRunning(false);
        }
      }
    );

    setIsRunning(true);
    setEloEstimation(null);
    setEloProgress({ progress: 0, currentLevel: 0, totalLevels: 8 });
    eloEstimatorRef.current.start();
  };

  /**
   * Stops all running processes
   */
  const handleStop = () => {
    managerRef.current?.stopAll?.();
    eloEstimatorRef.current?.stop?.();
    setIsRunning(false);
  };

  return (
    <div className="flex flex-col gap-6 w-full h-full overflow-y-auto p-2">
      {/* Arena Header */}
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

        {/* Configuration Section */}
        {arenaMode === "tournament" ? (
          <TournamentConfig
            whiteType={whiteType}
            setWhiteType={setWhiteType}
            blackType={blackType}
            setBlackType={setBlackType}
            numGames={numGames}
            setNumGames={setNumGames}
            previewMode={previewMode}
            setPreviewMode={setPreviewMode}
            whiteAiConfig={whiteAiConfig}
            blackAiConfig={blackAiConfig}
            isRunning={isRunning}
            onStart={handleStartTournament}
            onStop={handleStop}
          />
        ) : (
          <EloEstimationConfig
            eloPlayer={eloPlayer}
            setEloPlayer={setEloPlayer}
            gamesPerLevel={gamesPerLevel}
            setGamesPerLevel={setGamesPerLevel}
            whiteAiConfig={whiteAiConfig}
            blackAiConfig={blackAiConfig}
            isRunning={isRunning}
            onStart={handleStartEloEstimation}
            onStop={handleStop}
          />
        )}
      </div>

      {/* ELO Estimation Results */}
      {arenaMode === "elo_estimation" && (
        <EloEstimationResults
          eloEstimation={eloEstimation}
          eloProgress={eloProgress}
          eloPlayer={eloPlayer}
          whiteAiConfig={whiteAiConfig}
          blackAiConfig={blackAiConfig}
          gamesPerLevel={gamesPerLevel}
        />
      )}

      {/* Live Preview for ELO Estimation */}
      {arenaMode === "elo_estimation" && previewMode && eloPreviewFen && (
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 shadow-xl">
          <h4 className="text-sm font-bold text-slate-400 uppercase mb-2">
            Live Match Preview
          </h4>
          <div className="max-w-[220px] mx-auto">
            <MiniChessBoard fen={eloPreviewFen} />
          </div>
        </div>
      )}

      {/* Tournament Results */}
      {arenaMode === "tournament" && (
        <>
          <TournamentResults
            stats={stats}
            matches={matches}
            whiteAiConfig={whiteAiConfig}
            blackAiConfig={blackAiConfig}
          />
          <MatchList matches={matches} previewMode={previewMode} />
        </>
      )}
    </div>
  );
};
