export const Navbar = ({
  setMode,
  mode,
  groqApiKey,
  openAiApiKey,
  setGroqApiKey,
  setOpenAiApiKey,
}) => {
  return (
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
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
          🎮 Game Mode
        </label>
        <select
          value={mode}
          onChange={(e) => setMode(e.target.value)}
          className="w-full bg-slate-900/50 border border-slate-600/50 rounded-lg px-4 py-2.5 text-sm outline-none cursor-pointer hover:border-slate-500 transition-all"
        >
          <option value="versus">⚔️ Versus</option>
          <option value="ai-arena">🏆 AI Arena</option>
          <option value="elo-estimation">🔮 ELO Estimation</option>
        </select>
      </div>
      <div className="flex gap-3">
        <div className="">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            🔑 API Keys
          </h3>
          <div className=" flex justify-center items-center gap-x-2">
            <div className="space-x-2">
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
                className="w-20 bg-slate-900/50 border border-slate-600/50 rounded-lg px-3 py-2 text-xs focus:border-blue-500 outline-none transition-all"
                placeholder="gsk_..."
              />
            </div>
            <div className="space-x-2">
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
                className="w-20 bg-slate-900/50 border border-slate-600/50 rounded-lg px-3 py-2 text-xs focus:border-blue-500 outline-none transition-all"
                placeholder="sk-..."
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
