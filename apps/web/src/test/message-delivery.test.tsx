import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ChatView } from '@/features/messages/components/ChatView';
import { http } from '@/services/http';
vi.mock('next/navigation', () => ({ useParams: () => ({}) }));
vi.mock('@/stores/workspace.store', () => ({ useCurrentUser: () => ({ id:'u1', username:'alice', displayName:'Alice' }), loadConversations: vi.fn() }));
vi.mock('@/services/http', () => ({ http: { get:vi.fn(), post:vi.fn(), patch:vi.fn(), delete:vi.fn() }, ApiError: class extends Error {} }));
vi.mock('@/features/members/components/MemberList', () => ({ MemberList: () => null }));
vi.mock('@/features/members/components/UserCard', () => ({ UserCard: () => null }));
vi.mock('@/features/members/components/FriendsPanel', () => ({ FriendsPanel: () => null }));
vi.mock('@/features/messages/components/VoiceRoom', () => ({ VoiceRoom: () => null }));
vi.mock('@/features/messages/components/ChatHeader', () => ({ ChatHeader: ({channelName}:{channelName:string}) => <h1>{channelName}</h1> }));
vi.mock('@/features/messages/components/MessageList', () => ({ MessageList: React.forwardRef<HTMLDivElement,{messages:Array<{id:string;content:string}>}>(function List({messages},ref) {return <div ref={ref}>{messages.map((row)=><p data-testid="saved-message" key={row.id}>{row.content}</p>)}</div>}) }));
class Socket { static OPEN=1; static instances: Socket[]=[]; readyState=0; onmessage?: (event:{data:string})=>void; constructor(){Socket.instances.push(this)} close(){} send(){} }
beforeEach(()=>{vi.clearAllMocks();Socket.instances=[];vi.stubGlobal('WebSocket',Socket);HTMLElement.prototype.scrollIntoView=vi.fn();vi.mocked(http.get).mockResolvedValue({channel:{type:'TEXT',name:'general'}})});
afterEach(()=>{vi.unstubAllGlobals();vi.restoreAllMocks();vi.useRealTimers()});
const saved={id:'saved1',content:'hello',user:'Alice',avatar:'AL',time:'10:00',createdAt:'2026-11-01T01:00:00Z'};
describe('Message delivery',()=>{
 it('never shows raw route IDs while metadata is delayed or after navigating',async()=>{
  let finish!:(value:any)=>void;
  vi.mocked(http.get).mockImplementationOnce(()=>new Promise(resolve=>{finish=resolve}));
  const view=render(<ChatView serverId="s1" channelId="private-channel-id"/>);
  expect(screen.getByRole('heading')).toHaveTextContent('Đang tải...');
  expect(document.body).not.toHaveTextContent('private-channel-id');
  await act(async()=>{finish({channel:{type:'TEXT',name:'Design'}})});
  expect(screen.getByRole('heading')).toHaveTextContent('Design');
  vi.mocked(http.get).mockImplementationOnce(()=>new Promise(()=>{}));
  view.rerender(<ChatView serverId="s1" channelId="another-private-id"/>);
  expect(screen.getByRole('heading')).toHaveTextContent('Đang tải...');
  expect(document.body).not.toHaveTextContent('another-private-id');
  expect(document.body).not.toHaveTextContent('Design');
 });
 it('retains draft on network failure and retries with exactly the same nonce',async()=>{
  vi.mocked(http.post).mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce({message:saved});
  render(<ChatView serverId="s1" channelId="c1"/>);
  const input=screen.getByTestId('chat-input-field');fireEvent.change(input,{target:{value:'hello'}});fireEvent.click(screen.getByTestId('send-message-btn'));
  await screen.findByRole('alert');expect(input).toHaveValue('hello');expect(screen.queryByTestId('saved-message')).not.toBeInTheDocument();
  fireEvent.click(screen.getByTestId('send-message-btn'));await screen.findByTestId('saved-message');expect(input).toHaveValue('');
  expect(vi.mocked(http.post).mock.calls[0][1]).toEqual(vi.mocked(http.post).mock.calls[1][1]);expect(screen.getAllByTestId('saved-message')).toHaveLength(1);
 });
 it('disables double submit until the server confirms persistence',async()=>{
  let finish!:(value:unknown)=>void;vi.mocked(http.post).mockImplementation(()=>new Promise(resolve=>{finish=resolve}));
  render(<ChatView serverId="s1" channelId="c1"/>);fireEvent.change(screen.getByTestId('chat-input-field'),{target:{value:'hello'}});fireEvent.click(screen.getByTestId('send-message-btn'));
  expect(screen.getByTestId('send-message-btn')).toBeDisabled();fireEvent.click(screen.getByTestId('send-message-btn'));expect(http.post).toHaveBeenCalledTimes(1);expect(screen.queryByTestId('saved-message')).not.toBeInTheDocument();
  finish({message:saved});await screen.findByTestId('saved-message');
 });
 it('preserves a live message arriving while history is loading',async()=>{
  let finish!:(value:unknown)=>void;
  vi.mocked(http.get).mockImplementation((path)=>path.endsWith('/messages')?new Promise(resolve=>{finish=resolve}):Promise.resolve({channel:{type:'TEXT',name:'general'}}));
  render(<ChatView serverId="s1" channelId="c1"/>);
  act(()=>Socket.instances[0].onmessage?.({data:JSON.stringify({type:'channel_joined',channelId:'c1'})}));
  act(()=>Socket.instances[0].onmessage?.({data:JSON.stringify({type:'message_create',channelId:'c1',message:saved})}));
  finish({messages:[{...saved,id:'older',content:'older',createdAt:'2026-11-01T00:00:00Z'}],hasMore:false});
  await waitFor(()=>expect(screen.getAllByTestId('saved-message')).toHaveLength(2));expect(screen.getByText('hello')).toBeInTheDocument();
 });
 it('does not acknowledge a hidden channel and marks it read when the tab becomes visible',async()=>{
  vi.useFakeTimers();const visibility=vi.spyOn(document,'visibilityState','get').mockReturnValue('hidden');
  vi.mocked(http.post).mockResolvedValue(null);
  vi.mocked(http.get).mockImplementation((path)=>Promise.resolve(path.endsWith('/messages')?{messages:[],hasMore:false}:{channel:{type:'TEXT',name:'general'}}));
  render(<ChatView serverId="s1" channelId="c1"/>);
  await act(async()=>{Socket.instances[0].onmessage?.({data:JSON.stringify({type:'channel_joined',channelId:'c1'})});await Promise.resolve()});
  await act(async()=>{await vi.advanceTimersByTimeAsync(600)});expect(http.post).not.toHaveBeenCalled();
  visibility.mockReturnValue('visible');act(()=>document.dispatchEvent(new Event('visibilitychange')));
  await act(async()=>{await vi.advanceTimersByTimeAsync(600)});expect(http.post).toHaveBeenCalledWith('/channels/c1/read');
 });
});
