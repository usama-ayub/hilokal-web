import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Room, User } from "@/models";
import { getAuthUser } from "@/lib/auth";
import { initRoomState, getRoomRealtimeState } from "@/lib/room-state";
import { createLiveKitToken } from "@/lib/livekit";

/**
 * GET /api/rooms - List all active audio tables with live Redis participant counts
 */
export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const language = searchParams.get("language");
    const tableType = searchParams.get("type");

    const query: Record<string, unknown> = { status: "active" };
    if (language) query.primaryLanguage = language.toLowerCase();
    if (tableType) query.tableType = tableType.toLowerCase();

    const rooms = await Room.find(query)
      .populate("hostId", "username displayName avatarUrl isVip")
      .sort({ createdAt: -1 })
      .limit(30);

    // Enrich rooms with real-time Redis state (speakers, listeners)
    const enrichedRooms = await Promise.all(
      rooms.map(async (r) => {
        const state = await getRoomRealtimeState(r._id.toString());
        return {
          id: r._id,
          title: r.title,
          description: r.description,
          topicTags: r.topicTags,
          primaryLanguage: r.primaryLanguage,
          targetLevels: r.targetLevels,
          tableType: r.tableType,
          maxSpeakers: r.maxSpeakers,
          bannerUrl: r.bannerUrl,
          host: r.hostId,
          startedAt: r.startedAt,
          realtime: {
            speakerCount: state.speakerCount || 1,
            listenerCount: state.listenerCount || 0,
            handRaiseCount: state.handRaiseQueue.length,
          },
        };
      })
    );

    return NextResponse.json({
      success: true,
      count: enrichedRooms.length,
      rooms: enrichedRooms,
    });
  } catch (error: unknown) {
    console.error("List rooms error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch rooms" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/rooms - Create a new audio table (100% Free VIP with custom banners)
 */
export async function POST(req: NextRequest) {
  try {
    const authPayload = getAuthUser(req);
    if (!authPayload) {
      return NextResponse.json({ error: "Unauthorized: Please sign in to create a room" }, { status: 401 });
    }

    await connectToDatabase();

    const body = await req.json();
    const {
      title,
      description = "",
      topicTags = [],
      primaryLanguage = "en",
      targetLevels = ["A1", "A2", "B1", "B2"],
      maxSpeakers = 6,
      tableType = "casual",
      bannerUrl = "",
      isPrivate = false,
      accessCode = "",
    } = body;

    if (!title || title.trim().length === 0) {
      return NextResponse.json({ error: "Room title is required" }, { status: 400 });
    }

    // 1. Create Room in MongoDB
    const clampedSpeakers = Math.max(2, Math.min(10, Number(maxSpeakers) || 6));
    const newRoom = await Room.create({
      title: title.trim(),
      description: description.trim(),
      topicTags: Array.isArray(topicTags) ? topicTags : [],
      primaryLanguage: primaryLanguage.toLowerCase(),
      targetLevels: Array.isArray(targetLevels) ? targetLevels : ["A1", "A2"],
      hostId: authPayload.userId,
      maxSpeakers: clampedSpeakers,
      tableType,
      bannerUrl: bannerUrl || null,
      isPrivate: Boolean(isPrivate),
      accessCode: isPrivate ? accessCode : undefined,
      status: "active",
      startedAt: new Date(),
    });

    // 2. Initialize Ephemeral Redis State
    await initRoomState(newRoom._id.toString(), authPayload.userId, {
      title: newRoom.title,
      primaryLanguage: newRoom.primaryLanguage,
    });

    // 3. Generate Host LiveKit Token
    const livekitToken = await createLiveKitToken({
      roomName: newRoom._id.toString(),
      participantIdentity: authPayload.userId,
      participantName: authPayload.username,
      role: "host",
      metadata: {
        userId: authPayload.userId,
        username: authPayload.username,
        role: "host",
        isVip: authPayload.isVip,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Audio table created successfully",
      room: {
        id: newRoom._id,
        title: newRoom.title,
        description: newRoom.description,
        primaryLanguage: newRoom.primaryLanguage,
        targetLevels: newRoom.targetLevels,
        maxSpeakers: newRoom.maxSpeakers,
        tableType: newRoom.tableType,
        bannerUrl: newRoom.bannerUrl,
        hostId: authPayload.userId,
        status: newRoom.status,
      },
      token: livekitToken,
      wsUrl: process.env.NEXT_PUBLIC_LIVEKIT_WS_URL || "ws://localhost:7880",
    });
  } catch (error: unknown) {
    console.error("Create room error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create room" },
      { status: 500 }
    );
  }
}
