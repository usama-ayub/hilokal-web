import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { User, UserLanguage } from "@/models";
import { getAuthUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const authPayload = getAuthUser(req);
    if (!authPayload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const user = await User.findById(authPayload.userId).select("-passwordHash");
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const languages = await UserLanguage.find({ userId: user._id });

    return NextResponse.json({
      success: true,
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
        createdAt: user.createdAt,
        languages: languages.map((l) => ({
          id: l._id,
          code: l.languageCode,
          type: l.type,
          proficiency: l.proficiency,
          isPrimaryLearning: l.isPrimaryLearning,
        })),
      },
    });
  } catch (error: unknown) {
    console.error("Get profile error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const authPayload = getAuthUser(req);
    if (!authPayload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const body = await req.json();
    const {
      displayName,
      bio,
      countryCode,
      avatarUrl,
      audioBioUrl,
      languages,
    } = body;

    const user = await User.findById(authPayload.userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Update allowed fields
    if (displayName !== undefined) user.displayName = displayName.trim();
    if (bio !== undefined) user.bio = bio.trim();
    if (countryCode !== undefined) user.countryCode = countryCode.toUpperCase();
    if (avatarUrl !== undefined) user.avatarUrl = avatarUrl;
    if (audioBioUrl !== undefined) user.audioBioUrl = audioBioUrl;

    await user.save();

    // If languages list is provided, update user languages
    if (Array.isArray(languages)) {
      for (const lang of languages) {
        if (lang.code && lang.type) {
          await UserLanguage.findOneAndUpdate(
            { userId: user._id, languageCode: lang.code.toLowerCase() },
            {
              type: lang.type,
              proficiency: lang.proficiency || (lang.type === "native" ? "native" : "A1"),
              isPrimaryLearning: Boolean(lang.isPrimaryLearning),
            },
            { upsert: true, new: true }
          );
        }
      }
    }

    const updatedLanguages = await UserLanguage.find({ userId: user._id });

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
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
        languages: updatedLanguages.map((l) => ({
          id: l._id,
          code: l.languageCode,
          type: l.type,
          proficiency: l.proficiency,
          isPrimaryLearning: l.isPrimaryLearning,
        })),
      },
    });
  } catch (error: unknown) {
    console.error("Update profile error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update profile" },
      { status: 500 }
    );
  }
}
