import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,transition,verifyScenarios,expandFleet,deviceZone} from '../lib/afc.ts';
const tap={type:'tap',deviceId:'AG-01',cardId:'CARD-1001',direction:'entry'};
test('24 unique devices across six zones, including fully functional final terminal',()=>{
 const base=initialState();assert.equal(base.devices.length,24);assert.equal(new Set(base.devices.map(d=>d.id)).size,24);
 for(const zone of ['A','B','C','D','E','F'])assert.equal(base.devices.filter(d=>deviceZone(d.id)===zone).length,4);
 const faulted=transition(base,{type:'fault',deviceId:'AG-24',fault:'reader'});assert.equal(faulted.devices[23].fault,'reader');assert.equal(faulted.devices[0].fault,'none');
 const failed=transition(faulted,{...tap,deviceId:'AG-24'});assert.equal(failed.logs[0].code,'E_RDR_002');assert.equal(failed.revenue,0);
 const success=transition(transition(failed,{type:'fault',deviceId:'AG-24',fault:'none'}),{...tap,deviceId:'AG-24'});assert.equal(success.logs[0].code,'ENTRY_OK');assert.equal(success.revenue,1500);
});
test('four-device saved sessions expand without losing balances, logs, faults or counters',()=>{
 let old=transition(initialState(),tap);old=transition(old,{type:'fault',deviceId:'AG-02',fault:'network'});old.devices=old.devices.slice(0,4);
 const upgraded=expandFleet(old);assert.equal(upgraded.devices.length,24);assert.deepEqual(upgraded.cards,old.cards);assert.deepEqual(upgraded.logs,old.logs);assert.equal(upgraded.revenue,1500);assert.equal(upgraded.attempts,1);assert.equal(upgraded.devices[1].fault,'network');assert.equal(upgraded.devices[23].fault,'none');assert.deepEqual(expandFleet(upgraded),upgraded);
});
test('seven fare collection scenarios',()=>{for(const r of verifyScenarios())assert.ok(r.pass,r.name);});
test('each device fault preserves card balance and entry state',()=>{
 for(const fault of ['network','reader','gate']){const base=initialState();const s=transition(transition(base,{type:'fault',deviceId:'AG-01',fault}),tap);assert.deepEqual(s.cards,base.cards);assert.equal(s.revenue,0);assert.equal(s.success,0);assert.equal(s.logs[0].level,'ERROR');assert.equal(base.logs.length,0);}
});
test('charge does not count as collected revenue, then low balance card can enter',()=>{
 const base=initialState();const charged=transition(base,{type:'charge',cardId:'CARD-1002'});assert.equal(charged.cards[1].balance,5800);assert.equal(charged.revenue,0);const entered=transition(charged,{...tap,cardId:'CARD-1002'});assert.equal(entered.cards[1].balance,4300);assert.equal(entered.revenue,1500);
});
test('rapid duplicate tags only collect once; log retention keeps unique IDs',()=>{
 let s=initialState();for(let i=0;i<510;i++)s=transition(s,tap,'2026-11-07T12:00:00Z');assert.equal(s.revenue,1500);assert.equal(s.cards[0].balance,11000);assert.equal(s.logs.length,500);assert.equal(s.logs[0].id,510);assert.equal(s.logs.at(-1).id,11);assert.equal(s.attempts,510);assert.equal(s.success,1);
});
