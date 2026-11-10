# AFC Lab

**An interactive Automatic Fare Collection (AFC) operations simulator for public transit.**

AFC Lab is an educational portfolio project that demonstrates the workflow of an AFC software engineer: card taps, fare approvals, device fault injection, log analysis, and recovery—all in a browser.

**[Live Demo](https://afc-lab-dongyun.dongyunkim96.chatgpt.site/) · [GitHub Repository](https://github.com/dongyunkim96/AFCLab)**

## Deployment

| Item | Details |
| --- | --- |
| Live URL | https://afc-lab-dongyun.dongyunkim96.chatgpt.site/ |
| Hosting | ChatGPT Sites |
| Access | Public; no sign-in required |
| Interface languages | Korean and English, selectable in the header |
| Data persistence | The visitor's browser `localStorage` |

No installation is needed to use the live demo. Each visitor's practice data is stored in their browser. It is not shared with other visitors or synchronized across accounts or devices. Clearing browser storage also clears practice data and language preferences.

GitHub is used for source control. **Pushing to this repository does not automatically update the live Sites deployment.** Updates must be published through Sites separately.

## Features

| Feature | Description |
| --- | --- |
| Operations dashboard | Online device count, card tap requests, approval rate, and collected fares |
| Live device view | **24 fare gates** across **6 zones (A–F)**, with 4 individually selectable devices per zone |
| Card simulator | Standard, low-balance, and test cards; tap-in, tap-out, and virtual **₩5,000 top-ups** |
| Exception handling | Declines insufficient balances, duplicate entries, and exits without an entry record |
| Fault injection and recovery | Per-device network, card reader, and gate sensor faults, with simulated self-checks |
| Log analysis | `INFO` / `WARN` / `ERROR` filters, error-code/device/card search, and troubleshooting guidance |
| CSV export | Download the currently filtered event logs |
| Test center | **7 validation scenarios** that run independently of practice data |
| Language switching | Korean/English menus, guides, existing logs, error details, test results, and CSV exports |
| Browser persistence | Saved practice data and language preferences, session reset, and responsive layouts |

## Try the Demo

1. Open the [live site](https://afc-lab-dongyun.dongyunkim96.chatgpt.site/) and choose a language in the header.
2. Select the standard card, **tap in**, then **tap out**. Observe the balance and collected fares.
3. Select **Try a network failure**, or inject a fault in Device management.
4. Tap a card on the affected device and verify that a failed approval preserves its balance.
5. Open the error log, review the troubleshooting steps, **recover the device**, and try again.
6. Run all tests in the Test center to inspect normal and exceptional scenarios.

## Simulation Rules

| Scenario | Behavior |
| --- | --- |
| Successful entry | Deduct ₩1,500, mark the card as inside the station, and increase collected fares |
| Successful exit | Clear the entry state without an additional charge |
| Insufficient balance | Decline entry and preserve the balance |
| Duplicate entry | Decline approval and prevent a duplicate deduction |
| Exit without an entry record | Decline approval |
| Device fault | Block approval and deduction; record an error event |
| Virtual top-up | Add ₩5,000 to the balance without increasing collected fares |

Log timestamps are displayed in **Korea Standard Time (KST)**. The latest **500 events** are retained. Request, approval, and fare totals continue to accumulate until the practice session is reset.

## Technology and Architecture

| Area | Technology |
| --- | --- |
| Interface | React 19, TypeScript, App Router-style components |
| Development and builds | Vinext, Vite 8 |
| Styling and icons | CSS, Tailwind CSS 4, Lucide React |
| Runtime | Cloudflare Workers-compatible runtime, Wrangler |
| State and persistence | React Hooks, browser `localStorage` |
| Localization | Korean/English translation dictionary and presentation-layer translation |
| Validation | Node.js built-in test runner, TypeScript type checking |

Fare collection logic is implemented as an **immutable state transition function**, separate from the UI. Requests validate the device status, card entry state, and available balance before updating the balance, entry state, and fare totals. Failed requests preserve card state and record a specific event code.

Localization is applied when data is displayed, so switching languages does not alter existing events, balances, or approval results. Saved sessions from the original four-device version are expanded to 24 devices while preserving their data.

## Run Locally

Install **Node.js 24 LTS**, npm, and Git. The test commands below use Node.js's built-in support for running TypeScript files.

```bash
git clone https://github.com/dongyunkim96/AFCLab.git
cd AFCLab
npm ci
npm run dev
```

The development server defaults to **http://localhost:5173**. Check the terminal output for the actual URL. The core simulator does not require API keys or a database configuration.

### Build and Preview

```bash
npm run build
npm start
```

`npm start` runs the built Worker locally through Wrangler. It does not publish the site to the internet.

### Automated Tests and Type Checking

```bash
node --test scripts/afc.test.mjs scripts/i18n.test.mjs
npx tsc --noEmit
```

The automated tests cover normal entry and exit, duplicate charge protection, insufficient balances, all three device fault types, recovery, log retention, the 24-device fleet, saved-session migration, translation coverage, and data preservation during language changes. They run separately from the seven scenarios available in the web Test center.

## Key Files

| File | Purpose |
| --- | --- |
| [app/page.tsx](app/page.tsx) | Dashboard, simulator, device management, logs, and Test center |
| [app/globals.css](app/globals.css) | Styling, responsive layouts, and language selector |
| [app/layout.tsx](app/layout.tsx) | Shared page layout and metadata |
| [lib/afc.ts](lib/afc.ts) | State transitions, fare approvals, fault handling, and validation scenarios |
| [lib/i18n.ts](lib/i18n.ts) | Korean/English dictionary and dynamic message translation |
| [scripts/afc.test.mjs](scripts/afc.test.mjs) | Simulation logic and saved-session migration tests |
| [scripts/i18n.test.mjs](scripts/i18n.test.mjs) | Translation coverage and data preservation tests |
| [.openai/hosting.json](.openai/hosting.json) | Sites project and hosting configuration |
| [vite.config.ts](vite.config.ts) | Vinext, Vite, and Worker development/build configuration |

## Scope and Limitations

This is an **educational simulator**. The flat fare, entry-time deduction, and approval blocking during faults are practice rules. They do not implement a transit operator's distance-based fares, transfers, discounts, or settlement policies.

The current implementation does not process real payments, connect to physical card readers, use a remote approval server, or synchronize multiple users. Device self-checks are simulated state recovery operations. Database and other starter files remain in the repository, but they are not used to store practice data.

## C# Console Simulator

The **C# Demo** tab runs the C# fare engine in the browser using WebAssembly. Select a scenario to see the result, balances, and event codes, or recover a faulty gate and retry. The same engine powers the standalone console and its `--demo` walkthrough. See the [C# guide](csharp/README.md) for web runtime setup and interview practice.

## Possible Extensions

- Server-side transaction processing through an approval API and database
- Transaction IDs and idempotency handling for duplicate requests
- A card reader communication protocol emulator
- Dedicated ticket vending and top-up terminal interfaces
- Live event streams and operational metrics across multiple devices

For infrastructure, build, and hosting details inherited from the starter, see the [Sites Starter Reference](docs/sites-starter.md).
