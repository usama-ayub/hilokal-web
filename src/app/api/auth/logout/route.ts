import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, clearAuthCookie } from "@/lib/auth";
import { setUserOffline } from "@/lib/presence";

export async function POST(req: NextRequest) {
  try {
    const authPayload = getAuthUser(req);

    if (authPayload) {
      // Remove online status and active room key from Redis
      await setUserOffline(authPayload.userId);
    }

    const response = NextResponse.json({
      success: true,
      message: "Logged out successfully",
    });

    clearAuthCookie(response);

    return response;
  } catch (error: unknown) {
    console.error("Logout error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to log out",
      },
      { status: 500 }
    );
  }
}
