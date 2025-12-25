/**
 * AiEloEstimation component - placeholder for ELO estimation functionality
 * This component is currently a placeholder and needs to be implemented
 */

import { useState, useRef } from "react";
import { EloEstimator } from "../../managers/EloEstimator";
import { MiniChessBoard } from "../atoms/mini-chess-board";
import { EloEstimationConfig } from "./EloEstimationConfig";
import { EloEstimationResults } from "./EloEstimationResults";
import { MatchList } from "./MatchList";

/**
 * Arena component for running tournaments and ELO estimations
 */
export const AiEloEstimation = ({
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
  // ELO estimation state
  const [eloPlayer, setEloPlayer] = useState("white");
  const [gamesPerLevel, setGamesPerLevel] = useState(3);
  const [eloEstimation, setEloEstimation] = useState(null);
  const [eloProgress, setEloProgress] = useState(null);
  const [eloPreviewFen, setEloPreviewFen] = useState(null);

  // Shared state
  const [isRunning, setIsRunning] = useState(false);
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
      <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50 shadow-xl">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          🔮 AI Elo Estimation
        </h2>

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
      </div>

      <EloEstimationResults
        eloEstimation={eloEstimation}
        eloProgress={eloProgress}
        eloPlayer={eloPlayer}
        whiteAiConfig={whiteAiConfig}
        blackAiConfig={blackAiConfig}
        gamesPerLevel={gamesPerLevel}
      />

      {previewMode && eloPreviewFen && (
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 shadow-xl">
          <h4 className="text-sm font-bold text-slate-400 uppercase mb-2">
            Live Match Preview
          </h4>
          <div className="max-w-[220px] mx-auto">
            <MiniChessBoard fen={eloPreviewFen} />
          </div>
        </div>
      )}
    </div>
  );
};
