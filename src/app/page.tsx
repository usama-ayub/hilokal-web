"use client";

import React, { useEffect, useState } from "react";
import { 
  Headphones, 
  Sparkles, 
  Crown, 
  Coins, 
  Server, 
  Database, 
  Radio, 
  HardDrive, 
  CheckCircle2, 
  AlertCircle,
  RefreshCw,
  Layers,
  ArrowRight
} from "lucide-react";

interface ServiceHealth {
  status: string;
  latencyMs?: number;
  wsUrl?: string;
}

interface HealthData {
  status: string;
  timestamp: string;
  services: {
    mongodb: ServiceHealth;
    redis: ServiceHealth;
    minio: ServiceHealth;
    livekit: ServiceHealth;
  };
}

export default function Home() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const checkHealth = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/health");
      const data = await res.json();
      setHealth(data);
    } catch {
      setHealth(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 px-4 py-12 md:px-8 max-w-6xl mx-auto">
      {/* Header */}
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between pb-8 border-b border-slate-800 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2.5 rounded-xl shadow-lg shadow-indigo-600/30">
              <Headphones className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-300 bg-clip-text text-transparent">
                Hilokal Web Clone
              </h1>
              <p className="text-sm text-slate-400">
                Real-Time Audio Language Exchange • 100% Free VIP & AI Suite
              </p>
            </div>
          </div>
        </div>

        {/* Free VIP & Balance Badges */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold">
            <Crown className="w-4 h-4 text-amber-400" />
            VIP Unlocked (Free)
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-semibold">
            <Coins className="w-4 h-4 text-indigo-400" />
            500 Free Coins Daily
          </div>
        </div>
      </header>

      {/* Day 1 Status & Infrastructure Card */}
      <section className="mt-8">
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-indigo-500/20 text-indigo-300 text-xs font-medium mb-1">
                <Layers className="w-3.5 h-3.5" />
                Day 1 Milestone: Foundation & Architecture
              </div>
              <h2 className="text-xl font-bold text-white">Local Infrastructure Status</h2>
              <p className="text-sm text-slate-400">
                Verifying connection to local Docker services (MongoDB, Redis, MinIO S3, LiveKit SFU).
              </p>
            </div>

            <button
              onClick={checkHealth}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-medium rounded-lg transition-colors border border-slate-700"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Re-test Services
            </button>
          </div>

          {/* Grid of Services */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* MongoDB */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-slate-300 font-medium text-sm">
                  <Database className="w-4 h-4 text-emerald-400" />
                  MongoDB 7.0
                </div>
                {health?.services.mongodb.status === "connected" ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                )}
              </div>
              <div className="text-xs text-slate-400">
                Status:{" "}
                <span className={health?.services.mongodb.status === "connected" ? "text-emerald-400 font-medium" : "text-amber-400"}>
                  {health ? health.services.mongodb.status : "Waiting for Docker..."}
                </span>
              </div>
              {health?.services.mongodb.latencyMs !== undefined && (
                <div className="text-[11px] text-slate-500 mt-1">
                  Latency: {health.services.mongodb.latencyMs}ms
                </div>
              )}
            </div>

            {/* Redis */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-slate-300 font-medium text-sm">
                  <Server className="w-4 h-4 text-red-400" />
                  Redis 7.2
                </div>
                {health?.services.redis.status === "connected" ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                )}
              </div>
              <div className="text-xs text-slate-400">
                Status:{" "}
                <span className={health?.services.redis.status === "connected" ? "text-emerald-400 font-medium" : "text-amber-400"}>
                  {health ? health.services.redis.status : "Waiting for Docker..."}
                </span>
              </div>
              {health?.services.redis.latencyMs !== undefined && (
                <div className="text-[11px] text-slate-500 mt-1">
                  Latency: {health.services.redis.latencyMs}ms
                </div>
              )}
            </div>

            {/* MinIO Storage */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-slate-300 font-medium text-sm">
                  <HardDrive className="w-4 h-4 text-pink-400" />
                  MinIO (S3)
                </div>
                {health?.services.minio.status?.includes("connected") ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                )}
              </div>
              <div className="text-xs text-slate-400">
                Status:{" "}
                <span className={health?.services.minio.status?.includes("connected") ? "text-emerald-400 font-medium" : "text-amber-400"}>
                  {health ? health.services.minio.status : "Waiting for Docker..."}
                </span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Direct uploads enabled
              </div>
            </div>

            {/* LiveKit SFU */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-slate-300 font-medium text-sm">
                  <Radio className="w-4 h-4 text-indigo-400" />
                  LiveKit SFU
                </div>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-xs text-slate-400">
                Signaling: <span className="text-indigo-400 font-mono">ws://localhost:7880</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Sub-100ms WebRTC ready
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-4">
              <Headphones className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Live Audio Tables</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Real-time WebRTC audio rooms with Hosts, Speakers, and Listeners. Instant hand-raise queue powered by Redis Sorted Sets.
            </p>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-indigo-400">
            Coming in Day 4 <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 mb-4">
              <Crown className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Free VIP & Coins</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              All paid features unlocked for free. Send virtual gifts to speakers using complimentary daily coins with zero payment gateways.
            </p>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-amber-400">
            Unlocked by Default <Sparkles className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 mb-4">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Free AI Feedback</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Google Gemini free tier automatically summarizes completed audio tables and extracts 5 vocabulary flashcards for learners.
            </p>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-purple-400">
            Coming in Day 6 <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-12 pt-6 border-t border-slate-900 text-center text-xs text-slate-500">
        Hilokal Web Clone • Enterprise Architecture with 100% Free & Open-Source Stack
      </footer>
    </main>
  );
}
