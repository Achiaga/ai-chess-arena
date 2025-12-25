import { useState } from "react";
import { ArenaView } from "./components/organism/Arena";
import { VersusView } from "./components/organism/VersusView";
import { AiEloEstimation } from "./components/organism/AiEloEstimation";
import { Navbar } from "./components/atoms/navbar";

function App() {
  const [mode, setMode] = useState("versus");
  const [whiteAiConfig, setWhiteAiConfig] = useState({
    provider: localStorage.getItem("white_ai_provider") || "groq",
    model: localStorage.getItem("white_ai_model") || "llama3-70b-8192",
  });
  const [blackAiConfig, setBlackAiConfig] = useState({
    provider: localStorage.getItem("black_ai_provider") || "openai",
    model: localStorage.getItem("black_ai_model") || "gpt-4o-mini",
  });
  const [groqApiKey, setGroqApiKey] = useState(
    localStorage.getItem("groq_api_key") || ""
  );
  const [openAiApiKey, setOpenAiApiKey] = useState(
    localStorage.getItem("openai_api_key") || ""
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-100 font-sans p-4 md:p-6 flex flex-col">
      <Navbar
        setMode={setMode}
        mode={mode}
        groqApiKey={groqApiKey}
        openAiApiKey={openAiApiKey}
        setGroqApiKey={setGroqApiKey}
        setOpenAiApiKey={setOpenAiApiKey}
      />

      <main className="flex-1 flex flex-col lg:flex-row gap-6 max-w-[1800px] mx-auto w-full">
        {mode === "versus" ? (
          <VersusView
            whiteAiConfig={whiteAiConfig}
            blackAiConfig={blackAiConfig}
            setWhiteAiConfig={setWhiteAiConfig}
            setBlackAiConfig={setBlackAiConfig}
            groqApiKey={groqApiKey}
            openAiApiKey={openAiApiKey}
          />
        ) : mode === "ai-arena" ? (
          <ArenaView
            whiteAiConfig={whiteAiConfig}
            blackAiConfig={blackAiConfig}
            groqApiKey={groqApiKey}
            openAiApiKey={openAiApiKey}
          />
        ) : mode === "elo-estimation" ? (
          <AiEloEstimation
            whiteAiConfig={whiteAiConfig}
            blackAiConfig={blackAiConfig}
            groqApiKey={groqApiKey}
            openAiApiKey={openAiApiKey}
          />
        ) : (
          <>No mode Selected</>
        )}
      </main>

      <footer className="mt-6 text-center text-xs text-slate-500">
        <p>Powered by Stockfish • chess.js • Groq/OpenAI AI</p>
      </footer>
    </div>
  );
}

export default App;
