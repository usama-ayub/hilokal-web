import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { raiseHand, lowerHand } from "@/lib/room-state";

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
      await lowerHand(roomId, authPayload.userId);
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
