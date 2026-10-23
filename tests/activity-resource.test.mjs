import assert from 'node:assert/strict';
import test from 'node:test';
import { interactionModule } from './helpers/interaction-module.mjs';
function mount(gameSafe, hidden = false) {
  const events = {}; const jobs = new Map(); let next = 0; let closed = 0; let stopped = 0; let fft = 0;
  const track = {enabled:true,muted:false,readyState:'live',stop(){stopped++;}};
  let cleanup;
  const doc = {hidden,addEventListener:(name,fn)=>{events[name]=fn;},removeEventListener:name=>{delete events[name];}};
  const {useCallActivity: invokeActivity} = interactionModule('components/calls/use-call-activity.ts',{globals:{
    document:doc,window:{setTimeout:(fn,delay)=>{jobs.set(++next,{fn,delay});return next;},clearTimeout:id=>jobs.delete(id)},
    matchMedia:()=>({matches:false}),performance:{now:()=>1000},queueMicrotask,console,
    MediaStream:class{},AudioContext:class{state='running';createMediaStreamSource(){return{connect(){},disconnect(){}};}createAnalyser(){return{fftSize:256,frequencyBinCount:128,getByteTimeDomainData:a=>a.fill(128),getByteFrequencyData(){fft++;},disconnect(){}};}async close(){closed++;}},
  },mocks:{react:{useEffect:fn=>{cleanup=fn();},useRef:value=>({current:value}),useState:value=>[value,()=>{}]},'@/components/layout/experience-provider':{useExperience:()=>({preferences:{gameSafe}})}}});
  invokeActivity([{track,userId:'qa',local:true}],true,false);
  return{jobs,doc,events,cleanup,stats:()=>({closed,stopped,fft})};
}
test('hidden calls schedule no activity timers and resume one sampler when visible',()=>{
  const s=mount(false,true);assert.equal(s.jobs.size,0);s.doc.hidden=false;s.events.visibilitychange();assert.equal(s.jobs.size,1);
  s.doc.hidden=true;s.events.visibilitychange();assert.equal(s.jobs.size,0);s.cleanup();assert.equal(s.stats().stopped,0);
});
test('Game-Safe lowers analyser cadence and omits FFT work without stopping call tracks',()=>{
  const normal=mount(false);const safe=mount(true);assert.equal([...normal.jobs.values()][0].delay,100);assert.equal([...safe.jobs.values()][0].delay,250);
  assert.equal(normal.stats().fft,1);assert.equal(safe.stats().fft,0);normal.cleanup();safe.cleanup();assert.equal(safe.stats().closed,1);assert.equal(safe.stats().stopped,0);
});
