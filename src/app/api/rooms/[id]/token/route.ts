import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Room } from "@/models";
import { getAuthUser } from "@/lib/auth";
import { createLiveKitToken, RoomRole } from "@/lib/livekit";
import { joinRoomState, getRoomRealtimeState } from "@/lib/room-state";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/rooms/[id]/token - Generate a signed LiveKit WebRTC token for entering a room
 */
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { id: roomId } = await params;
    const authPayload = getAuthUser(req);

    if (!authPayload) {
      return NextResponse.json(
        { error: "Unauthorized: Please sign in to join an audio room" },
        { status: 401 }
      );
    }

    await connectToDatabase();

    const room = await Room.findById(roomId);
    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    if (room.status !== "active") {
      return NextResponse.json(
        { error: "This audio room has already ended" },
        { status: 400 }
      );
    }

    // Determine Role
    let role: RoomRole = "listener";
    const isHost = room.hostId.toString() === authPayload.userId;

    if (isHost) {
      role = "host";
    } else {
      // Check if user is already in the speakers set
      const realtimeState = await getRoomRealtimeState(roomId);
      if (realtimeState.speakers.includes(authPayload.userId)) {
        role = "speaker";
      }
    }

    // Update Redis In-Memory Room State
    await joinRoomState(roomId, authPayload.userId, role === "host" || role === "speaker");

    // Generate LiveKit signed JWT token
    const token = await createLiveKitToken({
      roomName: roomId,
      participantIdentity: authPayload.userId,
      participantName: authPayload.username,
      role,
      metadata: {
        userId: authPayload.userId,
        username: authPayload.username,
        role,
        isVip: authPayload.isVip,
      },
    });

    const wsUrl = process.env.NEXT_PUBLIC_LIVEKIT_WS_URL || "ws://localhost:7880";

    return NextResponse.json({
      success: true,
      token,
      role,
      wsUrl,
      room: {
        id: room._id,
        title: room.title,
        primaryLanguage: room.primaryLanguage,
      },
    });
  } catch (error: unknown) {
    console.error("Token generation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate LiveKit token" },
      { status: 500 }
    );
  }
}
