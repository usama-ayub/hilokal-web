import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { setUserOnline } from "@/lib/presence";

export async function POST(req: NextRequest) {
  try {
    const authPayload = getAuthUser(req);
    let userId = authPayload?.userId;
    let activeRoomId: string | undefined = undefined;

    // Allow parsing JSON body for room info or testing
    try {
      const body = await req.json();
      if (!userId && body.userId) {
        userId = body.userId;
      }
      if (body.activeRoomId) {
        activeRoomId = body.activeRoomId;
      }
    } catch {
      // Empty or non-JSON body is acceptable
    }

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized: Active user session required for heartbeat" },
        { status: 401 }
      );
    }

    // Refresh 60-second sliding TTL in Redis
    await setUserOnline(userId, activeRoomId);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      userId,
      online: true,
      activeRoomId: activeRoomId || null,
    });
  } catch (error: unknown) {
    console.error("Presence heartbeat error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to record heartbeat",
      },
      { status: 500 }
    );
  }
}
