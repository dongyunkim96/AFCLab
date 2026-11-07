import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,transition,verifyScenarios} from '../lib/afc.ts';
const tap={type:'tap',deviceId:'AG-01',cardId:'CARD-1001',direction:'entry'};
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
