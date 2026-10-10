import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { leaveRoomState } from "@/lib/room-state";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { id: roomId } = await params;
    const authPayload = getAuthUser(req);

    if (authPayload) {
      await leaveRoomState(roomId, authPayload.userId);
    }

    return NextResponse.json({
      success: true,
      message: "Successfully left the room",
    });
  } catch (error: unknown) {
    console.error("Leave room error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to leave room" },
      { status: 500 }
    );
  }
}
