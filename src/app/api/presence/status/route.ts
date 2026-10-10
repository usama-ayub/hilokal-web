import { NextRequest, NextResponse } from "next/server";
import { getMultiUserPresence, getUserPresence } from "@/lib/presence";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userIdsParam = searchParams.get("userIds");
    const userIdParam = searchParams.get("userId");

    if (userIdParam) {
      const status = await getUserPresence(userIdParam);
      return NextResponse.json({
        success: true,
        userId: userIdParam,
        presence: status,
      });
    }

    if (userIdsParam) {
      const userIds = userIdsParam.split(",").map((id) => id.trim()).filter(Boolean);
      const statuses = await getMultiUserPresence(userIds);
      return NextResponse.json({
        success: true,
        statuses,
      });
    }

    return NextResponse.json(
      { error: "Query parameter 'userId' or 'userIds' is required" },
      { status: 400 }
    );
  } catch (error: unknown) {
    console.error("Presence status error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to fetch presence status",
      },
      { status: 500 }
    );
  }
}
