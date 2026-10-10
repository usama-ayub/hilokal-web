import { redis } from "./redis";

const PRESENCE_TTL_SECONDS = 60; // 60 seconds TTL

export interface UserPresenceStatus {
  online: boolean;
  activeRoomId: string | null;
}

/**
 * Register user as online with a 60-second sliding TTL heartbeat
 */
export async function setUserOnline(userId: string, activeRoomId?: string): Promise<void> {
  const presenceKey = `presence:user:${userId}`;
  const roomKey = `user:${userId}:active_room`;

  const pipeline = redis.pipeline();
  pipeline.set(presenceKey, "online", "EX", PRESENCE_TTL_SECONDS);

  if (activeRoomId) {
    pipeline.set(roomKey, activeRoomId, "EX", PRESENCE_TTL_SECONDS);
  } else {
    // If no room is active, do not force remove if exists, or remove if explicitly leaving
  }

  await pipeline.exec();
}

/**
 * Mark user as offline by removing presence keys immediately
 */
export async function setUserOffline(userId: string): Promise<void> {
  const presenceKey = `presence:user:${userId}`;
  const roomKey = `user:${userId}:active_room`;

  await redis.del(presenceKey, roomKey);
}

/**
 * Set the current room a user is attending
 */
export async function setUserActiveRoom(userId: string, roomId: string): Promise<void> {
  const roomKey = `user:${userId}:active_room`;
  await redis.set(roomKey, roomId, "EX", PRESENCE_TTL_SECONDS);
}

/**
 * Remove active room key when a user leaves a table
 */
export async function clearUserActiveRoom(userId: string): Promise<void> {
  const roomKey = `user:${userId}:active_room`;
  await redis.del(roomKey);
}

/**
 * Query online status and active room for a single user
 */
export async function getUserPresence(userId: string): Promise<UserPresenceStatus> {
  const presenceKey = `presence:user:${userId}`;
  const roomKey = `user:${userId}:active_room`;

  const [status, activeRoomId] = await redis.mget(presenceKey, roomKey);

  return {
    online: status === "online",
    activeRoomId: activeRoomId || null,
  };
}

/**
 * High-performance batch lookup for multiple user presence statuses using Redis MGET
 */
export async function getMultiUserPresence(
  userIds: string[]
): Promise<Record<string, UserPresenceStatus>> {
  if (!userIds || userIds.length === 0) {
    return {};
  }

  const presenceKeys = userIds.map((id) => `presence:user:${id}`);
  const roomKeys = userIds.map((id) => `user:${id}:active_room`);

  const allKeys = [...presenceKeys, ...roomKeys];
  const results = await redis.mget(...allKeys);

  const presenceValues = results.slice(0, userIds.length);
  const roomValues = results.slice(userIds.length);

  const statuses: Record<string, UserPresenceStatus> = {};

  userIds.forEach((id, idx) => {
    statuses[id] = {
      online: presenceValues[idx] === "online",
      activeRoomId: roomValues[idx] || null,
    };
  });

  return statuses;
}
