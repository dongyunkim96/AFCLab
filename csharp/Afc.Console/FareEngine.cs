namespace AfcLab;

internal enum TapDirection
{
    Entry,
    Exit
}

internal enum GateFault
{
    None,
    Network,
    Reader,
    Sensor
}

internal enum LogLevel
{
    Info,
    Warn,
    Error
}

internal record TransitCard(string Id, string Name, int Balance, bool IsInside = false);

internal record Gate(string Id, GateFault Fault = GateFault.None);

internal record LogEntry(DateTimeOffset Time, LogLevel Level, string Code,
    string DeviceId, string CardId, string Message, int Amount = 0);

internal sealed class FareEngine
{
    public const int EntryFare = 1500;
    public const int TopUpAmount = 5000;
    public const int GateCount = 24;

    private readonly Dictionary<string, TransitCard> cards = new()
    {
        ["CARD-1001"] = new("CARD-1001", "Standard card", 12500),
        ["CARD-1002"] = new("CARD-1002", "Low-balance card", 800),
        ["CARD-1003"] = new("CARD-1003", "Test card", 5000)
    };

    private readonly Dictionary<string, Gate> gates = Enumerable.Range(1, GateCount)
        .Select(number => new Gate($"AG-{number:D2}"))
        .ToDictionary(gate => gate.Id);

    private readonly List<LogEntry> logs = new();

    public IEnumerable<TransitCard> Cards => cards.Values;
    public IEnumerable<LogEntry> RecentEvents => logs.AsEnumerable().Reverse();
    public int Attempts { get; private set; }
    public int Approvals { get; private set; }
    public int Revenue { get; private set; }

    public TransitCard GetCard(string cardId) => cards[cardId];
    public Gate GetGate(string gateId) => gates[gateId];

    public LogEntry Tap(string cardId, string gateId, TapDirection direction)
    {
        var card = GetCard(cardId);
        var gate = GetGate(gateId);
        Attempts++;

        // Return before changing the card whenever a validation fails.
        if (gate.Fault != GateFault.None)
        {
            var (code, message) = gate.Fault switch
            {
                GateFault.Network => ("E_NET_001", "Approval server unavailable. Check the network, then recover the gate."),
                GateFault.Reader => ("E_RDR_002", "Card read failed. Check the reader connection and power."),
                GateFault.Sensor => ("E_GATE_003", "Gate sensor failed. Inspect the passage and sensor."),
                _ => throw new InvalidOperationException("Unknown gate fault.")
            };
            return Log(LogLevel.Error, code, gateId, cardId, message);
        }

        bool isEntry = direction == TapDirection.Entry;
        if (isEntry && card.IsInside)
            return Log(LogLevel.Warn, "E_DUP_ENTRY", gateId, cardId, "This card already tapped in. Tap out first.");

        if (!isEntry && !card.IsInside)
            return Log(LogLevel.Warn, "E_NO_ENTRY", gateId, cardId, "No entry record. Tap in first.");

        if (isEntry && card.Balance < EntryFare)
            return Log(LogLevel.Warn, "E_BALANCE", gateId, cardId, "Insufficient balance. Top up and try again.");

        int charge = isEntry ? EntryFare : 0;
        cards[cardId] = card with { Balance = card.Balance - charge, IsInside = isEntry };
        Approvals++;
        Revenue += charge;

        return isEntry
            ? Log(LogLevel.Info, "ENTRY_OK", gateId, cardId, "Entry approved. Gate opened.", charge)
            : Log(LogLevel.Info, "EXIT_OK", gateId, cardId, "Exit approved. No extra fare.");
    }

    public LogEntry SetFault(string gateId, GateFault fault)
    {
        gates[gateId] = GetGate(gateId) with { Fault = fault };
        return fault == GateFault.None
            ? Log(LogLevel.Info, "DEVICE_RECOVERED", gateId, "-", "Gate recovered. Simulated self-check passed.")
            : Log(LogLevel.Error, "DEVICE_FAULT", gateId, "-", $"Injected {fault} fault.");
    }

    public LogEntry TopUp(string cardId)
    {
        var card = GetCard(cardId);
        cards[cardId] = card with { Balance = card.Balance + TopUpAmount };
        return Log(LogLevel.Info, "CHARGE_OK", "SYSTEM", cardId, "Virtual top-up complete.", TopUpAmount);
    }

    private LogEntry Log(LogLevel level, string code, string gateId, string cardId, string message, int amount = 0)
    {
        var entry = new LogEntry(DateTimeOffset.Now, level, code, gateId, cardId, message, amount);
        logs.Add(entry);
        if (logs.Count > 500)
            logs.RemoveAt(0);

        return entry;
    }
}
