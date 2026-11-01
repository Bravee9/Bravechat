import React from 'react';
import { describe,it,expect,vi,beforeEach } from 'vitest';
import { act,render,screen,fireEvent,waitFor } from '@testing-library/react';
import { VoiceRoom } from '@/features/messages/components/VoiceRoom';
import { audioStore } from '@/stores/audio.store';
import { http } from '@/services/http';
const sdk=vi.hoisted(()=>({mic:vi.fn().mockResolvedValue(undefined),handlers:{} as Record<string,(...args:any[])=>void>}));
vi.mock('@/services/http',()=>({http:{post:vi.fn()}}));
vi.mock('livekit-client',()=>({
 Room:class {
  localParticipant={identity:'u1',name:'Alice',setMicrophoneEnabled:sdk.mic,setCameraEnabled:vi.fn().mockResolvedValue(undefined),getTrackPublication:()=>undefined};remoteParticipants=new Map();
  on(event:string,handler:(...args:any[])=>void){sdk.handlers[event]=handler;return this} async connect(){} async disconnect(){}
 },
 RoomEvent:{ParticipantConnected:'join',ParticipantDisconnected:'leave',TrackSubscribed:'track',TrackUnsubscribed:'untrack',Reconnecting:'reconnecting',Reconnected:'reconnected',Disconnected:'disconnected'},
 Track:{Kind:{Audio:'audio',Video:'video'},Source:{Camera:'camera'}},
}));
beforeEach(()=>{vi.clearAllMocks();audioStore.set({muted:false,deafened:false});vi.mocked(http.post).mockResolvedValue({serverUrl:'ws://localhost:7880',token:'test'})});
describe('Shared voice controls',()=>{
 it('applies mute/deafen preferences to the room SDK and remote audio',async()=>{
  render(<VoiceRoom channelId="voice1" channelType="VOICE"/>);fireEvent.click(screen.getByRole('button',{name:'Tham gia'}));await screen.findByText(/Đã kết nối/);
  act(()=>audioStore.set({muted:true}));await waitFor(()=>expect(sdk.mic).toHaveBeenLastCalledWith(false));
  const audio=document.createElement('audio');act(()=>sdk.handlers.track({kind:'audio',attach:()=>audio},{},{identity:'u2'}));
  act(()=>audioStore.set({deafened:true}));await waitFor(()=>expect(audio.muted).toBe(true));
  fireEvent.click(screen.getByRole('button',{name:'Bật mic'}));await waitFor(()=>expect(sdk.mic).toHaveBeenLastCalledWith(true));expect(audioStore.get().deafened).toBe(false);
 });
});
