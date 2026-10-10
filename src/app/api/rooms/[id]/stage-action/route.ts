import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Room } from "@/models";
import { getAuthUser } from "@/lib/auth";
import {
  promoteToSpeaker,
  demoteToListener,
  leaveRoomState,
} from "@/lib/room-state";
import {
  updateLiveKitPermissions,
  removeLiveKitParticipant,
  muteLiveKitParticipant,
} from "@/lib/livekit";

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

    // Verify host permission
    const isHost = room.hostId.toString() === authPayload.userId;
    const isCoHost = room.coHostIds?.some((id) => id.toString() === authPayload.userId);

    if (!isHost && !isCoHost) {
      return NextResponse.json(
        { error: "Forbidden: Only hosts can manage stage participants" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { targetUserId, action, trackSid } = body;

    if (!targetUserId || !action) {
      return NextResponse.json(
        { error: "targetUserId and action are required" },
        { status: 400 }
      );
    }

    if (action === "promote") {
      const result = await promoteToSpeaker(roomId, targetUserId, room.maxSpeakers);
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }

      // Grant WebRTC publish permissions in LiveKit
      await updateLiveKitPermissions(roomId, targetUserId, true);

      return NextResponse.json({
        success: true,
        action: "promoted",
        message: "User promoted to speaker stage",
      });
    } else if (action === "demote") {
      await demoteToListener(roomId, targetUserId);

      // Revoke WebRTC publish permissions in LiveKit
      await updateLiveKitPermissions(roomId, targetUserId, false);

      return NextResponse.json({
        success: true,
        action: "demoted",
        message: "Speaker demoted to listener",
      });
    } else if (action === "kick") {
      await leaveRoomState(roomId, targetUserId);
      await removeLiveKitParticipant(roomId, targetUserId);

      return NextResponse.json({
        success: true,
        action: "kicked",
        message: "Participant removed from audio room",
      });
    } else if (action === "mute") {
      if (trackSid) {
        await muteLiveKitParticipant(roomId, targetUserId, trackSid, true);
      }
      return NextResponse.json({
        success: true,
        action: "muted",
        message: "Participant track muted",
      });
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error: unknown) {
    console.error("Stage action error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Stage action failed" },
      { status: 500 }
    );
  }
}
