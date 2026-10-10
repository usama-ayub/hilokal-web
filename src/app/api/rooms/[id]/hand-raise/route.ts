import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { raiseHand, lowerHand } from "@/lib/room-state";
import { Room } from "@/models";
import { connectToDatabase } from "@/lib/db";

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

    const body = await req.json();
    const action = body.action || "raise"; // "raise" | "lower"

    if (action === "raise") {
      const result = await raiseHand(roomId, authPayload.userId);
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        action: "raised",
        position: result.position,
        message: `Hand raised. Position in FIFO queue: #${result.position}`,
      });
    } else if (action === "lower") {
      let targetUserId = authPayload.userId;

      // If a host or co-host is dismissing another user's hand raise
      if (body.userId && body.userId !== authPayload.userId) {
        await connectToDatabase();
        const room = await Room.findById(roomId);
        const isHost = room?.hostId?.toString() === authPayload.userId;
        const isCoHost = room?.coHostIds?.some((id) => id.toString() === authPayload.userId);
        if (isHost || isCoHost) {
          targetUserId = body.userId;
        }
      }

      await lowerHand(roomId, targetUserId);
      return NextResponse.json({
        success: true,
        action: "lowered",
        message: "Hand lowered",
      });
    } else {
      return NextResponse.json({ error: "Invalid action. Use 'raise' or 'lower'" }, { status: 400 });
    }
  } catch (error: unknown) {
    console.error("Hand-raise error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to process hand raise" },
      { status: 500 }
    );
  }
}
