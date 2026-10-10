import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { User, CoinTransaction } from "@/models";
import { getAuthUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const authPayload = getAuthUser(req);
    if (!authPayload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const user = await User.findById(authPayload.userId).select("coinsBalance currentStreak longestStreak isVip");
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const transactions = await CoinTransaction.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .limit(30)
      .populate("relatedUserId", "username displayName avatarUrl isVip")
      .populate("relatedRoomId", "title")
      .lean();

    return NextResponse.json({
      success: true,
      balance: user.coinsBalance,
      currentStreak: user.currentStreak,
      longestStreak: user.longestStreak,
      isVip: user.isVip,
      transactions,
    });
  } catch (error: unknown) {
    console.error("Get coin balance error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch balance" },
      { status: 500 }
    );
  }
}
