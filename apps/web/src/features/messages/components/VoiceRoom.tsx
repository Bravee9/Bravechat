"use client";

import { Room, RoomEvent, Track, setLogLevel, type Participant, type RemoteTrack, type TrackPublication } from "livekit-client";
import { useCallback, useEffect, useRef, useState } from "react";
import { http } from "@/services/http";
import { audioStore } from "@/stores/audio.store";
import { useStore } from "@/lib/store";

interface VoiceRoomProps {
  channelId: string;
  channelType: "VOICE" | "VIDEO";
}

export function VoiceRoom({ channelId, channelType }: VoiceRoomProps) {
  const [room, setRoom] = useState<Room | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [status, setStatus] = useState("Chưa tham gia");
  const [error, setError] = useState("");
  const [joining, setJoining] = useState(false);
  const [microphoneEnabled, setMicrophoneEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const muted = useStore(audioStore, (state) => state.muted);
  const deafened = useStore(audioStore, (state) => state.deafened);
  const localAudioRef = useRef<HTMLDivElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const roomRef = useRef<Room | null>(null);
  const joiningRef = useRef(false);
  const generation = useRef(0);
  const tokenRequest = useRef<AbortController | null>(null);

  const leaveRoom = useCallback(async () => {
    generation.current++;
    tokenRequest.current?.abort();
    const currentRoom = roomRef.current;
    roomRef.current = null;
    joiningRef.current = false;
    setJoining(false);
    setRoom(null);
    setParticipants([]);
    setCameraEnabled(false);
    if (currentRoom) await currentRoom.disconnect();
    setStatus("Đã rời phòng");
  }, []);

  useEffect(() => () => {
    generation.current++;
    tokenRequest.current?.abort();
    void roomRef.current?.disconnect();
    roomRef.current = null;
    joiningRef.current = false;
  }, []);
  useEffect(() => {
    if (!room) return;
    let active = true;
    void room.localParticipant.setMicrophoneEnabled(!muted && !deafened).then(() => { if (active) setMicrophoneEnabled(!muted && !deafened); }).catch(() => { if (active) setError("Không thể thay đổi trạng thái micro."); });
    localAudioRef.current?.querySelectorAll("audio").forEach((audio) => { audio.muted = deafened; });
    return () => { active = false; };
  }, [room, muted, deafened]);
  useEffect(() => {
    if (!room || !cameraEnabled) return;
    const track = room.localParticipant.getTrackPublication(Track.Source.Camera)?.track;
    if (!track) return;
    const element = track.attach();
    if (element instanceof HTMLMediaElement) { element.muted = true; element.autoplay = true; }
    videoContainerRef.current?.appendChild(element);
    return () => { track.detach(element); element.remove(); };
  }, [room, cameraEnabled]);

  const joinRoom = async () => {
    if (joiningRef.current || roomRef.current) return;
    joiningRef.current = true;
    setJoining(true);
    const attempt = ++generation.current;
    const active = () => generation.current === attempt;
    const ensureActive = () => { if (!active()) throw new Error("Connection cancelled"); };
    const controller = new AbortController();
    tokenRequest.current = controller;
    setError("");
    setStatus("Đang kết nối...");
    let nextRoom: Room | undefined;
    try {
      const credentials = await http.post<{ serverUrl: string; token: string }>(`/voice/channels/${encodeURIComponent(channelId)}/token`, undefined, { signal: controller.signal });
      ensureActive();
      // SDK log kèm room/participant ID; giao diện tự xử lý lỗi bằng thông báo an toàn.
      setLogLevel("silent");
      nextRoom = new Room({ adaptiveStream: true, dynacast: true });
      roomRef.current = nextRoom;
      const connectedRoom = nextRoom;
      const syncParticipants = () => { if (active()) setParticipants([connectedRoom.localParticipant, ...Array.from(connectedRoom.remoteParticipants.values())]); };
      nextRoom
        .on(RoomEvent.ParticipantConnected, syncParticipants)
        .on(RoomEvent.ParticipantDisconnected, syncParticipants)
        .on(RoomEvent.TrackSubscribed, (track: RemoteTrack, _publication: TrackPublication, participant: Participant) => {
          if (!active()) return;
          const element = track.attach();
          if (element instanceof HTMLMediaElement && track.kind === Track.Kind.Audio) element.muted = audioStore.get().deafened;
          if (track.kind === Track.Kind.Audio && localAudioRef.current) localAudioRef.current.appendChild(element);
          if (track.kind === Track.Kind.Video && videoContainerRef.current) videoContainerRef.current.appendChild(element);
        })
        .on(RoomEvent.TrackUnsubscribed, (track: RemoteTrack) => track.detach().forEach((element) => element.remove()))
        .on(RoomEvent.Reconnecting, () => { if (active()) setStatus("Đang kết nối lại..."); })
        .on(RoomEvent.Reconnected, () => { if (active()) setStatus("Đã kết nối"); })
        .on(RoomEvent.Disconnected, () => {
          if (!active()) return;
          roomRef.current = null;
          setRoom(null);
          setParticipants([]);
          setStatus("Mất kết nối");
        });
      await nextRoom.connect(credentials.serverUrl, credentials.token);
      ensureActive();
      const enabled = !audioStore.get().muted && !audioStore.get().deafened;
      await nextRoom.localParticipant.setMicrophoneEnabled(enabled);
      ensureActive();
      setMicrophoneEnabled(enabled);
      if (channelType === "VIDEO") {
        await nextRoom.localParticipant.setCameraEnabled(true);
        ensureActive();
        setCameraEnabled(true);
      }
      setRoom(nextRoom);
      setParticipants([nextRoom.localParticipant, ...Array.from(nextRoom.remoteParticipants.values())]);
      setStatus("Đã kết nối");
    } catch {
      await nextRoom?.disconnect().catch(() => undefined);
      if (!active()) return;
      roomRef.current = null;
      setStatus("Không thể kết nối");
      // Lỗi SDK có thể chứa URL kết nối/JWT; chỉ đưa hướng dẫn cố định ra UI.
      setError("Không thể tham gia phòng. Kiểm tra kết nối và quyền micro/camera rồi thử lại.");
    } finally {
      if (active()) { joiningRef.current = false; setJoining(false); tokenRequest.current = null; }
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
          {!room ? <button type="button" disabled={joining} onClick={joinRoom} className="rounded bg-ocean-primary px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">{joining ? "Đang kết nối..." : "Tham gia"}</button> : <>
            <button type="button" onClick={() => audioStore.set(microphoneEnabled ? { muted: true } : { muted: false, deafened: false })} className="rounded border border-ocean-dark-border px-3 py-1.5 text-xs text-ocean-light">{microphoneEnabled ? "Tắt mic" : "Bật mic"}</button>
            {channelType === "VIDEO" ? <button type="button" onClick={() => { const next = !cameraEnabled; void room.localParticipant.setCameraEnabled(next).then(() => setCameraEnabled(next)).catch(() => setError("Không thể thay đổi trạng thái camera.")); }} className="rounded border border-ocean-dark-border px-3 py-1.5 text-xs text-ocean-light">{cameraEnabled ? "Tắt camera" : "Bật camera"}</button> : null}
            <button type="button" onClick={() => void leaveRoom()} className="rounded bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white">Rời phòng</button>
          </>}
        </div>
      </div>
      {error ? <p role="alert" className="mt-2 text-xs text-rose-400">{error}</p> : null}
      <div ref={videoContainerRef} className="mt-3 flex flex-wrap gap-2 [&_video]:max-h-56 [&_video]:max-w-full [&_video]:rounded" />
      <div ref={localAudioRef} className="hidden" />
      {room ? <div className="mt-2 flex flex-wrap gap-2 text-xs text-ocean-light/70">{participants.map((participant) => <span key={participant.identity} className="rounded bg-white/5 px-2 py-1">{participant.name || "Thành viên"}{participant.isSpeaking ? " · đang nói" : ""}</span>)}</div> : null}
    </section>
  );
}
