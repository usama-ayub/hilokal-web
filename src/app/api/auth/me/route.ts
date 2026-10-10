import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { User, UserLanguage } from "@/models";
import { getAuthUser } from "@/lib/auth";
import { getUserPresence } from "@/lib/presence";

export async function GET(req: NextRequest) {
  try {
    const authPayload = getAuthUser(req);

    if (!authPayload) {
      return NextResponse.json(
        { authenticated: false, user: null },
        { status: 200 }
      );
    }

    await connectToDatabase();

    const user = await User.findById(authPayload.userId).select("-passwordHash");

    if (!user) {
      return NextResponse.json(
        { authenticated: false, user: null },
        { status: 200 }
      );
    }

    const languages = await UserLanguage.find({ userId: user._id });
    const presence = await getUserPresence(user._id.toString());

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        audioBioUrl: user.audioBioUrl,
        bio: user.bio,
        countryCode: user.countryCode,
        isVip: user.isVip,
        coinsBalance: user.coinsBalance,
        currentStreak: user.currentStreak,
        totalTalkingTimeMinutes: user.totalTalkingTimeMinutes,
        presence,
        languages: languages.map((l) => ({
          code: l.languageCode,
          type: l.type,
          proficiency: l.proficiency,
          isPrimaryLearning: l.isPrimaryLearning,
        })),
      },
    });
  } catch (error: unknown) {
    console.error("Auth me error:", error);
    return NextResponse.json(
      {
        authenticated: false,
        user: null,
        error: error instanceof Error ? error.message : "Failed to verify session",
      },
      { status: 500 }
    );
  }
}
