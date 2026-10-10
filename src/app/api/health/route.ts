import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { redis } from "@/lib/redis";
import { ensureBucketsExist } from "@/lib/storage";

export async function GET() {
  const healthReport = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    services: {
      mongodb: { status: "unknown", latencyMs: 0 },
      redis: { status: "unknown", latencyMs: 0 },
      storage: { status: "unknown", latencyMs: 0 },
      livekit: { status: "configured", wsUrl: process.env.NEXT_PUBLIC_LIVEKIT_WS_URL },
    },
  };

  // 1. Test MongoDB Connection
  const mongoStart = Date.now();
  try {
    const mongooseConn = await connectToDatabase();
    if (mongooseConn.connection.readyState === 1) {
      healthReport.services.mongodb = {
        status: "connected",
        latencyMs: Date.now() - mongoStart,
      };
    } else {
      healthReport.services.mongodb = {
        status: "disconnected",
        latencyMs: Date.now() - mongoStart,
      };
      healthReport.status = "degraded";
    }
  } catch (err: unknown) {
    healthReport.services.mongodb = {
      status: `error: ${err instanceof Error ? err.message : String(err)}`,
      latencyMs: Date.now() - mongoStart,
    };
    healthReport.status = "degraded";
  }

  // 2. Test Redis Connection
  const redisStart = Date.now();
  try {
    const pingResponse = await redis.ping();
    healthReport.services.redis = {
      status: pingResponse === "PONG" ? "connected" : "unexpected_response",
      latencyMs: Date.now() - redisStart,
    };
  } catch (err: unknown) {
    healthReport.services.redis = {
      status: `error: ${err instanceof Error ? err.message : String(err)}`,
      latencyMs: Date.now() - redisStart,
    };
    healthReport.status = "degraded";
  }

  // 3. Test Local Media Storage Directories
  const storageStart = Date.now();
  try {
    await ensureBucketsExist();
    healthReport.services.storage = {
      status: "ready (local disk /public/uploads)",
      latencyMs: Date.now() - storageStart,
    };
  } catch (err: unknown) {
    healthReport.services.storage = {
      status: `error: ${err instanceof Error ? err.message : String(err)}`,
      latencyMs: Date.now() - storageStart,
    };
    healthReport.status = "degraded";
  }

  return NextResponse.json(healthReport, {
    status: healthReport.status === "healthy" ? 200 : 207,
  });
}
