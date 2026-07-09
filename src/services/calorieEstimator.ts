/**
 * Estimates calories burned from Strava activity data using MET (Metabolic Equivalent) values.
 * Strava provides: type, moving_time (seconds), distance (meters), average_heartrate, average_speed.
 * 
 * Formula: Calories = MET × weight (kg) × duration (hours)
 * Default weight: 80kg (can be made configurable via goals/settings)
 */

// MET values by activity type (moderate to vigorous intensity)
const MET_VALUES: Record<string, number> = {
  Run: 9.8,
  Ride: 7.5,
  Swim: 8.0,
  Walk: 3.8,
  Hike: 6.0,
  WeightTraining: 5.0,
  Crossfit: 8.0,
  Yoga: 3.0,
  Rowing: 7.0,
  Elliptical: 5.0,
  StairStepper: 9.0,
  RockClimbing: 8.0,
  NordicSki: 8.0,
  Trail: 10.0,
  VirtualRide: 6.5,
  VirtualRun: 9.8,
  EBikeRide: 4.0,
  Workout: 5.0,
  Soccer: 7.0,
  Tennis: 7.3,
  Basketball: 6.5,
};

const DEFAULT_MET = 5.0;
const DEFAULT_WEIGHT_KG = 80;

interface StravaActivity {
  type: string;
  sport_type?: string;
  moving_time: number; // seconds
  distance?: number; // meters
  average_heartrate?: number;
  average_speed?: number; // m/s
  kilojoules?: number; // Strava sometimes provides this for cycling
}

/**
 * Estimates calories burned for a single activity.
 * Uses kilojoules from Strava if available (cycling with power meter),
 * otherwise falls back to MET-based calculation with heart rate adjustment.
 */
export function estimateCalories(
  activity: StravaActivity,
  weightKg: number = DEFAULT_WEIGHT_KG
): number {
  // If Strava provides kilojoules (cycling with power meter), use that
  if (activity.kilojoules && activity.kilojoules > 0) {
    // Strava kilojoules is work output; actual calories burned is ~4x due to efficiency
    return Math.round(activity.kilojoules * 1.0); // Strava's kJ is already gross calories for cycling
  }

  const activityType = activity.sport_type || activity.type || "Workout";
  const met = MET_VALUES[activityType] || DEFAULT_MET;
  const durationHours = activity.moving_time / 3600;

  // Base calorie estimate
  let calories = met * weightKg * durationHours;

  // Heart rate adjustment: if HR data available, scale estimate
  // Higher HR than expected for the MET = higher actual burn
  if (activity.average_heartrate) {
    const hr = activity.average_heartrate;
    // Rough adjustment: if HR > 150, bump up; if < 120, scale down
    if (hr > 150) {
      calories *= 1.15;
    } else if (hr > 130) {
      calories *= 1.05;
    } else if (hr < 100) {
      calories *= 0.85;
    }
  }

  // Speed adjustment for running: faster pace = higher burn
  if ((activityType === "Run" || activityType === "VirtualRun") && activity.average_speed) {
    const paceMinPerKm = 1000 / (activity.average_speed * 60);
    if (paceMinPerKm < 5) {
      calories *= 1.2; // Fast runner
    } else if (paceMinPerKm > 7) {
      calories *= 0.9; // Slow jog
    }
  }

  return Math.round(calories);
}

/**
 * Estimates total calories burned for a list of activities.
 */
export function estimateTotalCalories(
  activities: StravaActivity[],
  weightKg: number = DEFAULT_WEIGHT_KG
): number {
  return activities.reduce((sum, a) => sum + estimateCalories(a, weightKg), 0);
}
