using System.Runtime.InteropServices.JavaScript;
using System.Runtime.Versioning;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace AfcLab;

[SupportedOSPlatform("browser")]
public static partial class BrowserDemo
{
    public static void Main() { }

    [JSExport]
    public static string RunScenario(string scenario, bool recoverAndRetry)
    {
        const string gateId = "AG-01";
        const string standardCard = "CARD-1001";
        var engine = new FareEngine();
        var (cardId, direction, fault) = scenario switch
        {
            "entry" or "duplicate" => (standardCard, TapDirection.Entry, GateFault.None),
            "exit-without-entry" => (standardCard, TapDirection.Exit, GateFault.None),
            "balance" => ("CARD-1002", TapDirection.Entry, GateFault.None),
            "network" => (standardCard, TapDirection.Entry, GateFault.Network),
            "reader" => (standardCard, TapDirection.Entry, GateFault.Reader),
            "sensor" => (standardCard, TapDirection.Entry, GateFault.Sensor),
            _ => throw new ArgumentException("Unknown demo scenario.", nameof(scenario))
        };

        if (scenario == "duplicate")
            engine.Tap(cardId, gateId, TapDirection.Entry);

        if (fault != GateFault.None)
            engine.SetFault(gateId, fault);

        int balanceBefore = engine.GetCard(cardId).Balance;
        var result = engine.Tap(cardId, gateId, direction);
        if (recoverAndRetry && fault != GateFault.None)
        {
            engine.SetFault(gateId, GateFault.None);
            result = engine.Tap(cardId, gateId, direction);
        }

        var card = engine.GetCard(cardId);
        var events = engine.RecentEvents.Reverse()
            .Select(entry => new DemoEvent(entry.Code, entry.Level.ToString().ToUpperInvariant()))
            .ToArray();

        var snapshot = new DemoResult(result.Code, result.Level == LogLevel.Info, cardId,
            gateId, balanceBefore, card.Balance, card.IsInside, events);
        return JsonSerializer.Serialize(snapshot, DemoJsonContext.Default.DemoResult);
    }
}

internal record DemoEvent(string Code, string Level);

internal record DemoResult(string Code, bool Approved, string CardId, string GateId,
    int BalanceBefore, int BalanceAfter, bool IsInside, DemoEvent[] Events);

[JsonSerializable(typeof(DemoResult))]
[JsonSourceGenerationOptions(PropertyNamingPolicy = JsonKnownNamingPolicy.CamelCase)]
internal partial class DemoJsonContext : JsonSerializerContext { }
