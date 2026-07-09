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
  // Get all activities from June 25th onward
  const startDate = new Date("2025-06-25T00:00:00Z");
  const after = Math.floor(startDate.getTime() / 1000);

  // Today's start for filtering today-only calories
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStart = Math.floor(today.getTime() / 1000);

  // Strava paginates at 200 max per page — fetch all pages
  let allActivities: any[] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const activitiesRes = await fetch(
      `https://www.strava.com/api/v3/athlete/activities?after=${after}&per_page=200&page=${page}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!activitiesRes.ok) break;

    const activities = await activitiesRes.json();
    if (activities.length === 0) {
      hasMore = false;
    } else {
      allActivities = [...allActivities, ...activities];
      page++;
      if (activities.length < 200) hasMore = false;
    }
  }

  // All activities from June 25th onward
  const workouts: GarminDailyData["workouts"] = allActivities.map((a: any) => {
    const caloriesBurned = estimateActivityCalories(a);
    return {
      type: a.type || a.sport_type || "Unknown",
      durationMinutes: Math.round((a.moving_time || 0) / 60),
      caloriesBurned,
    };
  });

  // Only count today's activities for the burn total
  const todayActivities = allActivities.filter((a: any) => {
    const activityTime = new Date(a.start_date).getTime() / 1000;
    return activityTime >= todayStart;
  });
  const totalCaloriesBurned = todayActivities.reduce((sum: number, a: any) => sum + estimateActivityCalories(a), 0);

  return {
    steps: 0,
    activeCaloriesBurned: totalCaloriesBurned,
    workouts,
    restingHeartRate: null,
  };
}

/**
 * Estimates calories for a single Strava activity using MET values.
 * Uses kilojoules from Strava if available (cycling), otherwise MET × weight × duration.
 */
function estimateActivityCalories(activity: any): number {
  const DEFAULT_WEIGHT_KG = 80;
  
  // If Strava provides kilojoules (cycling with power meter)
  if (activity.kilojoules && activity.kilojoules > 0) {
    return Math.round(activity.kilojoules);
  }

  const MET_VALUES: Record<string, number> = {
    Run: 9.8, Ride: 7.5, Swim: 8.0, Walk: 3.8, Hike: 6.0,
    WeightTraining: 5.0, Crossfit: 8.0, Yoga: 3.0, Rowing: 7.0,
    Elliptical: 5.0, StairStepper: 9.0, NordicSki: 8.0, Trail: 10.0,
    VirtualRide: 6.5, VirtualRun: 9.8, EBikeRide: 4.0, Workout: 5.0,
  };

  const type = activity.sport_type || activity.type || "Workout";
  const met = MET_VALUES[type] || 5.0;
  const durationHours = (activity.moving_time || 0) / 3600;
  let calories = met * DEFAULT_WEIGHT_KG * durationHours;

  // Heart rate adjustment
  if (activity.average_heartrate) {
    if (activity.average_heartrate > 150) calories *= 1.15;
    else if (activity.average_heartrate > 130) calories *= 1.05;
    else if (activity.average_heartrate < 100) calories *= 0.85;
  }

  return Math.round(calories);
}
