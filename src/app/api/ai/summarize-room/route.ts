import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Room, RoomMessage, AiSummary, User } from "@/models";
import { getAuthUser } from "@/lib/auth";
import { generateRoomSummaryWithGemini } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    const authPayload = getAuthUser(req);
    if (!authPayload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { roomId } = body;

    if (!roomId) {
      return NextResponse.json({ error: "Room ID is required" }, { status: 400 });
    }

    await connectToDatabase();

    const room = await Room.findById(roomId).populate("host", "username displayName avatarUrl isVip");
    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    // Fetch messages from this session
    const messages = await RoomMessage.find({ roomId: room._id })
      .sort({ createdAt: 1 })
      .populate("senderId", "displayName username")
      .lean();

    const formattedMessages = messages.map((m: any) => ({
      type: m.type,
      content: m.content,
      senderName: m.senderId?.displayName || m.senderId?.username || "Learner",
      correctionDetails: m.correctionDetails,
    }));

    const hostName = (room.host as any)?.displayName || (room.host as any)?.username || "Host";

    // Call Gemini Free Tier AI Engine
    const aiResult = await generateRoomSummaryWithGemini({
      roomId: room._id.toString(),
      roomTitle: room.title,
      language: room.primaryLanguage,
      levels: room.targetLevels || ["A1", "B1"],
      hostName,
      messages: formattedMessages,
    });

    // Upsert into AiSummary collection
    const summaryDoc = await AiSummary.findOneAndUpdate(
      { roomId: room._id },
      {
        roomId: room._id,
        hostId: (room.host as any)._id || authPayload.userId,
        title: aiResult.title,
        summaryMarkdown: aiResult.summaryMarkdown,
        topicsDiscussed: aiResult.topicsDiscussed,
        vocabularyWords: aiResult.vocabularyWords,
        grammarTips: aiResult.grammarTips,
        keyPhrases: aiResult.keyPhrases,
        generatedAt: new Date(),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return NextResponse.json({
      success: true,
      summary: summaryDoc,
      isAiGenerated: aiResult.isAiGenerated,
      modelUsed: aiResult.modelUsed,
    });
  } catch (error: unknown) {
    console.error("AI Room Summary error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate AI summary" },
      { status: 500 }
    );
  }
}
