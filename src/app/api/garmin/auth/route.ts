import { NextRequest, NextResponse } from "next/server";

// Strava OAuth2 flow (replacing Garmin)
const STRAVA_CLIENT_ID = process.env.STRAVA_CLIENT_ID || "";
const STRAVA_CLIENT_SECRET = process.env.STRAVA_CLIENT_SECRET || "";
const STRAVA_REDIRECT_URI = process.env.NEXT_PUBLIC_APP_URL
  ? `${process.env.NEXT_PUBLIC_APP_URL}/api/garmin/auth`
  : "http://localhost:3000/api/garmin/auth";

// POST: Initiate OAuth flow — return the Strava authorization URL
export async function POST() {
  if (!STRAVA_CLIENT_ID) {
    return NextResponse.json(
      { error: "Strava client ID not configured" },
      { status: 500 }
    );
  }

  const authUrl = `https://www.strava.com/oauth/authorize?client_id=${STRAVA_CLIENT_ID}&redirect_uri=${encodeURIComponent(STRAVA_REDIRECT_URI)}&response_type=code&scope=activity:read_all,read&approval_prompt=auto`;

  return NextResponse.json({ url: authUrl });
}

// GET: OAuth callback — exchange code for access token
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    if (error) {
      // User denied access
      const baseUrl = new URL("/", request.url).origin;
      return NextResponse.redirect(`${baseUrl}?auth_error=denied`);
    }

    if (!code) {
      return NextResponse.json(
        { error: "Missing authorization code" },
        { status: 400 }
      );
    }

    // Exchange code for access token
    const tokenResponse = await fetch("https://www.strava.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: STRAVA_CLIENT_ID,
        client_secret: STRAVA_CLIENT_SECRET,
        code,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      const baseUrl = new URL("/", request.url).origin;
      return NextResponse.redirect(`${baseUrl}?auth_error=token_failed`);
    }

    const tokenData = await tokenResponse.json();

    // Store tokens in HTTP-only cookies
    const baseUrl = new URL("/", request.url).origin;
    const response = NextResponse.redirect(baseUrl);

    response.cookies.set("strava_access_token", tokenData.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: tokenData.expires_in || 21600, // ~6 hours
    });

    response.cookies.set("strava_refresh_token", tokenData.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365, // 1 year
    });

    response.cookies.set("strava_expires_at", String(tokenData.expires_at), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
    });

    return response;
  } catch (error) {
    console.error("Strava auth callback error:", error);
    const baseUrl = new URL("/", request.url).origin;
    return NextResponse.redirect(`${baseUrl}?auth_error=unknown`);
  }
}
