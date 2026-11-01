import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { randomUUID, createHash } from 'node:crypto';
import { readdir, readFile, unlink } from 'node:fs/promises';
import path from 'node:path';
import { root, apiRequire } from './runtime.mjs';
const { PrismaClient } = createRequire(path.join(root, 'package.json'))('@prisma/client');
const WebSocket = createRequire(apiRequire.resolve('@fastify/websocket'))('ws');
const prisma = new PrismaClient();
const base = 'http://localhost:4000/api';
const origin = process.env.FRONTEND_URL || 'http://localhost:3000';
const tag = randomUUID().replaceAll('-', '').slice(0, 10);
const emails = ['a', 'b', 'c'].map((letter) => `workflow_${tag}_${letter}@example.test`);
const password = 'Test-' + randomUUID();
const sockets = []; const testMail = []; const userIds = []; let serverId;
if (process.env.NODE_ENV === 'production' || process.env.RESEND_API_KEY) throw new Error('Run these tests locally with the development mailbox, not a live email provider.');
class Client {
  cookies = new Map();
  get cookie() { return Array.from(this.cookies, ([key, value]) => `${key}=${value}`).join('; '); }
  async call(method, route, body, cookie = this.cookie) {
    const response = await fetch(base + route, { method, headers: { Cookie: cookie, Origin: origin, ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) }, body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(15000) });
    for (const value of response.headers.getSetCookie()) { const pair = value.split(';')[0]; const at = pair.indexOf('='); if (pair.slice(at + 1)) this.cookies.set(pair.slice(0,at), pair.slice(at+1)); else this.cookies.delete(pair.slice(0,at)); }
    return { status: response.status, headers: response.headers, body: await response.json() };
  }
}
const ok = (result, status = 200) => { assert.equal(result.status, status, JSON.stringify(result.body)); return result.body.data; };
async function connect(client, channelId) {
  const socket = new WebSocket(base.replace('http:','ws:') + '/ws', { headers: { Cookie: client.cookie, Origin: origin } });
  sockets.push(socket);
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('WebSocket connection timeout')), 10000);
    socket.on('error', reject);
    socket.on('message', (raw) => { const event = JSON.parse(raw); if (event.type === 'connected') { if (channelId) socket.send(JSON.stringify({ type: 'join_channel', channelId })); else { clearTimeout(timer); resolve(); } } if (event.type === 'channel_joined') { clearTimeout(timer); resolve(); } });
  });
  return socket;
}
function waitEvent(socket, predicate) {
  return new Promise((resolve,reject) => { const timer=setTimeout(()=>{socket.off('message',listener);reject(new Error('Realtime event timeout'));},10000); const listener=(raw)=>{const event=JSON.parse(raw);if(predicate(event)){clearTimeout(timer);socket.off('message',listener);resolve(event);}};socket.on('message',listener); });
}
try {
  const a = new Client(); const b = new Client(); const c = new Client(); const clients=[a,b,c]; const users=[];
  ok(await a.call('GET','/auth/me'),401);
  for (let index=0;index<3;index++) { const user=ok(await clients[index].call('POST','/auth/register',{email:emails[index],username:`workflow_${tag}_${index}`,password}),201).user; users.push(user);userIds.push(user.id); }
  ok(await a.call('POST','/auth/login',{email:emails[0],password:'wrong-password'}),401);
  const login = await a.call('POST','/auth/login',{email:emails[0],password});
  ok(login);
  assert.equal(login.headers.get('cache-control'), 'no-store');
  assert.deepEqual(Object.keys(login.body.data), ['user']);
  for (const name of ['token', 'refreshToken']) {
    const cookie = login.headers.getSetCookie().find(value => value.startsWith(name + '='));
    assert.ok(cookie && /; HttpOnly/i.test(cookie) && /; SameSite=Lax/i.test(cookie), 'Session cookies must remain HttpOnly and SameSite');
  }
  ok(await a.call('PATCH','/users/@me',{displayName:'Workflow A',customStatus:'testing'}));
  assert.equal(ok(await a.call('GET','/auth/me')).user.displayName,'Workflow A');
  const aSocket = await connect(a); const bSocket = await connect(b); const cSocket = await connect(c);
  const notice=waitEvent(bSocket,(event)=>event.type==='friends_update');
  const friendship=ok(await a.call('POST','/users/@me/friends',{username:users[1].username}),201).friendship;
  await notice;
  assert.equal(ok(await b.call('GET','/users/@me/friends')).incoming[0].id,friendship.id);
  assert.equal(ok(await a.call('POST','/users/@me/friends',{username:users[1].username}),201).friendship.id,friendship.id);
  ok(await c.call('PUT','/users/@me/friends/'+friendship.id,{action:'accept'}),404);
  ok(await a.call('PUT','/users/@me/friends/'+friendship.id,{action:'accept'}),404);
  ok(await b.call('PUT','/users/@me/friends/'+friendship.id,{action:'accept'}));
  assert.equal(ok(await a.call('GET','/users/@me/friends')).friends[0].user.id,users[1].id);
  ok(await a.call('POST','/users/@me/friends',{username:users[0].username}),400);
  let rejected=ok(await c.call('POST','/users/@me/friends',{username:users[1].username}),201).friendship;
  ok(await b.call('PUT','/users/@me/friends/'+rejected.id,{action:'reject'}));
  rejected=ok(await c.call('POST','/users/@me/friends',{username:users[1].username}),201).friendship;
  ok(await c.call('DELETE','/users/@me/friends/'+rejected.id));
  assert.equal(ok(await b.call('GET','/users/@me/friends')).incoming.length,0);
  console.log('PASS DB login, profile, friendship request/accept, realtime, forged-action rejection');

  const server=ok(await a.call('POST','/servers',{name:'Workflow '+tag}),201).server; serverId=server.id;
  const channelId=server.channels.find((channel)=>channel.type==='TEXT').id;
  const other=ok(await a.call('POST',`/servers/${serverId}/channels`,{name:'second'}),201).channel;
  ok(await c.call('GET',`/channels/${channelId}/messages`),404);
  const invite=ok(await a.call('POST',`/servers/${serverId}/invites`),201).invite;
  ok(await b.call('POST','/invites/'+invite.code));
  const channelSocket=await connect(b,channelId);
  const nonce=randomUUID(); const incoming=waitEvent(channelSocket,(event)=>event.type==='message_create');
  const posted=await Promise.all([a.call('POST',`/channels/${channelId}/messages`,{content:'Original',nonce}),a.call('POST',`/channels/${channelId}/messages`,{content:'Original',nonce})]);
  posted.forEach((result)=>assert.ok([200,201].includes(result.status),JSON.stringify(result.body)));
  const original=posted[0].body.data.message; assert.equal(original.id,posted[1].body.data.message.id); await incoming;
  assert.equal(await prisma.message.count({where:{channelId,nonce}}),1);
  ok(await a.call('POST',`/channels/${channelId}/messages`,{content:'Different',nonce}),409);
  const quote=ok(await b.call('POST',`/channels/${channelId}/messages`,{content:'Reply',replyToId:original.id,nonce:randomUUID()}),201).message;
  assert.equal(quote.replyTo.id,original.id);
  ok(await b.call('POST',`/channels/${other.id}/messages`,{content:'Wrong-channel reply',replyToId:original.id}),400);
  ok(await b.call('PATCH','/messages/'+original.id,{content:'Forged'}),403);
  ok(await c.call('POST','/messages/'+original.id+'/reactions',{emoji:'👍'}),404);
  const reactionEvent=waitEvent(channelSocket,(event)=>event.type==='message_update'&&event.message?.reactions?.length===1);
  ok(await b.call('POST','/messages/'+original.id+'/reactions',{emoji:'👍'})); await reactionEvent;
  const reacted=ok(await b.call('POST','/messages/'+original.id+'/reactions',{emoji:'👍'})).message;
  assert.equal(reacted.reactions[0].count,1);
  ok(await b.call('DELETE','/messages/'+original.id+'/reactions/'+encodeURIComponent('👍')));
  const mentioned='Edited @'+users[1].username;
  ok(await a.call('PATCH','/messages/'+original.id,{content:mentioned}));
  let history=ok(await b.call('GET',`/channels/${channelId}/messages`));
  assert.equal(history.messages.find((item)=>item.id===quote.id).replyTo.content,mentioned);
  let state=ok(await b.call('GET',`/servers/${serverId}`)).channels.find((item)=>item.id===channelId);
  assert.equal(state.hasUnread,true);assert.equal(state.mentionCount,1);
  assert.equal(ok(await b.call('GET','/users/@me/servers')).find((item)=>item.id===serverId).mentionCount,1);
  const readEvent=waitEvent(bSocket,(event)=>event.type==='channel_read'&&event.channelId===channelId);
  ok(await b.call('POST',`/channels/${channelId}/read`));await readEvent;
  state=ok(await b.call('GET',`/servers/${serverId}`)).channels.find((item)=>item.id===channelId);
  assert.equal(state.hasUnread,false);assert.equal(state.mentionCount,0);
  assert.ok(await prisma.channelReadState.findUnique({where:{userId_channelId:{userId:users[1].id,channelId}}}));
  ok(await c.call('POST',`/channels/${channelId}/read`),404);
  ok(await b.call('DELETE','/messages/'+original.id),403);
  ok(await a.call('DELETE','/messages/'+original.id));
  history=ok(await b.call('GET',`/channels/${channelId}/messages`));
  assert.equal(history.messages.find((item)=>item.id===quote.id).replyTo.content,'Tin nhắn đã xóa');
  console.log('PASS channel send/retry deduplication, reply, edit/delete ownership, emoji persistence/realtime');
  console.log('PASS persistent channel unread/mentions, read acknowledgement, cross-session read event');

  let leaked=false;cSocket.on('message',(raw)=>{if(JSON.parse(raw).type==='dm_create')leaked=true});
  const dmNonce=randomUUID();const dmEvent=waitEvent(bSocket,(event)=>event.type==='dm_create');
  const dm=ok(await a.call('POST','/messages/dm/'+users[1].id,{content:'First DM',nonce:dmNonce}),201).message;await dmEvent;
  await new Promise((resolve)=>setTimeout(resolve,100));assert.equal(leaked,false);
  assert.equal(ok(await a.call('POST','/messages/dm/'+users[1].id,{content:'First DM',nonce:dmNonce})).message.id,dm.id);
  const dmReply=ok(await b.call('POST','/messages/dm/'+users[0].id,{content:'DM reply',replyToId:dm.id,nonce:randomUUID()}),201).message;
  assert.equal(dmReply.replyTo.id,dm.id);
  ok(await c.call('PATCH',`/messages/dm/${users[0].id}/${dm.id}`,{content:'Forged'}),404);
  ok(await b.call('PATCH',`/messages/dm/${users[0].id}/${dm.id}`,{content:'Forged'}),403);
  ok(await b.call('POST',`/messages/dm/${users[0].id}/${dm.id}/reactions`,{emoji:'❤️'}));
  ok(await a.call('PATCH',`/messages/dm/${users[1].id}/${dm.id}`,{content:'Edited DM'}));
  const conversation=ok(await b.call('GET','/users/@me/conversations')).filter((item)=>item.recipient.id===users[0].id);
  assert.equal(conversation.length,1);assert.equal(conversation[0].hasUnread,true);
  const date=new Date(Date.now()-10000);
  await prisma.directMessage.createMany({data:Array.from({length:55},(_,index)=>({senderId:users[0].id,receiverId:users[1].id,content:'History '+index,createdAt:date}))});
  const first=ok(await b.call('GET','/messages/dm/'+users[0].id));assert.equal(first.messages.length,50);assert.equal(first.hasMore,true);
  const second=ok(await b.call('GET','/messages/dm/'+users[0].id+'?before='+first.nextCursor));
  assert.equal(new Set([...first.messages,...second.messages].map((item)=>item.id)).size,57);
  assert.equal(ok(await b.call('GET','/users/@me/conversations'))[0].hasUnread,false);
  const blocking=ok(await b.call('POST','/users/@me/friends/block',{userId:users[0].id})).friendship;
  ok(await a.call('POST','/messages/dm/'+users[1].id,{content:'Blocked message'}),403);
  ok(await a.call('POST','/users/@me/friends',{username:users[1].username}),403);
  ok(await a.call('DELETE','/users/@me/friends/'+blocking.id),404);
  ok(await b.call('DELETE','/users/@me/friends/'+blocking.id));
  ok(await a.call('POST','/messages/dm/'+users[1].id,{content:'Unblocked message'}),201);
  const reciprocal=await Promise.all([a.call('POST','/users/@me/friends',{username:users[1].username}),b.call('POST','/users/@me/friends',{username:users[0].username})]);
  assert.deepEqual(reciprocal.map((result)=>result.status).sort(),[201,409]);
  assert.equal(await prisma.friendship.count({where:{OR:[{userId:users[0].id,friendId:users[1].id},{userId:users[1].id,friendId:users[0].id}]}}),1);
  const closedMembership=new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error('Membership socket remained open')),5000);channelSocket.once('close',(code)=>{clearTimeout(timer);resolve(code)})});
  ok(await b.call('DELETE',`/servers/${serverId}/members/@me`));assert.equal(await closedMembership,1008);
  ok(await b.call('GET',`/channels/${channelId}/messages`),404);
  console.log('PASS persistent realtime DM, replies/reactions, pagination ties, unique conversations/unread, blocking');

  const oldCookie=a.cookie;ok(await a.call('POST','/auth/refresh'));ok(await a.call('GET','/auth/me',undefined,oldCookie),401);
  const mail=ok(await a.call('POST','/auth/forgot-password',{email:emails[0]}));assert.equal(mail.delivery,'development');
  const mailFolder=path.join(root,'.local/mail');
  let resetToken;
  for(const file of await readdir(mailFolder)) { const full=path.join(mailFolder,file); const item=JSON.parse(await readFile(full,'utf8'));if(item.to===emails[0]) { testMail.push(full);resetToken=new URL(item.url).searchParams.get('token'); } }
  assert.ok(resetToken);const stored=await prisma.passwordResetToken.findUnique({where:{tokenHash:createHash('sha256').update(resetToken).digest('hex')}});assert.ok(stored&&stored.tokenHash!==resetToken);
  const expiredValue=createHash('sha256').update(randomUUID()).digest('hex');
  await prisma.passwordResetToken.create({data:{userId:users[0].id,tokenHash:createHash('sha256').update(expiredValue).digest('hex'),expiresAt:new Date(Date.now()-1000)}});
  ok(await a.call('POST','/auth/reset-password',{token:expiredValue,password:'Expired-link-password'}),400);
  const replacement='Changed-'+randomUUID();const beforeReset=a.cookie;
  const resetRace=await Promise.all([a.call('POST','/auth/reset-password',{token:resetToken,password:replacement}),a.call('POST','/auth/reset-password',{token:resetToken,password:replacement})]);
  assert.deepEqual(resetRace.map((result)=>result.status).sort(),[200,400]);
  ok(await a.call('GET','/auth/me',undefined,beforeReset),401);
  ok(await a.call('POST','/auth/reset-password',{token:resetToken,password:replacement}),400);
  ok(await a.call('POST','/auth/login',{email:emails[0],password}),401);
  ok(await a.call('POST','/auth/login',{email:emails[0],password:replacement}));
  const lastSocket=await connect(a);
  const closedSession=new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error('Logged-out socket remained open')),5000);lastSocket.once('close',(code)=>{clearTimeout(timer);resolve(code)})});
  const revoked=a.cookie;ok(await a.call('POST','/auth/logout'));assert.equal(await closedSession,1008);ok(await a.call('GET','/auth/me',undefined,revoked),401);
  console.log('PASS rotating sessions, local reset mail, hashed one-use reset, session revocation, logout');
} finally {
  sockets.forEach((socket)=>socket.terminate());
  await prisma.friendship.deleteMany({where:{OR:[{userId:{in:userIds}},{friendId:{in:userIds}}]}});
  await prisma.directMessage.deleteMany({where:{OR:[{senderId:{in:userIds}},{receiverId:{in:userIds}}]}});
  if(serverId)await prisma.server.deleteMany({where:{id:serverId}});
  await prisma.user.deleteMany({where:{email:{in:emails}}});
  await prisma.$disconnect();
  for(const file of testMail)await unlink(file).catch(()=>undefined);
}
