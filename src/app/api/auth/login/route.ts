import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { User, UserLanguage, CoinTransaction } from "@/models";
import { verifyPassword, generateToken, setAuthCookie } from "@/lib/auth";
import { setUserOnline } from "@/lib/presence";

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();

    const body = await req.json();
    const { identifier, password } = body;

    if (!identifier || !password) {
      return NextResponse.json(
        { error: "Username/email and password are required" },
        { status: 400 }
      );
    }

    const cleanIdentifier = identifier.trim().toLowerCase();

    // 1. Find user by either email or username
    const user = await User.findOne({
      $or: [{ username: cleanIdentifier }, { email: cleanIdentifier }],
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // 2. Verify Password
    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // 3. Free Daily Coins & Streak Evaluation
    const now = new Date();
    const lastActive = new Date(user.lastActiveAt);
    let dailyBonusAwarded = false;

    // Check if the current login is on a different calendar day
    const isNewDay =
      now.getUTCFullYear() !== lastActive.getUTCFullYear() ||
      now.getUTCMonth() !== lastActive.getUTCMonth() ||
      now.getUTCDate() !== lastActive.getUTCDate();

    if (isNewDay) {
      // Calculate difference in days to check streak continuity
      const msPerDay = 1000 * 60 * 60 * 24;
      const daysDiff = Math.floor(
        (Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) -
          Date.UTC(lastActive.getUTCFullYear(), lastActive.getUTCMonth(), lastActive.getUTCDate())) /
          msPerDay
      );

      if (daysDiff === 1) {
        // Consecutive day login - continue streak
        user.currentStreak += 1;
      } else if (daysDiff > 1) {
        // Streak broken - reset to 1
        user.currentStreak = 1;
      }

      // Award 500 Complimentary Daily Coins
      const dailyCoinAmount = 500;
      user.coinsBalance += dailyCoinAmount;
      dailyBonusAwarded = true;

      await CoinTransaction.create({
        userId: user._id,
        type: "daily_login_bonus",
        amount: dailyCoinAmount,
        balanceAfter: user.coinsBalance,
        description: `Daily login reward: +${dailyCoinAmount} Free Coins (Day ${user.currentStreak} Streak)`,
      });
    }

    user.lastActiveAt = now;
    await user.save();

    // 4. Fetch User Languages
    const languages = await UserLanguage.find({ userId: user._id });

    // 5. Generate JWT Token & Set Cookie
    const tokenPayload = {
      userId: user._id.toString(),
      username: user.username,
      email: user.email,
      isVip: user.isVip,
    };

    const token = generateToken(tokenPayload);

    // 6. Set User Online in Redis Presence Engine
    await setUserOnline(user._id.toString());

    const response = NextResponse.json({
      success: true,
      message: dailyBonusAwarded
        ? `Welcome back! +500 Free Coins added to your balance for daily login.`
        : `Signed in successfully`,
      dailyBonusAwarded,
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
        languages: languages.map((l) => ({
          code: l.languageCode,
          type: l.type,
          proficiency: l.proficiency,
          isPrimaryLearning: l.isPrimaryLearning,
        })),
      },
      token,
    });

    setAuthCookie(response, token);

    return response;
  } catch (error: unknown) {
    console.error("Login error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to sign in",
      },
      { status: 500 }
    );
  }
}
