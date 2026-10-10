import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { redis } from "@/lib/redis";
import { minioClient, STORAGE_BUCKETS, ensureBucketsExist } from "@/lib/storage";

export async function GET() {
  const healthReport = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    services: {
      mongodb: { status: "unknown", latencyMs: 0 },
      redis: { status: "unknown", latencyMs: 0 },
      minio: { status: "unknown", latencyMs: 0 },
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

  // 3. Test MinIO Storage Connection & Ensure Buckets
  const minioStart = Date.now();
  try {
    await ensureBucketsExist();
    const exists = await minioClient.bucketExists(STORAGE_BUCKETS.AVATARS);
    healthReport.services.minio = {
      status: exists ? "connected_and_bucket_ready" : "connected_bucket_missing",
      latencyMs: Date.now() - minioStart,
    };
  } catch (err: unknown) {
    healthReport.services.minio = {
      status: `error: ${err instanceof Error ? err.message : String(err)}`,
      latencyMs: Date.now() - minioStart,
    };
    healthReport.status = "degraded";
  }

  return NextResponse.json(healthReport, {
    status: healthReport.status === "healthy" ? 200 : 207,
  });
}
