"use client";

import { Room, RoomEvent, Track, type Participant, type RemoteTrack, type TrackPublication } from "livekit-client";
import { useCallback, useEffect, useRef, useState } from "react";
import { http } from "@/services/http";

interface VoiceRoomProps {
  channelId: string;
  channelType: "VOICE" | "VIDEO";
}

export function VoiceRoom({ channelId, channelType }: VoiceRoomProps) {
  const [room, setRoom] = useState<Room | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [status, setStatus] = useState("Chưa tham gia");
  const [error, setError] = useState("");
  const [microphoneEnabled, setMicrophoneEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const localAudioRef = useRef<HTMLDivElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);

  const leaveRoom = useCallback(async () => {
    const currentRoom = room;
    setRoom(null);
    setParticipants([]);
    if (currentRoom) await currentRoom.disconnect();
    setStatus("Đã rời phòng");
  }, [room]);

  useEffect(() => () => { void room?.disconnect(); }, [room]);

  const joinRoom = async () => {
    setError("");
    setStatus("Đang kết nối...");
    try {
      const credentials = await http.post<{ serverUrl: string; token: string }>(`/voice/channels/${encodeURIComponent(channelId)}/token`);
      const nextRoom = new Room({ adaptiveStream: true, dynacast: true });
      const syncParticipants = () => setParticipants([nextRoom.localParticipant, ...Array.from(nextRoom.remoteParticipants.values())]);
      nextRoom
        .on(RoomEvent.ParticipantConnected, syncParticipants)
        .on(RoomEvent.ParticipantDisconnected, syncParticipants)
        .on(RoomEvent.TrackSubscribed, (track: RemoteTrack, _publication: TrackPublication, participant: Participant) => {
          const element = track.attach();
          element.dataset.participant = participant.identity;
          if (track.kind === Track.Kind.Audio && localAudioRef.current) localAudioRef.current.appendChild(element);
          if (track.kind === Track.Kind.Video && videoContainerRef.current) videoContainerRef.current.appendChild(element);
        })
        .on(RoomEvent.TrackUnsubscribed, (track: RemoteTrack) => track.detach().forEach((element) => element.remove()))
        .on(RoomEvent.Reconnecting, () => setStatus("Đang kết nối lại..."))
        .on(RoomEvent.Reconnected, () => setStatus("Đã kết nối"))
        .on(RoomEvent.Disconnected, () => {
          setRoom(null);
          setParticipants([]);
          setStatus("Mất kết nối");
        });
      await nextRoom.connect(credentials.serverUrl, credentials.token);
      await nextRoom.localParticipant.setMicrophoneEnabled(true);
      setMicrophoneEnabled(true);
      if (channelType === "VIDEO") {
        await nextRoom.localParticipant.setCameraEnabled(true);
        setCameraEnabled(true);
      }
      setRoom(nextRoom);
      setParticipants([nextRoom.localParticipant, ...Array.from(nextRoom.remoteParticipants.values())]);
      setStatus("Đã kết nối");
    } catch (joinError) {
      setStatus("Không thể kết nối");
      setError(joinError instanceof Error ? joinError.message : "Không thể tham gia voice room.");
    }
  };

  return (
    <section className="mx-6 mb-3 rounded-lg border border-ocean-dark-border bg-ocean-dark-surface/60 p-3" aria-label="Voice room">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-ocean-light">{channelType === "VIDEO" ? "Video room" : "Voice room"}</p>
          <p className="text-xs text-ocean-light/60">{status} · {participants.length} người</p>
        </div>
        <div className="flex gap-2">
          {!room ? <button type="button" onClick={joinRoom} className="rounded bg-ocean-primary px-3 py-1.5 text-xs font-semibold text-white">Tham gia</button> : <>
            <button type="button" onClick={() => { const next = !microphoneEnabled; setMicrophoneEnabled(next); void room.localParticipant.setMicrophoneEnabled(next); }} className="rounded border border-ocean-dark-border px-3 py-1.5 text-xs text-ocean-light">{microphoneEnabled ? "Tắt mic" : "Bật mic"}</button>
            {channelType === "VIDEO" ? <button type="button" onClick={() => { const next = !cameraEnabled; setCameraEnabled(next); void room.localParticipant.setCameraEnabled(next); }} className="rounded border border-ocean-dark-border px-3 py-1.5 text-xs text-ocean-light">{cameraEnabled ? "Tắt camera" : "Bật camera"}</button> : null}
            <button type="button" onClick={() => void leaveRoom()} className="rounded bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white">Rời phòng</button>
          </>}
        </div>
      </div>
      {error ? <p role="alert" className="mt-2 text-xs text-rose-400">{error}</p> : null}
      <div ref={videoContainerRef} className="mt-3 flex flex-wrap gap-2 [&_video]:max-h-56 [&_video]:max-w-full [&_video]:rounded" />
      <div ref={localAudioRef} className="hidden" />
      {room ? <div className="mt-2 flex flex-wrap gap-2 text-xs text-ocean-light/70">{participants.map((participant) => <span key={participant.identity} className="rounded bg-white/5 px-2 py-1">{participant.name || participant.identity}{participant.isSpeaking ? " · đang nói" : ""}</span>)}</div> : null}
    </section>
  );
}
