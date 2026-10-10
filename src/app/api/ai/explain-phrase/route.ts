import { NextRequest, NextResponse } from "next/server";
import { explainPhrase } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phrase, language = "es" } = body;

    if (!phrase || !phrase.trim()) {
      return NextResponse.json({ error: "Phrase is required" }, { status: 400 });
    }

    const explanation = await explainPhrase(phrase.trim(), language);

    return NextResponse.json({
      success: true,
      data: explanation,
    });
  } catch (error: unknown) {
    console.error("Explain phrase error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to explain phrase" },
      { status: 500 }
    );
  }
}
