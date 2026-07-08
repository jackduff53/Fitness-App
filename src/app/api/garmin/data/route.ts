import { NextRequest, NextResponse } from "next/server";
import type { GarminDailyData } from "@/types";

const STRAVA_CLIENT_ID = process.env.STRAVA_CLIENT_ID || "";
const STRAVA_CLIENT_SECRET = process.env.STRAVA_CLIENT_SECRET || "";

async function refreshAccessToken(refreshToken: string): Promise<{ access_token: string; refresh_token: string; expires_at: number } | null> {
  try {
    const response = await fetch("https://www.strava.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: STRAVA_CLIENT_ID,
        client_secret: STRAVA_CLIENT_SECRET,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    let accessToken = request.cookies.get("strava_access_token")?.value;
    const refreshToken = request.cookies.get("strava_refresh_token")?.value;
    const expiresAt = request.cookies.get("strava_expires_at")?.value;

    if (!accessToken && !refreshToken) {
      return NextResponse.json(
        { error: "Not authenticated with Strava" },
        { status: 401 }
      );
    }

    // Check if token expired and refresh if needed
    if (expiresAt && Date.now() / 1000 > Number(expiresAt) && refreshToken) {
      const newTokens = await refreshAccessToken(refreshToken);
      if (!newTokens) {
        return NextResponse.json(
          { error: "Token refresh failed" },
          { status: 401 }
        );
      }
      accessToken = newTokens.access_token;

      // We'll set updated cookies in the response
      const data = await fetchStravaData(accessToken);
      const response = NextResponse.json(data);
      response.cookies.set("strava_access_token", newTokens.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 21600,
      });
      response.cookies.set("strava_refresh_token", newTokens.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 365,
      });
      response.cookies.set("strava_expires_at", String(newTokens.expires_at), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 365,
      });
      return response;
    }

    if (!accessToken) {
      return NextResponse.json(
        { error: "No valid access token" },
        { status: 401 }
      );
    }

    const data = await fetchStravaData(accessToken);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Strava data fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch activity data" },
      { status: 500 }
    );
  }
}

async function fetchStravaData(accessToken: string): Promise<GarminDailyData> {
  // Get today's activities from Strava
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const after = Math.floor(today.getTime() / 1000);

  const activitiesRes = await fetch(
    `https://www.strava.com/api/v3/athlete/activities?after=${after}&per_page=30`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  let workouts: GarminDailyData["workouts"] = [];
  let totalCaloriesBurned = 0;

  if (activitiesRes.ok) {
    const activities = await activitiesRes.json();
    workouts = activities.map((a: any) => ({
      type: a.type || a.sport_type || "Unknown",
      durationMinutes: Math.round((a.moving_time || 0) / 60),
      caloriesBurned: Math.round(a.calories || a.kilojoules / 4.184 || 0),
    }));
    totalCaloriesBurned = workouts.reduce((sum, w) => sum + w.caloriesBurned, 0);
  }

  // Strava doesn't provide daily steps or resting HR directly
  // These will need to be manually entered or estimated
  return {
    steps: 0, // User enters manually
    activeCaloriesBurned: totalCaloriesBurned,
    workouts,
    restingHeartRate: null, // Not available from Strava activity API
  };
}
