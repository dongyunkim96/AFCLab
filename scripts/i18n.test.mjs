import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import {translate} from '../lib/i18n.ts';
import {initialState,transition} from '../lib/afc.ts';

test('all static UI and simulation messages have English translations',()=>{
  for(const file of ['app/page.tsx','lib/afc.ts']){
    const source=ts.createSourceFile(file,fs.readFileSync(new URL('../'+file,import.meta.url),'utf8'),ts.ScriptTarget.Latest,true,file.endsWith('tsx')?ts.ScriptKind.TSX:ts.ScriptKind.TS);
    function visit(node){
      if(ts.isStringLiteral(node)&&/[가-힣]/.test(node.text)){
        const translatedUI=ts.isCallExpression(node.parent)&&node.parent.expression.getText(source)==='t';
        if(file==='lib/afc.ts'||translatedUI)assert.ok(!/[가-힣]/.test(translate('en',node.text)),`Missing translation: ${node.text}`);
      }
      ts.forEachChild(node,visit);
    }
    visit(source);
  }
});
test('dynamic notices, error labels and scenario counts translate',()=>{
  for(const message of ['AG-24 장애 해제 · 자가진단 완료','3건의 로그를 내보냈습니다.','4번 로그 상세','2개 단말기 점검 필요','AG-24 정상 단말기 선택','AG-24 Fault 단말기 선택','AG-24 통신 장애 주입 완료. 카드를 태그하고 로그를 확인하세요.','7 / 7 테스트 통과']){
    assert.ok(!/[가-힣]/.test(translate('en',message)),message);
    assert.equal(translate('ko',message),message);
  }
});
test('changing a display language preserves canonical event data and balances',()=>{
  const state=transition(initialState(),{type:'tap',deviceId:'AG-24',cardId:'CARD-1001',direction:'entry'});
  const snapshot=JSON.stringify(state);
  assert.match(translate('en',state.logs[0].message),/Entry approved/);
  assert.match(translate('ko',state.logs[0].message),/입장 승인/);
  assert.equal(JSON.stringify(state),snapshot);
  assert.equal(state.cards[0].balance,11000);
  assert.equal(translate('en','AG-24'),'AG-24');
});
