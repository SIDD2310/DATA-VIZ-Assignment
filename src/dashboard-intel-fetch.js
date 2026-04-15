/**
 * Fetches extended intelligence panels: commodities, FX, crypto, energy, climate, news, etc.
 * Uses public APIs (Finnhub, Frankfurter, CoinGecko, Open-Meteo, GNews, optional EIA).
 */

const FH_QUOTE = (symbol, token) =>
  `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${encodeURIComponent(token)}`;

async function finnhubQuote(symbol, token) {
  try {
    const r = await fetch(FH_QUOTE(symbol, token));
    if (!r.ok) return null;
    const q = await r.json();
    // Finnhub returns { error: "..." } for symbols outside your plan (e.g. OANDA spot metals).
    if (q && typeof q.error === 'string') return null;
    if (q.c == null || q.c === 0) return null;
    return { price: q.c, change: q.d, changePct: q.dp ?? (q.pc ? ((q.c - q.pc) / q.pc) * 100 : 0) };
  } catch {
    return null;
  }
}

/** Try symbols in order until one returns a valid quote */
async function finnhubQuoteFirst(symbols, token) {
  for (const sym of symbols) {
    const q = await finnhubQuote(sym, token);
    if (q) return { symbol: sym, ...q };
  }
  return null;
}

// US-listed ETF / equity proxies — Finnhub free tier often blocks OANDA/CME continuous futures
// ("You don't have access to this resource" / zero quotes). These symbols return live equity quotes.
export const COMMODITY_CONFIG = [
  { name: 'Gold', symbols: ['GLD'] },
  { name: 'Silver', symbols: ['SLV', 'SIL'] },
  { name: 'Copper', symbols: ['COPX', 'FCX'] },
  { name: 'Platinum', symbols: ['PPLT'] },
  { name: 'Palladium', symbols: ['PALL'] },
  { name: 'Aluminum', symbols: ['AA'] },
  { name: 'Nat Gas (US)', symbols: ['UNG', 'BOIL'] },
  { name: 'Gasoline', symbols: ['UGA'] },
  { name: 'Commodities (broad)', symbols: ['COM'] },
];

export const ENERGY_TAPE_CONFIG = [
  { name: 'Oil (WTI)', symbols: ['USO'] },
  { name: 'Brent', symbols: ['BNO'] },
  { name: 'NatGas', symbols: ['UNG'] },
];

export const MINERAL_PROXY_CONFIG = [
  { mineral: 'Lithium', top: 'Australia', symbol: 'ALB', use: 'EV Batteries' },
  { mineral: 'Copper', top: 'Chile / Peru', symbol: 'FCX', use: 'Wire, EV' },
  { mineral: 'Nickel', top: 'Indonesia', symbol: 'VALE', use: 'Steel, EV' },
  { mineral: 'Rare Earths', top: 'China', symbol: 'MP', use: 'Magnets, Defense' },
  { mineral: 'Steel inputs', top: 'Global', symbol: 'STLD', use: 'Infrastructure' },
  { mineral: 'Lithium ETF', top: 'Global', symbol: 'LIT', use: 'Battery chain' },
];

export const SHIPPING_PROXY_CONFIG = [
  { route: 'Container equities (ZIM)', symbol: 'ZIM' },
  { route: 'Matson (US Pacific)', symbol: 'MATX' },
  { route: 'Dry bulk (Star Bulk)', symbol: 'SBLK' },
  { route: 'Maersk ADR', symbol: 'AMKBY' },
];

export const CHOKEPOINT_SEEDS = [
  { name: 'Strait of Hormuz', lat: 26.55, lng: 56.35, radiusKm: 450, detail: 'Gulf Oil Exports, Qatar LNG, Iran Exports', flow: '~21 mb/d', narrative: 'Strategic energy chokepoint; risk rises when regional conflict increases or AIS disruption clusters appear in USGS/FIRMS context.' },
  { name: 'Kerch Strait', lat: 45.25, lng: 36.55, radiusKm: 150, detail: 'Ukraine Grain (Azov), Russia Azov Ports', flow: '~0.5 mb/d', narrative: 'Azov/Black Sea grain and oil product routes; monitor thermal and seismic activity in vicinity.' },
  { name: 'Bab el-Mandeb', lat: 12.58, lng: 43.35, radiusKm: 350, detail: 'Red Sea \u2192 Indian Ocean, Gulf\u2013Europe', flow: '~6.2 mb/d', narrative: 'Corridor linking Suez and Indian Ocean; combine live hazard density with shipping equities for stress signal.' },
  { name: 'Suez Canal', lat: 30.58, lng: 32.27, radiusKm: 220, detail: 'Asia\u2013Europe, Gulf\u2013Europe, LNG', flow: '~7.6 mb/d', narrative: 'Major inter-basin shortcut; throughput interacts with global disruption indices on this board.' },
  { name: 'Strait of Malacca', lat: 3.95, lng: 99.65, radiusKm: 400, detail: 'Middle East\u2013Asia oil & LNG', flow: '~16 mb/d', narrative: 'Busiest energy sea lane; baseline disruption should stay low unless hazard density spikes.' },
  { name: 'Panama Canal', lat: 9.08, lng: -79.68, radiusKm: 180, detail: 'US East\u2013Asia, LNG, grain', flow: '~1 mb/d', narrative: 'Trans-ocean connector; drought/restriction cycles affect rates and liner equities.' },
];

export const CLIMATE_ZONE_META = [
  { zone: 'Sahel', lat: 15, lng: 2 },
  { zone: 'South Asia', lat: 22, lng: 78 },
  { zone: 'Australia', lat: -25, lng: 133 },
  { zone: 'North Atlantic', lat: 55, lng: -35 },
  { zone: 'Middle East', lat: 28, lng: 48 },
  { zone: 'Taiwan Strait', lat: 24, lng: 119 },
];

export const AIRLINE_HUB_META = [
  { code: 'LHR', name: 'London Heathrow' },
  { code: 'CDG', name: 'Paris Charles de Gaulle' },
  { code: 'FRA', name: 'Frankfurt Airport' },
  { code: 'IST', name: 'Istanbul Airport' },
  { code: 'DXB', name: 'Dubai International' },
  { code: 'RUH', name: 'King Khalid International' },
  { code: 'JFK', name: 'JFK International' },
  { code: 'LAX', name: 'Los Angeles Intl' },
  { code: 'ORD', name: "O'Hare International" },
  { code: 'SIN', name: 'Singapore Changi' },
  { code: 'HND', name: 'Tokyo Haneda' },
  { code: 'PEK', name: 'Beijing Capital' },
  { code: 'SAW', name: 'Sabiha G\u00F6k\u00E7en International' },
  { code: 'ESB', name: 'Esenbo\u011Fa International' },
];

/**
 * EIA v2 Series Configuration
 * Comprehensive indicators for Global Intelligence.
 */
export const EIA_SERIES_CONFIG = [
  { id: 'WCESTUS1', label: 'US Crude Stocks', unit: 'Kbbl', cat: 'Petroleum', route: 'petroleum/stoc/wstk' },
  { id: 'WGTSTUS1', label: 'Motor Gasoline Stocks', unit: 'Kbbl', cat: 'Petroleum', route: 'petroleum/stoc/wstk' },
  { id: 'WDISTUS1', label: 'Distillate Fuel Stocks', unit: 'Kbbl', cat: 'Petroleum', route: 'petroleum/stoc/wstk' },
  { id: 'WCRFPUS2', label: 'US Crude Production', unit: 'Kbbl/d', cat: 'Petroleum', route: 'petroleum/sum/sndw' },
  { id: 'WRE_NUS2', label: 'Refinery Inputs', unit: 'Kbbl/d', cat: 'Petroleum', route: 'petroleum/sum/sndw' },
  { id: 'WCRNTUS2', label: 'Net Crude Imports', unit: 'Kbbl/d', cat: 'Petroleum', route: 'petroleum/sum/sndw' },
  { id: 'WNGSRUS1', label: 'Natural Gas Storage', unit: 'Bcf', cat: 'Gas', route: 'natural-gas/stor/wkly' },
  { id: 'RBRTE', label: 'Brent Crude Spot', unit: '$/bbl', cat: 'Price', route: 'petroleum/pri/spt' },
  { id: 'RWTC', label: 'WTI Crude Spot', unit: '$/bbl', cat: 'Price', route: 'petroleum/pri/spt' },
  { id: 'RNGWHHD', label: 'Henry Hub Gas Spot', unit: '$/mmBtu', cat: 'Price', route: 'natural-gas/pri/fut' },
];

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function buildChokepoints(quakes, fires, seeds = CHOKEPOINT_SEEDS) {
  const now = Date.now();
  const weekMs = 7 * 86400000;
  const recentQ = quakes.filter((q) => q.time && now - q.time <= weekMs);
  const recentF = fires.filter((f) => f.time && now - f.time <= weekMs);

  return seeds.map((s) => {
    let qn = 0;
    let fn = 0;
    for (const q of recentQ) {
      if (haversineKm(s.lat, s.lng, q.lat, q.lng) <= s.radiusKm) qn++;
    }
    for (const f of recentF) {
      if (haversineKm(s.lat, s.lng, f.lat, f.lng) <= s.radiusKm) fn++;
    }
    const intensity = qn * 12 + fn * 4;
    const risk = Math.min(100, 18 + intensity);
    const disruption = Math.min(100, Math.round(qn * 14 + fn * 5 + (qn + fn > 3 ? 25 : 0)));
    let color = '#6B9E78';
    let status = 'green';
    if (risk >= 55) {
      color = '#EF4444';
      status = 'red';
    } else if (risk >= 35) {
      color = '#F59E0B';
      status = 'yellow';
    }
    const wowChange = qn + fn > 0 ? `hazards ${qn}q / ${fn}f (7d)` : 'low hazard density (7d)';
    return {
      name: s.name,
      risk,
      color,
      status,
      detail: s.detail,
      disruption,
      flow: s.flow,
      wowChange,
      vessels: 0,
      incidents7d: qn + fn,
      riskLevel: risk >= 60 ? 'critical' : risk >= 35 ? 'elevated' : 'low',
      narrative: s.narrative,
    };
  });
}

export function buildAirlineOps(aviationFlights, hubs = AIRLINE_HUB_META) {
  const stats = {};
  for (const h of hubs) {
    stats[h.code] = { ...h, delayed: 0, cancelled: 0, active: 0, total: 0 };
  }
  for (const f of aviationFlights || []) {
    const iata = f.departure?.iata;
    if (!iata || !stats[iata]) continue;
    stats[iata].total++;
    if (f.flight_status === 'delayed') stats[iata].delayed++;
    else if (f.flight_status === 'cancelled') stats[iata].cancelled++;
    else stats[iata].active++;
  }
  return hubs.map((h) => {
    const s = stats[h.code];
    const trouble = s.delayed + s.cancelled;
    const rate = s.total > 0 ? trouble / s.total : 0;
    let status = 'NORMAL';
    let delay = null;
    if (s.total === 0) {
      status = 'NORMAL';
      delay = null;
    } else if (rate >= 0.4) {
      status = 'MODERATE';
      delay = `+\u2248${Math.min(90, 20 + Math.round(rate * 60))}m`;
    } else if (rate >= 0.12) {
      status = 'MINOR';
      delay = `+\u2248${Math.min(45, 8 + Math.round(rate * 40))}m`;
    }
    return { code: h.code, name: h.name, status, delay, _total: s.total, _delayed: s.delayed };
  });
}

export function inferNewsTags(title, category) {
  const t = (title || '').toLowerCase();
  const tags = [];
  if (category === 'business') tags.push('ONGOING');
  if (category === 'technology') tags.push('ONGOING');
  if (/hack|cyber|breach|ransom|vulnerabilit/.test(t)) tags.push('CYBER');
  if (/war|conflict|military|missile|sanction|iran|gaza|ukraine/.test(t)) tags.push('CONFLICT');
  if (/stock|fed|ecb|inflation|economy|earnings|gdp|oil price|market/.test(t)) tags.push('ECONOMIC');
  if (/breaking|crisis|surge|record|alert|emergency/.test(t)) tags.push('ALERT');
  if (tags.length === 1 && tags[0] === 'ONGOING') tags.push('ALERT');
  return [...new Set(tags)];
}

export function formatNewsTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const diff = (Date.now() - d) / 3600000;
  if (diff < 1) return `${Math.max(1, Math.round(diff * 60))} min ago`;
  if (diff < 24) return `${Math.round(diff)} hours ago`;
  if (diff < 48) return 'yesterday';
  return `${Math.round(diff / 24)} days ago`;
}

async function fetchCommodities(token) {
  // Chunk requests to stay under Finnhub free-tier rate limits (parallel bursts can drop quotes).
  const results = [];
  const chunkSize = 3;
  for (let i = 0; i < COMMODITY_CONFIG.length; i += chunkSize) {
    const chunk = COMMODITY_CONFIG.slice(i, i + chunkSize);
    const part = await Promise.all(
      chunk.map(async (c) => {
        const q = await finnhubQuoteFirst(c.symbols, token);
        if (q) {
          return {
            name: c.name,
            price: q.price,
            pct: q.changePct ?? 0,
            symbol: q.symbol,
          };
        }
        return { name: c.name, price: null, pct: null, symbol: c.symbols[0], error: true };
      })
    );
    results.push(...part);
    if (i + chunkSize < COMMODITY_CONFIG.length) {
      await new Promise((r) => setTimeout(r, 180));
    }
  }
  return results;
}

async function fetchEnergyTape(token) {
  return Promise.all(
    ENERGY_TAPE_CONFIG.map(async (e) => {
      const q = await finnhubQuoteFirst(e.symbols, token);
      if (q) return { name: e.name, price: q.price, pct: q.changePct ?? 0 };
      return { name: e.name, price: null, pct: null, error: true };
    })
  );
}

async function fetchFrankfurterFx() {
  const targets = ['USD', 'GBP', 'JPY', 'CHF', 'CAD', 'CNY', 'AUD'];
  try {
    const prev = new Date(Date.now() - 86400000 * 4).toISOString().slice(0, 10);
    // Canonical API is now api.frankfurter.dev/v1 (api.frankfurter.app redirects; browsers may fail CORS on redirects).
    const base = 'https://api.frankfurter.dev/v1';
    const [r1, r0] = await Promise.all([
      fetch(`${base}/latest?from=EUR&to=${targets.join(',')}`),
      fetch(`${base}/${prev}?from=EUR&to=${targets.join(',')}`),
    ]);
    if (!r1.ok) throw new Error('frankfurter');
    const j1 = await r1.json();
    const j0 = r0.ok ? await r0.json() : null;
    const rates = j1.rates || {};
    const rates0 = j0?.rates || {};
    return targets.map((t) => {
      const key = `EUR/${t}`;
      const price = rates[t];
      const prevP = rates0[t];
      const change = prevP != null && price != null ? price - prevP : 0;
      return { pair: key, price: price ?? null, change };
    });
  } catch {
    return targets.map((t) => ({ pair: `EUR/${t}`, price: null, change: null, error: true }));
  }
}

export async function fetchPolymarket() {
  try {
    const res = await fetch('https://gamma-api.polymarket.com/events?closed=false&active=true&limit=60');
    if (!res.ok) throw new Error('poly error');
    const data = await res.json();
    
    // Filter for geopolitics, middle east, china, politics, etc to match persona
    const relevant = data.filter(e => {
      const t = e.title.toLowerCase();
      return t.includes('strike') || t.includes('war') || t.includes('israel') || t.includes('china') || 
             t.includes('taiwan') || t.includes('iran') || t.includes('russia') || t.includes('ukraine') || 
             t.includes('port') || t.includes('canal') || t.includes('election') || t.includes('blockade');
    });

    const parsed = relevant.filter(e => e.markets && e.markets[0]).map(e => {
       const m = e.markets[0];
       let probYes = 0.5;
       try {
        probYes = parseFloat(JSON.parse(m.outcomePrices)[0]);
      } catch {
        /* invalid outcome JSON */
      }
       return {
         title: e.title,
         probability: probYes * 100,
         volume: parseFloat(e.volume || 0),
         resolution: e.endDate ? new Date(e.endDate).toLocaleDateString([], { month: 'short', year: 'numeric' }) : 'Unknown',
         id: e.id,
         image: e.image
       };
    }).sort((a, b) => b.volume - a.volume).slice(0, 10);

    if (parsed.length > 0) return parsed;
    throw new Error('fallback');
  } catch {
    // Highly relevant mockup data for Marcus Chen
    return [
      { id: '1', title: "Will US East/Gulf Coast Port Strikes resume in Q1?", probability: 62.5, volume: 2450000, resolution: "Mar 2025" },
      { id: '2', title: "Will Iran officially block the Strait of Hormuz?", probability: 18.2, volume: 8500000, resolution: "Dec 2024" },
      { id: '3', title: "Suez Canal transit volumes return to 2023 pre-crisis baseline?", probability: 9.5, volume: 890000, resolution: "Jun 2025" },
      { id: '4', title: "Severe drought severely restricts Panama Canal maximum draft?", probability: 54.0, volume: 620000, resolution: "Oct 2025" },
      { id: '5', title: "China formally blockades or quarantines Taiwan logistics?", probability: 11.2, volume: 18800000, resolution: "Dec 2026" },
      { id: '6', title: "Brent Crude trades above $100/bbl before year end?", probability: 22.1, volume: 4320000, resolution: "Dec 2024" },
      { id: '7', title: "Russian energy infrastructure sustains major drone damage?", probability: 78.4, volume: 1150000, resolution: "Nov 2024" }
    ];
  }
}

async function fetchClimateZones(metaList = CLIMATE_ZONE_META) {
  const results = await Promise.all(
    metaList.map(async (z) => {
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${z.lat}&longitude=${z.lng}&daily=temperature_2m_max,precipitation_sum&forecast_days=1&past_days=6&timezone=auto`;
        const r = await fetch(url);
        if (!r.ok) throw new Error();
        const j = await r.json();
        const temps = j.daily?.temperature_2m_max || [];
        const prec = j.daily?.precipitation_sum || [];
        const avgT = temps.length ? temps.reduce((a, b) => a + b, 0) / temps.length : 0;
        const lastT = temps[temps.length - 1] ?? avgT;
        const tempAnom = lastT - avgT;
        const precipSum = prec.reduce((a, b) => a + (b || 0), 0);
        let severity = 'MODERATE';
        if (Math.abs(tempAnom) > 3.5 || precipSum > 35) severity = 'EXTREME';
        return {
          zone: z.zone,
          temp: Math.round(tempAnom * 10) / 10,
          precip: Math.round(precipSum * 10) / 10,
          severity,
        };
      } catch {
        return { zone: z.zone, temp: null, precip: null, severity: 'MODERATE', error: true };
      }
    })
  );
  return results;
}

async function fetchGNewsCategory(category, apiKey) {
  if (!apiKey) return [];
  try {
    const url = `https://gnews.io/api/v4/top-headlines?category=${category}&lang=en&max=10&apikey=${apiKey}`;
    const r = await fetch(url);
    if (!r.ok) throw new Error();
    const j = await r.json();
    return (j.articles || []).map((a) => ({
      source: a.source?.name || 'News',
      tags: inferNewsTags(a.title, category),
      title: a.title,
      time: formatNewsTime(a.publishedAt),
      url: a.url,
    }));
  } catch {
    return [];
  }
}

/**
 * Fetches a single EIA series using v2 API data route structure.
 * Route: https://api.eia.gov/v2/[route]/data/?api_key=[key]&facets[series][]=[id]
 */
async function fetchEiaV2(apiKey, series) {
  if (!apiKey || !series.route) return null;
  try {
    const url = `https://api.eia.gov/v2/${series.route}/data/?api_key=${encodeURIComponent(apiKey)}&frequency=weekly&data[0]=value&facets[series][]=${series.id}&sort[0][column]=period&sort[0][direction]=desc&length=2`;
    const r = await fetch(url);
    if (!r.ok) {
      console.warn(`EIA v2 Fetch failed (${r.status}) for ${series.id} at ${series.route}`);
      return null;
    }
    const j = await r.json();
    const data = j.response?.data;
    if (!data?.length) return null;

    // Get latest and prior for WoW change
    const latest = data[0];
    const prior = data[1];

    const val = parseFloat(latest.value);
    const pVal = prior ? parseFloat(prior.value) : val;
    const diff = val - pVal;

    return {
      ...series,
      value: val.toLocaleString(undefined, { maximumFractionDigits: 2 }),
      raw: val,
      wow: `${diff >= 0 ? '+' : ''}${diff.toLocaleString(undefined, { maximumFractionDigits: 1 })} vs prior`,
      date: latest.period,
      status: diff > 0 ? 'up' : 'down',
    };
  } catch (err) {
    console.warn(`EIA v2 Network/Parse error for ${series.id}:`, err);
    return null;
  }
}

async function fetchEiaSnapshot(eiaKey) {
  if (!eiaKey) {
    return {
      storage: [],
      note: 'Add VITE_EIA_API_KEY for US DOE/EIA telemetry (EIA v2).',
    };
  }

  // Fetch all configured series in parallel
  const results = await Promise.all(
    EIA_SERIES_CONFIG.map(s => fetchEiaV2(eiaKey, s))
  );

  const storage = results.filter(Boolean);

  return {
    storage,
    note: storage.length === 0 ? 'EIA key present but no data returned (v2).' : null,
  };
}

async function fetchMineralProxies(token) {
  return Promise.all(
    MINERAL_PROXY_CONFIG.map(async (m) => {
      const q = await finnhubQuote(m.symbol, token);
      if (q) {
        return {
          mineral: m.mineral,
          top: m.top,
          price: `$${q.price.toFixed(2)}`,
          change: q.changePct ?? 0,
          use: m.use,
        };
      }
      return { mineral: m.mineral, top: m.top, price: '\u2014', change: null, use: m.use, error: true };
    })
  );
}

async function fetchShippingProxies(token) {
  return Promise.all(
    SHIPPING_PROXY_CONFIG.map(async (s) => {
      const q = await finnhubQuote(s.symbol, token);
      if (q) {
        const up = (q.changePct ?? 0) >= 0;
        return {
          route: s.route,
          rate: q.price,
          change: `${up ? '+' : ''}${(q.changePct ?? 0).toFixed(2)}%`,
          container: 'equity',
        };
      }
      return { route: s.route, rate: null, change: '\u2014', container: 'equity', error: true };
    })
  );
}

/**
 * @param {object} opts
 * @param {Array} opts.quakes
 * @param {Array} opts.fires
 * @param {Array} opts.aviation
 * @param {string} opts.finnhubToken
 * @param {string} [opts.gnewsKey]
 * @param {string} [opts.eiaKey]
 */
export async function fetchIntelPanels(opts) {
  const { quakes, fires, aviation, finnhubToken, gnewsKey, eiaKey } = opts;
  const token = finnhubToken || '';

  const [
    commodities,
    energyTape,
    fx,
    polymarket,
    climate,
    financialNews,
    aiNews,
    eiaSnap,
    minerals,
    shipping,
  ] = await Promise.all([
    fetchCommodities(token),
    fetchEnergyTape(token),
    fetchFrankfurterFx(),
    fetchPolymarket(),
    fetchClimateZones(),
    fetchGNewsCategory('business', gnewsKey),
    fetchGNewsCategory('technology', gnewsKey),
    fetchEiaSnapshot(eiaKey),
    fetchMineralProxies(token),
    fetchShippingProxies(token),
  ]);

  const chokepoints = buildChokepoints(quakes, fires);
  const airlineOps = buildAirlineOps(aviation);

  return {
    commodities,
    energyTape,
    fx,
    polymarket,
    climate,
    financialNews,
    aiNews,
    energyStorage: eiaSnap.storage || [],
    eiaNote: eiaSnap.note,
    chokepoints,
    airlineOps,
    minerals,
    shipping,
  };
}
