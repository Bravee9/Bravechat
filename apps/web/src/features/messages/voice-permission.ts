import { RoomEvent, type Room } from 'livekit-client';

export async function waitForVoicePermission(room: Room, signal: AbortSignal) {
  const admitted = () => room.localParticipant.permissions?.canPublish && room.localParticipant.permissions?.canSubscribe;
  if (signal.aborted) throw new Error('Connection cancelled');
  if (admitted()) return;
  await new Promise<void>((resolve, reject) => {
    const cleanup = () => {
      clearTimeout(timer);
      room.off(RoomEvent.ParticipantPermissionsChanged, check);
      room.off(RoomEvent.Disconnected, cancelled);
      signal.removeEventListener('abort', cancelled);
    };
    const check = () => { if (admitted()) { cleanup(); resolve(); } };
    const cancelled = () => { cleanup(); reject(new Error('Voice admission cancelled')); };
    const timer = setTimeout(() => { cleanup(); reject(new Error('Voice admission timeout')); }, 10000);
    room.on(RoomEvent.ParticipantPermissionsChanged, check);
    room.on(RoomEvent.Disconnected, cancelled);
    signal.addEventListener('abort', cancelled, { once: true });
    check();
  });
}
