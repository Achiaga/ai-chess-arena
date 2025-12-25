import React, { useState, useEffect, useRef, useCallback } from "react";
import { Chess } from "chess.js";

// --- Assets & Constants ---
const PIECE_SYMBOLS = {
  p: "♟",
  r: "♜",
  n: "♞",
  b: "♝",
  q: "♛",
  k: "♚",
  P: "♙",
  R: "♖",
  N: "♘",
  B: "♗",
  Q: "♕",
  K: "♔",
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
}) => {
  const board = game.board();
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [optionSquares, setOptionSquares] = useState({});

  const getMoveOptions = (square) => {
    const moves = game.moves({ square, verbose: true });
    if (moves.length === 0) return false;

    const newOptions = {};
    moves.forEach((move) => {
      newOptions[move.to] = {
        background:
          game.get(move.to) &&
          game.get(move.to).color !== game.get(square).color
            ? "radial-gradient(circle, rgba(255,0,0,0.4) 85%, transparent 85%)"
            : "radial-gradient(circle, rgba(0,255,0,0.4) 25%, transparent 25%)",
        borderRadius: "50%",
      };
    });
    return newOptions;
  };

  const onSquareClick = (square) => {
    // If we have a selected square, try to move
    if (selectedSquare) {
      const move = { from: selectedSquare, to: square, promotion: "q" };

      // Check if valid move
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

    // If clicked on a piece that belongs to the side to move (or just selecting a new piece)
    const piece = game.get(square);
    if (piece) {
      // Allow selecting own pieces
      // Note: We might want to restrict this based on whose turn it is in the UI,
      // but for now we just show options.
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

      let bgClass = isLight ? "bg-[#f0d9b5]" : "bg-[#b58863]";
      if (isLastMove) bgClass = "bg-yellow-200/50"; // Highlight last move
      if (isCheck) bgClass = "bg-red-500/50"; // Highlight check

      row.push(
        <div
          key={square}
          onClick={() => onSquareClick(square)}
          className={`w-full h-full flex justify-center items-center relative cursor-pointer ${bgClass}`}
        >
          {/* Rank/File Labels */}
          {c === 0 && orientation === "w" && (
            <span
              className={`absolute top-0 left-1 text-[10px] font-bold ${
                isLight ? "text-[#b58863]" : "text-[#f0d9b5]"
              }`}
            >
              {rank}
            </span>
          )}
          {r === 7 && orientation === "w" && (
            <span
              className={`absolute bottom-0 right-1 text-[10px] font-bold ${
                isLight ? "text-[#b58863]" : "text-[#f0d9b5]"
              }`}
            >
              {file}
            </span>
          )}

          {/* Piece */}
          {piece && (
            <span
              className="text-4xl md:text-5xl select-none drop-shadow-md transition-transform hover:scale-110"
              style={{
                color: piece.color === "w" ? "#fff" : "#000",
                textShadow:
                  piece.color === "w" ? "0 0 2px #000" : "0 0 2px #fff",
              }}
            >
              {
                PIECE_SYMBOLS[
                  piece.color === "w" ? piece.type.toUpperCase() : piece.type
                ]
              }
            </span>
          )}

          {/* Selection/Option Overlays */}
          {isSelected && (
            <div className="absolute inset-0 bg-yellow-400/40"></div>
          )}
          {isOption && (
            <div
              className="absolute w-4 h-4"
              style={{
                background: isOption.background,
                borderRadius: isOption.borderRadius,
              }}
            ></div>
          )}
        </div>
      );
    }
    rows.push(
      <div key={i} className="grid grid-cols-8 w-full h-1/8 flex-1">
        {row}
      </div>
    );
  }

  return (
    <div className="w-full max-w-[600px] aspect-square border-4 border-[#333] rounded-lg overflow-hidden shadow-2xl flex flex-col">
      {rows}
    </div>
  );
};

// --- Main App Component ---
function App() {
  // State
  const [game, setGame] = useState(new Chess());
  const [fen, setFen] = useState(game.fen()); // Force re-render
  const [mode, setMode] = useState("human_vs_stockfish");
  const [orientation, setOrientation] = useState("w");
  const [status, setStatus] = useState("White to move");
  const [evalScore, setEvalScore] = useState("0.00");
  const [thinking, setThinking] = useState(false);
  const [thinkingText, setThinkingText] = useState("");
  const [apiKey, setApiKey] = useState(
    localStorage.getItem("groq_api_key") || ""
  );
  const [stockfishDepth, setStockfishDepth] = useState(10);
  const [llmModel, setLlmModel] = useState("llama3-70b-8192");
  const [coachMessages, setCoachMessages] = useState([]);
  const [lastMove, setLastMove] = useState(null);
  const [checkSquare, setCheckSquare] = useState(null);

  // Refs
  const stockfishRef = useRef(null);
  const gameRef = useRef(game); // Keep ref to current game instance for callbacks

  // --- Effects ---

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
            if (move) handleAiMove(move);
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

    return () => stockfishRef.current?.terminate();
  }, []);

  // Game Loop for AI vs AI
  useEffect(() => {
    if (mode === "llm_vs_llm" && !game.isGameOver() && !thinking) {
      const timer = setTimeout(() => {
        triggerLlmMove();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [fen, mode, thinking]);

  // --- Helpers ---

  const updateGameState = (newGame) => {
    setGame(newGame);
    setFen(newGame.fen());
    gameRef.current = newGame;

    // Status
    let s = "";
    if (newGame.isCheckmate())
      s = `Checkmate! ${newGame.turn() === "w" ? "Black" : "White"} wins`;
    else if (newGame.isDraw()) s = "Draw";
    else if (newGame.isCheck())
      s = `${newGame.turn() === "w" ? "White" : "Black"} is in check!`;
    else s = `${newGame.turn() === "w" ? "White" : "Black"} to move`;
    setStatus(s);

    // Check square
    if (newGame.inCheck()) {
      // Find king
      const board = newGame.board();
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const p = board[r][c];
          if (p && p.type === "k" && p.color === newGame.turn()) {
            const file = String.fromCharCode(97 + c);
            const rank = 8 - r;
            setCheckSquare(`${file}${rank}`);
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
    const newGame = new Chess(game.fen());
    try {
      const result = newGame.move(move);
      if (result) {
        setLastMove({ from: result.from, to: result.to });
        updateGameState(newGame);

        // Trigger AI response if needed
        if (!newGame.isGameOver()) {
          if (mode === "human_vs_stockfish" && newGame.turn() !== orientation) {
            triggerStockfishMove(newGame);
          } else if (
            mode === "human_vs_llm" &&
            newGame.turn() !== orientation
          ) {
            triggerLlmMove();
          }
        }
        return true;
      }
    } catch (e) {
      return false;
    }
    return false;
  };

  const handleAiMove = (moveStr) => {
    setThinking(false);
    // Convert UCI (e2e4) to move object if needed, or just pass string if chess.js supports it (it usually does or needs simple parsing)
    // Chess.js .move() supports verbose objects or SAN strings. UCI needs careful handling.
    // We'll try to let chess.js handle it or parse it.
    const from = moveStr.substring(0, 2);
    const to = moveStr.substring(2, 4);
    const promotion = moveStr.length > 4 ? moveStr.substring(4, 5) : "q";

    makeMove({ from, to, promotion });
  };

  const triggerStockfishMove = (currGame) => {
    setThinking(true);
    setThinkingText("Stockfish is thinking...");
    stockfishRef.current.postMessage(`position fen ${currGame.fen()}`);
    stockfishRef.current.postMessage(`go depth ${stockfishDepth}`);
  };

  const triggerLlmMove = async () => {
    if (!apiKey) return alert("API Key required");
    setThinking(true);
    setThinkingText("LLM is thinking...");

    const prompt = `
You are a Chess Grandmaster.
FEN: ${game.fen()}
PGN: ${game.pgn()}
Valid Moves: ${game.moves().join(", ")}

Pick the best move.
Output ONLY the move in SAN or UCI format inside brackets: [MOVE].
`;

    try {
      const res = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messages: [{ role: "user", content: prompt }],
            model: llmModel,
            temperature: 0.1,
          }),
        }
      );
      const data = await res.json();
      const content = data.choices[0].message.content;

      const match = content.match(/\[(.*?)\]/);
      if (match) {
        handleAiMove(match[1]);
        addCoachMessage(
          `<strong>LLM Thought:</strong> ${content.substring(0, 100)}...`
        );
      } else {
        // Fallback
        const valid = game.moves();
        const words = content.split(/\s+/);
        const move = words.find((w) => valid.includes(w));
        if (move) handleAiMove(move);
        else {
          setThinking(false);
          alert("LLM failed to move");
        }
      }
    } catch (e) {
      setThinking(false);
      console.error(e);
    }
  };

  const triggerCoach = async () => {
    if (!apiKey) return alert("API Key required");
    setThinking(true);
    setThinkingText("Coach is analyzing...");

    const prompt = `Analyze this position: ${game.fen()}. Key threats and best plans? Concise.`;

    try {
      const res = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messages: [{ role: "user", content: prompt }],
            model: "llama3-70b-8192",
          }),
        }
      );
      const data = await res.json();
      addCoachMessage(
        `<strong>Coach:</strong> ${data.choices[0].message.content}`
      );
    } catch (e) {
      alert(e.message);
    }
    setThinking(false);
  };

  const addCoachMessage = (msg) => {
    setCoachMessages((prev) => [...prev, { id: Date.now(), html: msg }]);
  };

  // --- Handlers ---
  const resetGame = () => {
    const newGame = new Chess();
    updateGameState(newGame);
    setLastMove(null);
    setCoachMessages([]);
    if (mode === "llm_vs_llm") setTimeout(triggerLlmMove, 500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1c2c] to-[#0f1016] text-slate-200 font-sans p-4 md:p-8 flex flex-col">
      {/* Header */}
      <header className="flex justify-between items-center mb-6 p-4 rounded-2xl bg-white/5 backdrop-blur border border-white/10 shadow-lg">
        <div className="flex items-center gap-3">
          <i className="fa-solid fa-chess-king text-3xl text-blue-400"></i>
          <div>
            <h1 className="text-xl font-bold">AI Chess Arena</h1>
            <p className="text-xs text-gray-400">React Edition</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setOrientation((o) => (o === "w" ? "b" : "w"))}
            className="px-3 py-1 bg-white/10 rounded hover:bg-white/20 transition"
          >
            Flip Board
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col lg:flex-row gap-6">
        {/* Sidebar Controls */}
        <aside className="w-full lg:w-1/4 bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6 flex flex-col gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase">
              Groq API Key
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value);
                localStorage.setItem("groq_api_key", e.target.value);
              }}
              className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-sm focus:border-blue-500 outline-none transition"
              placeholder="gsk_..."
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase">
              Mode
            </label>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-sm outline-none"
            >
              <option value="human_vs_stockfish">Human vs Stockfish</option>
              <option value="human_vs_llm">Human vs LLM</option>
              <option value="llm_vs_llm">LLM vs LLM</option>
              <option value="coach">Coach Mode</option>
            </select>
          </div>

          {mode === "human_vs_stockfish" && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase">
                Stockfish Depth: {stockfishDepth}
              </label>
              <input
                type="range"
                min="1"
                max="20"
                value={stockfishDepth}
                onChange={(e) => setStockfishDepth(parseInt(e.target.value))}
                className="w-full"
              />
            </div>
          )}

          <button
            onClick={resetGame}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-bold shadow-lg transition transform hover:-translate-y-0.5"
          >
            New Game
          </button>
        </aside>

        {/* Board Area */}
        <section className="flex-1 flex flex-col items-center relative bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6">
          <div className="w-full flex justify-between items-center mb-4 px-4">
            <div className="flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  game.turn() === "w"
                    ? "bg-white shadow-[0_0_10px_white]"
                    : "bg-black border border-white"
                }`}
              ></div>
              <span className="font-semibold">{status}</span>
            </div>
            <div
              className={`font-mono text-sm px-2 py-1 rounded ${
                parseFloat(evalScore) > 0 ? "text-green-400" : "text-red-400"
              } bg-black/30`}
            >
              Eval: {evalScore}
            </div>
          </div>

          <ChessBoard
            game={game}
            onMove={makeMove}
            orientation={orientation}
            lastMove={lastMove}
            checkSquare={checkSquare}
          />

          {thinking && (
            <div className="absolute bottom-8 bg-black/80 backdrop-blur px-6 py-3 rounded-full flex items-center gap-3 border border-white/10 shadow-xl z-10">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span className="text-sm font-medium">{thinkingText}</span>
            </div>
          )}
        </section>

        {/* Info Panel */}
        <aside className="w-full lg:w-1/4 bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6 flex flex-col gap-4">
          <h3 className="font-bold border-b border-white/10 pb-2">
            Coach & Chat
          </h3>

          <div className="flex-1 bg-black/20 rounded-lg p-3 overflow-y-auto text-sm space-y-3 min-h-[200px] max-h-[400px]">
            {coachMessages.length === 0 && (
              <div className="text-gray-500 italic">No insights yet...</div>
            )}
            {coachMessages.map((msg) => (
              <div
                key={msg.id}
                className="bg-white/5 p-2 rounded border-l-2 border-blue-500"
                dangerouslySetInnerHTML={{ __html: msg.html }}
              ></div>
            ))}
          </div>

          <button
            onClick={triggerCoach}
            className="w-full py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition"
          >
            <i className="fa-solid fa-comment-dots mr-2"></i> Ask Coach
          </button>

          <div className="mt-auto">
            <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">
              PGN
            </h4>
            <div className="bg-black/30 p-2 rounded text-xs font-mono h-24 overflow-y-auto text-gray-300">
              {game.pgn() || "Game started..."}
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}

export default App;
