import { NextRequest, NextResponse } from "next/server";

// Garmin OAuth 1.0a flow
// In production, this would handle full OAuth token exchange
// For now, provides the structure for auth initiation and callback

const GARMIN_CONSUMER_KEY = process.env.GARMIN_CONSUMER_KEY || "";
const GARMIN_CONSUMER_SECRET = process.env.GARMIN_CONSUMER_SECRET || "";

export async function POST(request: NextRequest) {
  try {
    if (!GARMIN_CONSUMER_KEY || !GARMIN_CONSUMER_SECRET) {
      return NextResponse.json(
        { error: "Garmin OAuth credentials not configured" },
        { status: 500 }
      );
    }

    // In production: initiate OAuth 1.0a request token flow
    // 1. Request a request token from Garmin
    // 2. Return the authorization URL for the user to approve
    const authUrl = `https://connect.garmin.com/oauthConfirm?oauth_token=placeholder`;

    return NextResponse.json({ url: authUrl });
  } catch (error) {
    console.error("Garmin auth error:", error);
    return NextResponse.json(
      { error: "Failed to initiate Garmin authentication" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // OAuth callback handler
    const { searchParams } = new URL(request.url);
    const oauthToken = searchParams.get("oauth_token");
    const oauthVerifier = searchParams.get("oauth_verifier");

    if (!oauthToken || !oauthVerifier) {
      return NextResponse.json(
        { error: "Missing OAuth parameters" },
        { status: 400 }
      );
    }

    // In production: exchange request token + verifier for access token
    // Store access token in HTTP-only cookie
    const response = NextResponse.redirect(new URL("/", request.url));
    response.cookies.set("garmin_token", "placeholder_access_token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365, // 1 year
    });

    return response;
  } catch (error) {
    console.error("Garmin auth callback error:", error);
    return NextResponse.json(
      { error: "Failed to complete Garmin authentication" },
      { status: 500 }
    );
  }
}
