import { AccessToken, RoomServiceClient } from "livekit-server-sdk";

const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY || "devkey";
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET || "secretvalue992834019283401928340192";
const LIVEKIT_HOST = process.env.LIVEKIT_HOST || "http://localhost:7880";

export type RoomRole = "host" | "speaker" | "listener";

interface CreateTokenOptions {
  roomName: string;
  participantIdentity: string;
  participantName: string;
  role: RoomRole;
  metadata?: Record<string, unknown>;
}

/**
 * Generate cryptographically signed JWT token for LiveKit WebRTC Audio Rooms
 */
export async function createLiveKitToken({
  roomName,
  participantIdentity,
  participantName,
  role,
  metadata = {},
}: CreateTokenOptions): Promise<string> {
  const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
    identity: participantIdentity,
    name: participantName,
    metadata: JSON.stringify(metadata),
    ttl: "6h",
  });

  // Role-based permissions
  const canPublish = role === "host" || role === "speaker";
  const isHost = role === "host";

  at.addGrant({
    roomJoin: true,
    room: roomName,
    canPublish: canPublish, // Speakers and Hosts can transmit audio
    canSubscribe: true, // Everyone can hear audio
    canPublishData: true, // Allows sending in-room data packets (reactions/emojis)
    roomAdmin: isHost, // Hosts can mute/kick participants
  });

  return await at.toJwt();
}

/**
 * Singleton LiveKit RoomServiceClient for administrative operations
 */
let roomServiceClientInstance: RoomServiceClient | null = null;

export function getRoomServiceClient(): RoomServiceClient {
  if (!roomServiceClientInstance) {
    roomServiceClientInstance = new RoomServiceClient(
      LIVEKIT_HOST,
      LIVEKIT_API_KEY,
      LIVEKIT_API_SECRET
    );
  }
  return roomServiceClientInstance;
}

/**
 * List all active WebRTC participants in a LiveKit room
 */
export async function listLiveKitParticipants(roomName: string) {
  try {
    const client = getRoomServiceClient();
    return await client.listParticipants(roomName);
  } catch (error) {
    console.error("LiveKit listParticipants error:", error);
    return [];
  }
}

/**
 * Mute a specific participant's audio track in LiveKit
 */
export async function muteLiveKitParticipant(
  roomName: string,
  identity: string,
  trackSid: string,
  muted: boolean = true
) {
  try {
    const client = getRoomServiceClient();
    await client.mutePublishedTrack(roomName, identity, trackSid, muted);
    return true;
  } catch (error) {
    console.error("LiveKit mutePublishedTrack error:", error);
    return false;
  }
}

/**
 * Disconnect/Kick a participant from the WebRTC audio room
 */
export async function removeLiveKitParticipant(roomName: string, identity: string) {
  try {
    const client = getRoomServiceClient();
    await client.removeParticipant(roomName, identity);
    return true;
  } catch (error) {
    console.error("LiveKit removeParticipant error:", error);
    return false;
  }
}

/**
 * Dynamically promote/demote participant WebRTC publishing permissions in LiveKit
 */
export async function updateLiveKitPermissions(
  roomName: string,
  identity: string,
  canPublish: boolean
) {
  try {
    const client = getRoomServiceClient();
    await client.updateParticipant(roomName, identity, undefined, {
      canPublish,
      canSubscribe: true,
      canPublishData: true,
    });
    return true;
  } catch (error) {
    console.error("LiveKit updateParticipant error:", error);
    return false;
  }
}

/**
 * Delete a room on the LiveKit SFU server
 */
export async function deleteLiveKitRoom(roomName: string) {
  try {
    const client = getRoomServiceClient();
    await client.deleteRoom(roomName);
    return true;
  } catch (error) {
    console.error("LiveKit deleteRoom error:", error);
    return false;
  }
}
