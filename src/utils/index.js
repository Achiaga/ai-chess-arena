export function eloReliability(range) {
  const width = range[1] - range[0];

  if (width < 100) return { label: "Very High", color: "text-green-400" };
  if (width < 200) return { label: "High", color: "text-blue-400" };
  if (width < 350) return { label: "Medium", color: "text-yellow-400" };
  return { label: "Low", color: "text-red-400" };
}
