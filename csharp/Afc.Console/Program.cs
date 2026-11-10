using AfcLab;

if (args is ["--demo"])
    return RunDemo();

if (args.Length > 0)
{
    Console.Error.WriteLine("Usage: dotnet run --project csharp/Afc.Console [-- --demo]");
    return 1;
}

var engine = new FareEngine();
string cardId = "CARD-1001";
string gateId = "AG-01";

Console.WriteLine("AFC Lab | C# fare collection simulator");
Console.WriteLine("Practice session with virtual cards and gates.");

while (true)
{
    var card = engine.GetCard(cardId);
    var gate = engine.GetGate(gateId);
    string location = card.IsInside ? "inside" : "outside";
    Console.WriteLine($"\n{card.Id} | KRW {card.Balance:N0} | {location} | {gate.Id} ({gate.Fault})");
    Console.WriteLine($"Taps: {engine.Attempts} | Approvals: {engine.Approvals} | Fares: KRW {engine.Revenue:N0}");
    Console.WriteLine("1. Tap in      2. Tap out        3. Select card   4. Select gate");
    Console.WriteLine("5. Set fault   6. Recover gate   7. Event log     8. Top up     0. Exit");
    Console.Write("> ");

    switch (Console.ReadLine()?.Trim())
    {
        case "1":
            Print(engine.Tap(cardId, gateId, TapDirection.Entry));
            break;
        case "2":
            Print(engine.Tap(cardId, gateId, TapDirection.Exit));
            break;
        case "3":
            var choices = engine.Cards.ToArray();
            for (int i = 0; i < choices.Length; i++)
                Console.WriteLine($"{i + 1}. {choices[i].Name} | KRW {choices[i].Balance:N0}");
            if (ReadNumber("Card number", choices.Length) is int cardNumber)
                cardId = choices[cardNumber - 1].Id;
            break;
        case "4":
            if (ReadNumber("Gate number", FareEngine.GateCount) is int gateNumber)
                gateId = $"AG-{gateNumber:D2}";
            break;
        case "5":
            Console.WriteLine("1. Network   2. Reader   3. Sensor");
            if (ReadNumber("Fault number", 3) is int faultNumber)
                Print(engine.SetFault(gateId, (GateFault)faultNumber));
            break;
        case "6":
            Print(engine.SetFault(gateId, GateFault.None));
            break;
        case "7":
            var recent = engine.RecentEvents.Take(10).ToArray();
            if (recent.Length == 0)
                Console.WriteLine("No events yet.");
            foreach (var entry in recent)
                Print(entry);
            break;
        case "8":
            Print(engine.TopUp(cardId));
            break;
        case "0":
        case null:
            return 0;
        default:
            Console.WriteLine("Choose a menu number from 0 to 8.");
            break;
    }
}

static int? ReadNumber(string label, int maximum)
{
    Console.Write($"{label} (1-{maximum}): ");
    if (int.TryParse(Console.ReadLine(), out int value) && value >= 1 && value <= maximum)
        return value;

    Console.WriteLine("Invalid selection.");
    return null;
}

static void Print(LogEntry entry)
{
    string amount = entry.Amount == 0 ? "" : $" | KRW {entry.Amount:N0}";
    Console.WriteLine($"{entry.Time:HH:mm:ss} [{entry.Level.ToString().ToUpperInvariant()}] " +
        $"{entry.Code} | {entry.DeviceId} | {entry.CardId}{amount} | {entry.Message}");
}

static int RunDemo()
{
    var engine = new FareEngine();
    const string cardId = "CARD-1001";
    const string lowBalanceId = "CARD-1002";
    const string gateId = "AG-01";
    int passed = 0;

    void Check(string scenario, LogEntry entry, string expectedCode, int expectedBalance, bool expectedInside)
    {
        var card = engine.GetCard(entry.CardId);
        bool ok = entry.Code == expectedCode && card.Balance == expectedBalance && card.IsInside == expectedInside;
        if (ok)
            passed++;
        Console.WriteLine($"{(ok ? "PASS" : "FAIL")} | {scenario} | {entry.Code} | KRW {card.Balance:N0}");
    }

    Check("Entry charges the fare", engine.Tap(cardId, gateId, TapDirection.Entry), "ENTRY_OK", 11000, true);
    Check("Duplicate entry preserves balance", engine.Tap(cardId, gateId, TapDirection.Entry), "E_DUP_ENTRY", 11000, true);
    Check("Exit has no extra fare", engine.Tap(cardId, gateId, TapDirection.Exit), "EXIT_OK", 11000, false);
    Check("Exit requires an entry", engine.Tap(cardId, gateId, TapDirection.Exit), "E_NO_ENTRY", 11000, false);
    Check("Low balance blocks entry", engine.Tap(lowBalanceId, gateId, TapDirection.Entry), "E_BALANCE", 800, false);

    engine.SetFault(gateId, GateFault.Network);
    Check("Network fault preserves card state", engine.Tap(cardId, gateId, TapDirection.Entry), "E_NET_001", 11000, false);
    engine.SetFault(gateId, GateFault.None);
    Check("Retry works after recovery", engine.Tap(cardId, gateId, TapDirection.Entry), "ENTRY_OK", 9500, true);

    Console.WriteLine($"\n{passed}/7 scenarios passed. Collected fares: KRW {engine.Revenue:N0}.");
    return passed == 7 ? 0 : 1;
}
