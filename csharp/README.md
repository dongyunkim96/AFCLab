# AFC Lab C# Console

This console simulator models the same fare and device rules as the web demo. Start with the standard card at `AG-01`, then practice tracing a failed tap and recovering the gate.

## Run the web demo

Open [AFC Lab](https://afc-lab-dongyun.dongyunkim96.chatgpt.site/) and select **C# Demo** in the navigation. The scenario buttons run the C# fare engine using WebAssembly and display the decision, balance before and after, and event codes. **Recover and retry** shows the failed tap, recovery, and subsequent approval in order.

The browser project compiles the same `FareEngine.cs` used by the console. `BrowserDemo.RunScenario` exposes the scenario to JavaScript and returns the result as JSON. Each click starts an independent simulation.

To build the browser runtime locally, run these commands from the repository root after installing the .NET 10 SDK and the web project's npm dependencies.

```powershell
dotnet workload install wasm-tools
dotnet publish csharp/Afc.Browser -c Release
node scripts/stage-csharp-runtime.mjs
npm run dev
```

The staging command copies the generated WebAssembly and its loader to the web app's public assets. Stage the runtime before building the web app for deployment.

## Run it

Install the [.NET 10 SDK](https://dotnet.microsoft.com/en-us/download/dotnet/10.0). Run these commands from the repository root.

```powershell
dotnet run --project csharp/Afc.Console
dotnet run --project csharp/Afc.Console -- --demo
```

The first command opens an interactive menu. The second runs seven scenarios and checks the event code, remaining balance, and entry state for each one. Cards, gates, and event history live in memory for the current run.

## Walk through a fault

1. Select `1` to tap in. The standard card goes from ₩12,500 to ₩11,000 and logs `ENTRY_OK`.
2. Select `1` again. `E_DUP_ENTRY` reports the duplicate entry and the balance stays at ₩11,000.
3. Select `2` to tap out. `EXIT_OK` clears the entry state and the balance stays at ₩11,000.
4. Select `5` and then `1` to inject a network fault. Tap in with `1` and use `7` to inspect `E_NET_001`. The card stays outside with ₩11,000.
5. Select `6` to recover the gate. Tap in again with `1` to confirm that the device approves the request and the balance drops to ₩9,500.

To show a different rejection, select the low-balance card with `3` and then `2`. A tap on a healthy gate returns `E_BALANCE`. Select `8` to add ₩5,000 of virtual credit.

## Read the code in this order

| File | What to look for |
| --- | --- |
| [Program.cs](Afc.Console/Program.cs) | `while` repeats the menu. `switch` chooses an action. `int.TryParse` handles invalid numeric input. |
| [FareEngine.cs](Afc.Console/FareEngine.cs) | `Tap()` validates the gate and card before replacing the card's state. The `Dictionary` finds cards and gates by ID, `enum` defines valid directions and faults, and `List` stores events. |
| [lib/afc.ts](../lib/afc.ts) | The TypeScript version of the same fare rules, called by the web dashboard. |

## Interview practice

> I built a C# console simulator for transit fare collection. The console handles input, and the fare engine validates the gate, the card's entry state, and the balance. A successful tap updates the card and records an event. A rejected tap records the reason and preserves the card state. I can demonstrate a network fault, inspect the log, recover the gate, and retry the tap.

- **Why use `enum`?** Gate faults and tap directions have a fixed set of values. The engine works with named values such as `GateFault.Network` and `TapDirection.Entry`.
- **What prevents double charging?** After a successful entry the card has `IsInside = true`. A second entry returns `E_DUP_ENTRY` before changing the balance. A shared backend would also need a transaction and request deduplication to handle concurrent taps and retries.
- **How did you check the rules?** Run `--demo` to check both the event and the card state for approved and rejected taps. The interactive menu lets you reproduce each case and examine the log.
