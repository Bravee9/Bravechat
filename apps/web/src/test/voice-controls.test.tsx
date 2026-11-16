import React from 'react';
import { describe,it,expect,vi,beforeEach } from 'vitest';
import { act,render,screen,fireEvent,waitFor } from '@testing-library/react';
import { VoiceRoom } from '@/features/messages/components/VoiceRoom';
import { audioStore } from '@/stores/audio.store';
import { http } from '@/services/http';
const sdk=vi.hoisted(()=>({permissions:{canPublish:true,canSubscribe:true},mic:vi.fn().mockResolvedValue(undefined),connect:vi.fn().mockResolvedValue(undefined),disconnect:vi.fn().mockResolvedValue(undefined),logLevel:vi.fn(),handlers:{} as Record<string,(...args:unknown[])=>void>}));
vi.mock('@/services/http',()=>({http:{post:vi.fn()}}));
vi.mock('livekit-client',()=>({
 Room:class {
  localParticipant={identity:'u1',name:'Alice',permissions:sdk.permissions,setMicrophoneEnabled:sdk.mic,setCameraEnabled:vi.fn().mockResolvedValue(undefined),getTrackPublication:()=>undefined};remoteParticipants=new Map();
  on(event:string,handler:(...args:unknown[])=>void){sdk.handlers[event]=handler;return this} connect=sdk.connect; disconnect=sdk.disconnect;
  off(event:string){delete sdk.handlers[event];return this}
 },
 setLogLevel:sdk.logLevel,
 RoomEvent:{ParticipantConnected:'join',ParticipantDisconnected:'leave',TrackSubscribed:'track',TrackUnsubscribed:'untrack',Reconnecting:'reconnecting',Reconnected:'reconnected',Disconnected:'disconnected',ParticipantPermissionsChanged:'permissions'},
 Track:{Kind:{Audio:'audio',Video:'video'},Source:{Camera:'camera'}},
}));
beforeEach(()=>{vi.clearAllMocks();sdk.permissions.canPublish=true;sdk.permissions.canSubscribe=true;sdk.connect.mockResolvedValue(undefined);audioStore.set({muted:false,deafened:false});vi.mocked(http.post).mockResolvedValue({serverUrl:'ws://localhost:7880',token:'test'})});
describe('Shared voice controls',()=>{
 it('waits for server admission before enabling the microphone',async()=>{
  sdk.permissions.canPublish=false;sdk.permissions.canSubscribe=false;
  render(<VoiceRoom channelId="voice1" channelType="VOICE"/>);
  fireEvent.click(screen.getByRole('button',{name:'Tham gia'}));
  await waitFor(()=>expect(sdk.handlers.permissions).toBeDefined());
  expect(sdk.mic).not.toHaveBeenCalled();
  act(()=>{sdk.permissions.canPublish=true;sdk.permissions.canSubscribe=true;sdk.handlers.permissions()});
  await screen.findByText(/Đã kết nối/);expect(sdk.mic).toHaveBeenCalledWith(true);
 });
 it('does not render SDK errors containing credentials and disables SDK console logs',async()=>{
  sdk.connect.mockRejectedValueOnce(new Error('ws://host/rtc?access_token=private-jwt&room=private-room'));
  render(<VoiceRoom channelId="voice1" channelType="VOICE"/>);
  fireEvent.click(screen.getByRole('button',{name:'Tham gia'}));
  const alert=await screen.findByRole('alert');
  expect(alert).not.toHaveTextContent('private-jwt');expect(alert).not.toHaveTextContent('private-room');
  expect(sdk.logLevel).toHaveBeenCalledWith('silent');
 });
 it('prevents duplicate joins and never connects after unmount while awaiting token',async()=>{
  let finish!:(value:unknown)=>void;
  vi.mocked(http.post).mockImplementationOnce(()=>new Promise(resolve=>{finish=resolve}));
  const view=render(<VoiceRoom channelId="voice1" channelType="VOICE"/>);
  fireEvent.click(screen.getByRole('button',{name:'Tham gia'}));
  const pending=screen.getByRole('button',{name:'Đang kết nối...'});expect(pending).toBeDisabled();fireEvent.click(pending);
  expect(http.post).toHaveBeenCalledTimes(1);view.unmount();
  await act(async()=>{finish({serverUrl:'ws://localhost:7880',token:'private'});await Promise.resolve()});
  expect(sdk.connect).not.toHaveBeenCalled();
 });
 it('applies mute/deafen preferences to the room SDK and remote audio',async()=>{
  render(<VoiceRoom channelId="voice1" channelType="VOICE"/>);fireEvent.click(screen.getByRole('button',{name:'Tham gia'}));await screen.findByText(/Đã kết nối/);
  act(()=>audioStore.set({muted:true}));await waitFor(()=>expect(sdk.mic).toHaveBeenLastCalledWith(false));
  const audio=document.createElement('audio');act(()=>sdk.handlers.track({kind:'audio',attach:()=>audio},{},{identity:'u2'}));
  act(()=>audioStore.set({deafened:true}));await waitFor(()=>expect(audio.muted).toBe(true));
  fireEvent.click(screen.getByRole('button',{name:'Bật mic'}));await waitFor(()=>expect(sdk.mic).toHaveBeenLastCalledWith(true));expect(audioStore.get().deafened).toBe(false);
 });
});
