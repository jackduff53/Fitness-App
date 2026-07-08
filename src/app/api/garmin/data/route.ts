import { NextRequest, NextResponse } from "next/server";
import type { GarminDailyData } from "@/types";

export async function GET(request: NextRequest) {
  try {
    const garminToken = request.cookies.get("garmin_token")?.value;

    if (!garminToken) {
      return NextResponse.json(
        { error: "Not authenticated with Garmin" },
        { status: 401 }
      );
    }

    // In production: use the OAuth token to call Garmin Health API endpoints
    // GET https://apis.garmin.com/wellness-api/rest/dailies
    // GET https://apis.garmin.com/wellness-api/rest/activities
    // GET https://apis.garmin.com/wellness-api/rest/hrv (for resting HR)

    // For development/demo: return sample data
    // Replace this with actual Garmin API calls when credentials are configured
    const data: GarminDailyData = {
      steps: 8500,
      activeCaloriesBurned: 450,
      workouts: [
        { type: "Running", durationMinutes: 30, caloriesBurned: 320 },
      ],
      restingHeartRate: 62,
    };

    return NextResponse.json(data);
  } catch (error) {
    console.error("Garmin data fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch Garmin data" },
      { status: 500 }
    );
  }
}
