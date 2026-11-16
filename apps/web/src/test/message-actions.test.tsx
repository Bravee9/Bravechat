import React from 'react';
import { describe,it,expect,vi } from 'vitest';
import { render,screen,fireEvent } from '@testing-library/react';
import { MessageItem } from '@/features/messages/components/MessageItem';
const message={id:'m1',user:'Alice',avatar:'AL',time:'10:00',content:'Hello',author:{id:'u1',username:'alice'},replyTo:{id:'p1',user:'Bob',content:'Parent'},reactions:[{emoji:'👍',count:1,userIds:['u1']}]};
describe('Message actions',()=>{
 it('calls reply with the actual message and removes an existing own reaction',()=>{
  const onReply=vi.fn(),onReaction=vi.fn();render(<MessageItem message={message} isCurrentUser currentUserId="u1" onReply={onReply} onReaction={onReaction}/>);
  fireEvent.click(screen.getByRole('button',{name:'Trả lời'}));expect(onReply).toHaveBeenCalledWith(message);
  fireEvent.click(screen.getByRole('button',{name:'👍 1'}));expect(onReaction).toHaveBeenCalledWith(message,'👍',true);expect(screen.getByText('↩ Bob: Parent')).toBeInTheDocument();
 });
 it('offers emoji selection and hides edit/delete for another author',()=>{
  const onReaction=vi.fn();render(<MessageItem message={message} isCurrentUser={false} currentUserId="u2" onReaction={onReaction} onEdit={vi.fn()} onDelete={vi.fn()}/>);
  expect(screen.queryByRole('button',{name:'Sửa'})).not.toBeInTheDocument();expect(screen.queryByRole('button',{name:'Xóa'})).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button',{name:'Thêm emoji'}));fireEvent.click(screen.getByRole('button',{name:'🎉'}));expect(onReaction).toHaveBeenCalledWith(message,'🎉',false);
 });
});
