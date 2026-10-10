"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import {
  Room,
  RoomEvent,
  RemoteParticipant,
  LocalParticipant,
  Track,
  RemoteTrackPublication,
  RemoteTrack,
} from "livekit-client";

export interface ParticipantState {
  identity: string;
  name: string;
  isLocal: boolean;
  isSpeaking: boolean;
  isMuted: boolean;
  canPublish: boolean;
}

interface UseLiveKitRoomProps {
  onDataReceived?: (data: Record<string, unknown>, senderIdentity?: string) => void;
  onPermissionsChanged?: (canPublish: boolean) => void;
}

export function useLiveKitRoom(props?: UseLiveKitRoomProps) {
  const onDataReceivedRef = useRef(props?.onDataReceived);
  onDataReceivedRef.current = props?.onDataReceived;

  const onPermissionsChangedRef = useRef(props?.onPermissionsChanged);
  onPermissionsChangedRef.current = props?.onPermissionsChanged;

  const roomRef = useRef<Room | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [isAudioPlaybackAllowed, setIsAudioPlaybackAllowed] = useState<boolean>(true);
  const [participants, setParticipants] = useState<ParticipantState[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Sync participant list from LiveKit room instance
  const syncParticipants = useCallback((currentRoom: Room) => {
    const list: ParticipantState[] = [];

    // Local participant
    const local = currentRoom.localParticipant;
    if (local) {
      const canPub = local.permissions?.canPublish ?? false;
      list.push({
        identity: local.identity,
        name: local.name || local.identity,
        isLocal: true,
        isSpeaking: local.isSpeaking,
        isMuted: !local.isMicrophoneEnabled,
        canPublish: canPub,
      });
      setIsMuted(!local.isMicrophoneEnabled);
    }

    // Remote participants
    currentRoom.remoteParticipants.forEach((p: RemoteParticipant) => {
      const canPub = p.permissions?.canPublish ?? false;
      const isMicMuted = !p.isMicrophoneEnabled;
      list.push({
        identity: p.identity,
        name: p.name || p.identity,
        isLocal: false,
        isSpeaking: p.isSpeaking,
        isMuted: isMicMuted,
        canPublish: canPub,
      });
    });

    setParticipants(list);
  }, []);

  const startAudio = useCallback(async () => {
    if (roomRef.current) {
      try {
        await roomRef.current.startAudio();
        setIsAudioPlaybackAllowed(true);
      } catch (err) {
        console.warn("Failed to start audio playback context:", err);
      }
    }
  }, []);

  const connect = useCallback(
    async (wsUrl: string, token: string) => {
      if (roomRef.current) {
        await roomRef.current.disconnect();
      }

      setIsConnecting(true);
      setError(null);

      try {
        const room = new Room({
          adaptiveStream: true,
          dynacast: true,
          audioCaptureDefaults: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });

        roomRef.current = room;

        // Set up event listeners
        room
          .on(RoomEvent.Connected, () => {
            setIsConnected(true);
            setIsConnecting(false);
            syncParticipants(room);

            // Attempt to start audio playback context immediately
            room.startAudio().then(() => {
              setIsAudioPlaybackAllowed(true);
            }).catch(() => {
              setIsAudioPlaybackAllowed(room.canPlaybackAudio);
            });

            // Attach any already-subscribed tracks from existing remote participants
            room.remoteParticipants.forEach((p) => {
              p.audioTrackPublications.forEach((pub) => {
                if (pub.track && pub.isSubscribed) {
                  let el = document.getElementById(`audio-${p.identity}`) as HTMLAudioElement;
                  if (!el) {
                    el = pub.track.attach();
                    el.id = `audio-${p.identity}`;
                    el.autoplay = true;
                    el.volume = 1.0;
                    el.setAttribute("playsinline", "true");
                    document.body.appendChild(el);
                  }
                  el.play().catch((e) => console.warn("Autoplay deferred:", e));
                }
              });
            });
          })
          .on(RoomEvent.Disconnected, () => {
            setIsConnected(false);
            setIsConnecting(false);
            setParticipants([]);
          })
          .on(RoomEvent.ParticipantConnected, () => {
            syncParticipants(room);
          })
          .on(RoomEvent.ParticipantDisconnected, (participant: RemoteParticipant) => {
            // Remove audio element when participant disconnects
            const el = document.getElementById(`audio-${participant.identity}`);
            if (el) el.remove();
            syncParticipants(room);
          })
          .on(RoomEvent.ActiveSpeakersChanged, () => {
            syncParticipants(room);
          })
          .on(RoomEvent.TrackMuted, () => {
            syncParticipants(room);
          })
          .on(RoomEvent.TrackUnmuted, () => {
            syncParticipants(room);
          })
          .on(RoomEvent.AudioPlaybackStatusChanged, () => {
            setIsAudioPlaybackAllowed(room.canPlaybackAudio);
          })
          .on(
            RoomEvent.ParticipantPermissionsChanged,
            (prevPermissions, participant) => {
              syncParticipants(room);
              if (participant.isLocal) {
                const canPub = participant.permissions?.canPublish ?? false;
                onPermissionsChangedRef.current?.(canPub);
              }
            }
          )
          .on(
            RoomEvent.TrackSubscribed,
            (track: RemoteTrack, publication: RemoteTrackPublication, participant: RemoteParticipant) => {
              if (track.kind === Track.Kind.Audio) {
                // Ensure audio element is created and attached
                let element = document.getElementById(`audio-${participant.identity}`) as HTMLAudioElement;
                if (!element) {
                  element = track.attach();
                  element.id = `audio-${participant.identity}`;
                  element.autoplay = true;
                  element.volume = 1.0;
                  element.setAttribute("playsinline", "true");
                  document.body.appendChild(element);
                } else {
                  track.attach(element);
                }

                // Explicitly play audio and unlock context
                element.play().catch((err) => {
                  console.warn("Audio autoplay blocked by browser, requiring user gesture:", err);
                  setIsAudioPlaybackAllowed(false);
                });
              }
              syncParticipants(room);
            }
          )
          .on(
            RoomEvent.TrackUnsubscribed,
            (track: RemoteTrack, publication: RemoteTrackPublication, participant: RemoteParticipant) => {
              const element = document.getElementById(`audio-${participant.identity}`);
              if (element) {
                track.detach(element);
                element.remove();
              }
              syncParticipants(room);
            }
          )
          .on(RoomEvent.DataReceived, (payload: Uint8Array, participant?: RemoteParticipant) => {
            try {
              const decoder = new TextDecoder();
              const json = JSON.parse(decoder.decode(payload));
              onDataReceivedRef.current?.(json, participant?.identity);
            } catch (err) {
              console.warn("Failed to parse data packet:", err);
            }
          });

        await room.connect(wsUrl, token);
      } catch (err: unknown) {
        setIsConnecting(false);
        setIsConnected(false);
        const errMsg = err instanceof Error ? err.message : "Failed to connect to LiveKit SFU";
        setError(errMsg);
        console.error("LiveKit connection failed:", err);
      }
    },
    [syncParticipants]
  );

  const disconnect = useCallback(async () => {
    if (roomRef.current) {
      // Detach and clean up any audio elements
      document.querySelectorAll("[id^='audio-']").forEach((el) => el.remove());
      await roomRef.current.disconnect();
      roomRef.current = null;
    }
    setIsConnected(false);
    setParticipants([]);
  }, []);

  const toggleMicrophone = useCallback(async () => {
    if (!roomRef.current || !roomRef.current.localParticipant) return;
    try {
      const local = roomRef.current.localParticipant;
      const currentlyEnabled = local.isMicrophoneEnabled;
      const nextEnabled = !currentlyEnabled;

      // Unlock browser audio context if not already active
      await roomRef.current.startAudio();

      await local.setMicrophoneEnabled(nextEnabled);
      setIsMuted(!nextEnabled);
      syncParticipants(roomRef.current);
    } catch (err) {
      console.error("Error toggling microphone:", err);
    }
  }, [syncParticipants]);

  const broadcastData = useCallback(async (data: Record<string, unknown>) => {
    if (!roomRef.current || !roomRef.current.localParticipant) return;
    try {
      const encoder = new TextEncoder();
      const payload = encoder.encode(JSON.stringify(data));
      await roomRef.current.localParticipant.publishData(payload, { reliable: true });
    } catch (err) {
      console.warn("broadcastData error:", err);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (roomRef.current) {
        document.querySelectorAll("[id^='audio-']").forEach((el) => el.remove());
        roomRef.current.disconnect();
      }
    };
  }, []);

  return {
    isConnected,
    isConnecting,
    isMuted,
    isAudioPlaybackAllowed,
    participants,
    error,
    connect,
    disconnect,
    toggleMicrophone,
    startAudio,
    broadcastData,
  };
}
