import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT = `You are an expert fitness coach creating a detailed, prescriptive weekly workout plan. The user is a 210 lb, 5'10" male who wants a healthy mix of weight training and running, emphasizing heart health.

Based on their previous week's activity data, create a specific, actionable plan for the upcoming week (Sunday to Saturday).

Rules:
- Be EXTREMELY specific: exact exercises, sets, reps, weight percentages, run distances, paces, and durations
- For strength days: list every exercise with sets × reps (e.g., "Barbell Bench Press: 4×8 @ moderate weight")
- For run days: specify distance in miles, target pace, heart rate zone, and intervals if applicable
- For recovery days: specific stretches or mobility drills with hold times
- Include warm-up and cool-down instructions
- If they ran a lot last week, add more strength or recovery
- If they skipped cardio, emphasize it more
- Always include at least 3 cardio sessions and 2-3 strength sessions
- Always include 1 recovery day
- Emphasize heart health: zone 2 runs, tempo runs, and consistent effort

Return a JSON object with a "schedule" key containing an array of 7 objects (Sunday first):
- day: "Sunday" through "Saturday"
- type: short type (e.g., "Upper Body Push", "Tempo Run", "Active Recovery")
- emoji: single emoji
- focus: 3-5 word focus
- exercises: array of strings, each being a specific exercise with sets/reps/distance/pace (e.g., "Barbell Bench Press: 4×8", "Run: 4 miles @ 8:30/mi pace, Zone 2", "Hamstring stretch: 3×30 sec hold")
- duration: total estimated time (e.g., "55 min")
- heartNote: 1 sentence about heart health benefit
- intensity: "low", "moderate", or "high"

Return ONLY the JSON object.`;

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
