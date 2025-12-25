export const PIECE_SYMBOLS = {
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

export const STOCKFISH_URL =
  "https://cdnjs.cloudflare.com/ajax/libs/stockfish.js/10.0.0/stockfish.js";

// Stockfish depth to approximate ELO mapping
export const STOCKFISH_ELO_LEVELS = [
  { depth: 1, elo: 800, label: "Beginner" },
  { depth: 3, elo: 1000, label: "Novice" },
  { depth: 5, elo: 1200, label: "Intermediate" },
  { depth: 7, elo: 1400, label: "Club Player" },
  { depth: 9, elo: 1600, label: "Advanced" },
  { depth: 11, elo: 1800, label: "Expert" },
  { depth: 13, elo: 2000, label: "Master" },
  { depth: 15, elo: 2200, label: "Strong Master" },
];
