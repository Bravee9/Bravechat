import React from 'react';
import { describe,it,expect,vi,beforeEach } from 'vitest';
import { render,screen,fireEvent } from '@testing-library/react';
import { FriendsPanel } from '@/features/members/components/FriendsPanel';
import { http } from '@/services/http';
vi.mock('@/services/http',()=>({http:{get:vi.fn(),post:vi.fn(),put:vi.fn(),delete:vi.fn()}}));
const incoming={id:'f1',user:{id:'u2',username:'bob',displayName:'Bob',status:'ONLINE',avatarUrl:null}};
beforeEach(()=>{vi.clearAllMocks();vi.mocked(http.get).mockResolvedValue({friends:[],incoming:[incoming],outgoing:[],blocked:[]})});
describe('Friends workflow',()=>{
 it('keeps an incoming invitation visible when the API rejects acceptance',async()=>{
  vi.mocked(http.put).mockRejectedValue(new Error('Lời mời không còn tồn tại.'));render(<FriendsPanel/>);
  await screen.findByRole('button',{name:'Đang chờ (1)'});fireEvent.click(screen.getByRole('button',{name:'Đang chờ (1)'}));
  fireEvent.click(screen.getByRole('button',{name:'Chấp nhận'}));expect(await screen.findByRole('alert')).toHaveTextContent('Lời mời không còn tồn tại.');expect(screen.getByText('Bob')).toBeInTheDocument();
 });
 it('renders accepted friends only after API success and reload',async()=>{
  vi.mocked(http.put).mockResolvedValue(null);render(<FriendsPanel/>);await screen.findByRole('button',{name:'Đang chờ (1)'});fireEvent.click(screen.getByRole('button',{name:'Đang chờ (1)'}));
  vi.mocked(http.get).mockResolvedValue({friends:[incoming],incoming:[],outgoing:[],blocked:[]});fireEvent.click(screen.getByRole('button',{name:'Chấp nhận'}));
  await screen.findByRole('button',{name:'Tất cả (1)'});fireEvent.click(screen.getByRole('button',{name:'Tất cả (1)'}));expect(screen.getByRole('link',{name:'Nhắn tin'})).toHaveAttribute('href','/channels/@me/u2');
 });
});
