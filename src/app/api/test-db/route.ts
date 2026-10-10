import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import {
  User,
  UserLanguage,
  Room,
  ScheduledTable,
  RoomMessage,
  AiSummary,
  CoinTransaction,
} from "@/models";

export async function GET() {
  try {
    await connectToDatabase();

    // Verify all model collections are registered and accessible
    const modelStats = {
      usersCount: await User.countDocuments(),
      userLanguagesCount: await UserLanguage.countDocuments(),
      roomsCount: await Room.countDocuments(),
      scheduledTablesCount: await ScheduledTable.countDocuments(),
      roomMessagesCount: await RoomMessage.countDocuments(),
      aiSummariesCount: await AiSummary.countDocuments(),
      coinTransactionsCount: await CoinTransaction.countDocuments(),
    };

    return NextResponse.json({
      status: "success",
      message: "MongoDB connected and all 7 domain models are operational",
      timestamp: new Date().toISOString(),
      models: {
        User: { status: "ready", count: modelStats.usersCount },
        UserLanguage: { status: "ready", count: modelStats.userLanguagesCount },
        Room: { status: "ready", count: modelStats.roomsCount },
        ScheduledTable: { status: "ready", count: modelStats.scheduledTablesCount },
        RoomMessage: { status: "ready", count: modelStats.roomMessagesCount },
        AiSummary: { status: "ready", count: modelStats.aiSummariesCount },
        CoinTransaction: { status: "ready", count: modelStats.coinTransactionsCount },
      },
    });
  } catch (error: unknown) {
    console.error("Test DB error:", error);
    return NextResponse.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : "Database test failed",
      },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    await connectToDatabase();

    // Create a demo seed user to test schema validations & free tier defaults
    const demoUsername = `hilokal_learner_${Math.floor(Math.random() * 9000 + 1000)}`;
    const testUser = await User.create({
      username: demoUsername,
      email: `${demoUsername}@example.com`,
      passwordHash: "$2a$10$demoHashedPasswordForValidationTestingOnly123456",
      displayName: "Hilokal Test Learner",
      bio: "Learning languages with free VIP and live audio tables!",
      countryCode: "US",
      // Verified defaults:
      // isVip: true (100% Free VIP)
      // coinsBalance: 500 (100% Free Coins)
    });

    // Create test language portfolio
    const nativeLang = await UserLanguage.create({
      userId: testUser._id,
      languageCode: "en",
      type: "native",
      proficiency: "native",
    });

    const targetLang = await UserLanguage.create({
      userId: testUser._id,
      languageCode: "es",
      type: "learning",
      proficiency: "B1",
      isPrimaryLearning: true,
    });

    // Create test audio room
    const testRoom = await Room.create({
      title: "English & Spanish Daily Practice 🌟",
      description: "Casual conversation room for beginners and intermediate speakers.",
      primaryLanguage: "es",
      targetLevels: ["A2", "B1", "B2"],
      hostId: testUser._id,
      tableType: "practice",
      maxSpeakers: 6,
      status: "active",
    });

    // Record initial free signup coins transaction
    const initialCoinsTx = await CoinTransaction.create({
      userId: testUser._id,
      type: "initial_signup",
      amount: 500,
      balanceAfter: 500,
      description: "Welcome bonus: 500 Free Coins for stage gifts",
    });

    return NextResponse.json({
      status: "seed_created",
      message: "Sample test entities created successfully in MongoDB",
      data: {
        user: {
          id: testUser._id,
          username: testUser.username,
          isVip: testUser.isVip,
          coinsBalance: testUser.coinsBalance,
        },
        languages: [nativeLang.languageCode, targetLang.languageCode],
        room: {
          id: testRoom._id,
          title: testRoom.title,
          status: testRoom.status,
        },
        transaction: {
          amount: initialCoinsTx.amount,
          type: initialCoinsTx.type,
        },
      },
    });
  } catch (error: unknown) {
    console.error("Test DB Seed error:", error);
    return NextResponse.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : "Database seed failed",
      },
      { status: 500 }
    );
  }
}
