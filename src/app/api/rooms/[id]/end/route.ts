import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Room } from "@/models";
import { getAuthUser } from "@/lib/auth";
import { cleanRoomState } from "@/lib/room-state";
import { deleteLiveKitRoom } from "@/lib/livekit";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { id: roomId } = await params;
    const authPayload = getAuthUser(req);

    if (!authPayload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const room = await Room.findById(roomId);
    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    // Only host can end room
    if (room.hostId.toString() !== authPayload.userId) {
      return NextResponse.json(
        { error: "Forbidden: Only the room host can end this table" },
        { status: 403 }
      );
    }

    // 1. Mark room as ended in MongoDB
    room.status = "ended";
    room.endedAt = new Date();
    await room.save();

    // 2. Clean up Redis In-Memory State
    await cleanRoomState(roomId);

    // 3. Terminate LiveKit WebRTC SFU room
    await deleteLiveKitRoom(roomId);

    return NextResponse.json({
      success: true,
      message: "Room ended successfully",
      roomId,
    });
  } catch (error: unknown) {
    console.error("End room error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to end room" },
      { status: 500 }
    );
  }
}
