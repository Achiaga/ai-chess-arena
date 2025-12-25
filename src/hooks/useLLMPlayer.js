import { useState } from "react";

/**
 * Custom hook for LLM player integration
 */
export const useLLMPlayer = (gameRef) => {
  const [thinking, setThinking] = useState(false);
  const [thinkingText, setThinkingText] = useState("");

  /**
   * Triggers LLM to make a move
   */
  const triggerLlmMove = async (
    config,
    groqApiKey,
    openAiApiKey,
    onMove,
    onError
  ) => {
    const { provider, model } = config;
    const apiKey = provider === "groq" ? groqApiKey : openAiApiKey;
    const apiUrl =
      provider === "groq"
        ? "https://api.groq.com/openai/v1/chat/completions"
        : "https://api.openai.com/v1/chat/completions";

    if (!apiKey) {
      const error = `⚠️ ${
        provider === "groq" ? "Groq" : "OpenAI"
      } API Key required`;
      alert(error);
      if (onError) onError(error);
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
        const valid = gameRef.current.moves();
        const words = content.split(/\s+/);
        moveStr = words
          .find((w) => valid.includes(w.replace(/[.,!?\[\]]/g, "")))
          ?.replace(/[.,!?\[\]]/g, "");
      }

      setThinking(false);

      if (moveStr) {
        onMove(moveStr);
      } else {
        const error = "Could not parse move from response";
        console.error("LLM error:", error);
        if (onError) onError(error);
      }
    } catch (e) {
      setThinking(false);
      console.error("LLM API error:", e);
      if (onError) onError(e.message);

      if (e.message.includes("Unauthorized")) {
        alert(`${provider === "groq" ? "Groq" : "OpenAI"} API Key is invalid.`);
      }
    }
  };

  return {
    thinking,
    setThinking,
    thinkingText,
    setThinkingText,
    triggerLlmMove,
  };
};
