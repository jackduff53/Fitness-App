import { NextRequest, NextResponse } from "next/server";
import type { ParsedFoodResult } from "@/types";

const SYSTEM_PROMPT = `You are a nutrition assistant. Parse the following food description into structured JSON. Return: { name, calories, protein (g), carbs (g), fat (g), fiber (g), heartUnhealthy (boolean), heartUnhealthyReason (string or null) }. heartUnhealthy should be true for foods high in saturated fat, trans fat, excessive sodium, alcohol, or high sugar (e.g., fried foods, processed meats, sugary drinks, alcohol). Return ONLY the JSON object.`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { description } = body;

    if (!description || typeof description !== "string" || description.trim() === "") {
      return NextResponse.json(
        { error: "Missing or invalid food description in request body" },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 500 }
      );
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
          { role: "user", content: description.trim() },
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error("OpenAI API error:", response.status, errorData);
      return NextResponse.json(
        { error: "Failed to parse food description" },
        { status: 500 }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return NextResponse.json(
        { error: "No response from OpenAI" },
        { status: 500 }
      );
    }

    const parsed: ParsedFoodResult = JSON.parse(content);

    // Validate required fields
    const result: ParsedFoodResult = {
      name: parsed.name || "Unknown Food",
      calories: Number(parsed.calories) || 0,
      protein: Number(parsed.protein) || 0,
      carbs: Number(parsed.carbs) || 0,
      fat: Number(parsed.fat) || 0,
      fiber: Number(parsed.fiber) || 0,
      heartUnhealthy: Boolean(parsed.heartUnhealthy),
      heartUnhealthyReason: parsed.heartUnhealthyReason || undefined,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Food parse error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
