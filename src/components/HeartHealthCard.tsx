import type { HeartHealthColor } from "@/types";

interface HeartHealthCardProps {
  score: number;
  color: HeartHealthColor;
  unhealthyFoods: string[];
}

const colorMap = {
  green: "text-green-400",
  yellow: "text-amber-400",
  red: "text-red-400",
};

const bgGradientMap = {
  green: "from-green-500/20 to-transparent",
  yellow: "from-amber-500/20 to-transparent",
  red: "from-red-500/20 to-transparent",
};

const barColorMap = {
  green: "bg-gradient-to-r from-green-500 to-green-400",
  yellow: "bg-gradient-to-r from-amber-500 to-amber-400",
  red: "bg-gradient-to-r from-red-500 to-red-400",
};

export function HeartHealthCard({ score, color, unhealthyFoods }: HeartHealthCardProps) {
  return (
    <div className={`gradient-card rounded-2xl p-5 bg-gradient-to-br ${bgGradientMap[color]}`}>
      <div className="flex justify-between items-start mb-3">
        <div>
          <p className="text-xs font-medium text-text-secondary uppercase tracking-wider">Heart Health</p>
          <p className="text-xs text-text-secondary mt-1">
            {score >= 70 ? "Great choices today" : score >= 40 ? "Room for improvement" : "Needs attention"}
          </p>
        </div>
        <span className={`text-4xl font-black ${colorMap[color]}`}>{score}</span>
      </div>
      <div className="w-full h-2 bg-black/50 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${barColorMap[color]}`}
          style={{ width: `${score}%` }}
        />
      </div>
      {unhealthyFoods.length > 0 && (
        <div className="mt-4 pt-3 border-t border-white/5">
          <p className="text-xs text-text-secondary mb-2">⚠️ Flagged items</p>
          <div className="flex flex-wrap gap-2">
            {unhealthyFoods.map((food, i) => (
              <span key={i} className="text-xs bg-red-500/10 text-red-400 px-2 py-1 rounded-lg border border-red-500/20">
                {food}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
