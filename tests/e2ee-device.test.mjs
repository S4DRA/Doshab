import assert from 'node:assert/strict';import test from 'node:test';import {webcrypto,randomUUID} from 'node:crypto';import {interactionModule} from './helpers/interaction-module.mjs';
function setup(status=200){const saved=new Map();let generated=0;let failStorage=false;let requests=0;let now=0;
 const subtle=new Proxy(webcrypto.subtle,{get(target,key){if(key==='generateKey')return(...args)=>{generated++;return target.generateKey(...args);};const value=target[key];return typeof value==='function'?value.bind(target):value;}});
 const subject=interactionModule('lib/e2ee-message.client.ts',{globals:{TextDecoder,TextEncoder,Uint8Array,ArrayBuffer,AbortSignal,Date:{now:()=>now},fetch:async()=>{requests++;return{ok:status>=200&&status<300};},window:{crypto:{subtle,randomUUID},localStorage:{getItem:key=>saved.get(key)||null,setItem:(key,value)=>{if(failStorage)throw new Error('storage unavailable');saved.set(key,value);}}}},mocks:{'@/lib/e2ee-message':{deviceEncryptedMessagePrefix:'e2ee:v2:',encryptedMessagePrefix:'e2ee:v1:'}}});return{subject,generated:()=>generated,setStorageFailure:value=>{failStorage=value;},requests:()=>requests,advance:()=>{now+=60001;}};
}
test('concurrent secure-chat preparation creates and reuses one real device key pair',async()=>{
 const s=setup();const identities=await Promise.all(Array.from({length:30},()=>s.subject.getOrCreateDeviceIdentity()));assert.equal(new Set(identities.map(i=>i.deviceId)).size,1);assert.equal(s.generated(),1);await s.subject.getOrCreateDeviceIdentity();assert.equal(s.generated(),1);
});
test('device registration failures never announce encryption readiness',async()=>{
 for(const status of [401,429,500]){const s=setup(status);await assert.rejects(s.subject.registerDeviceKey('account-a'),/Could not register/);await assert.rejects(s.subject.registerDeviceKey('account-a'),/Could not register/);assert.equal(s.requests(),2);}
});
test('rapid conversation switches reuse registration, while account switches and expiry re-register',async()=>{
 const s=setup();await Promise.all(Array.from({length:40},()=>s.subject.registerDeviceKey('account-a')));assert.equal(s.requests(),1);
 await s.subject.registerDeviceKey('account-b');assert.equal(s.requests(),2);await s.subject.registerDeviceKey('account-a');assert.equal(s.requests(),3);
 s.advance();await s.subject.registerDeviceKey('account-a');assert.equal(s.requests(),4);
});
test('a failed identity write can be retried without retaining a rejected creation promise',async()=>{
 const s=setup();s.setStorageFailure(true);await assert.rejects(s.subject.getOrCreateDeviceIdentity(),/storage unavailable/);s.setStorageFailure(false);assert.ok((await s.subject.getOrCreateDeviceIdentity()).deviceId);assert.equal(s.generated(),2);
});
