import assert from 'node:assert/strict';import test from 'node:test';import {interactionModule} from './helpers/interaction-module.mjs';
const {summarizeMediaStats}=interactionModule('lib/media/diagnostics.ts');
test('media statistics expose only aggregate quality counters and normalize available units',()=>{
 const report=new Map([['in',{type:'inbound-rtp',kind:'audio',packetsReceived:98,packetsLost:2,jitter:0.012,trackIdentifier:'private-track'}],['out',{type:'candidate-pair',state:'succeeded',nominated:true,currentRoundTripTime:0.025,bytesSent:400,bytesReceived:600,localCandidateId:'private-ip'}]]);
 const sample=summarizeMediaStats([report]);assert.equal(sample.packetLossPercent,2);assert.equal(sample.jitterMs,12);assert.equal(sample.roundTripMs,25);assert.equal(sample.bytesSent,400);assert.doesNotMatch(JSON.stringify(sample),/private|candidate|trackIdentifier/);
});
test('unsupported or absent quality measurements remain unavailable rather than perfect',()=>{
 const sample=summarizeMediaStats([]);assert.equal(sample.packetLossPercent,null);assert.equal(sample.roundTripMs,null);assert.equal(sample.jitterMs,null);
});
