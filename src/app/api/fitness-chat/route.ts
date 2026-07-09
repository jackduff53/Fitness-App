import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT = `You are a concise fitness data assistant. The user will ask questions about their workout and fitness data. Answer using the provided activity data. Be brief, friendly, and use numbers where relevant. If the data doesn't contain enough info to answer, say so.`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { question, activities, dailySummaries } = body;

    if (!question || typeof question !== "string") {
      return NextResponse.json({ error: "Missing question" }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 500 });
    }

    // Build context from user's activity data
    const context = buildContext(activities, dailySummaries);

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
          { role: "user", content: `Here is my recent fitness data:\n\n${context}\n\nQuestion: ${question}` },
        ],
        temperature: 0.5,
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      return NextResponse.json({ error: "AI service error" }, { status: 500 });
    }

    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content || "I couldn't generate an answer.";

    return NextResponse.json({ answer });
  } catch (error) {
    console.error("Fitness chat error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

function buildContext(activities: any[] | undefined, dailySummaries: any[] | undefined): string {
  let context = "";

  if (activities && activities.length > 0) {
    context += "Recent Activities:\n";
    activities.slice(0, 20).forEach((a: any, i: number) => {
      context += `${i + 1}. ${a.type || "Workout"} - ${a.durationMinutes || 0} min, ${a.caloriesBurned || 0} cal burned, ${a.distance ? (a.distance / 1000).toFixed(1) + " km" : "no distance"}\n`;
    });
  }

  if (dailySummaries && dailySummaries.length > 0) {
    context += "\nDaily Summaries (last 7 days):\n";
    dailySummaries.slice(-7).forEach((s: any) => {
      context += `${s.date}: ${s.totalCaloriesBurned} cal burned, ${s.totalCaloriesConsumed} cal consumed, ${s.stepCount} steps\n`;
    });
  }

  if (!context) {
    context = "No activity data available yet.";
  }

  return context;
}
