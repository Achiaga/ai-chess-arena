export class LLMEngine {
  constructor(config) {
    this.provider = config.provider;
    this.model = config.model;
    this.apiKey = config.apiKey;
    this.apiUrl =
      this.provider === "groq"
        ? "https://api.groq.com/openai/v1/chat/completions"
        : "https://api.openai.com/v1/chat/completions";
  }

  async getMove(fen, pgn, validMoves, turn) {
    if (!this.apiKey) {
      throw new Error(`${this.provider} API Key required`);
    }

    const prompt = `
You are a Chess Grandmaster.
FEN: ${fen}
PGN: ${pgn}
Valid Moves: ${validMoves.join(", ")}

Pick the best move for ${turn === "w" ? "White" : "Black"}.
Output ONLY the move in SAN format inside brackets: [MOVE].
Example: [Nf3] or [e4] or [O-O]
`;

    try {
      const res = await fetch(this.apiUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [{ role: "user", content: prompt }],
          model: this.model,
          temperature: 0.1,
        }),
      });

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
        const words = content.split(/\s+/);
        moveStr = words
          .find((w) => validMoves.includes(w.replace(/[.,!?\[\]]/g, "")))
          ?.replace(/[.,!?\[\]]/g, "");
      }

      return moveStr;
    } catch (e) {
      console.error("LLM Engine Error:", e);
      throw e;
    }
  }
}
