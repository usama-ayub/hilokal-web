"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";

interface PresenceHeartbeatProps {
  activeRoomId?: string;
}

/**
 * Headless background component that transmits a presence heartbeat to Redis
 * every 30 seconds to maintain the 60-second sliding TTL online status.
 */
export function PresenceHeartbeat({ activeRoomId }: PresenceHeartbeatProps) {
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const sendHeartbeat = async () => {
      try {
        await fetch("/api/presence/heartbeat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ activeRoomId }),
        });
      } catch (err) {
        console.warn("Heartbeat failed to send:", err);
      }
    };

    // Send immediate heartbeat upon mounting / login
    sendHeartbeat();

    // Set recurring interval for 30 seconds
    const intervalId = setInterval(sendHeartbeat, 30000);

    return () => {
      clearInterval(intervalId);
    };
  }, [isAuthenticated, user, activeRoomId]);

  return null;
}
