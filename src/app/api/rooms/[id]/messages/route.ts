import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { RoomMessage, Room, User } from "@/models";
import { getAuthUser } from "@/lib/auth";
import { redis } from "@/lib/redis";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id: roomId } = await params;
    await connectToDatabase();

    const limit = parseInt(req.nextUrl.searchParams.get("limit") || "60", 10);

    const messages = await RoomMessage.find({ roomId })
      .sort({ createdAt: 1 })
      .limit(limit)
      .populate("senderId", "username displayName avatarUrl isVip")
      .populate("giftDetails.recipientId", "username displayName avatarUrl isVip")
      .lean();

    return NextResponse.json({
      success: true,
      messages,
    });
  } catch (error: unknown) {
    console.error("Fetch room messages error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch messages" },
      { status: 500 }
    );
  }
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

    const body = await req.json();
    const { type = "text", content, correctionDetails } = body;

    if (!content || !content.trim()) {
      return NextResponse.json({ error: "Message content cannot be empty" }, { status: 400 });
    }

    if (type === "correction") {
      if (!correctionDetails?.originalText || !correctionDetails?.correctedText) {
        return NextResponse.json(
          { error: "Language correction requires both originalText and correctedText" },
          { status: 400 }
        );
      }
    }

    const message = await RoomMessage.create({
      roomId: room._id,
      senderId: authPayload.userId,
      type,
      content: content.trim(),
      correctionDetails:
        type === "correction"
          ? {
              originalText: correctionDetails.originalText.trim(),
              correctedText: correctionDetails.correctedText.trim(),
              explanation: correctionDetails.explanation?.trim() || "",
            }
          : undefined,
    });

    const populatedMessage = await RoomMessage.findById(message._id)
      .populate("senderId", "username displayName avatarUrl isVip")
      .lean();

    // Broadcast to Redis PubSub channel
    try {
      const eventPayload = {
        type: "ROOM_MESSAGE",
        roomId,
        message: populatedMessage,
        timestamp: Date.now(),
      };
      await redis.publish(`room:${roomId}:events`, JSON.stringify(eventPayload));
    } catch (err) {
      console.warn("Failed to publish message event to Redis:", err);
    }

    return NextResponse.json({
      success: true,
      message: populatedMessage,
    });
  } catch (error: unknown) {
    console.error("Send message error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to send message" },
      { status: 500 }
    );
  }
}
