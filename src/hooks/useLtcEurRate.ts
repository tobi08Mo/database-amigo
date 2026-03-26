import { useState, useEffect } from "react";

const FALLBACK_RATE = 76.5;
const CACHE_KEY = "bm_ltc_eur_rate";
const CACHE_TTL = 60_000; // 1 minute

interface CachedRate {
  rate: number;
  ts: number;
}

function getCached(): CachedRate | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed: CachedRate = JSON.parse(raw);
    if (Date.now() - parsed.ts < CACHE_TTL) return parsed;
  } catch {}
  return null;
}

function setCache(rate: number) {
  localStorage.setItem(CACHE_KEY, JSON.stringify({ rate, ts: Date.now() }));
}

export function useLtcEurRate() {
  const cached = getCached();
  const [rate, setRate] = useState(cached?.rate ?? FALLBACK_RATE);
  const [loading, setLoading] = useState(!cached);

  useEffect(() => {
    let cancelled = false;

    async function fetchRate() {
      try {
        const res = await fetch(
          "https://api.coingecko.com/api/v3/simple/price?ids=litecoin&vs_currencies=eur"
        );
        if (!res.ok) return;
        const data = await res.json();
        const newRate = data?.litecoin?.eur;
        if (typeof newRate === "number" && newRate > 0 && !cancelled) {
          setRate(newRate);
          setCache(newRate);
        }
      } catch {
        // keep current rate
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchRate();
    const interval = setInterval(fetchRate, 60_000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  return { rate, loading };
}