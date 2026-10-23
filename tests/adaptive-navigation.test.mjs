import assert from 'node:assert/strict';
import test from 'node:test';
import { interactionModule } from './helpers/interaction-module.mjs';
const subject = interactionModule('lib/adaptive-navigation.ts', { globals: { URL, setTimeout, clearTimeout, Date } });
function setup() {
  const jobs = new Map(); const requests = []; let id = 0; let allowed = true; let now = 0;
  const scheduler = subject.createNavigationPreparation({ allowed: () => allowed, current: () => '/dashboard', now: () => now,
    schedule: (fn, delay) => { jobs.set(++id, { fn, delay }); return id; }, cancel: id => jobs.delete(id),
    prefetch: (href, options) => requests.push({ href, ...options }) });
  return { scheduler, requests, jobs, flush: () => { const pending = [...jobs.values()]; jobs.clear(); pending.forEach(job => job.fn()); }, block: () => { allowed = false; }, advance: () => { now += 60000; } };
}
test('speculation rejects action routes, call autojoin, URLs and action query flags', () => {
  for (const href of ['/api/auth/logout','/dashboard/calls/123?autoJoin=1','//evil.test/dashboard','https://evil.test/dashboard','/dashboard/friends?add=1','/dashboard?incoming=1','/dashboard/profile#account','/dashboard/../api/messages']) assert.equal(subject.preparationHref(href), null);
  assert.equal(subject.preparationHref('/dashboard/groups/group/channels/channel'), '/dashboard/groups/group/channels/channel');
  assert.equal(subject.preparationHref('/dashboard/profile?view=settings'), '/dashboard/profile?view=settings');
});
test('idle mounts and cancelled flyovers cause no speculative requests', () => {
  const s = setup(); assert.equal(s.requests.length, 0);
  for (let i = 0; i < 100; i++) s.scheduler.intent(`/dashboard/groups/g${i}`, 'pointer')();
  s.flush(); assert.equal(s.requests.length, 0); assert.equal(s.jobs.size, 0);
});
test('sustained focus prepares once, duplicate intent reuses it and visits release the single reservation', () => {
  const s = setup(); s.scheduler.intent('/dashboard/messages','focus'); s.flush();
  s.scheduler.intent('/dashboard/messages','pointer'); s.flush();
  s.scheduler.intent('/dashboard/friends','focus'); s.flush();
  assert.equal(s.requests.length, 1); assert.equal(s.scheduler.snapshot().reserved, 1); assert.equal(s.scheduler.snapshot().reused, 1);
  s.scheduler.visit('/dashboard/messages'); s.scheduler.intent('/dashboard/friends','focus'); s.flush();
  assert.equal(s.requests.length, 2); assert.equal(s.scheduler.snapshot().useful, 1);
});
test('framework invalidation permits another destination and obsolete callbacks cannot release its slot', () => {
  const s = setup(); s.scheduler.intent('/dashboard/messages','focus'); s.flush(); s.requests[0].onInvalidate();
  s.scheduler.intent('/dashboard/friends','focus'); s.flush(); s.requests[0].onInvalidate();
  assert.equal(s.scheduler.snapshot().reserved, 1); assert.equal(s.scheduler.snapshot().retained, 1);
});

test('an older invalidation cannot release a newer preparation for the same destination', () => {
  const s = setup();
  s.scheduler.intent('/dashboard/messages', 'focus'); s.flush();
  s.scheduler.visit('/dashboard/messages');
  s.scheduler.intent('/dashboard/messages', 'focus'); s.flush();
  assert.equal(s.requests.length, 2);
  s.requests[0].onInvalidate();
  assert.equal(s.scheduler.snapshot().reserved, 1);
  assert.equal(s.scheduler.snapshot().retained, 1);
  assert.equal(s.scheduler.snapshot().invalidatedUnused, 0);
  s.scheduler.intent('/dashboard/friends', 'focus'); s.flush();
  assert.equal(s.requests.length, 2);
  s.requests[1].onInvalidate();
  assert.equal(s.scheduler.snapshot().reserved, 0);
  assert.equal(s.scheduler.snapshot().invalidatedUnused, 1);
});
test('rate cap bounds even completed preparations, and direct navigation never waits for speculation', () => {
  const s = setup();
  for (let i = 0; i < 10; i++) { const href = `/dashboard/groups/g${i}`; s.scheduler.intent(href,'focus'); s.flush(); s.scheduler.visit(href); }
  assert.equal(s.requests.length, 4); s.advance(); s.scheduler.intent('/dashboard/friends','focus'); s.flush(); assert.equal(s.requests.length, 5);
  s.scheduler.visit('/dashboard/friends'); assert.equal(s.jobs.size, 0);
});
test('resources are rechecked after intent and disposal cancels pending work', () => {
  const s = setup(); s.scheduler.intent('/dashboard/messages','pointer'); s.block(); s.flush(); assert.equal(s.requests.length, 0);
  const fresh = setup(); fresh.scheduler.intent('/dashboard/friends','focus'); fresh.scheduler.dispose(); fresh.flush(); assert.equal(fresh.requests.length, 0);
});
test('hidden, offline, reduced-data, constrained networks and active media suppress preparation', () => {
  const state = { hidden:false,online:true,gameSafe:false,mediaActive:false };
  assert.equal(subject.preparationAllowed(state),true);
  for (const override of [{hidden:true},{online:false},{gameSafe:true},{mediaActive:true},{saveData:true},{effectiveType:'2g'},{effectiveType:'3g'}]) assert.equal(subject.preparationAllowed({...state,...override}),false);
});
test('conversation positions are bounded, account lifetime scoped and contain no message bodies', () => {
  const a = subject.createConversationPositions(2); const b = subject.createConversationPositions(2);
  a.set('a',{top:100,following:false});a.set('b',{top:200,following:false});a.set('c',{top:300,following:true});
  assert.equal(a.get('a'),undefined);assert.equal(a.size,2);assert.equal(b.get('c'),undefined);a.clear();assert.equal(a.size,0);
});
test('speculative server reads never repair group membership or create accounts', async () => {
  let writes = 0;
  const prisma = { group: { findMany: async () => [{id:'legacy-group'}] }, groupMember: { createMany: async () => { writes++; } }, user: { findUnique: async () => null, create: async () => { writes++; } } };
  const guards = {'@/lib/speculative-request':{isSpeculativeRequest:async()=>true},'@/lib/prisma':{prisma}};
  const data = interactionModule('lib/dashboard-data.ts',{mocks:{...guards,react:{cache:fn=>fn}}});
  await data.ensureOwnedGroupMemberships('current-account');
  const auth = interactionModule('lib/auth.ts',{mocks:{...guards,'@/lib/auth-dev-flags':{shouldBypassEmailVerificationForDev:()=>true},'@/lib/session':{},'@/lib/supabase/server':{createSupabaseServerClient:async()=>({auth:{getUser:async()=>({data:{user:{email:'qa@example.test',user_metadata:{}}}})}})}}});
  assert.equal((await auth.getAuthState()).status,'unauthenticated'); assert.equal(writes,0);
});
