import { redis } from "./redis";

export interface HandRaiseItem {
  userId: string;
  raisedAt: number;
}

export interface RoomRealtimeState {
  roomId: string;
  speakers: string[];
  listeners: string[];
  handRaiseQueue: HandRaiseItem[];
  speakerCount: number;
  listenerCount: number;
  meta: Record<string, string>;
}

/**
 * Initialize ephemeral Redis state when a room becomes active
 */
export async function initRoomState(
  roomId: string,
  hostId: string,
  metadata: Record<string, string> = {}
): Promise<void> {
  const speakersKey = `room:${roomId}:speakers`;
  const listenersKey = `room:${roomId}:listeners`;
  const metaKey = `room:${roomId}:meta`;
  const queueKey = `room:${roomId}:hand_raise_queue`;

  const pipeline = redis.pipeline();

  // Host starts on the speaker stage
  pipeline.sadd(speakersKey, hostId);
  pipeline.del(listenersKey);
  pipeline.del(queueKey);

  pipeline.hset(metaKey, {
    hostId,
    startedAt: new Date().toISOString(),
    isMutedAll: "false",
    ...metadata,
  });

  // Set TTL on meta hash (24 hours)
  pipeline.expire(metaKey, 86400);

  // Set active room for host
  pipeline.set(`user:${hostId}:active_room`, roomId, "EX", 60);

  await pipeline.exec();
}

/**
 * Join user into room state (as speaker or audience listener)
 */
export async function joinRoomState(
  roomId: string,
  userId: string,
  asSpeaker: boolean = false
): Promise<void> {
  const speakersKey = `room:${roomId}:speakers`;
  const listenersKey = `room:${roomId}:listeners`;
  const userActiveRoomKey = `user:${userId}:active_room`;

  const pipeline = redis.pipeline();

  if (asSpeaker) {
    pipeline.srem(listenersKey, userId);
    pipeline.sadd(speakersKey, userId);
  } else {
    pipeline.srem(speakersKey, userId);
    pipeline.sadd(listenersKey, userId);
  }

  pipeline.set(userActiveRoomKey, roomId, "EX", 60);
  await pipeline.exec();
}

/**
 * Leave room state: removes user from speakers, listeners, and hand-raise queue
 */
export async function leaveRoomState(roomId: string, userId: string): Promise<void> {
  const speakersKey = `room:${roomId}:speakers`;
  const listenersKey = `room:${roomId}:listeners`;
  const queueKey = `room:${roomId}:hand_raise_queue`;
  const userActiveRoomKey = `user:${userId}:active_room`;

  const pipeline = redis.pipeline();
  pipeline.srem(speakersKey, userId);
  pipeline.srem(listenersKey, userId);
  pipeline.zrem(queueKey, userId);
  pipeline.del(userActiveRoomKey);

  await pipeline.exec();
}

/**
 * Add user to hand-raise FIFO priority queue (ordered by microsecond timestamp)
 */
export async function raiseHand(
  roomId: string,
  userId: string
): Promise<{ success: boolean; position: number; error?: string }> {
  const speakersKey = `room:${roomId}:speakers`;
  const queueKey = `room:${roomId}:hand_raise_queue`;

  // Check if user is already a speaker
  const isSpeaker = await redis.sismember(speakersKey, userId);
  if (isSpeaker) {
    return { success: false, position: -1, error: "Already a speaker on stage" };
  }

  const timestamp = Date.now();
  await redis.zadd(queueKey, timestamp, userId);

  const rank = await redis.zrank(queueKey, userId);
  return { success: true, position: rank !== null ? rank + 1 : 1 };
}

/**
 * Remove user from hand-raise queue (hand lowered or cancelled)
 */
export async function lowerHand(roomId: string, userId: string): Promise<boolean> {
  const queueKey = `room:${roomId}:hand_raise_queue`;
  const removed = await redis.zrem(queueKey, userId);
  return removed > 0;
}

/**
 * Promote user from audience / queue to speaker stage
 */
export async function promoteToSpeaker(
  roomId: string,
  userId: string,
  maxSpeakers: number = 6
): Promise<{ success: boolean; error?: string }> {
  const speakersKey = `room:${roomId}:speakers`;
  const listenersKey = `room:${roomId}:listeners`;
  const queueKey = `room:${roomId}:hand_raise_queue`;

  const currentSpeakerCount = await redis.scard(speakersKey);
  if (currentSpeakerCount >= maxSpeakers) {
    return {
      success: false,
      error: `Stage capacity reached (${maxSpeakers} speakers max)`,
    };
  }

  const pipeline = redis.pipeline();
  pipeline.zrem(queueKey, userId);
  pipeline.srem(listenersKey, userId);
  pipeline.sadd(speakersKey, userId);

  await pipeline.exec();
  return { success: true };
}

/**
 * Demote speaker back to audience listener
 */
export async function demoteToListener(roomId: string, userId: string): Promise<void> {
  const speakersKey = `room:${roomId}:speakers`;
  const listenersKey = `room:${roomId}:listeners`;

  const pipeline = redis.pipeline();
  pipeline.srem(speakersKey, userId);
  pipeline.sadd(listenersKey, userId);

  await pipeline.exec();
}

/**
 * Fetch complete real-time room state from Redis in a single atomic pipeline
 */
export async function getRoomRealtimeState(roomId: string): Promise<RoomRealtimeState> {
  const speakersKey = `room:${roomId}:speakers`;
  const listenersKey = `room:${roomId}:listeners`;
  const queueKey = `room:${roomId}:hand_raise_queue`;
  const metaKey = `room:${roomId}:meta`;

  const pipeline = redis.pipeline();
  pipeline.smembers(speakersKey);
  pipeline.smembers(listenersKey);
  pipeline.zrange(queueKey, 0, -1, "WITHSCORES");
  pipeline.hgetall(metaKey);

  const results = await pipeline.exec();

  const speakers = (results?.[0]?.[1] as string[]) || [];
  const listeners = (results?.[1]?.[1] as string[]) || [];
  const rawQueue = (results?.[2]?.[1] as string[]) || [];
  const meta = (results?.[3]?.[1] as Record<string, string>) || {};

  // Parse raw [userId, score, userId, score] pairs from ZRANGE WITHSCORES
  const handRaiseQueue: HandRaiseItem[] = [];
  for (let i = 0; i < rawQueue.length; i += 2) {
    handRaiseQueue.push({
      userId: rawQueue[i],
      raisedAt: Number(rawQueue[i + 1]),
    });
  }

  return {
    roomId,
    speakers,
    listeners,
    handRaiseQueue,
    speakerCount: speakers.length,
    listenerCount: listeners.length,
    meta,
  };
}

/**
 * Clean up all ephemeral Redis keys when an audio room is ended
 */
export async function cleanRoomState(roomId: string): Promise<void> {
  const speakersKey = `room:${roomId}:speakers`;
  const listenersKey = `room:${roomId}:listeners`;
  const queueKey = `room:${roomId}:hand_raise_queue`;
  const metaKey = `room:${roomId}:meta`;

  await redis.del(speakersKey, listenersKey, queueKey, metaKey);
}
