# AFC Lab

**대중교통 자동요금징수(AFC, Automatic Fare Collection) 운영 시뮬레이터**

교통카드 태그부터 요금 승인, 단말기 장애 재현, 로그 분석과 복구까지 AFC 소프트웨어 엔지니어의 업무 흐름을 브라우저에서 체험하는 교육용 포트폴리오 프로젝트입니다.

**[라이브 데모](https://afc-lab-dongyun.dongyunkim96.chatgpt.site/) · [GitHub 저장소](https://github.com/dongyunkim96/AFCLab)**

## 배포 정보

| 항목 | 내용 |
| --- | --- |
| 서비스 주소 | https://afc-lab-dongyun.dongyunkim96.chatgpt.site/ |
| 호스팅 | ChatGPT Sites |
| 접근 방식 | 공개 사이트 · 로그인 없이 이용 가능 |
| 지원 언어 | 한국어 / English · 상단 버튼으로 전환 |
| 데이터 저장 | 방문자의 브라우저 `localStorage` |

사이트 이용에는 프로젝트 설치가 필요하지 않습니다. 실습 데이터는 방문자별 브라우저에 저장되며 다른 방문자와 공유되거나 계정 간에 동기화되지 않습니다. 브라우저 저장 데이터를 삭제하면 실습 내역과 언어 설정도 초기화됩니다.

GitHub는 소스 코드 보관과 버전 관리에 사용합니다. **GitHub에 push하는 것만으로 Sites의 배포 사이트가 자동 업데이트되지는 않습니다.** Sites 배포는 별도로 진행합니다.

## 주요 기능

| 기능 | 설명 |
| --- | --- |
| 운영 대시보드 | 온라인 단말기, 카드 태그 요청 수, 승인 성공률, 누적 징수 금액 표시 |
| 단말기 라이브 뷰 | 총 **24대**, **A~F 6개 구역**에 4대씩 배치하고 개별 선택 |
| 카드 시뮬레이터 | 일반·잔액 부족·테스트 카드 3종, 입장·퇴장 태그, 가상 **5,000원 충전** |
| 예외 처리 | 잔액 부족, 중복 입장, 입장 기록 없는 퇴장 거절 |
| 장애 주입·복구 | 단말기별 서버 통신·카드 리더·게이트 센서 장애와 가상 자가진단 |
| 로그 분석 | `INFO` / `WARN` / `ERROR` 필터, 오류 코드·단말기·카드 검색, 점검 절차 |
| CSV 내보내기 | 필터링한 로그를 CSV 파일로 다운로드 |
| 테스트 센터 | 실습 데이터에 영향을 주지 않는 **7개 검증 시나리오** |
| 언어 전환 | 메뉴·도움말·기존 로그·오류 설명·테스트 결과·CSV의 한국어·영어 표시 |
| 브라우저 저장 | 실습 데이터와 언어 선택 유지, 초기화 지원, 모바일 반응형 화면 |

## 직접 체험하기

1. [배포 사이트](https://afc-lab-dongyun.dongyunkim96.chatgpt.site/)를 열고 상단에서 언어를 선택합니다.
2. 일반 카드로 **입장 태그 → 퇴장 태그**를 실행하고 잔액과 징수 금액을 확인합니다.
3. **통신 장애 시나리오**를 실행하거나 단말기 관리에서 장애를 주입합니다.
4. 해당 단말기에 카드를 태그하고, 승인 실패 시 잔액이 보존되는지 확인합니다.
5. 오류 로그에서 점검 절차를 확인한 후 **장애 해제 → 재태그**합니다.
6. 테스트 센터에서 전체 테스트를 실행해 정상·예외 처리 결과를 확인합니다.

## 시뮬레이션 규칙

| 상황 | 처리 |
| --- | --- |
| 정상 입장 | 1,500원 차감, 입장 상태 전환, 징수 금액 증가 |
| 정상 퇴장 | 추가 차감 없이 입장 상태 해제 |
| 잔액 부족 | 입장 거절, 잔액 유지 |
| 중복 입장 | 승인 거절, 이중 차감 방지 |
| 입장 기록 없는 퇴장 | 승인 거절 |
| 단말기 장애 | 승인과 차감 차단, 오류 로그 기록 |
| 가상 충전 | 잔액 5,000원 증가, 징수 금액에는 미포함 |

로그 시간은 **한국 표준시(KST)**로 표시합니다. 최근 **500건**의 로그를 보관하며 전체 요청·승인·징수 통계는 실습 초기화 전까지 누적됩니다.

## 기술 스택과 구조

| 영역 | 사용 기술 |
| --- | --- |
| 화면 | React 19, TypeScript, App Router 형식의 컴포넌트 |
| 개발·빌드 | Vinext, Vite 8 |
| 스타일·아이콘 | CSS, Tailwind CSS 4, Lucide React |
| 실행 환경 | Cloudflare Workers 호환 런타임, Wrangler |
| 상태·저장 | React Hooks, 브라우저 `localStorage` |
| 다국어 | 한국어·영어 번역 사전과 표시 단계의 번역 함수 |
| 검증 | Node.js 내장 테스트 러너, TypeScript 타입 검사 |

요금징수 로직은 UI와 분리한 **불변 상태 전이 함수**로 구현했습니다. 단말기 상태, 카드 입장 상태, 잔액을 검증한 뒤 승인된 요청만 잔액·입장 상태·징수 통계를 변경합니다. 실패한 요청은 카드 상태를 보존하고 원인별 로그를 남깁니다.

언어 변경은 표시 단계에서 처리하므로 기존 이벤트 데이터와 잔액, 승인 결과에 영향을 주지 않습니다. 기존 4대 단말기 버전의 저장 데이터도 24대 구성으로 확장하면서 유지합니다.

## 로컬 실행

**Node.js 24 LTS**, npm, Git을 준비합니다. 아래 테스트 명령은 Node.js의 TypeScript 직접 실행 기능을 사용합니다.

```bash
git clone https://github.com/dongyunkim96/AFCLab.git
cd AFCLab
npm ci
npm run dev
```

개발 서버의 기본 주소는 **http://localhost:5173**입니다. 실제 접속 주소는 터미널에 출력되는 URL을 확인하세요. 기본 시뮬레이션 실행에는 별도 API 키나 데이터베이스 설정이 필요하지 않습니다.

### 빌드 및 빌드 결과 확인

```bash
npm run build
npm start
```

`npm start`는 빌드된 Worker를 Wrangler로 로컬 실행합니다. 사이트를 인터넷에 배포하는 명령은 아닙니다.

### 자동 테스트와 타입 검사

```bash
node --test scripts/afc.test.mjs scripts/i18n.test.mjs
npx tsc --noEmit
```

자동 테스트는 정상 입출장, 중복 차감 방지, 잔액 부족, 세 종류의 단말기 장애, 복구, 로그 보관, 24대 단말기 구성, 저장 데이터 확장, 번역 누락과 언어 변경 시 데이터 보존을 검증합니다. 웹 테스트 센터의 7개 시나리오와 별도로 실행됩니다.

## 주요 파일

| 파일 | 역할 |
| --- | --- |
| [app/page.tsx](app/page.tsx) | 대시보드, 시뮬레이터, 단말기 관리, 로그, 테스트 센터 |
| [app/globals.css](app/globals.css) | 화면 스타일, 반응형 레이아웃, 언어 버튼 |
| [app/layout.tsx](app/layout.tsx) | 공통 페이지 레이아웃과 메타데이터 |
| [lib/afc.ts](lib/afc.ts) | 상태 전이, 요금 승인, 장애 처리, 검증 시나리오 |
| [lib/i18n.ts](lib/i18n.ts) | 한국어·영어 번역 사전과 동적 문구 번역 |
| [scripts/afc.test.mjs](scripts/afc.test.mjs) | 시뮬레이션 로직과 저장 데이터 확장 테스트 |
| [scripts/i18n.test.mjs](scripts/i18n.test.mjs) | 번역 범위와 데이터 보존 테스트 |
| [.openai/hosting.json](.openai/hosting.json) | Sites 프로젝트와 호스팅 연결 설정 |
| [vite.config.ts](vite.config.ts) | Vinext·Vite·Worker 개발 및 빌드 설정 |

## 범위와 확장 방향

이 프로젝트는 **교육용 시뮬레이터**입니다. 정액 요금, 입장 시 차감, 장애 시 승인 차단은 실습용 가상 규칙이며 실제 교통기관의 거리·환승·할인·정산 정책을 구현하지 않습니다.

실제 결제, 물리적 카드 리더 연결, 원격 승인 서버와 다중 사용자 동기화는 포함하지 않습니다. 단말기 자가진단도 가상 상태 복구입니다. 저장소의 데이터베이스 등 스타터용 파일은 현재 실습 데이터 저장에는 사용하지 않습니다.

확장할 수 있는 기능:

- 승인 API와 데이터베이스를 통한 서버 기반 거래 처리
- 중복 요청을 식별하는 거래 ID와 멱등성 처리
- 카드 리더 통신 프로토콜 에뮬레이터
- 승차권 발매·충전 전용 단말기 화면
- 여러 단말기의 실시간 이벤트 스트림과 운영 지표

기반 스타터의 환경·빌드·호스팅 세부 사항은 [Sites Starter Reference](docs/sites-starter.md)를 참고하세요.

## English overview

**AFC Lab is an educational Automatic Fare Collection operations simulator.** Explore card entry and exit, fare deductions, device faults, event logs, troubleshooting, and recovery in your browser.

- **[Live demo](https://afc-lab-dongyun.dongyunkim96.chatgpt.site/)** — publicly accessible without signing in, hosted on ChatGPT Sites.
- 24 fare gate devices across 6 zones, with individual network, reader, and sensor fault injection.
- Three virtual cards, virtual top-ups, log search, troubleshooting details, and CSV export.
- Seven in-app validation scenarios and separate automated tests.
- Use the **한국어 / English** buttons in the header to switch languages.
- Practice data and language preferences are saved in the current browser, without shared server storage.
- Use Node.js 24 LTS, run `npm ci`, then `npm run dev` to start locally.

The ₩1,500 entry fare and all device behaviors are simulated practice rules. The project does not process real payments or connect to physical transit hardware. Pushing code to GitHub does not automatically update the Sites deployment.
