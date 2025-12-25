import { useState, useRef } from "react";
import { TournamentManager } from "../../managers/TournamentManager";
import { TournamentConfig } from "./TournamentConfig";
import { TournamentResults } from "./TournamentResults";
import { MatchList } from "./MatchList";

export const ArenaView = ({
  whiteAiConfig,
  blackAiConfig,
  groqApiKey,
  openAiApiKey,
}) => {
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

  const [isRunning, setIsRunning] = useState(false);
  const [previewMode, setPreviewMode] = useState(true);

  const managerRef = useRef(null);
  const eloEstimatorRef = useRef(null);

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

  const handleStop = () => {
    managerRef.current?.stopAll?.();
    eloEstimatorRef.current?.stop?.();
    setIsRunning(false);
  };

  return (
    <div className="flex flex-col gap-6 w-full h-full overflow-y-auto p-2">
      <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50 shadow-xl">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          🏆 AI Arena
        </h2>

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
      </div>

      <TournamentResults
        stats={stats}
        matches={matches}
        whiteAiConfig={whiteAiConfig}
        blackAiConfig={blackAiConfig}
      />
      <MatchList matches={matches} previewMode={previewMode} />
    </div>
  );
};
