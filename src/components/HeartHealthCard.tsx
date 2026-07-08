import type { HeartHealthColor } from "@/types";

interface HeartHealthCardProps {
  score: number;
  color: HeartHealthColor;
  unhealthyFoods: string[];
}

const colorMap = {
  green: "text-green-400",
  yellow: "text-yellow-400",
  red: "text-red-400",
};

const bgColorMap = {
  green: "bg-green-400",
  yellow: "bg-yellow-400",
  red: "bg-red-400",
};

export function HeartHealthCard({ score, color, unhealthyFoods }: HeartHealthCardProps) {
  return (
    <div className="bg-card rounded-xl p-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm text-text-secondary">Heart Health Score</h3>
        <span className={`text-3xl font-bold ${colorMap[color]}`}>{score}</span>
      </div>
      <div className="w-full h-2 bg-background rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${bgColorMap[color]}`}
          style={{ width: `${score}%` }}
        />
      </div>
      {unhealthyFoods.length > 0 && (
        <div className="mt-3 border-t border-gray-700 pt-2">
          <p className="text-xs text-text-secondary mb-1">Flagged Foods</p>
          {unhealthyFoods.map((food, i) => (
            <div key={i} className="flex items-center gap-2 text-xs text-text-primary">
              <span className="text-red-400">⚠️</span>
              <span>{food}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
