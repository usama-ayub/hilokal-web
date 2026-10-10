import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { User, UserLanguage, CoinTransaction } from "@/models";
import { hashPassword, generateToken, setAuthCookie } from "@/lib/auth";
import { setUserOnline } from "@/lib/presence";

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();

    const body = await req.json();
    const {
      username,
      email,
      password,
      displayName,
      nativeLanguage = "en",
      learningLanguage = "es",
      learningLevel = "A1",
      bio = "",
      countryCode = "US",
    } = body;

    // 1. Validation
    if (!username || !email || !password || !displayName) {
      return NextResponse.json(
        { error: "Username, email, password, and display name are required" },
        { status: 400 }
      );
    }

    if (username.length < 3 || username.length > 30) {
      return NextResponse.json(
        { error: "Username must be between 3 and 30 characters" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    const cleanUsername = username.trim().toLowerCase();
    const cleanEmail = email.trim().toLowerCase();

    // 2. Check for existing user
    const existingUser = await User.findOne({
      $or: [{ username: cleanUsername }, { email: cleanEmail }],
    });

    if (existingUser) {
      if (existingUser.username === cleanUsername) {
        return NextResponse.json({ error: "Username is already taken" }, { status: 409 });
      }
      return NextResponse.json({ error: "Email is already registered" }, { status: 409 });
    }

    // 3. Hash password
    const passwordHash = await hashPassword(password);

    // 4. Create User (100% Free VIP + 500 Complimentary Coins)
    const newUser = await User.create({
      username: cleanUsername,
      email: cleanEmail,
      passwordHash,
      displayName: displayName.trim(),
      bio: bio.trim(),
      countryCode: countryCode.toUpperCase(),
      isVip: true, // Free VIP Unlocked for all users
      coinsBalance: 500, // 500 Welcome Bonus Coins
      currentStreak: 1,
      lastActiveAt: new Date(),
    });

    // 5. Create Language Portfolio
    await UserLanguage.create([
      {
        userId: newUser._id,
        languageCode: nativeLanguage.toLowerCase(),
        type: "native",
        proficiency: "native",
        isPrimaryLearning: false,
      },
      {
        userId: newUser._id,
        languageCode: learningLanguage.toLowerCase(),
        type: "learning",
        proficiency: learningLevel,
        isPrimaryLearning: true,
      },
    ]);

    // 6. Record Initial Free Welcome Coins Transaction
    await CoinTransaction.create({
      userId: newUser._id,
      type: "initial_signup",
      amount: 500,
      balanceAfter: 500,
      description: "Welcome bonus: 500 Free Coins for stage gifts",
    });

    // 7. Generate JWT Token & Set Cookie
    const tokenPayload = {
      userId: newUser._id.toString(),
      username: newUser.username,
      email: newUser.email,
      isVip: newUser.isVip,
    };

    const token = generateToken(tokenPayload);

    // 8. Register User Online Presence in Redis
    await setUserOnline(newUser._id.toString());

    const response = NextResponse.json({
      success: true,
      message: "User registered successfully with Free VIP & 500 Welcome Coins",
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        displayName: newUser.displayName,
        avatarUrl: newUser.avatarUrl,
        audioBioUrl: newUser.audioBioUrl,
        bio: newUser.bio,
        countryCode: newUser.countryCode,
        isVip: newUser.isVip,
        coinsBalance: newUser.coinsBalance,
        currentStreak: newUser.currentStreak,
      },
      token,
    });

    setAuthCookie(response, token);

    return response;
  } catch (error: unknown) {
    console.error("Registration error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to register user",
      },
      { status: 500 }
    );
  }
}
