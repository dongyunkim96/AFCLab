"use client";

import { useState } from 'react';
import { Code2, Play, RotateCcw } from 'lucide-react';
import { diagnostics } from '../lib/afc';
import { translate, type Language } from '../lib/i18n';
import './csharp-demo.css';

const scenarios = [
  { id: 'entry', ko: '정상 입장', en: 'Normal entry', code: 'ENTRY_OK' },
  { id: 'balance', ko: '잔액 부족', en: 'Insufficient balance', code: 'E_BALANCE' },
  { id: 'duplicate', ko: '중복 입장', en: 'Duplicate entry', code: 'E_DUP_ENTRY' },
  { id: 'exit-without-entry', ko: '입장 없는 퇴장', en: 'Exit without entry', code: 'E_NO_ENTRY' },
  { id: 'network', ko: '서버 통신 장애', en: 'Network fault', code: 'E_NET_001', recoverable: true },
  { id: 'reader', ko: '카드 리더 장애', en: 'Card reader fault', code: 'E_RDR_002', recoverable: true },
  { id: 'sensor', ko: '게이트 센서 장애', en: 'Gate sensor fault', code: 'E_GATE_003', recoverable: true },
] as const;

type Scenario = (typeof scenarios)[number];
type DemoResult = {
  code: string;
  approved: boolean;
  cardId: string;
  gateId: string;
  balanceBefore: number;
  balanceAfter: number;
  isInside: boolean;
  events: { code: string; level: string }[];
};
type RunScenario = (scenario: string, recoverAndRetry: boolean) => string;

let engine: Promise<RunScenario> | undefined;

function loadEngine() {
  if (!engine) {
    engine = (async () => {
      const modulePath = '/csharp-runtime/_framework/dotnet.js';
      const { dotnet } = await import(/* @vite-ignore */ modulePath);
      const runtime = await dotnet.create();
      const exports = await runtime.getAssemblyExports(runtime.getConfig().mainAssemblyName);
      return exports.AfcLab.BrowserDemo.RunScenario as RunScenario;
    })().catch(error => {
      engine = undefined;
      throw error;
    });
  }
  return engine;
}

export default function CsharpDemo({ language }: { language: Language }) {
  const [selected, setSelected] = useState<Scenario | null>(null);
  const [result, setResult] = useState<DemoResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const label = (ko: string, en: string) => language === 'ko' ? ko : en;
  const localize = (text: string) => translate(language, text);
  const money = (amount: number) => `₩${amount.toLocaleString('ko-KR')}`;

  async function run(scenario: Scenario, recover = false) {
    setSelected(scenario);
    setResult(null);
    setLoadFailed(false);
    setLoading(true);
    try {
      const runScenario = await loadEngine();
      setResult(JSON.parse(runScenario(scenario.id, recover)) as DemoResult);
    } catch {
      setLoadFailed(true);
    } finally {
      setLoading(false);
    }
  }

  const detail = result && diagnostics[result.code];
  const recovered = result?.events.some(event => event.code === 'DEVICE_RECOVERED');
  const canRecover = selected && 'recoverable' in selected && result && !result.approved;

  return (
    <section className="panel csharp-demo">
      <header className="panel-heading">
        <div>
          <h2><Code2 size={18} />{label('C# 요금 처리 시나리오', 'C# fare processing scenarios')}</h2>
          <p>{label('버튼을 누르면 브라우저에서 C# 엔진이 실행됩니다.', 'Select a scenario to run the C# fare engine in your browser.')}</p>
        </div>
        <span className="badge info">C# · WASM</span>
      </header>
      <div className="csharp-demo-layout">
        <div className="csharp-scenarios" aria-label={label('시연 상황', 'Demo scenarios')}>
          {scenarios.map(scenario => (
            <button type="button" key={scenario.id} className="csharp-scenario"
              aria-pressed={selected?.id === scenario.id} disabled={loading} onClick={() => void run(scenario)}>
              <span>{scenario[language]}<small>{scenario.code}</small></span>
              <Play size={14} aria-hidden="true" />
            </button>
          ))}
        </div>
        <div className="csharp-result" aria-busy={loading}>
          {loading && <p role="status">{label('C# 런타임을 불러오는 중입니다…', 'Loading the C# runtime…')}</p>}
          {loadFailed && <p role="alert" className="bad">
            {label('C# 런타임을 실행하지 못했습니다. 상황을 다시 눌러 재시도하세요.', 'The C# runtime could not start. Select a scenario to try again.')}
          </p>}
          {!loading && !loadFailed && !result && <div className="csharp-placeholder">
            <Code2 size={28} aria-hidden="true" />
            <h3>{label('시연할 상황을 선택하세요', 'Choose a scenario')}</h3>
            <p>{label('승인 결과, 처리 전후 잔액과 이벤트 로그가 여기에 표시됩니다.', 'The decision, balance before and after, and event log will appear here.')}</p>
          </div>}
          {result && <>
            <div role="status" className={`csharp-outcome ${result.approved ? 'good' : 'bad'}`}>
              <strong>{result.approved ? label('승인', 'Approved') : label('거절', 'Declined')} · {result.code}</strong>
              <span>{detail ? localize(detail[0]) : recovered
                ? label('장애를 해제한 뒤 재시도에 성공했습니다.', 'The tap succeeded after recovery.')
                : label('입장이 승인됐습니다. 요금이 한 번 차감됐습니다.', 'Entry approved. The fare was deducted once.')}</span>
            </div>
            <dl className="csharp-balances">
              <div><dt>{label('처리 전 잔액', 'Balance before')}</dt><dd>{money(result.balanceBefore)}</dd></div>
              <div><dt>{label('처리 후 잔액', 'Balance after')}</dt><dd>{money(result.balanceAfter)}</dd></div>
              <div><dt>{label('입장 상태', 'Entry state')}</dt><dd>{result.isInside ? label('입장 중', 'Inside') : label('미입장', 'Outside')}</dd></div>
            </dl>
            <h3>{label('이벤트 로그', 'Event log')} <small>{result.gateId} · {result.cardId}</small></h3>
            <ol className="csharp-events">
              {result.events.map((event, index) => <li key={index}>
                <span className={`badge ${event.level.toLowerCase()}`}>{event.level}</span><code>{event.code}</code>
              </li>)}
            </ol>
            {detail && <p className="csharp-next">{localize(detail[1])}</p>}
            {canRecover && <button type="button" className="button primary" onClick={() => void run(selected, true)}>
              <RotateCcw size={15} />{label('장애 복구 후 재시도', 'Recover and retry')}
            </button>}
          </>}
        </div>
      </div>
      <p className="csharp-footnote">{label('각 시연은 별도 가상 카드와 단말기로 시작합니다.', 'Each scenario starts with its own virtual card and gate.')}</p>
    </section>
  );
}
