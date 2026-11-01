import React from 'react';
import { describe,it,expect,vi,beforeEach } from 'vitest';
import { render,screen,fireEvent } from '@testing-library/react';
import { ResetPasswordForm } from '@/features/auth/components/ResetPasswordForm';
import { http } from '@/services/http';
vi.mock('@/services/http',()=>({http:{post:vi.fn()}}));
beforeEach(()=>vi.clearAllMocks());
describe('Password reset',()=>{
 it('does not submit mismatching passwords',async()=>{
  render(<ResetPasswordForm token={'a'.repeat(64)}/>);fireEvent.change(screen.getByLabelText('Mật khẩu mới'),{target:{value:'ExamplePassword1'}});fireEvent.change(screen.getByLabelText('Nhập lại mật khẩu'),{target:{value:'DifferentPassword1'}});fireEvent.click(screen.getByRole('button',{name:'Đặt lại mật khẩu'}));
  expect(await screen.findByRole('alert')).toHaveTextContent('Hai mật khẩu chưa trùng khớp.');expect(http.post).not.toHaveBeenCalled();
 });
 it('shows login only after the server confirms the reset',async()=>{
  vi.mocked(http.post).mockResolvedValue(null);render(<ResetPasswordForm token={'a'.repeat(64)}/>);
  for(const label of ['Mật khẩu mới','Nhập lại mật khẩu'])fireEvent.change(screen.getByLabelText(label),{target:{value:'ExamplePassword1'}});
  fireEvent.click(screen.getByRole('button',{name:'Đặt lại mật khẩu'}));expect(await screen.findByRole('link',{name:'Đăng nhập'})).toHaveAttribute('href','/login');
 });
});
