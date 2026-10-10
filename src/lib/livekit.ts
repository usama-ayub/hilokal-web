import { AccessToken } from "livekit-server-sdk";

const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY || "devkey";
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET || "secretvalue992834019283401928340192";

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
    canPublish: canPublish,       // Speakers and Hosts can transmit audio
    canSubscribe: true,           // Everyone can hear audio
    canPublishData: true,         // Allows sending in-room data packets (reactions/emojis)
    roomAdmin: isHost,            // Hosts can mute/kick participants
  });

  return await at.toJwt();
}
