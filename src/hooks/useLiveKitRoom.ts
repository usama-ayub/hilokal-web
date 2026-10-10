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
}

export function useLiveKitRoom() {
  const roomRef = useRef<Room | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [participants, setParticipants] = useState<ParticipantState[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Sync participant list from LiveKit room instance
  const syncParticipants = useCallback((currentRoom: Room) => {
    const list: ParticipantState[] = [];

    // Local participant
    const local = currentRoom.localParticipant;
    if (local) {
      list.push({
        identity: local.identity,
        name: local.name || local.identity,
        isLocal: true,
        isSpeaking: local.isSpeaking,
        isMuted: !local.isMicrophoneEnabled,
      });
    }

    // Remote participants
    currentRoom.remoteParticipants.forEach((p: RemoteParticipant) => {
      const isMicMuted = !p.isMicrophoneEnabled;
      list.push({
        identity: p.identity,
        name: p.name || p.identity,
        isLocal: false,
        isSpeaking: p.isSpeaking,
        isMuted: isMicMuted,
      });
    });

    setParticipants(list);
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
          })
          .on(RoomEvent.Disconnected, () => {
            setIsConnected(false);
            setIsConnecting(false);
            setParticipants([]);
          })
          .on(RoomEvent.ParticipantConnected, () => {
            syncParticipants(room);
          })
          .on(RoomEvent.ParticipantDisconnected, () => {
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
          .on(
            RoomEvent.TrackSubscribed,
            (track: RemoteTrack, publication: RemoteTrackPublication, participant: RemoteParticipant) => {
              if (track.kind === Track.Kind.Audio) {
                // Attach remote audio element to play through speaker
                const element = track.attach();
                element.id = `audio-${participant.identity}`;
                document.body.appendChild(element);
              }
              syncParticipants(room);
            }
          )
          .on(
            RoomEvent.TrackUnsubscribed,
            (track: RemoteTrack) => {
              track.detach().forEach((el) => el.remove());
            }
          );

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
      const currentlyEnabled = roomRef.current.localParticipant.isMicrophoneEnabled;
      await roomRef.current.localParticipant.setMicrophoneEnabled(!currentlyEnabled);
      setIsMuted(currentlyEnabled);
      syncParticipants(roomRef.current);
    } catch (err) {
      console.error("Error toggling microphone:", err);
    }
  }, [syncParticipants]);

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
    participants,
    error,
    connect,
    disconnect,
    toggleMicrophone,
  };
}
