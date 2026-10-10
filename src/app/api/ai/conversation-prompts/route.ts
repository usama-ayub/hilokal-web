import { NextRequest, NextResponse } from "next/server";
import { generateConversationStarters } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { language = "es", level = "B1" } = body;

    const starters = await generateConversationStarters(language, level);

    return NextResponse.json({
      success: true,
      language,
      level,
      starters,
    });
  } catch (error: unknown) {
    console.error("Conversation starters error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate starters" },
      { status: 500 }
    );
  }
}
