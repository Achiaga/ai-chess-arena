import React, { useState, useEffect, useRef } from "react";
import { Chess } from "chess.js";

// --- Assets & Constants ---
const PIECE_SYMBOLS = {
  p: "♟︎",
  r: "♜",
  n: "♞",
  b: "♝",
  q: "♛",
  k: "♚",
  P: "♟︎",
  R: "♜",
  N: "♞",
  B: "♝",
  Q: "♛",
  K: "♚",
};

const STOCKFISH_URL =
  "https://cdnjs.cloudflare.com/ajax/libs/stockfish.js/10.0.0/stockfish.js";

// --- Components ---

// 1. Chessboard Component
const ChessBoard = ({
  game,
  onMove,
  orientation = "w",
  lastMove,
  checkSquare,
  disabled = false,
}) => {
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [optionSquares, setOptionSquares] = useState({});
  const [draggedPiece, setDraggedPiece] = useState(null);

  const getMoveOptions = (square) => {
    const moves = game.moves({ square, verbose: true });
    if (moves.length === 0) return false;

    const newOptions = {};
    moves.forEach((move) => {
      newOptions[move.to] = {
        background:
          game.get(move.to) &&
          game.get(move.to).color !== game.get(square).color
            ? "radial-gradient(circle, rgba(239,68,68,0.5) 85%, transparent 85%)"
            : "radial-gradient(circle, rgba(34,197,94,0.5) 30%, transparent 30%)",
        borderRadius: "50%",
      };
    });
    return newOptions;
  };

  const onSquareClick = (square) => {
    if (disabled) return;

    // If we have a selected square, try to move
    if (selectedSquare) {
      const move = { from: selectedSquare, to: square, promotion: "q" };

      try {
        const result = onMove(move);
        if (result) {
          setSelectedSquare(null);
          setOptionSquares({});
          return;
        }
      } catch (e) {
        // Invalid move
      }
    }

    // If clicked on a piece that belongs to the side to move
    const piece = game.get(square);
    if (piece && piece.color === game.turn()) {
      const options = getMoveOptions(square);
      if (options) {
        setSelectedSquare(square);
        setOptionSquares(options);
        return;
      }
    }

    // Deselect if clicking empty square or invalid piece
    setSelectedSquare(null);
    setOptionSquares({});
  };

  // Render Board
  const rows = [];
  for (let i = 0; i < 8; i++) {
    const row = [];
    for (let j = 0; j < 8; j++) {
      // Orientation logic
      const r = orientation === "w" ? i : 7 - i;
      const c = orientation === "w" ? j : 7 - j;

      const file = String.fromCharCode(97 + c);
      const rank = 8 - r;
      const square = `${file}${rank}`;

      const isLight = (r + c) % 2 === 0;
      const piece = game.get(square);

      // Styles
      const isSelected = selectedSquare === square;
      const isOption = optionSquares[square];
      const isLastMove =
        lastMove && (lastMove.from === square || lastMove.to === square);
      const isCheck = checkSquare === square;

      let bgClass = isLight ? "bg-[#ebecd0]" : "bg-[#739552]";
      if (isLastMove) bgClass = isLight ? "bg-[#cdd26a]" : "bg-[#aaa23a]";
      if (isCheck) bgClass = "bg-gradient-to-br from-red-500 to-red-600";

      row.push(
        <div
          key={square}
          onClick={() => onSquareClick(square)}
          className={`w-full h-full flex justify-center items-center relative transition-all duration-200 ${
            disabled ? "cursor-not-allowed" : "cursor-pointer"
          } ${bgClass} ${
            isSelected ? "ring-4 ring-yellow-400 ring-inset z-10" : ""
          } hover:brightness-110`}
        >
          {/* Rank/File Labels */}
          {c === 0 && (
            <span
              className={`absolute top-0.5 left-1 text-[11px] font-bold ${
                isLight ? "text-[#739552]" : "text-[#ebecd0]"
              }`}
            >
              {rank}
            </span>
          )}
          {r === 7 && (
            <span
              className={`absolute bottom-0.5 right-1 text-[11px] font-bold ${
                isLight ? "text-[#739552]" : "text-[#ebecd0]"
              }`}
            >
              {file}
            </span>
          )}

          {/* Piece */}
          {piece && (
            <span
              className={`text-5xl md:text-6xl select-none transition-transform duration-150 ${
                isSelected ? "scale-110" : "hover:scale-105"
              }`}
              style={{
                filter:
                  piece.color === "w"
                    ? "drop-shadow(0 2px 3px rgba(0,0,0,0.6))"
                    : "drop-shadow(0 2px 3px rgba(255,255,255,0.4))",
                color: piece.color === "w" ? "#ffffff" : "#000000",
              }}
            >
              {PIECE_SYMBOLS[piece.type]}
            </span>
          )}

          {/* Option Overlays */}
          {isOption && (
            <div
              className="absolute pointer-events-none transition-all duration-150"
              style={{
                width: piece ? "85%" : "30%",
                height: piece ? "85%" : "30%",
                background: isOption.background,
                borderRadius: isOption.borderRadius,
              }}
            ></div>
          )}
        </div>
      );
    }
    rows.push(
      <div key={i} className="grid grid-cols-8 w-full h-[12.5%]">
        {row}
      </div>
    );
  }

  return (
    <div className="w-full max-w-[640px] aspect-square border-8 border-[#312e2b] rounded-xl overflow-hidden shadow-2xl flex flex-col bg-[#312e2b]">
      {rows}
    </div>
  );
};

// --- Main App Component ---
function App() {
  // State
  const [game, setGame] = useState(new Chess());
  const [fen, setFen] = useState(game.fen());
  const [mode, setMode] = useState("human_vs_stockfish");
  const [orientation, setOrientation] = useState("w");
  const [status, setStatus] = useState("White to move");
  const [evalScore, setEvalScore] = useState("0.00");
  const [thinking, setThinking] = useState(false);
  const [thinkingText, setThinkingText] = useState("");
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
  const [stockfishDepth, setStockfishDepth] = useState(10);
  const [gameStarted, setGameStarted] = useState(false);
  const [coachMessages, setCoachMessages] = useState([]);
  const [lastMove, setLastMove] = useState(null);
  const [checkSquare, setCheckSquare] = useState(null);
  const [moveHistory, setMoveHistory] = useState([]);
  const [capturedPieces, setCapturedPieces] = useState({ w: [], b: [] });

  // Refs
  const stockfishRef = useRef(null);
  const gameRef = useRef(game);
  const awaitingMoveRef = useRef(false);
  const messagesEndRef = useRef(null);

  // --- Effects ---

  // Auto-scroll coach messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [coachMessages]);

  // Init Stockfish
  useEffect(() => {
    const initStockfish = async () => {
      try {
        const response = await fetch(STOCKFISH_URL);
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);

        const worker = new Worker(blobUrl);
        worker.onmessage = (event) => {
          const line = event.data;
          if (line.startsWith("bestmove")) {
            const move = line.split(" ")[1];
            if (move && awaitingMoveRef.current) {
              awaitingMoveRef.current = false;
              handleStockfishMove(move);
            }
          }
          // Eval parsing
          if (line.includes("info") && line.includes("score cp")) {
            const match = line.match(/score cp (-?\d+)/);
            if (match) {
              const cp = parseInt(match[1]);
              const score = (gameRef.current.turn() === "w" ? cp : -cp) / 100;
              setEvalScore(score.toFixed(2));
            }
          } else if (line.includes("score mate")) {
            const match = line.match(/score mate (-?\d+)/);
            if (match) setEvalScore(`M${match[1]}`);
          }
        };
        worker.postMessage("uci");
        stockfishRef.current = worker;
      } catch (e) {
        console.error("Stockfish init failed", e);
      }
    };

    initStockfish();

    return () => {
      if (stockfishRef.current) {
        stockfishRef.current.terminate();
      }
    };
  }, []);

  // Game Loop for AI vs AI
  useEffect(() => {
    if (game.isGameOver() || thinking) return;

    if (mode === "llm_vs_llm" && gameStarted) {
      const timer = setTimeout(() => {
        const turn = game.turn();
        const config = turn === "w" ? whiteAiConfig : blackAiConfig;
        triggerLlmMove(config);
      }, 1000);
      return () => clearTimeout(timer);
    }

    if (mode === "stockfish_vs_llm" && gameStarted) {
      const timer = setTimeout(() => {
        if (game.turn() === "w") {
          triggerStockfishMove(game);
        } else {
          triggerLlmMove(blackAiConfig);
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [fen, mode, thinking, gameStarted, whiteAiConfig, blackAiConfig]);

  // --- Helpers ---

  const updateGameState = (newGame) => {
    setGame(newGame);
    setFen(newGame.fen());
    gameRef.current = newGame;

    // Status
    let s = "";
    if (newGame.isCheckmate())
      s = `Checkmate! ${newGame.turn() === "w" ? "Black" : "White"} wins! 🏆`;
    else if (newGame.isDraw()) s = "Draw! 🤝";
    else if (newGame.isCheck())
      s = `${newGame.turn() === "w" ? "White" : "Black"} is in check! ⚠️`;
    else s = `${newGame.turn() === "w" ? "White" : "Black"} to move`;
    setStatus(s);

    // Check square
    if (newGame.inCheck()) {
      const board = newGame.board();
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const p = board[r][c];
          if (p && p.type === "k" && p.color === newGame.turn()) {
            const file = String.fromCharCode(97 + c);
            const rank = 8 - r;
            setCheckSquare(`${file}${rank}`);
            break;
          }
        }
      }
    } else {
      setCheckSquare(null);
    }

    // Stockfish Eval
    if (stockfishRef.current && !newGame.isGameOver()) {
      stockfishRef.current.postMessage(`position fen ${newGame.fen()}`);
      stockfishRef.current.postMessage("go depth 10");
    }
  };

  const makeMove = (move) => {
    const newGame = new Chess(gameRef.current.fen());
    try {
      const result = newGame.move(move);
      if (result) {
        setLastMove({ from: result.from, to: result.to });

        // Track captured pieces
        if (result.captured) {
          setCapturedPieces((prev) => ({
            ...prev,
            [result.color === "w" ? "b" : "w"]: [
              ...prev[result.color === "w" ? "b" : "w"],
              result.captured,
            ],
          }));
        }

        // Add to move history
        setMoveHistory((prev) => [...prev, result.san]);

        updateGameState(newGame);

        // Trigger AI response if needed
        if (!newGame.isGameOver()) {
          if (mode === "human_vs_stockfish" && newGame.turn() !== orientation) {
            setTimeout(() => triggerStockfishMove(newGame), 300);
          } else if (
            mode === "human_vs_llm" &&
            newGame.turn() !== orientation
          ) {
            const config =
              newGame.turn() === "w" ? whiteAiConfig : blackAiConfig;
            setTimeout(() => triggerLlmMove(config), 300);
          } else if (mode === "stockfish_vs_llm") {
            // Handled by the AI vs AI useEffect loop
          }
        }
        return true;
      }
    } catch (e) {
      console.error("Move error:", e);
      return false;
    }
    return false;
  };

  const handleStockfishMove = (moveStr) => {
    setThinking(false);
    const from = moveStr.substring(0, 2);
    const to = moveStr.substring(2, 4);
    const promotion = moveStr.length > 4 ? moveStr.substring(4, 5) : "q";
    makeMove({ from, to, promotion });
  };

  const triggerStockfishMove = (currGame) => {
    if (awaitingMoveRef.current || !stockfishRef.current) return;

    setThinking(true);
    setThinkingText("Stockfish is thinking...");
    awaitingMoveRef.current = true;

    stockfishRef.current.postMessage(`position fen ${currGame.fen()}`);
    stockfishRef.current.postMessage(`go depth ${stockfishDepth}`);
  };

  const triggerLlmMove = async (config) => {
    const { provider, model } = config;
    const apiKey = provider === "groq" ? groqApiKey : openAiApiKey;
    const apiUrl =
      provider === "groq"
        ? "https://api.groq.com/openai/v1/chat/completions"
        : "https://api.openai.com/v1/chat/completions";

    if (!apiKey) {
      alert(`⚠️ ${provider === "groq" ? "Groq" : "OpenAI"} API Key required`);
      setMode("human_vs_stockfish");
      return;
    }
    setThinking(true);
    setThinkingText(`${model} is thinking...`);

    const prompt = `
You are a Chess Grandmaster.
FEN: ${gameRef.current.fen()}
PGN: ${gameRef.current.pgn()}
Valid Moves: ${gameRef.current.moves().join(", ")}

Pick the best move for ${gameRef.current.turn() === "w" ? "White" : "Black"}.
Output ONLY the move in SAN format inside brackets: [MOVE].
Example: [Nf3] or [e4] or [O-O]
`;

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
          temperature: 0.1,
        }),
      });

      if (res.status === 401) {
        throw new Error(
          `Unauthorized: Invalid ${
            provider === "groq" ? "Groq" : "OpenAI"
          } API Key`
        );
      }

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `API Error: ${res.status}`);
      }

      const data = await res.json();
      const content = data.choices[0].message.content;

      const match = content.match(/\[(.*?)\]/);
      let moveStr = "";

      if (match) {
        moveStr = match[1].trim();
      } else {
        // Fallback: try to find any valid move in the text
        const valid = gameRef.current.moves();
        const words = content.split(/\s+/);
        moveStr = words
          .find((w) => valid.includes(w.replace(/[.,!?\[\]]/g, "")))
          ?.replace(/[.,!?\[\]]/g, "");
      }

      if (moveStr) {
        const result = makeMove(moveStr);
        if (result) {
          addCoachMessage(`<strong>🤖 LLM played:</strong> ${moveStr}`);
          setThinking(false);
        } else {
          setThinking(false);
          console.error(`Invalid move from LLM: ${moveStr}`);
          addCoachMessage(
            `<strong>⚠️ LLM error:</strong> Invalid move attempted: ${moveStr}`
          );
          // If in AI vs AI mode, maybe try again or stop
          if (mode === "llm_vs_llm" || mode === "stockfish_vs_llm") {
            // Stop to avoid infinite loop of invalid moves
            setMode("human_vs_stockfish");
          }
        }
      } else {
        setThinking(false);
        addCoachMessage(
          `<strong>⚠️ LLM error:</strong> Could not parse move from response.`
        );
        if (mode === "llm_vs_llm" || mode === "stockfish_vs_llm") {
          setMode("human_vs_stockfish");
        }
      }
    } catch (e) {
      setThinking(false);
      console.error(e);
      addCoachMessage(`<strong>❌ API Error:</strong> ${e.message}`);
      if (e.message.includes("Unauthorized")) {
        alert(`${provider === "groq" ? "Groq" : "OpenAI"} API Key is invalid.`);
      }
    }
  };

  const triggerCoach = async () => {
    const turn = game.turn();
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
    setThinking(true);
    setThinkingText("Coach is analyzing...");

    const prompt = `Analyze this chess position: ${gameRef.current.fen()}. 
Current turn: ${gameRef.current.turn() === "w" ? "White" : "Black"}
PGN: ${gameRef.current.pgn()}

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
    setThinking(false);
  };

  const addCoachMessage = (msg) => {
    setCoachMessages((prev) => [...prev, { id: Date.now(), html: msg }]);
  };

  // --- Handlers ---
  const resetGame = () => {
    awaitingMoveRef.current = false;
    const newGame = new Chess();
    updateGameState(newGame);
    setLastMove(null);
    setCoachMessages([]);
    setThinking(false);
    setGameStarted(false);
    setMoveHistory([]);
    setCapturedPieces({ w: [], b: [] });
  };

  const formatMoveHistory = () => {
    const moves = [];
    for (let i = 0; i < moveHistory.length; i += 2) {
      moves.push({
        number: Math.floor(i / 2) + 1,
        white: moveHistory[i],
        black: moveHistory[i + 1] || "",
      });
    }
    return moves;
  };

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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-100 font-sans p-4 md:p-6 flex flex-col">
      {/* Header */}
      <header className="flex justify-between items-center mb-6 p-5 rounded-2xl bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-xl border border-slate-600/30 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="text-5xl">♔</div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              AI Chess Arena
            </h1>
            <p className="text-xs text-slate-400 font-medium">
              Professional Chess Engine
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setOrientation((o) => (o === "w" ? "b" : "w"))}
            className="px-4 py-2 bg-slate-700/50 hover:bg-slate-600/50 rounded-lg transition-all duration-200 font-medium text-sm border border-slate-600/30 hover:border-slate-500/50 hover:scale-105 active:scale-95"
          >
            🔄 Flip Board
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col lg:flex-row gap-6 max-w-[1800px] mx-auto w-full">
        {/* Sidebar Controls */}
        <aside className="w-full lg:w-80 bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 flex flex-col gap-5 shadow-2xl overflow-y-auto max-h-[calc(100vh-120px)]">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              🎮 Game Mode
            </label>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              className="w-full bg-slate-900/50 border border-slate-600/50 rounded-lg px-4 py-2.5 text-sm outline-none cursor-pointer hover:border-slate-500 transition-all"
            >
              <option value="human_vs_stockfish">👤 Human vs Stockfish</option>
              <option value="human_vs_llm">👤 Human vs LLM</option>
              <option value="llm_vs_llm">🤖 LLM vs LLM</option>
              <option value="stockfish_vs_llm">⚔️ Stockfish vs LLM</option>
              <option value="coach">🎓 Coach Mode</option>
            </select>
          </div>

          <div className="space-y-4 py-2 border-t border-slate-700/50">
            {(mode === "llm_vs_llm" ||
              (mode === "human_vs_llm" && orientation === "b") ||
              (mode === "coach" && game.turn() === "w")) && (
              <AiConfigSection
                title="⚪ White AI"
                config={whiteAiConfig}
                setConfig={setWhiteAiConfig}
              />
            )}
            {(mode === "llm_vs_llm" ||
              mode === "stockfish_vs_llm" ||
              (mode === "human_vs_llm" && orientation === "w") ||
              (mode === "coach" && game.turn() === "b")) && (
              <AiConfigSection
                title="⚫ Black AI"
                config={blackAiConfig}
                setConfig={setBlackAiConfig}
              />
            )}
          </div>

          {mode === "human_vs_stockfish" && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex justify-between">
                <span>⚙️ Stockfish Depth</span>
                <span className="text-blue-400">{stockfishDepth}</span>
              </label>
              <input
                type="range"
                min="1"
                max="20"
                value={stockfishDepth}
                onChange={(e) => setStockfishDepth(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>Beginner</span>
                <span>Grandmaster</span>
              </div>
            </div>
          )}

          <div className="space-y-4 py-2 border-t border-slate-700/50">
            {(mode === "llm_vs_llm" || mode === "stockfish_vs_llm") &&
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

          {/* Captured Pieces */}
          <div className="space-y-3 pt-4 border-t border-slate-700/50">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Captured Pieces
            </h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 w-16">White:</span>
                <div className="flex flex-wrap gap-1">
                  {capturedPieces.w.map((piece, i) => (
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
                  {capturedPieces.b.map((piece, i) => (
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

        {/* Board Area */}
        <section className="flex-1 flex flex-col items-center relative bg-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-2xl">
          <div className="w-full flex justify-between items-center mb-5 px-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-4 h-4 rounded-full transition-all duration-300 ${
                  game.turn() === "w"
                    ? "bg-white shadow-[0_0_15px_rgba(255,255,255,0.8)]"
                    : "bg-slate-900 border-2 border-white shadow-[0_0_15px_rgba(0,0,0,0.5)]"
                }`}
              ></div>
              <span className="font-bold text-lg">{status}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400 font-medium">
                Evaluation:
              </span>
              <div
                className={`font-mono text-base font-bold px-3 py-1.5 rounded-lg transition-all ${
                  parseFloat(evalScore) > 0
                    ? "text-green-400 bg-green-500/10 border border-green-500/30"
                    : parseFloat(evalScore) < 0
                    ? "text-red-400 bg-red-500/10 border border-red-500/30"
                    : "text-slate-400 bg-slate-700/30 border border-slate-600/30"
                }`}
              >
                {evalScore}
              </div>
            </div>
          </div>

          <ChessBoard
            game={game}
            onMove={makeMove}
            orientation={orientation}
            lastMove={lastMove}
            checkSquare={checkSquare}
            disabled={thinking}
          />

          {thinking && (
            <div className="absolute bottom-8 bg-slate-900/90 backdrop-blur-xl px-8 py-4 rounded-2xl flex items-center gap-4 border border-slate-700/50 shadow-2xl z-10 animate-pulse">
              <div className="relative">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-t-2 border-blue-500"></div>
                <div className="absolute inset-0 rounded-full bg-blue-500/20 animate-ping"></div>
              </div>
              <span className="text-sm font-semibold">{thinkingText}</span>
            </div>
          )}
        </section>

        {/* Info Panel */}
        <aside className="w-full lg:w-80 bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 flex flex-col gap-5 shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-700/50 pb-3">
            <h3 className="font-bold text-lg">💬 Coach & Analysis</h3>
            <button
              onClick={triggerCoach}
              disabled={thinking}
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

          {/* Move History */}
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

          <div className="space-y-4 py-2 border-t border-slate-700/50">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              🔑 API Keys
            </h3>
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">
                  Groq Key
                </label>
                <input
                  type="password"
                  value={groqApiKey}
                  onChange={(e) => {
                    setGroqApiKey(e.target.value);
                    localStorage.setItem("groq_api_key", e.target.value);
                  }}
                  className="w-full bg-slate-900/50 border border-slate-600/50 rounded-lg px-3 py-2 text-xs focus:border-blue-500 outline-none transition-all"
                  placeholder="gsk_..."
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">
                  OpenAI Key
                </label>
                <input
                  type="password"
                  value={openAiApiKey}
                  onChange={(e) => {
                    setOpenAiApiKey(e.target.value);
                    localStorage.setItem("openai_api_key", e.target.value);
                  }}
                  className="w-full bg-slate-900/50 border border-slate-600/50 rounded-lg px-3 py-2 text-xs focus:border-blue-500 outline-none transition-all"
                  placeholder="sk-..."
                />
              </div>
            </div>
          </div>

          {/* PGN Export */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>📋 PGN</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(game.pgn());
                  alert("✅ PGN copied to clipboard!");
                }}
                className="text-[10px] px-2 py-1 bg-slate-700/50 hover:bg-slate-600/50 rounded transition-all"
              >
                Copy
              </button>
            </h4>
            <div className="bg-slate-900/30 p-3 rounded-xl text-xs font-mono max-h-24 overflow-y-auto text-slate-300 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900/20 leading-relaxed">
              {game.pgn() || "Game not started..."}
            </div>
          </div>
        </aside>
      </main>

      {/* Footer */}
      <footer className="mt-6 text-center text-xs text-slate-500">
        <p>Powered by Stockfish • chess.js • Groq AI</p>
      </footer>
    </div>
  );
}

export default App;
