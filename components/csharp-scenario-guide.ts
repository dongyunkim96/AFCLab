type Explanation = {
  source: 'FareEngine.cs' | 'BrowserDemo.cs';
  code: string;
  ko: [string, string, string];
  en: [string, string, string];
};

function faultGuide(
  code: string,
  fault: string,
  message: string,
  ko: Explanation['ko'],
  en: Explanation['en'],
): Explanation {
  return {
    source: 'FareEngine.cs',
    code: `GateFault.${fault} => ("${code}", "${message}"),
// …
return Log(LogLevel.Error, code, gateId, cardId, message);`,
    ko,
    en,
  };
}

export const scenarioGuides = {
  entry: {
    source: 'FareEngine.cs',
    code: `int charge = isEntry ? EntryFare : 0;
cards[cardId] = card with { Balance = card.Balance - charge, IsInside = isEntry };`,
    ko: [
      '입장 기록이 없는 카드로 태그합니다. 잔액은 ₩12,500이고 입장 요금은 ₩1,500입니다.',
      '단말기와 카드 상태 검사에 모두 통과하면 요금을 빼고 IsInside를 true로 저장합니다.',
      'ENTRY_OK를 기록합니다. 잔액은 ₩11,000, 카드 상태는 입장 중으로 바뀝니다.',
    ],
    en: [
      'Tap a card with no entry record and a ₩12,500 balance. The entry fare is ₩1,500.',
      'Once the gate and card checks pass, the engine deducts the fare and saves IsInside as true.',
      'The engine logs ENTRY_OK. The balance falls to ₩11,000 and the card is marked inside.',
    ],
  },
  balance: {
    source: 'FareEngine.cs',
    code: `if (isEntry && card.Balance < EntryFare)
    return Log(LogLevel.Warn, "E_BALANCE", gateId, cardId, "Insufficient balance. Top up and try again.");`,
    ko: [
      '잔액이 ₩800인 카드로 ₩1,500 입장 요금을 결제하려고 합니다.',
      '잔액이 입장 요금보다 적으므로 E_BALANCE를 기록하고 즉시 처리를 끝냅니다.',
      '차감 단계에 도달하지 않습니다. 잔액은 ₩800이고 입장 상태도 그대로입니다.',
    ],
    en: [
      'A card with ₩800 attempts to pay the ₩1,500 entry fare.',
      'The balance is below the entry fare, so the engine logs E_BALANCE and returns immediately.',
      'The deduction never runs. The card keeps its ₩800 balance and remains outside.',
    ],
  },
  duplicate: {
    source: 'FareEngine.cs',
    code: `if (isEntry && card.IsInside)
    return Log(LogLevel.Warn, "E_DUP_ENTRY", gateId, cardId, "This card already tapped in. Tap out first.");`,
    ko: [
      'C# 시연이 먼저 정상 입장을 한 번 처리합니다. 첫 태그에서 ₩1,500이 차감되고 카드가 입장 중으로 바뀝니다.',
      '같은 카드로 다시 입장하면 isEntry와 card.IsInside가 모두 true여서 E_DUP_ENTRY를 반환합니다.',
      '두 번째 태그는 거절됩니다. 화면의 처리 전·후 잔액은 둘 다 ₩11,000이고, 첫 승인은 로그에 남습니다.',
    ],
    en: [
      'The demo runs one successful entry first. That tap deducts ₩1,500 and marks the card inside.',
      'On the second entry tap, isEntry and card.IsInside are both true, so the engine returns E_DUP_ENTRY.',
      'The second tap is declined. Both displayed balances are ₩11,000, and the first approval remains in the log.',
    ],
  },
  'exit-without-entry': {
    source: 'FareEngine.cs',
    code: `if (!isEntry && !card.IsInside)
    return Log(LogLevel.Warn, "E_NO_ENTRY", gateId, cardId, "No entry record. Tap in first.");`,
    ko: [
      '입장 기록이 없는 카드로 퇴장을 시도합니다.',
      '퇴장 요청이고 card.IsInside가 false이므로 E_NO_ENTRY를 기록하고 처리를 끝냅니다.',
      '퇴장이 거절되고 ₩12,500 잔액과 미입장 상태는 그대로입니다.',
    ],
    en: [
      'A card with no entry record attempts to exit.',
      'The request is for exit and card.IsInside is false, so the engine logs E_NO_ENTRY and returns.',
      'Exit is declined. The balance stays at ₩12,500 and the card remains outside.',
    ],
  },
  network: faultGuide('E_NET_001', 'Network', 'Approval server unavailable. Check the network, then recover the gate.', [
    '시연에서 단말기에 서버 통신 장애(Network)를 설정한 뒤 입장을 시도합니다.',
    '엔진은 잔액 검사보다 먼저 단말기 상태를 확인합니다. Network는 E_NET_001로 변환됩니다.',
    '입장이 거절됩니다. 오류를 기록하고 처리를 끝내므로 잔액은 ₩12,500 그대로입니다.',
  ], [
    'The demo sets a simulated approval server connection fault, then attempts entry.',
    'The engine checks the gate before the card balance. Network maps to E_NET_001.',
    'Entry is declined. The engine logs the error and returns, leaving the balance at ₩12,500.',
  ]),
  reader: faultGuide('E_RDR_002', 'Reader', 'Card read failed. Check the reader connection and power.', [
    '시연에서 카드 리더가 읽기에 실패한 상황(Reader)을 설정합니다.',
    '엔진은 리더 장애를 E_RDR_002로 변환하고, 카드 상태나 잔액을 바꾸기 전에 처리를 끝냅니다.',
    '입장이 거절되고 ₩12,500 잔액과 미입장 상태는 그대로입니다.',
  ], [
    'The demo sets a simulated card reader failure.',
    'The engine maps the reader fault to E_RDR_002 and returns before changing the card state or balance.',
    'Entry is declined. The balance stays at ₩12,500 and the card remains outside.',
  ]),
  sensor: faultGuide('E_GATE_003', 'Sensor', 'Gate sensor failed. Inspect the passage and sensor.', [
    '시연에서 개집표기 센서가 고장 난 상황(Sensor)을 설정합니다.',
    '엔진은 센서 장애를 E_GATE_003으로 변환하고, 입장 처리에 들어가기 전에 오류를 반환합니다.',
    '입장이 거절되고 ₩12,500 잔액과 미입장 상태는 그대로입니다.',
  ], [
    'The demo sets a simulated gate sensor fault.',
    'The engine maps the sensor fault to E_GATE_003 and returns before processing entry.',
    'Entry is declined. The balance stays at ₩12,500 and the card remains outside.',
  ]),
} satisfies Record<string, Explanation>;

export const recoveryGuide: Explanation = {
  source: 'BrowserDemo.cs',
  code: `if (recoverAndRetry && fault != GateFault.None)
{
    engine.SetFault(gateId, GateFault.None);
    result = engine.Tap(cardId, gateId, direction);
}`,
  ko: [
    '같은 시연 안에서 첫 태그를 장애 상태로 실행해 거절 로그를 남깁니다.',
    'SetFault로 장애를 해제해 DEVICE_RECOVERED를 기록하고, 같은 카드로 다시 태그합니다.',
    '두 번째 태그만 승인됩니다. ENTRY_OK가 기록되고 잔액은 ₩12,500에서 ₩11,000으로 바뀝니다.',
  ],
  en: [
    'The first tap runs with the fault active and records the decline.',
    'SetFault clears the fault and records DEVICE_RECOVERED. The engine then taps the same card again.',
    'Only the second tap is approved. ENTRY_OK is logged and the balance drops from ₩12,500 to ₩11,000.',
  ],
};
