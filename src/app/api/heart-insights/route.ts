import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT = `You are a heart health advisor analyzing a user's 7-day nutrition and fitness data. The user is a 210 lb, 5'10" male focused on cardiovascular health.

Given their data, provide:
1. A brief overall assessment (2-3 sentences)
2. 3 specific things they did well for heart health
3. 3 specific areas to improve
4. 5 actionable recommendations for next week (be specific — mention foods, workout types, durations)

Focus on: fiber intake, omega-3 sources, sodium/saturated fat avoidance, cardio frequency, zone 2 training, resting heart rate trends, and consistency.

Return a JSON object with:
- overallAssessment: string (2-3 sentences)
- positives: array of 3 strings (specific things done well)
- improvements: array of 3 strings (specific areas to improve)
- recommendations: array of 5 objects with { title: string, detail: string }
- scoreBreakdown: object with { fiberScore: number, cardioScore: number, calorieScore: number, fatScore: number, penaltyScore: number } (each 0-100 representing how well they did in that category)

Return ONLY the JSON object.`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { foodEntries, workouts, goals, currentScore } = body;

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 500 });
    }

    // Build context
    let context = `Current Heart Health Score: ${currentScore}/100\n\n`;

    if (foodEntries && foodEntries.length > 0) {
      context += "Food entries (last 7 days):\n";
      foodEntries.forEach((entry: any, i: number) => {
        context += `${entry.date} - ${entry.name}: ${entry.calories} cal, ${entry.protein}g protein, ${entry.carbs}g carbs, ${entry.fat}g fat, ${entry.fiber}g fiber${entry.heartUnhealthy ? " ⚠️ HEART UNHEALTHY: " + entry.heartUnhealthyReason : ""}\n`;
      });
    } else {
      context += "No food entries logged in the past 7 days.\n";
    }

    context += "\n";

    if (workouts && workouts.length > 0) {
      context += "Workouts (last 7 days):\n";
      workouts.forEach((w: any, i: number) => {
        context += `${w.date} - ${w.type}: ${w.durationMinutes} min, ${w.caloriesBurned} cal burned\n`;
      });
    } else {
      context += "No workouts recorded in the past 7 days.\n";
    }

    if (goals) {
      context += `\nDaily goals: ${goals.calorieTarget} cal intake, ${goals.fatTarget}g fat, ${goals.burnGoal} cal burn\n`;
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: context },
        ],
        response_format: { type: "json_object" },
        temperature: 0.6,
      }),
    });

    if (!response.ok) {
      return NextResponse.json({ error: "AI service error" }, { status: 500 });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return NextResponse.json({ error: "No response from AI" }, { status: 500 });
    }

    const parsed = JSON.parse(content);
    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Heart insights error:", error);
    return NextResponse.json({ error: "Failed to generate insights" }, { status: 500 });
  }
}
