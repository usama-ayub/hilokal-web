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
  ArrowRight,
  UploadCloud,
  FileCode2,
  Send,
  UserCheck,
  ShieldCheck,
  Flame,
  Globe,
  LogOut,
  LogIn,
  UserPlus,
  Activity,
  Mic,
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { PresenceHeartbeat } from "@/components/PresenceHeartbeat";

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
    storage: ServiceHealth;
    livekit: ServiceHealth;
  };
}

interface DbTestResult {
  status: string;
  message: string;
  models?: Record<string, { status: string; count: number }>;
  data?: {
    user: { id: string; username: string; isVip: boolean; coinsBalance: number };
    languages: string[];
    room: { id: string; title: string; status: string };
    transaction: { amount: number; type: string };
  };
}

export default function Home() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Day 2 State
  const [dbStatus, setDbStatus] = useState<DbTestResult | null>(null);
  const [dbLoading, setDbLoading] = useState<boolean>(false);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Day 3 Auth & Presence State
  const { user, isAuthenticated, fetchMe, login, register, logout } = useAuthStore();
  const [authMode, setAuthMode] = useState<"login" | "register">("register");
  const [authForm, setAuthForm] = useState({
    username: "learner_alex",
    email: "alex@hilokal.test",
    password: "password123",
    displayName: "Alex Rivera",
    nativeLanguage: "en",
    learningLanguage: "es",
    learningLevel: "B1",
    bio: "Passionate polyglot learning Spanish and Japanese!",
  });
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [presenceData, setPresenceData] = useState<{ online: boolean; activeRoomId: string | null } | null>(null);
  const [checkingPresence, setCheckingPresence] = useState<boolean>(false);

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

  const testDbModels = async (seed: boolean = false) => {
    setDbLoading(true);
    try {
      const res = await fetch("/api/test-db", {
        method: seed ? "POST" : "GET",
      });
      const data = await res.json();
      setDbStatus(data);
    } catch (err) {
      setDbStatus({
        status: "error",
        message: err instanceof Error ? err.message : "Failed to connect to database models",
      });
    } finally {
      setDbLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadSuccess(null);
    setUploadError(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("bucket", "avatars");

    try {
      const res = await fetch("/api/media/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Upload failed");
      }
      setUploadSuccess(data.url);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthMessage(null);
    setAuthError(null);

    if (authMode === "register") {
      const res = await register({
        username: authForm.username,
        email: authForm.email,
        password: authForm.password,
        displayName: authForm.displayName,
        nativeLanguage: authForm.nativeLanguage,
        learningLanguage: authForm.learningLanguage,
        learningLevel: authForm.learningLevel,
        bio: authForm.bio,
      });

      if (!res.success) {
        setAuthError(res.error || "Registration failed");
      } else {
        setAuthMessage("Account created successfully with Free VIP & 500 Coins!");
        refreshPresence(user?.id);
      }
    } else {
      const res = await login(authForm.email || authForm.username, authForm.password);
      if (!res.success) {
        setAuthError(res.error || "Login failed");
      } else {
        setAuthMessage(
          res.dailyBonusAwarded
            ? "Welcome back! +500 Free Coins claimed for daily login streak!"
            : "Signed in successfully!"
        );
        refreshPresence(user?.id);
      }
    }
  };

  const refreshPresence = async (userIdToQuery?: string) => {
    const targetId = userIdToQuery || user?.id;
    if (!targetId) return;

    setCheckingPresence(true);
    try {
      const res = await fetch(`/api/presence/status?userId=${targetId}`);
      const data = await res.json();
      if (data.success) {
        setPresenceData(data.presence);
      }
    } catch {
      // Ignore
    } finally {
      setCheckingPresence(false);
    }
  };

  useEffect(() => {
    checkHealth();
    testDbModels(false);
    fetchMe();
  }, []);

  useEffect(() => {
    if (user?.id) {
      refreshPresence(user.id);
    }
  }, [user?.id]);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 px-4 py-12 md:px-8 max-w-6xl mx-auto">
      {/* Background Heartbeat for logged-in user */}
      <PresenceHeartbeat />

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

        {/* Dynamic Badges */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold">
            <Crown className="w-4 h-4 text-amber-400" />
            {user?.isVip ? "VIP Member (Free)" : "VIP Unlocked (Free)"}
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-semibold">
            <Coins className="w-4 h-4 text-indigo-400" />
            {user ? `${user.coinsBalance} Coins` : "500 Free Coins Daily"}
          </div>
          {isAuthenticated && (
            <button
              onClick={() => logout()}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          )}
        </div>
      </header>

      {/* Day 3 Milestone: Authentication & Real-Time Presence Engine */}
      <section className="mt-8">
        <div className="bg-slate-900/60 border border-emerald-500/30 rounded-2xl p-6 shadow-xl backdrop-blur-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-300 text-xs font-medium mb-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Day 3 Milestone: JWT Auth & Redis Presence Engine (Active)
              </div>
              <h2 className="text-xl font-bold text-white">Authentication & Redis Heartbeats</h2>
              <p className="text-sm text-slate-400">
                JWT password security, automatic Free VIP, 500 Daily Coins reward, and sub-second online presence.
              </p>
            </div>

            {isAuthenticated && user && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => refreshPresence(user.id)}
                  disabled={checkingPresence}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-medium rounded-lg transition-colors border border-slate-700"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${checkingPresence ? "animate-spin" : ""}`} />
                  Query Redis Presence
                </button>
              </div>
            )}
          </div>

          {/* Conditional: Authenticated View vs Guest View */}
          {isAuthenticated && user ? (
            <div className="space-y-4">
              {/* Active Profile Card */}
              <div className="p-5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-500 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                      {user.displayName?.charAt(0) || user.username.charAt(0).toUpperCase()}
                    </div>
                    {/* Live Online Glowing Pulse */}
                    <span className="absolute bottom-0 right-0 flex h-4 w-4">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-slate-950"></span>
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-white">{user.displayName}</h3>
                      <span className="text-xs text-slate-400 font-mono">@{user.username}</span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-bold">
                        <Crown className="w-3 h-3" /> VIP
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{user.bio || "No bio set."}</p>

                    <div className="flex flex-wrap items-center gap-3 mt-2 text-xs">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Globe className="w-3.5 h-3.5 text-indigo-400" />
                        Native: <strong className="text-slate-200 uppercase">{user.languages?.find((l) => l.type === "native")?.code || "EN"}</strong>
                      </span>
                      <span className="text-slate-400 flex items-center gap-1">
                        <Globe className="w-3.5 h-3.5 text-emerald-400" />
                        Learning: <strong className="text-slate-200 uppercase">{user.languages?.find((l) => l.type === "learning")?.code || "ES"} ({user.languages?.find((l) => l.type === "learning")?.proficiency || "A1"})</strong>
                      </span>
                      <span className="text-slate-400 flex items-center gap-1">
                        <Flame className="w-3.5 h-3.5 text-orange-400" />
                        Streak: <strong className="text-orange-400">{user.currentStreak} Day{user.currentStreak > 1 ? "s" : ""}</strong>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Presence & Balance Summary */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-slate-900/80 p-3.5 rounded-lg border border-slate-800 text-xs">
                  <div>
                    <div className="text-[11px] text-slate-400">Redis In-Memory Status</div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                      <span className="font-semibold text-emerald-400">
                        {presenceData?.online ? "Online (Sliding 60s TTL)" : "Online (Active Heartbeat)"}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      Heartbeat runs every 30s
                    </div>
                  </div>

                  <div className="sm:border-l sm:border-slate-800 sm:pl-4">
                    <div className="text-[11px] text-slate-400">Free Coins Balance</div>
                    <div className="flex items-center gap-1 text-indigo-400 font-bold text-sm mt-0.5">
                      <Coins className="w-4 h-4 text-indigo-400" />
                      {user.coinsBalance} Coins
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      Zero real payments required
                    </div>
                  </div>
                </div>
              </div>

              {authMessage && (
                <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-800/40 text-xs text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{authMessage}</span>
                </div>
              )}
            </div>
          ) : (
            <div>
              {/* Form Tab Toggles */}
              <div className="flex items-center gap-2 mb-4 border-b border-slate-800 pb-2">
                <button
                  onClick={() => setAuthMode("register")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    authMode === "register"
                      ? "bg-indigo-600 text-white"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Register New Learner (Free VIP)
                </button>
                <button
                  onClick={() => setAuthMode("login")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    authMode === "login"
                      ? "bg-indigo-600 text-white"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <LogIn className="w-3.5 h-3.5" />
                  Sign In Existing Learner
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleAuthSubmit} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-400 font-medium">Username</label>
                    <input
                      type="text"
                      required
                      value={authForm.username}
                      onChange={(e) => setAuthForm({ ...authForm, username: e.target.value })}
                      placeholder="e.g. learner_alex"
                      className="mt-1 w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 font-medium">Email Address</label>
                    <input
                      type="email"
                      required
                      value={authForm.email}
                      onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                      placeholder="e.g. alex@hilokal.test"
                      className="mt-1 w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 font-medium">Password</label>
                    <input
                      type="password"
                      required
                      value={authForm.password}
                      onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                      placeholder="Min 6 characters"
                      className="mt-1 w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  {authMode === "register" && (
                    <>
                      <div>
                        <label className="text-[11px] text-slate-400 font-medium">Display Name</label>
                        <input
                          type="text"
                          required
                          value={authForm.displayName}
                          onChange={(e) => setAuthForm({ ...authForm, displayName: e.target.value })}
                          placeholder="e.g. Alex Rivera"
                          className="mt-1 w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] text-slate-400 font-medium">Native Language</label>
                        <select
                          value={authForm.nativeLanguage}
                          onChange={(e) => setAuthForm({ ...authForm, nativeLanguage: e.target.value })}
                          className="mt-1 w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                        >
                          <option value="en">English (EN)</option>
                          <option value="es">Spanish (ES)</option>
                          <option value="ur">Urdu (UR)</option>
                          <option value="fr">French (FR)</option>
                          <option value="ja">Japanese (JA)</option>
                          <option value="ko">Korean (KO)</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] text-slate-400 font-medium">Learning Target & Level</label>
                        <div className="flex gap-2">
                          <select
                            value={authForm.learningLanguage}
                            onChange={(e) => setAuthForm({ ...authForm, learningLanguage: e.target.value })}
                            className="mt-1 w-1/2 px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                          >
                            <option value="es">Spanish (ES)</option>
                            <option value="en">English (EN)</option>
                            <option value="ja">Japanese (JA)</option>
                            <option value="fr">French (FR)</option>
                            <option value="de">German (DE)</option>
                          </select>
                          <select
                            value={authForm.learningLevel}
                            onChange={(e) => setAuthForm({ ...authForm, learningLevel: e.target.value })}
                            className="mt-1 w-1/2 px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                          >
                            <option value="A1">A1 (Beginner)</option>
                            <option value="A2">A2 (Elementary)</option>
                            <option value="B1">B1 (Intermediate)</option>
                            <option value="B2">B2 (Upper Int)</option>
                            <option value="C1">C1 (Advanced)</option>
                            <option value="C2">C2 (Mastery)</option>
                          </select>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="text-[11px] text-slate-400">
                    {authMode === "register" ? (
                      <span>★ Free VIP Crown & +500 Coins automatically granted</span>
                    ) : (
                      <span>★ Daily login streak increments automatically</span>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg text-xs transition-colors shadow-lg shadow-emerald-600/20"
                  >
                    {authMode === "register" ? (
                      <>
                        <UserPlus className="w-3.5 h-3.5" />
                        Create Free VIP Account
                      </>
                    ) : (
                      <>
                        <LogIn className="w-3.5 h-3.5" />
                        Sign In & Start Heartbeat
                      </>
                    )}
                  </button>
                </div>
              </form>

              {authError && (
                <div className="mt-3 p-3 rounded-lg bg-red-950/40 border border-red-800/40 text-xs text-red-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              {authMessage && (
                <div className="mt-3 p-3 rounded-lg bg-emerald-950/40 border border-emerald-800/40 text-xs text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{authMessage}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Day 1 Status & Infrastructure Card */}
      <section className="mt-8">
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-300 text-xs font-medium mb-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Day 1 Milestone: Foundation & Architecture (Active)
              </div>
              <h2 className="text-xl font-bold text-white">Local Infrastructure Status</h2>
              <p className="text-sm text-slate-400">
                Verifying connection to MongoDB, Redis, Local Media Storage, and LiveKit SFU.
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
                <span
                  className={
                    health?.services.mongodb.status === "connected"
                      ? "text-emerald-400 font-medium"
                      : "text-amber-400"
                  }
                >
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
                <span
                  className={
                    health?.services.redis.status === "connected"
                      ? "text-emerald-400 font-medium"
                      : "text-amber-400"
                  }
                >
                  {health ? health.services.redis.status : "Waiting for Docker..."}
                </span>
              </div>
              {health?.services.redis.latencyMs !== undefined && (
                <div className="text-[11px] text-slate-500 mt-1">
                  Latency: {health.services.redis.latencyMs}ms
                </div>
              )}
            </div>

            {/* Media Storage */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-slate-300 font-medium text-sm">
                  <HardDrive className="w-4 h-4 text-pink-400" />
                  Media Storage
                </div>
                {health?.services.storage.status?.includes("ready") ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                )}
              </div>
              <div className="text-xs text-slate-400">
                Status:{" "}
                <span
                  className={
                    health?.services.storage.status?.includes("ready")
                      ? "text-emerald-400 font-medium"
                      : "text-amber-400"
                  }
                >
                  {health ? health.services.storage.status : "Checking storage..."}
                </span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Zero-Docker local disk uploads
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

      {/* Day 2: Domain Data Models & Media Storage Pipeline */}
      <section className="mt-8">
        <div className="bg-slate-900/60 border border-indigo-900/40 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-indigo-500/20 text-indigo-300 text-xs font-medium mb-1">
                <Layers className="w-3.5 h-3.5" />
                Day 2 Milestone: Domain Data Models & Media Storage Pipeline
              </div>
              <h2 className="text-xl font-bold text-white">7 Mongoose Models & Storage Engine</h2>
              <p className="text-sm text-slate-400">
                Data models with Free VIP defaults, 500 coin economy, and multipart image/audio storage.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => testDbModels(false)}
                disabled={dbLoading}
                className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-medium rounded-lg transition-colors border border-slate-700"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${dbLoading ? "animate-spin" : ""}`} />
                Check Models
              </button>
              <button
                onClick={() => testDbModels(true)}
                disabled={dbLoading}
                className="flex items-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white rounded-lg transition-colors shadow-lg shadow-indigo-600/20"
              >
                <Send className="w-3.5 h-3.5" />
                Seed Test Learner
              </button>
            </div>
          </div>

          {/* Model Catalog Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
            {[
              { name: "User", desc: "Free VIP & 500 Coins", countKey: "User" },
              { name: "UserLanguage", desc: "CEFR A1-C2", countKey: "UserLanguage" },
              { name: "Room", desc: "Audio Tables", countKey: "Room" },
              { name: "ScheduledTable", desc: "Events & RSVP", countKey: "ScheduledTable" },
              { name: "RoomMessage", desc: "Chat & Corrections", countKey: "RoomMessage" },
              { name: "AiSummary", desc: "Gemini Flashcards", countKey: "AiSummary" },
              { name: "CoinTransaction", desc: "Gift & Coin Ledger", countKey: "CoinTransaction" },
            ].map((m) => {
              const modelData = dbStatus?.models?.[m.countKey];
              return (
                <div
                  key={m.name}
                  className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-white font-mono">{m.name}</span>
                      <FileCode2 className="w-3.5 h-3.5 text-indigo-400" />
                    </div>
                    <div className="text-[10px] text-slate-400">{m.desc}</div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-slate-900 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">Docs:</span>
                    <span className="text-emerald-400 font-semibold font-mono">
                      {modelData ? modelData.count : "..."}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Seed Feedback Card */}
          {dbStatus?.data && (
            <div className="p-4 mb-6 rounded-xl bg-emerald-950/30 border border-emerald-800/50 text-xs">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold mb-2">
                <CheckCircle2 className="w-4 h-4" />
                Live Mongoose Test Seed Created:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-slate-300">
                <div>
                  <span className="text-slate-500">User:</span> {dbStatus.data.user.username} (VIP:{" "}
                  {dbStatus.data.user.isVip ? "Yes" : "No"})
                </div>
                <div>
                  <span className="text-slate-500">Free Coins Balance:</span>{" "}
                  <span className="text-indigo-400 font-bold">
                    {dbStatus.data.user.coinsBalance} Coins
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">Active Room:</span> {dbStatus.data.room.title}
                </div>
              </div>
            </div>
          )}

          {/* Media Upload Test Pipeline */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-slate-200 font-semibold text-sm">
                  <UploadCloud className="w-4 h-4 text-pink-400" />
                  Media Storage Test Pipeline (Avatars, Room Banners & Audio Bios)
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Tests multipart upload via <code className="text-indigo-400">/api/media/upload</code> directly to <code className="text-indigo-400">public/uploads/</code>.
                </p>
              </div>

              <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-pink-600 hover:bg-pink-500 text-xs font-semibold text-white rounded-lg transition-colors shadow-lg shadow-pink-600/20">
                <UploadCloud className={`w-3.5 h-3.5 ${uploading ? "animate-spin" : ""}`} />
                {uploading ? "Uploading..." : "Upload Test Image"}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
            </div>

            {uploadSuccess && (
              <div className="mt-3 p-3 rounded-lg bg-emerald-950/40 border border-emerald-800/40 text-xs text-emerald-300 flex items-center justify-between gap-2">
                <span>Upload Successful! Public URL: <a href={uploadSuccess} target="_blank" rel="noreferrer" className="underline text-indigo-400">{uploadSuccess}</a></span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              </div>
            )}

            {uploadError && (
              <div className="mt-3 p-3 rounded-lg bg-red-950/40 border border-red-800/40 text-xs text-red-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>Upload Failed: {uploadError}</span>
              </div>
            )}
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
