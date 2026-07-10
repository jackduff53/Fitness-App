import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT = `You are a fitness coach creating a personalized weekly workout plan. The user is a 210 lb, 5'10" male who wants a healthy mix of weight training and running days, emphasizing heart healthiness.

Based on their previous week's activity data, create an adaptive plan for the upcoming week (Sunday to Saturday).

Rules:
- If they ran a lot last week, add more strength or recovery
- If they skipped cardio, emphasize it more this week
- If they did heavy lifting, suggest lighter volume or deload
- If they missed days, keep the plan achievable
- Always include at least 3 cardio sessions and 2-3 strength sessions
- Always include 1 recovery/rest day
- Emphasize heart health: zone 2 cardio, interval training, and consistent movement

Return a JSON array of 7 objects (Sunday first) with these fields:
- day: "Sunday" through "Saturday"
- type: short workout type (e.g., "Upper Body Strength", "Cardio — Run", "Active Recovery")
- emoji: single emoji for the workout
- focus: 3-5 word focus area
- description: 1-2 sentence description of what to do
- heartNote: 1 sentence about how this benefits heart health
- intensity: "low", "moderate", or "high"

Return ONLY the JSON array.`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { lastWeekActivities } = body;

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 500 });
    }

    // Build context about last week
    let activityContext = "No activity data from last week.";
    if (lastWeekActivities && lastWeekActivities.length > 0) {
      activityContext = "Last week's activities:\n" + lastWeekActivities.map((a: any, i: number) =>
        `${i + 1}. ${a.type} - ${a.durationMinutes} min, ${a.caloriesBurned} cal (${a.date})`
      ).join("\n");
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
          { role: "user", content: activityContext },
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
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
    // Handle both { schedule: [...] } and direct array responses
    const plan = Array.isArray(parsed) ? parsed : parsed.schedule || parsed.plan || parsed.days || [];

    return NextResponse.json({ plan });
  } catch (error) {
    console.error("Generate plan error:", error);
    return NextResponse.json({ error: "Failed to generate plan" }, { status: 500 });
  }
}
