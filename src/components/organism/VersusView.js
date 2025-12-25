import { useState, useEffect, useRef } from "react";
import { ChessBoard } from "../atoms/chess-board";
import { PIECE_SYMBOLS } from "../../constants";
import { useChessGame } from "../../hooks/useChessGame";
import { useStockfish } from "../../hooks/useStockfish";
import { useLLMPlayer } from "../../hooks/useLLMPlayer";

/**
 * VersusView component - handles all versus game modes
 * Modes: human_vs_stockfish, human_vs_llm, stockfish_vs_llm, llm_vs_llm
 */
export const VersusView = ({
  mode,
  whiteAiConfig,
  blackAiConfig,
  setWhiteAiConfig,
  setBlackAiConfig,
  groqApiKey,
  openAiApiKey,
}) => {
  const [whitePlayer, setWhitePlayer] = useState("human");
  const [blackPlayer, setBlackPlayer] = useState("stockfish");
  const [orientation, setOrientation] = useState("w");
  const [gameStarted, setGameStarted] = useState(false);
  const [coachMessages, setCoachMessages] = useState([]);
  const messagesEndRef = useRef(null);

  // Use custom hooks
  const chessGame = useChessGame();
  const stockfish = useStockfish(chessGame.gameRef);
  const llmPlayer = useLLMPlayer(chessGame.gameRef);

  // Scroll coach messages to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [coachMessages]);

  // Update Stockfish position when game changes
  useEffect(() => {
    if (!chessGame.game.isGameOver()) {
      stockfish.updatePosition(chessGame.fen);
    }
  }, [chessGame.fen, chessGame.game, stockfish]);

  // AI vs AI game loop
  useEffect(() => {
    if (chessGame.game.isGameOver() || llmPlayer.thinking) return;

    // Only auto-play if both players are AI (not human)
    const bothAI = whitePlayer !== "human" && blackPlayer !== "human";
    if (bothAI && gameStarted) {
      const timer = setTimeout(() => {
        const turn = chessGame.game.turn();
        const currentPlayer = turn === "w" ? whitePlayer : blackPlayer;

        if (currentPlayer === "stockfish") {
          handleStockfishMove();
        } else if (currentPlayer === "llm") {
          const config = turn === "w" ? whiteAiConfig : blackAiConfig;
          handleLlmMove(config);
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [
    chessGame.fen,
    whitePlayer,
    blackPlayer,
    llmPlayer.thinking,
    gameStarted,
    whiteAiConfig,
    blackAiConfig,
  ]);

  /**
   * Adds a message to the coach panel
   */
  const addCoachMessage = (msg) => {
    setCoachMessages((prev) => [...prev, { id: Date.now(), html: msg }]);
  };

  /**
   * Handles Stockfish move
   */
  const handleStockfishMove = () => {
    llmPlayer.setThinking(true);
    llmPlayer.setThinkingText("Stockfish is thinking...");

    stockfish.triggerStockfishMove(chessGame.game, (moveStr) => {
      const from = moveStr.substring(0, 2);
      const to = moveStr.substring(2, 4);
      const promotion = moveStr.length > 4 ? moveStr.substring(4, 5) : "q";
      chessGame.makeMove({ from, to, promotion });
      llmPlayer.setThinking(false);
    });
  };

  /**
   * Handles LLM move
   */
  const handleLlmMove = (config) => {
    llmPlayer.triggerLlmMove(
      config,
      groqApiKey,
      openAiApiKey,
      (moveStr) => {
        const result = chessGame.makeMove(moveStr);
        if (result) {
          addCoachMessage(`<strong>🤖 LLM played:</strong> ${moveStr}`);
        } else {
          console.error(`Invalid move from LLM: ${moveStr}`);
          addCoachMessage(
            `<strong>⚠️ LLM error:</strong> Invalid move attempted: ${moveStr}`
          );
        }
      },
      (error) => {
        addCoachMessage(`<strong>❌ API Error:</strong> ${error}`);
      }
    );
  };

  /**
   * Handles user move from the board
   */
  const onUserMove = (move) => {
    const result = chessGame.makeMove(move);

    if (result && !chessGame.game.isGameOver()) {
      // Trigger AI response if next player is AI
      const turn = chessGame.game.turn();
      const nextPlayer = turn === "w" ? whitePlayer : blackPlayer;

      if (nextPlayer === "stockfish") {
        setTimeout(() => handleStockfishMove(), 300);
      } else if (nextPlayer === "llm") {
        const config = turn === "w" ? whiteAiConfig : blackAiConfig;
        setTimeout(() => handleLlmMove(config), 300);
      }
    }

    return result;
  };

  /**
   * Resets the game
   */
  const resetGame = () => {
    stockfish.awaitingMoveRef.current = false;
    chessGame.resetGame();
    setCoachMessages([]);
    llmPlayer.setThinking(false);
    setGameStarted(false);
  };

  /**
   * Triggers AI coach analysis
   */
  const triggerCoach = async () => {
    const turn = chessGame.game.turn();
    const config = turn === "w" ? whiteAiConfig : blackAiConfig;
    const { provider, model } = config;
    const apiKey = provider === "groq" ? groqApiKey : openAiApiKey;
    const apiUrl =
      provider === "groq"
        ? "https://api.groq.com/openai/v1/chat/completions"
        : "https://api.openai.com/v1/chat/completions";

    if (!apiKey) {
      alert(`⚠️ ${provider === "groq" ? "Groq" : "OpenAI"} API Key required`);
      return;
    }
    llmPlayer.setThinking(true);
    llmPlayer.setThinkingText("Coach is analyzing...");

    const prompt = `Analyze this chess position: ${chessGame.gameRef.current.fen()}. 
Current turn: ${chessGame.gameRef.current.turn() === "w" ? "White" : "Black"}
PGN: ${chessGame.gameRef.current.pgn()}

Provide a brief analysis covering:
1. Key threats and tactical opportunities
2. Best move recommendations
3. Strategic considerations

Keep it concise (3-4 sentences).`;

    try {
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [{ role: "user", content: prompt }],
          model: model,
        }),
      });
      const data = await res.json();
      addCoachMessage(
        `<strong>🎯 Coach Analysis:</strong> ${data.choices[0].message.content}`
      );
    } catch (e) {
      addCoachMessage(`<strong>❌ Coach error:</strong> ${e.message}`);
    }
    llmPlayer.setThinking(false);
  };

  /**
   * Formats move history for display
   */
  const formatMoveHistory = () => {
    const moves = [];
    for (let i = 0; i < chessGame.moveHistory.length; i += 2) {
      moves.push({
        number: Math.floor(i / 2) + 1,
        white: chessGame.moveHistory[i],
        black: chessGame.moveHistory[i + 1] || "",
      });
    }
    return moves;
  };

  /**
   * AI Configuration Section Component
   */
  const AiConfigSection = ({ title, config, setConfig }) => (
    <div className="space-y-3 p-4 bg-slate-900/40 rounded-xl border border-slate-700/50">
      <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2">
        {title}
      </h3>
      <div className="space-y-2">
        <label className="text-[10px] font-bold text-slate-500 uppercase">
          Provider
        </label>
        <select
          value={config.provider}
          onChange={(e) => {
            const p = e.target.value;
            const newConfig = {
              provider: p,
              model: p === "groq" ? "llama3-70b-8192" : "gpt-4o-mini",
            };
            setConfig(newConfig);
            const side = title.toLowerCase().includes("white")
              ? "white"
              : "black";
            localStorage.setItem(`${side}_ai_provider`, p);
            localStorage.setItem(`${side}_ai_model`, newConfig.model);
          }}
          className="w-full bg-slate-900/50 border border-slate-600/50 rounded-lg px-3 py-2 text-xs outline-none cursor-pointer hover:border-slate-500 transition-all"
        >
          <option value="groq">Groq</option>
          <option value="openai">OpenAI</option>
        </select>
      </div>
      <div className="space-y-2">
        <label className="text-[10px] font-bold text-slate-500 uppercase">
          Model
        </label>
        <select
          value={config.model}
          onChange={(e) => {
            const m = e.target.value;
            const newConfig = { ...config, model: m };
            setConfig(newConfig);
            const side = title.toLowerCase().includes("white")
              ? "white"
              : "black";
            localStorage.setItem(`${side}_ai_model`, m);
          }}
          className="w-full bg-slate-900/50 border border-slate-600/50 rounded-lg px-3 py-2 text-xs outline-none cursor-pointer hover:border-slate-500 transition-all"
        >
          {config.provider === "groq" ? (
            <>
              <option value="llama3-70b-8192">Llama 3 70B</option>
              <option value="llama3-8b-8192">Llama 3 8B</option>
              <option value="mixtral-8x7b-32768">Mixtral 8x7B</option>
            </>
          ) : (
            <>
              <option value="gpt-4o-mini">GPT-4o Mini</option>
              <option value="gpt-4o">GPT-4o</option>
              <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
            </>
          )}
        </select>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Player Configuration */}
      <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 shadow-xl">
        <h3 className="text-sm font-bold text-slate-400 uppercase mb-4">
          ⚔️ Player Configuration
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 uppercase">
              ⚪ White Player
            </label>
            <select
              value={whitePlayer}
              onChange={(e) => {
                setWhitePlayer(e.target.value);
                setGameStarted(false);
                resetGame();
              }}
              className="w-full bg-slate-900/50 border border-slate-600/50 rounded-lg px-3 py-2 text-sm outline-none cursor-pointer hover:border-slate-500 transition-all"
            >
              <option value="human">👤 Human</option>
              <option value="llm">🤖 LLM</option>
              <option value="stockfish">⚙️ Stockfish</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 uppercase">
              ⚫ Black Player
            </label>
            <select
              value={blackPlayer}
              onChange={(e) => {
                setBlackPlayer(e.target.value);
                setGameStarted(false);
                resetGame();
              }}
              className="w-full bg-slate-900/50 border border-slate-600/50 rounded-lg px-3 py-2 text-sm outline-none cursor-pointer hover:border-slate-500 transition-all"
            >
              <option value="human">👤 Human</option>
              <option value="llm">🤖 LLM</option>
              <option value="stockfish">⚙️ Stockfish</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex justify-center items-baseline gap-x-6">
        <aside className="w-full lg:w-80 bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 flex flex-col gap-5 shadow-2xl overflow-y-auto max-h-[calc(100vh-120px)]">
          <button
            onClick={() => setOrientation((o) => (o === "w" ? "b" : "w"))}
            className="px-2 py-2 bg-slate-700/50 hover:bg-slate-600/50 rounded-lg transition-all duration-200 font-medium text-sm border border-slate-600/30 hover:border-slate-500/50 hover:scale-105 active:scale-95"
          >
            🔄 Flip Board
          </button>

          <div className="space-y-4 py-2 border-t border-slate-700/50">
            {whitePlayer === "llm" && (
              <AiConfigSection
                title="⚪ White AI"
                config={whiteAiConfig}
                setConfig={setWhiteAiConfig}
              />
            )}
            {blackPlayer === "llm" && (
              <AiConfigSection
                title="⚫ Black AI"
                config={blackAiConfig}
                setConfig={setBlackAiConfig}
              />
            )}
          </div>

          {(whitePlayer === "stockfish" || blackPlayer === "stockfish") && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex justify-between">
                <span>⚙️ Stockfish Depth</span>
                <span className="text-blue-400">
                  {stockfish.stockfishDepth}
                </span>
              </label>
              <input
                type="range"
                min="1"
                max="20"
                value={stockfish.stockfishDepth}
                onChange={(e) =>
                  stockfish.setStockfishDepth(parseInt(e.target.value))
                }
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>Beginner</span>
                <span>Grandmaster</span>
              </div>
            </div>
          )}

          <div className="space-y-4 py-2 border-t border-slate-700/50 pt-6">
            {whitePlayer !== "human" &&
              blackPlayer !== "human" &&
              !gameStarted && (
                <button
                  onClick={() => setGameStarted(true)}
                  className="w-full py-3 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 rounded-xl font-bold shadow-lg transition-all duration-200 transform hover:-translate-y-0.5 hover:shadow-xl active:scale-95 text-sm mb-2"
                >
                  🚀 Start Match
                </button>
              )}
            <button
              onClick={resetGame}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 rounded-xl font-bold shadow-lg transition-all duration-200 transform hover:-translate-y-0.5 hover:shadow-xl active:scale-95 text-sm"
            >
              ♟️ New Game
            </button>
          </div>

          <div className="space-y-3 pt-4 border-t border-slate-700/50">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Captured Pieces
            </h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 w-16">White:</span>
                <div className="flex flex-wrap gap-1">
                  {chessGame.capturedPieces.w.map((piece, i) => (
                    <span
                      key={i}
                      className="text-2xl"
                      style={{
                        color: "#ffffff",
                        filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.6))",
                      }}
                    >
                      {PIECE_SYMBOLS[piece]}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 w-16">Black:</span>
                <div className="flex flex-wrap gap-1">
                  {chessGame.capturedPieces.b.map((piece, i) => (
                    <span
                      key={i}
                      className="text-2xl"
                      style={{
                        color: "#000000",
                        filter: "drop-shadow(0 1px 2px rgba(255,255,255,0.4))",
                      }}
                    >
                      {PIECE_SYMBOLS[piece]}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </aside>

        <section className="flex-1 flex flex-col items-center relative bg-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-2xl">
          <div className="w-full flex justify-between items-center mb-5 px-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-4 h-4 rounded-full transition-all duration-300 ${
                  chessGame.game.turn() === "w"
                    ? "bg-white shadow-[0_0_15px_rgba(255,255,255,0.8)]"
                    : "bg-slate-900 border-2 border-white shadow-[0_0_15px_rgba(0,0,0,0.5)]"
                }`}
              ></div>
              <span className="font-bold text-lg">{chessGame.status}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400 font-medium">
                Evaluation:
              </span>
              <div
                className={`font-mono text-base font-bold px-3 py-1.5 rounded-lg transition-all ${
                  parseFloat(stockfish.evalScore) > 0
                    ? "text-green-400 bg-green-500/10 border border-green-500/30"
                    : parseFloat(stockfish.evalScore) < 0
                    ? "text-red-400 bg-red-500/10 border border-red-500/30"
                    : "text-slate-400 bg-slate-700/30 border border-slate-600/30"
                }`}
              >
                {stockfish.evalScore}
              </div>
            </div>
          </div>

          <ChessBoard
            game={chessGame.game}
            onMove={onUserMove}
            orientation={orientation}
            lastMove={chessGame.lastMove}
            checkSquare={chessGame.checkSquare}
            disabled={
              llmPlayer.thinking ||
              chessGame.game.isGameOver() ||
              (chessGame.game.turn() === "w" && whitePlayer !== "human") ||
              (chessGame.game.turn() === "b" && blackPlayer !== "human")
            }
          />

          {llmPlayer.thinking && (
            <div className="absolute bottom-8 bg-slate-900/90 backdrop-blur-xl px-8 py-4 rounded-2xl flex items-center gap-4 border border-slate-700/50 shadow-2xl z-10 animate-pulse">
              <div className="relative">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-t-2 border-blue-500"></div>
                <div className="absolute inset-0 rounded-full bg-blue-500/20 animate-ping"></div>
              </div>
              <span className="text-sm font-semibold">
                {llmPlayer.thinkingText}
              </span>
            </div>
          )}
        </section>

        <aside className="w-full lg:w-80 bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 flex flex-col gap-5 shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-700/50 pb-3">
            <h3 className="font-bold text-lg">💬 Coach & Analysis</h3>
            <button
              onClick={triggerCoach}
              disabled={llmPlayer.thinking}
              className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 rounded-lg text-xs transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Ask Coach
            </button>
          </div>

          <div className="flex-1 bg-slate-900/30 rounded-xl p-4 overflow-y-auto text-sm space-y-3 min-h-[200px] max-h-[300px] scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900/20">
            {coachMessages.length === 0 && (
              <div className="text-slate-500 italic text-center py-8">
                💡 No insights yet. Click "Ask Coach" for analysis!
              </div>
            )}
            {coachMessages.map((msg) => (
              <div
                key={msg.id}
                className="bg-slate-800/50 p-3 rounded-lg border-l-4 border-blue-500 hover:bg-slate-800/70 transition-all"
                dangerouslySetInnerHTML={{ __html: msg.html }}
              ></div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-700/50 pb-2">
              📜 Move History
            </h4>
            <div className="bg-slate-900/30 rounded-xl p-3 max-h-40 overflow-y-auto text-xs scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900/20">
              {formatMoveHistory().length === 0 ? (
                <div className="text-slate-500 italic text-center py-2">
                  No moves yet
                </div>
              ) : (
                <div className="space-y-1">
                  {formatMoveHistory().map((move) => (
                    <div
                      key={move.number}
                      className="flex items-center gap-2 hover:bg-slate-800/30 px-2 py-1 rounded transition-all"
                    >
                      <span className="font-bold text-slate-500 w-6">
                        {move.number}.
                      </span>
                      <span className="font-mono text-slate-200 flex-1">
                        {move.white}
                      </span>
                      {move.black && (
                        <span className="font-mono text-slate-200 flex-1">
                          {move.black}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>📋 PGN</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(chessGame.game.pgn());
                  alert("✅ PGN copied to clipboard!");
                }}
                className="text-[10px] px-2 py-1 bg-slate-700/50 hover:bg-slate-600/50 rounded transition-all"
              >
                Copy
              </button>
            </h4>
            <div className="bg-slate-900/30 p-3 rounded-xl text-xs font-mono max-h-24 overflow-y-auto text-slate-300 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900/20 leading-relaxed">
              {chessGame.game.pgn() || "Game not started..."}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};
