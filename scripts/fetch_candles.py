"""
Fetch 7-day hourly candle data for all tracked market symbols using yfinance.
Outputs a JSON file that the dashboard frontend reads for candlestick charts.

Usage:
    pip install yfinance
    python scripts/fetch_candles.py
"""
import json
import sys
from pathlib import Path
from datetime import datetime

try:
    import yfinance as yf
except ImportError:
    print("ERROR: yfinance not installed. Run: pip install yfinance")
    sys.exit(1)

SYMBOLS = [
    "AAPL", "AMZN", "AVGO", "BAC", "BRK-B", "COST", "GOOGL", "HD",
    "JNJ", "JPM", "LLY", "MA", "SPY", "QQQ", "^VIX"
]

# Map yfinance symbols back to Finnhub-style symbols used in the dashboard
SYMBOL_MAP = {"BRK-B": "BRK.B", "^VIX": "VIX"}

OUTPUT_PATH = Path(__file__).resolve().parent.parent / "public" / "market-candles.json"


def fetch_all():
    result = {}
    for sym in SYMBOLS:
        dashboard_sym = SYMBOL_MAP.get(sym, sym)
        print(f"  Fetching {sym} -> {dashboard_sym} ...", end=" ", flush=True)
        try:
            ticker = yf.Ticker(sym)
            df = ticker.history(period="7d", interval="1h")
            if df.empty:
                print("EMPTY (market may be closed)")
                continue

            candles = []
            for ts, row in df.iterrows():
                candles.append({
                    "time": int(ts.timestamp() * 1000),  # ms epoch
                    "open": round(row["Open"], 4),
                    "high": round(row["High"], 4),
                    "low": round(row["Low"], 4),
                    "close": round(row["Close"], 4),
                    "volume": int(row["Volume"]),
                })
            result[dashboard_sym] = candles
            print(f"{len(candles)} candles OK")
        except Exception as e:
            print(f"FAILED: {e}")

    return result


def main():
    print(f"\n{'='*60}")
    print(f"  yfinance Market Candle Fetcher")
    print(f"  Symbols: {len(SYMBOLS)}")
    print(f"  Output:  {OUTPUT_PATH}")
    print(f"{'='*60}\n")

    data = fetch_all()

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_PATH, "w") as f:
        json.dump({
        "generated": datetime.now(tz=__import__('datetime').timezone.utc).isoformat(),
        "symbols": data,
    }, f)

    total = sum(len(v) for v in data.values())
    print(f"\n[OK] Saved {len(data)} symbols, {total} total candles to {OUTPUT_PATH.name}")


if __name__ == "__main__":
    main()
