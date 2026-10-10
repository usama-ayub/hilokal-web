import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { transferVirtualGift } from "@/lib/gifts";

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
    const { recipientId, giftId } = body;

    if (!recipientId || !giftId) {
      return NextResponse.json(
        { error: "recipientId and giftId are required" },
        { status: 400 }
      );
    }

    const result = await transferVirtualGift({
      senderId: authPayload.userId,
      recipientId,
      roomId,
      giftId,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      gift: result.gift,
      senderNewBalance: result.senderNewBalance,
      roomMessage: result.roomMessage,
    });
  } catch (error: unknown) {
    console.error("Gift transfer error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to transfer gift" },
      { status: 500 }
    );
  }
}
