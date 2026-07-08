import type { GarminDailyData } from "@/types";

export class GarminAuthError extends Error {
  constructor(message = "Authentication failed. Please re-authenticate with Garmin.") {
    super(message);
    this.name = "GarminAuthError";
  }
}

export class GarminNetworkError extends Error {
  constructor(message = "Failed to connect to Garmin. Please check your connection.") {
    super(message);
    this.name = "GarminNetworkError";
  }
}

/**
 * Fetches the current day's activity data from the Garmin API route.
 * @returns Promise resolving to GarminDailyData
 * @throws GarminAuthError on 401 responses
 * @throws GarminNetworkError on 500 or network failure
 */
export async function fetchGarminData(): Promise<GarminDailyData> {
  let response: Response;

  try {
    response = await fetch("/api/garmin/data", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    throw new GarminNetworkError();
  }

  if (response.status === 401) {
    throw new GarminAuthError();
  }

  if (!response.ok) {
    throw new GarminNetworkError(
      `Garmin API error: ${response.status} ${response.statusText}`
    );
  }

  const data: GarminDailyData = await response.json();
  return data;
}

/**
 * Initiates the Garmin OAuth authentication flow via the API route.
 * @returns Promise resolving to the authorization URL the user should be redirected to
 * @throws GarminAuthError on 401 responses
 * @throws GarminNetworkError on 500 or network failure
 */
export async function initiateGarminAuth(): Promise<string> {
  let response: Response;

  try {
    response = await fetch("/api/garmin/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    throw new GarminNetworkError();
  }

  if (response.status === 401) {
    throw new GarminAuthError();
  }

  if (!response.ok) {
    throw new GarminNetworkError(
      `Garmin auth error: ${response.status} ${response.statusText}`
    );
  }

  const data = await response.json();
  return data.url as string;
}
