export const FARE = 1500;
export const faultNames = { none: '정상 운영', network: '서버 통신 끊김', reader: '카드 리더 오류', gate: '게이트 센서 오류' };
export type Fault = keyof typeof faultNames;
export type Log = { id:number; time:string; device:string; card:string; level:'INFO'|'WARN'|'ERROR'; code:string; message:string; amount:number };
export type State = { cards:{id:string;name:string;balance:number;inside:boolean}[];devices:{id:string;fault:Fault}[];logs:Log[];revenue:number;attempts:number;success:number;sequence:number };
export type Action = {type:'tap';deviceId:string;cardId:string;direction:'entry'|'exit'} | {type:'charge';cardId:string} | {type:'fault';deviceId:string;fault:Fault};
export function initialState():State { return {
  cards:[{id:'CARD-1001',name:'일반 교통카드',balance:12500,inside:false},{id:'CARD-1002',name:'잔액 부족 카드',balance:800,inside:false},{id:'CARD-1003',name:'테스트 교통카드',balance:5000,inside:false}],
  devices:['AG-01','AG-02','AG-03','AG-04'].map(id=>({id,fault:'none'})), logs:[],revenue:0,attempts:0,success:0,sequence:0,
}; }
export function transition(state:State, action:Action, now=new Date().toISOString()):State {
  const next=structuredClone(state);
  const device='deviceId' in action ? next.devices.find(d=>d.id===action.deviceId):undefined;
  const card='cardId' in action ? next.cards.find(c=>c.id===action.cardId):undefined;
  const log=(level:Log['level'],code:string,message:string,amount=0)=>{
    next.logs.unshift({id:++next.sequence,time:now,device:'deviceId' in action?action.deviceId:'SYSTEM',card:'cardId' in action?action.cardId:'—',level,code,message,amount});
    next.logs=next.logs.slice(0,500);
  };
  if(action.type==='fault'&&device){device.fault=action.fault;log(action.fault==='none'?'INFO':'ERROR',action.fault==='none'?'DEVICE_RECOVERED':'DEVICE_FAULT',action.fault==='none'?'장애 해제 · 단말기 자가진단 정상':faultNames[action.fault]);}
  if(action.type==='charge'&&card){card.balance+=5000;log('INFO','CHARGE_OK','가상 충전 완료 · 5,000원',5000);}
  if(action.type==='tap'&&card&&device){
    next.attempts++;
    const errors={network:['E_NET_001','승인 서버 응답 없음 · 네트워크를 확인하세요.'],reader:['E_RDR_002','카드 판독 실패 · 리더 연결을 확인하세요.'],gate:['E_GATE_003','게이트 센서 이상 · 통로를 점검하세요.']};
    if(device.fault!=='none'){const [code,message]=errors[device.fault];log('ERROR',code,message);}
    else if(action.direction==='entry'&&card.inside)log('WARN','E_DUP_ENTRY','이미 입장한 카드입니다. 퇴장을 먼저 처리하세요.');
    else if(action.direction==='exit'&&!card.inside)log('WARN','E_NO_ENTRY','입장 기록이 없습니다. 먼저 입장 태그를 해주세요.');
    else if(action.direction==='entry'&&card.balance<FARE)log('WARN','E_BALANCE','잔액 부족 · 충전 후 다시 이용하세요.');
    else{const amount=action.direction==='entry'?FARE:0;card.balance-=amount;card.inside=action.direction==='entry';next.revenue+=amount;next.success++;log('INFO',action.direction==='entry'?'ENTRY_OK':'EXIT_OK',action.direction==='entry'?'입장 승인 · 1,500원 차감 · 게이트 열림':'퇴장 승인 · 추가 요금 없음 · 게이트 열림',amount);}
  }
  return next;
}
export const diagnostics:Record<string,[string,string,string]>={
  E_NET_001:['승인 서버 통신 실패','네트워크 연결·서버 응답 확인 → 단말기 장애 해제 → 같은 카드로 재태그','승인 실패 시 잔액과 입장 상태가 변경되지 않는지 확인합니다.'],
  E_RDR_002:['카드 리더 판독 실패','리더 연결·전원 확인 → 단말기 장애 해제 → 재태그','실제 장비에서는 리더 드라이버와 통신 로그도 확인합니다.'],
  E_GATE_003:['게이트 센서 응답 오류','통로 장애물·센서 상태 확인 → 단말기 장애 해제 → 재태그','이 실습은 센서 오류 시 승인과 차감을 함께 차단합니다.'],
  E_BALANCE:['교통카드 잔액 부족','가상 충전 +5,000원 → 입장 재시도 → 차감 확인','장비 고장이 아닌 이용 조건 미충족으로 WARN을 기록합니다.'],
  E_DUP_ENTRY:['중복 입장 요청','입장 상태 확인 → 퇴장 태그 → 다시 입장','중복 요청으로 요금이 이중 차감되지 않는지 확인합니다.'],
  E_NO_ENTRY:['입장 기록 없음','입장 태그 → 퇴장 태그 순서로 테스트','입장 기록 없는 퇴장은 승인하지 않습니다.'],
  DEVICE_FAULT:['단말기 장애 주입','카드 태그 → 오류 로그 확인 → 장애 해제 → 재태그','실습을 위해 직접 주입한 가상 하드웨어·통신 장애입니다.'],
};
export function verifyScenarios(){
  const base=initialState(); const tap:Action={type:'tap',deviceId:'AG-01',cardId:'CARD-1001',direction:'entry'};
  const entry=transition(base,tap), exit=transition(entry,{...tap,direction:'exit'}), dup=transition(entry,tap), low=transition(base,{...tap,cardId:'CARD-1002'});
  const fault=transition(base,{type:'fault',deviceId:'AG-01',fault:'network'}), failed=transition(fault,tap), recovered=transition(transition(failed,{type:'fault',deviceId:'AG-01',fault:'none'}),tap);
  return [
    {name:'정상 입장 · 요금 차감 및 입장 상태 전환',pass:entry.cards[0].balance===11000&&entry.cards[0].inside},
    {name:'정상 퇴장 · 추가 차감 없이 입장 상태 해제',pass:!exit.cards[0].inside&&exit.cards[0].balance===11000},
    {name:'중복 입장 · 이중 차감 방지',pass:dup.cards[0].balance===11000&&dup.logs[0].code==='E_DUP_ENTRY'},
    {name:'잔액 부족 · 승인 거절 및 잔액 유지',pass:low.cards[1].balance===800&&!low.cards[1].inside&&low.logs[0].code==='E_BALANCE'},
    {name:'통신 장애 · 차감과 입장 처리 차단',pass:failed.cards[0].balance===12500&&!failed.cards[0].inside&&failed.logs[0].code==='E_NET_001'},
    {name:'장애 복구 · 같은 카드 정상 재승인',pass:recovered.cards[0].balance===11000&&recovered.logs[0].code==='ENTRY_OK'},
    {name:'입장 기록 없는 퇴장 · 승인 거절',pass:transition(base,{...tap,direction:'exit'}).logs[0].code==='E_NO_ENTRY'},
  ];
}
