import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { AiSummary } from "@/models";

interface RouteParams {
  params: Promise<{ roomId: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { roomId } = await params;
    await connectToDatabase();

    const summary = await AiSummary.findOne({ roomId })
      .populate("hostId", "username displayName avatarUrl isVip")
      .lean();

    if (!summary) {
      return NextResponse.json(
        { success: false, message: "No summary found for this room yet" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      summary,
    });
  } catch (error: unknown) {
    console.error("Fetch room summary error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch summary" },
      { status: 500 }
    );
  }
}
