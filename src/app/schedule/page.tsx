"use client";

const schedule = [
  {
    day: "Sunday",
    type: "Active Recovery",
    emoji: "🧘",
    focus: "Mobility & Light Cardio",
    description: "30 min easy walk or yoga. Focus on stretching and joint mobility.",
    heartNote: "Keeps blood flowing without stressing the cardiovascular system",
    color: "text-green-400",
  },
  {
    day: "Monday",
    type: "Upper Body Strength",
    emoji: "💪",
    focus: "Push & Pull",
    description: "Bench press, rows, shoulder press, pull-ups, tricep/bicep work. 45-60 min.",
    heartNote: "Resistance training improves resting heart rate over time",
    color: "text-accent",
  },
  {
    day: "Tuesday",
    type: "Cardio — Run",
    emoji: "🏃",
    focus: "Steady State / Zone 2",
    description: "30-45 min run at conversational pace. Keep heart rate 130-150 bpm.",
    heartNote: "Zone 2 cardio builds aerobic base and strengthens the heart",
    color: "text-red-400",
  },
  {
    day: "Wednesday",
    type: "Lower Body Strength",
    emoji: "🦵",
    focus: "Legs & Core",
    description: "Squats, deadlifts, lunges, leg press, calf raises, core work. 45-60 min.",
    heartNote: "Large muscle groups increase calorie burn and metabolic health",
    color: "text-accent",
  },
  {
    day: "Thursday",
    type: "Cardio — Run",
    emoji: "🏃",
    focus: "Intervals / Tempo",
    description: "Warm up 10 min, then alternating fast/slow intervals for 20-30 min. Cool down.",
    heartNote: "HIIT intervals strengthen cardiac output and VO2max",
    color: "text-red-400",
  },
  {
    day: "Friday",
    type: "Upper Body Strength",
    emoji: "💪",
    focus: "Push & Pull (Volume)",
    description: "Similar to Monday with different exercises or rep ranges. 45-60 min.",
    heartNote: "Consistent resistance training lowers blood pressure long-term",
    color: "text-accent",
  },
  {
    day: "Saturday",
    type: "Cardio — Long Run",
    emoji: "🏃‍♂️",
    focus: "Endurance",
    description: "45-75 min easy-to-moderate run. Build distance gradually. Enjoy it.",
    heartNote: "Long steady runs maximize cardiovascular adaptation",
    color: "text-red-400",
  },
];

export default function SchedulePage() {
  const today = new Date().getDay(); // 0 = Sunday

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-black tracking-tight">Weekly Plan</h1>
      <p className="text-xs text-text-secondary">Heart-healthy mix of strength & running</p>

      <div className="space-y-3">
        {schedule.map((item, i) => {
          const isToday = i === today;
          return (
            <div
              key={item.day}
              className={`gradient-card rounded-2xl p-4 transition-all ${
                isToday ? "glow-orange-strong border border-accent/40" : "border border-transparent"
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{item.emoji}</span>
                    <span className={`text-xs font-bold uppercase tracking-wider ${isToday ? "text-accent" : "text-text-secondary"}`}>
                      {item.day} {isToday && "— TODAY"}
                    </span>
                  </div>
                  <p className={`text-lg font-bold mt-1 ${item.color}`}>{item.type}</p>
                  <p className="text-xs text-text-secondary mt-0.5">{item.focus}</p>
                  <p className="text-sm text-white/80 mt-2 leading-relaxed">{item.description}</p>
                  <p className="text-xs text-green-400/70 mt-2 italic">❤️ {item.heartNote}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
