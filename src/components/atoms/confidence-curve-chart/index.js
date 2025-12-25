import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

export const ConfidenceCurveChart = ({ curve, estimatedElo }) => {
  if (!curve || curve.length === 0) return null;

  const data = curve.map((c) => ({
    elo: c.elo,
    likelihood: Math.exp(c.likelihood), // convert log-likelihood for readability
  }));

  return (
    <div className="w-full h-64">
      <ResponsiveContainer>
        <LineChart data={data}>
          <XAxis dataKey="elo" tick={{ fill: "#94a3b8", fontSize: 12 }} />
          <YAxis hide />
          <Tooltip
            formatter={(v) => v.toFixed(4)}
            labelFormatter={(l) => `ELO ${l}`}
          />
          <Line
            type="monotone"
            dataKey="likelihood"
            strokeWidth={3}
            dot={false}
          />
          <ReferenceLine
            x={estimatedElo}
            stroke="#a855f7"
            strokeDasharray="4 4"
            label={{
              value: "Estimate",
              fill: "#a855f7",
              position: "top",
            }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
