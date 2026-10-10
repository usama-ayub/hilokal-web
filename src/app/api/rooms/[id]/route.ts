import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Room, User } from "@/models";
import { getRoomRealtimeState } from "@/lib/room-state";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id: roomId } = await params;
    await connectToDatabase();

    const room = await Room.findById(roomId).populate(
      "hostId",
      "username displayName avatarUrl isVip"
    );

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    // Fetch live state from Redis
    const realtimeState = await getRoomRealtimeState(roomId);

    // Populate user profiles for active speakers and hand-raise queue
    const allUserIds = [
      ...realtimeState.speakers,
      ...realtimeState.listeners,
      ...realtimeState.handRaiseQueue.map((q) => q.userId),
    ];

    const users = await User.find({ _id: { $in: allUserIds } }).select(
      "username displayName avatarUrl isVip countryCode"
    );

    const userMap = new Map(users.map((u) => [u._id.toString(), u]));

    const populatedSpeakers = realtimeState.speakers.map((id) => userMap.get(id) || { id });
    const populatedListeners = realtimeState.listeners.map((id) => userMap.get(id) || { id });
    const populatedQueue = realtimeState.handRaiseQueue.map((q) => ({
      user: userMap.get(q.userId) || { id: q.userId },
      raisedAt: q.raisedAt,
    }));

    return NextResponse.json({
      success: true,
      room: {
        id: room._id,
        title: room.title,
        description: room.description,
        primaryLanguage: room.primaryLanguage,
        targetLevels: room.targetLevels,
        maxSpeakers: room.maxSpeakers,
        tableType: room.tableType,
        bannerUrl: room.bannerUrl,
        host: room.hostId,
        status: room.status,
        startedAt: room.startedAt,
      },
      realtime: {
        speakers: populatedSpeakers,
        listeners: populatedListeners,
        handRaiseQueue: populatedQueue,
        speakerCount: populatedSpeakers.length,
        listenerCount: populatedListeners.length,
      },
    });
  } catch (error: unknown) {
    console.error("Get room error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch room" },
      { status: 500 }
    );
  }
}
