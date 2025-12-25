import { ConfidenceCurveChart } from "../atoms/confidence-curve-chart";
import { eloReliability } from "../../utils";

/**
 * ELO Estimation results display component
 */
export const EloEstimationResults = ({
  eloEstimation,
  eloProgress,
  eloPlayer,
  whiteAiConfig,
  blackAiConfig,
  gamesPerLevel,
}) => {
  const reliability = eloEstimation?.range
    ? eloReliability(eloEstimation.range)
    : { label: "--", color: "text-slate-400" };

  return (
    <>
      {/* Progress Indicator */}
      {eloProgress && (
        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50 shadow-xl">
          <h3 className="text-lg font-bold mb-4">Estimation in Progress...</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>
                  Testing Level {eloProgress.currentLevel + 1} of{" "}
                  {eloProgress.totalLevels}
                </span>
                <span>{Math.round(eloProgress.progress)}%</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-3">
                <div
                  className="bg-blue-500 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${eloProgress.progress}%` }}
                ></div>
              </div>
            </div>
            {eloProgress.currentElo && (
              <p className="text-sm text-slate-400">
                Current test: ~{eloProgress.currentElo} ELO
              </p>
            )}
          </div>
        </div>
      )}

      {/* Reliability Indicator */}
      <div className="bg-slate-800/50 p-6 rounded-xl text-center">
        <div className="text-sm text-slate-400 uppercase mb-2">Reliability</div>
        <div className={`text-2xl font-bold ${reliability.color}`}>
          {reliability.label}
        </div>
        {eloEstimation?.range && (
          <div className="text-xs text-slate-500 mt-2">
            Confidence interval width: ±{eloEstimation.range} ELO
          </div>
        )}
      </div>

      {/* Tested Levels */}
      <div className="mt-6">
        <h4 className="text-sm font-bold text-slate-300 uppercase mb-3">
          Tested Stockfish Levels
        </h4>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {eloProgress?.results?.map((r) => (
            <div
              key={r.level}
              className="bg-slate-800/40 p-3 rounded-lg text-center border border-slate-700/50"
            >
              <div className="text-sm font-bold text-slate-200">
                {r.level} ELO
              </div>
              <div className="text-xs text-slate-400 mt-1">
                Score: {r.score.toFixed(1)}%
              </div>
              <div
                className={`text-xs font-bold mt-1 ${
                  r.score > 55
                    ? "text-green-400"
                    : r.score < 45
                    ? "text-red-400"
                    : "text-blue-400"
                }`}
              >
                {r.score > 55 ? "Stronger" : r.score < 45 ? "Weaker" : "Even"}
              </div>
            </div>
          ))}
        </div>
      </div>

      {eloEstimation?.stoppedEarly && (
        <div className="mt-4 text-center text-sm text-green-400">
          ✔ Estimation stopped early due to high confidence
        </div>
      )}

      {/* Final Results */}
      {eloEstimation && (
        <div className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 rounded-xl p-6 border-2 border-purple-500/30 shadow-2xl">
          <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
            🔮​ ELO Estimation Complete
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-slate-800/50 p-6 rounded-xl text-center">
              <div className="text-sm text-slate-400 uppercase mb-2">
                LLM Model
              </div>
              <div className="text-3xl font-bold text-purple-400">
                {eloPlayer === "white"
                  ? whiteAiConfig.model
                  : blackAiConfig.model}
              </div>
            </div>

            <div className="bg-slate-800/50 p-6 rounded-xl text-center">
              <div className="text-sm text-slate-400 uppercase mb-2">
                Estimated ELO
              </div>
              <div className="text-5xl font-bold text-purple-400">
                {eloEstimation.elo}
              </div>
            </div>

            <div className="bg-slate-800/50 p-6 rounded-xl text-center">
              <div className="text-sm text-slate-400 uppercase mb-2">
                Confidence Range
              </div>
              <div className="text-2xl font-bold text-blue-400">
                ± {eloEstimation.range}
              </div>
              <div className="text-xs text-slate-500 mt-2">
                {eloEstimation.elo - eloEstimation.range} -{" "}
                {eloEstimation.elo + eloEstimation.range}
              </div>
            </div>

            <div className="bg-slate-800/50 p-6 rounded-xl text-center">
              <div className="text-sm text-slate-400 uppercase mb-2">
                Confidence
              </div>
              <div className="text-2xl font-bold text-green-400">
                {Math.round(eloEstimation.confidence)}%
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-slate-800/30 rounded-lg">
            <p className="text-sm text-slate-300 text-center">
              Based on performance across 8 difficulty levels ({gamesPerLevel}{" "}
              games each)
            </p>
          </div>
        </div>
      )}

      {/* Confidence Curve */}
      {eloEstimation?.confidenceCurve && (
        <div className="mt-8 bg-slate-900/40 p-6 rounded-xl border border-slate-700/50">
          <h4 className="text-sm font-bold text-slate-300 uppercase mb-3">
            Bayesian Confidence Curve
          </h4>
          <ConfidenceCurveChart
            curve={eloEstimation.confidenceCurve}
            estimatedElo={eloEstimation.elo}
          />
          <p className="text-xs text-slate-400 mt-3 text-center">
            Peak indicates the most statistically likely ELO
          </p>
        </div>
      )}
    </>
  );
};
