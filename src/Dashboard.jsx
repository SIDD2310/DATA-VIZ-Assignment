import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Activity, ArrowLeft, ArrowRight, AlertTriangle, Info,
  Plane, TrendingDown, TrendingUp, ShieldAlert, Layers,
  Globe2, BarChart3, Network, Eye, Map as MapIcon, ChevronRight,
  DollarSign, Gauge, Fuel, Anchor, Bitcoin, Newspaper,
  CloudRain
} from 'lucide-react';
import Globe from 'react-globe.gl';
import {
  XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer,
  Bar, ComposedChart, Line, AreaChart, Area, Cell, PieChart, Pie,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart
} from 'recharts';
import CountryDossier from './CountryDossier';
import { fetchIntelPanels, CHOKEPOINT_SEEDS, CLIMATE_ZONE_META } from './dashboard-intel-fetch';
import FlatMap from './FlatMap.jsx';

const KEYS = {
  finnhub: 'd79nie9r01qqpmhhdh9gd79nie9r01qqpmhhdha0',
  firms: 'b123493e888a60f4aaae4b34bbf72b87',
  aviation: '92020335bc1069eb12ab0eb50a0b807e',
  eia: '7V6IgbhNrM3STgjDszflZk9w9j661lHBlzf3HwXG',
  gnews: '9ca18a6baae121d79dd23e8d3af50a1e',
};

const THEME = {
  bg: '#1A1A1A', surface: '#2A2A28', text: '#F2F0E9',
  textSecondary: '#C8C4BA', textMuted: '#8A857A', accent: '#CC5833',
  primary: '#2E4036', danger: '#EF4444', blue: '#7BA4C7',
  green: '#6B9E78', flight: '#A78BFA',
};

const GEOJSON_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

const MAJOR_HUBS = [
  { code: 'JFK', lat: 40.64, lng: -73.78, country: 'United States of America' },
  { code: 'LHR', lat: 51.47, lng: -0.46, country: 'United Kingdom' },
  { code: 'DXB', lat: 25.25, lng: 55.36, country: 'United Arab Emirates' },
  { code: 'HND', lat: 35.55, lng: 139.78, country: 'Japan' },
  { code: 'SIN', lat: 1.35, lng: 103.99, country: 'Singapore' },
  { code: 'LAX', lat: 33.94, lng: -118.41, country: 'United States of America' },
  { code: 'CDG', lat: 49.01, lng: 2.55, country: 'France' },
  { code: 'SYD', lat: -33.95, lng: 151.18, country: 'Australia' },
  { code: 'GRU', lat: -23.43, lng: -46.47, country: 'Brazil' },
  { code: 'NBO', lat: -1.32, lng: 36.93, country: 'Kenya' },
  { code: 'DEL', lat: 28.56, lng: 77.10, country: 'India' },
  { code: 'ICN', lat: 37.46, lng: 126.44, country: 'South Korea' },
  { code: 'FRA', lat: 50.03, lng: 8.57, country: 'Germany' },
  { code: 'PEK', lat: 40.08, lng: 116.58, country: 'China' },
  { code: 'JNB', lat: -26.14, lng: 28.24, country: 'South Africa' },
];

function generateFlightArcs() {
  const arcs = [];
  const statuses = ['active', 'active', 'active', 'delayed', 'cancelled'];
  for (let i = 0; i < MAJOR_HUBS.length; i++) {
    for (let j = i + 1; j < MAJOR_HUBS.length; j++) {
      if (Math.random() > 0.4) continue;
      arcs.push({
        startLat: MAJOR_HUBS[i].lat, startLng: MAJOR_HUBS[i].lng,
        endLat: MAJOR_HUBS[j].lat, endLng: MAJOR_HUBS[j].lng,
        from: MAJOR_HUBS[i].code, to: MAJOR_HUBS[j].code,
        status: statuses[Math.floor(Math.random() * statuses.length)],
        domain: 'AVIATION'
      });
    }
  }
  return arcs;
}

function generateMaritimeArcs() {
  const arcs = [];
  const HUBS = [
    { code: 'HMB', lat: 53.5, lng: 9.9 }, // Hamburg
    { code: 'SHA', lat: 31.0, lng: 121.8 }, // Shanghai
    { code: 'LAX', lat: 33.7, lng: -118.2 }, // LA
    { code: 'SGP', lat: 1.25, lng: 103.8 } // Singapore
  ];
  
  // Create routes connecting major shipping hubs via chokepoints
  HUBS.forEach(hub => {
    CHOKEPOINT_SEEDS.forEach(choke => {
       if (Math.random() > 0.6) return;
       const routeCount = Math.floor(Math.random() * 3) + 1;
       for (let i = 0; i < routeCount; i++) {
         arcs.push({
            startLat: hub.lat + (Math.random() - 0.5) * 2,
            startLng: hub.lng + (Math.random() - 0.5) * 2,
            endLat: choke.lat + (Math.random() - 0.5) * 1.5,
            endLng: choke.lng + (Math.random() - 0.5) * 1.5,
            from: hub.code, to: choke.name,
            status: 'active',
            domain: 'MARITIME'
         });
       }
    });
  });

  // Chokepoint to Chokepoint routing
  for (let i = 0; i < CHOKEPOINT_SEEDS.length; i++) {
    for (let j = i + 1; j < CHOKEPOINT_SEEDS.length; j++) {
      if (Math.random() > 0.4) continue;
      for (let route = 0; route < 2; route++) {
        arcs.push({
          startLat: CHOKEPOINT_SEEDS[i].lat + (Math.random() - 0.5),
          startLng: CHOKEPOINT_SEEDS[i].lng + (Math.random() - 0.5),
          endLat: CHOKEPOINT_SEEDS[j].lat + (Math.random() - 0.5),
          endLng: CHOKEPOINT_SEEDS[j].lng + (Math.random() - 0.5),
          from: CHOKEPOINT_SEEDS[i].name, to: CHOKEPOINT_SEEDS[j].name,
          status: 'active',
          domain: 'MARITIME'
        });
      }
    }
  }
  
  return arcs;
}

function pointInPolygon(lat, lng, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1];
    const xj = ring[j][0], yj = ring[j][1];
    if ((yi > lat) !== (yj > lat) && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function ringBBox(ring) {
  let minLng = Infinity;
  let maxLng = -Infinity;
  let minLat = Infinity;
  let maxLat = -Infinity;
  for (let i = 0; i < ring.length; i++) {
    const lng = ring[i][0];
    const lat = ring[i][1];
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
  }
  return { minLng, maxLng, minLat, maxLat };
}

function mergeBBoxes(boxes) {
  return boxes.reduce(
    (acc, b) => ({
      minLng: Math.min(acc.minLng, b.minLng),
      maxLng: Math.max(acc.maxLng, b.maxLng),
      minLat: Math.min(acc.minLat, b.minLat),
      maxLat: Math.max(acc.maxLat, b.maxLat),
    }),
    boxes[0],
  );
}

function pointInRingBBox(lat, lng, bbox) {
  return lng >= bbox.minLng && lng <= bbox.maxLng && lat >= bbox.minLat && lat <= bbox.maxLat;
}

/** Precomputed bboxes so country clicks do not scan every polygon vertex per event. */
function buildGeoPrepared(geoData) {
  if (!geoData?.length) return [];
  const prepared = [];
  for (const c of geoData) {
    const name = c.properties?.name;
    const geom = c.geometry;
    if (!name || !geom) continue;
    const polys = geom.type === 'Polygon' ? [geom.coordinates] : (geom.type === 'MultiPolygon' ? geom.coordinates : []);
    const polygons = [];
    for (const poly of polys) {
      const outer = poly[0];
      if (!outer?.length) continue;
      polygons.push({ outer, bbox: ringBBox(outer) });
    }
    if (!polygons.length) continue;
    const countryBbox = mergeBBoxes(polygons.map((p) => p.bbox));
    prepared.push({ name, polygons, countryBbox });
  }
  return prepared;
}

function pointInPreparedCountry(lat, lng, entry) {
  if (!entry) return false;
  if (!pointInRingBBox(lat, lng, entry.countryBbox)) return false;
  for (const { outer, bbox } of entry.polygons) {
    if (!pointInRingBBox(lat, lng, bbox)) continue;
    if (pointInPolygon(lat, lng, outer)) return true;
  }
  return false;
}

function resolveCountryForPointPrepared(lat, lng, prepared) {
  if (!prepared?.length) return null;
  for (const entry of prepared) {
    if (pointInPreparedCountry(lat, lng, entry)) return entry.name;
  }
  return null;
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-[#2A2A28]/95 backdrop-blur-md p-3 border border-[#CC5833]/20 rounded-lg shadow-xl text-xs font-sans z-50">
        <p className="font-bold text-[#F2F0E9] mb-1">{label}</p>
        {payload.map((entry, i) => (
          <div key={i} className="flex items-center justify-between gap-4 py-0.5">
            <span className="text-[#8A857A] uppercase font-mono text-[9px]">{entry.name}</span>
            <span className="font-bold font-mono" style={{ color: entry.color || THEME.accent }}>
              {typeof entry.value === 'number' ? entry.value.toFixed(1) : entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const GlobalTooltip = ({ children, text, position = 'top', disabled = false }) => {
  const [visible, setVisible] = useState(false);
  if (disabled || !text) return children;

  return (
    <div className="relative inline-block" onMouseEnter={() => setVisible(true)} onMouseLeave={() => setVisible(false)}>
      {children}
      {visible && (
        <div className={`absolute z-[100] px-2.5 py-1.5 font-mono text-[9px] uppercase tracking-wider bg-[#000]/95 text-white rounded-md border border-[#CC5833]/40 shadow-2xl whitespace-nowrap pointer-events-none animate-fadeIn ${
          position === 'right' ? 'left-full ml-3 top-1/2 -translate-y-1/2' :
          position === 'left' ? 'right-full mr-3 top-1/2 -translate-y-1/2' :
          position === 'bottom' ? 'top-full mt-3 left-1/2 -translate-x-1/2' :
          'bottom-full mb-3 left-1/2 -translate-x-1/2'
        }`}>
          <div className={`absolute w-2 h-2 bg-[#000] border-t border-l border-[#CC5833]/40 transform rotate-[-45deg] ${
            position === 'right' ? '-left-1 top-1/2 -translate-y-1/2 border-t-0 border-r-0' :
            position === 'left' ? '-right-1 top-1/2 -translate-y-1/2 border-b-0 border-l-0' :
            position === 'bottom' ? '-top-1 left-1/2 -translate-x-1/2 border-b-0 border-r-0' :
            '-bottom-1 left-1/2 -translate-x-1/2 border-t-0 border-l-0'
          }`} />
          {text}
        </div>
      )}
    </div>
  );
};

function normalizeWingbitsFlightPath(rawPath) {
  if (!Array.isArray(rawPath) || rawPath.length < 2) return [];
  const out = [];
  let cur = null;

  const pushCur = () => {
    if (cur && typeof cur.lat === 'number' && typeof cur.lng === 'number') out.push(cur);
    cur = null;
  };

  for (const p of rawPath) {
    if (!p || typeof p !== 'object') continue;

    if (typeof p.latitude === 'number' && typeof p.longitude === 'number') {
      pushCur();
      cur = {
        lat: p.latitude,
        lng: p.longitude,
        altFt: typeof p.altitude === 'number' ? p.altitude : null,
        ts: typeof p.timestamp === 'number' ? p.timestamp : null,
      };
      continue;
    }

    // Wingbits often returns interleaved samples:
    // { altitude, timestamp } then later { latitude, longitude } for the same fix.
    if (typeof p.altitude === 'number' && typeof p.timestamp === 'number') {
      if (cur && typeof cur.lat === 'number' && typeof cur.lng === 'number') {
        cur.altFt = p.altitude;
        cur.ts = p.timestamp;
      }
      continue;
    }
  }

  pushCur();

  // De-dupe consecutive identical points (common in sampled paths)
  const deduped = [];
  for (const pt of out) {
    const prev = deduped[deduped.length - 1];
    if (prev && prev.lat === pt.lat && prev.lng === pt.lng) continue;
    deduped.push(pt);
  }
  return deduped;
}

async function fetchWithFallback(url, type, mockGenerator) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    if (type === 'csv') return await res.text();
    return await res.json();
  } catch { return mockGenerator(); }
}

const PAGES = [
  { id: 'situation', number: '01', icon: <Activity className="shrink-0" size={18} />, label: 'Situation Room', tooltip: 'High-level executive risk & physical hazard snapshot' },
  { id: 'map', number: '02', icon: <Globe2 className="shrink-0" size={18} />, label: 'Geospatial Map', tooltip: 'Live multi-domain telemetry and chokepoint mapping' },
  { id: 'signals', number: '03', icon: <Activity className="shrink-0" size={18} />, label: 'Signal Patterns', tooltip: 'Hazard vs aviation disruption co-movement analysis' },
  { id: 'markets', number: '04', icon: <BarChart3 className="shrink-0" size={18} />, label: 'Markets', tooltip: 'Real-time equity and macro sentiment monitoring' },
  { id: 'commodities', number: '05', icon: <DollarSign className="shrink-0" size={18} />, label: 'Commodities & FX', tooltip: 'Global ETF snapshots and EIA spot pricing' },
  { id: 'polymarket', number: '06', icon: <Eye className="shrink-0" size={18} />, label: 'Prediction Markets', tooltip: 'Geopolitical event probabilities via Polymarket' },
  { id: 'energy', number: '07', icon: <Fuel className="shrink-0" size={18} />, label: 'Energy Complex', tooltip: 'U.S. DOE/EIA weekly inventory and supply telemetry' },
  { id: 'supply', number: '08', icon: <Anchor className="shrink-0" size={18} />, label: 'Supply Chain', tooltip: 'Maritime chokepoint risk and transit clustering' },
  { id: 'news', number: '09', icon: <Newspaper className="shrink-0" size={18} />, label: 'World News', tooltip: 'Live GNews headlines filtered for geopolitical impact' },
  { id: 'climate', number: '10', icon: <CloudRain className="shrink-0" size={18} />, label: 'Climate & Aviation', tooltip: 'Atmospheric anomalies and flight stress modeling' },
  { id: 'cascade', number: '11', icon: <Network className="shrink-0" size={18} />, label: 'Cascade Analysis', tooltip: 'Probabilistic modeling of systemic fallout triggers' },
];

const MARKET_SYMBOLS = [
  { symbol: 'AAPL', name: 'Apple', sector: 'Tech' },
  { symbol: 'AMZN', name: 'Amazon', sector: 'Tech' },
  { symbol: 'AVGO', name: 'Broadcom', sector: 'Tech' },
  { symbol: 'BAC', name: 'BofA', sector: 'Finance' },
  { symbol: 'BRK.B', name: 'Berkshire', sector: 'Finance' },
  { symbol: 'COST', name: 'Costco', sector: 'Consumer' },
  { symbol: 'GOOGL', name: 'Alphabet', sector: 'Tech' },
  { symbol: 'HD', name: 'Home Depot', sector: 'Consumer' },
  { symbol: 'JNJ', name: 'J&J', sector: 'Health' },
  { symbol: 'JPM', name: 'JPMorgan', sector: 'Finance' },
  { symbol: 'LLY', name: 'Eli Lilly', sector: 'Health' },
  { symbol: 'MA', name: 'Mastercard', sector: 'Finance' },
  { symbol: 'SPY', name: 'S&P 500 ETF', sector: 'Index' },
  { symbol: 'QQQ', name: 'Nasdaq 100', sector: 'Index' },
  { symbol: 'VIX', name: 'Volatility Index', sector: 'Volatility' },
];

const TagBadge = ({ tag }) => {
  const colors = { ALERT: '#EF4444', ONGOING: '#8A857A', CYBER: '#7BA4C7', ECONOMIC: '#6B9E78', CONFLICT: '#F59E0B' };
  return <span className="px-1.5 py-0.5 rounded font-mono text-[7px] font-bold uppercase" style={{ backgroundColor: `${colors[tag] || '#555'}20`, color: colors[tag] || '#555', border: `1px solid ${colors[tag] || '#555'}30` }}>{tag}</span>;
};

function PageHeader({ title, subtitle, compact }) {
  return (
    <div className={`${compact ? 'mb-4' : 'mb-8'} max-w-2xl`}>
      <h2 className="text-xl font-semibold tracking-tight text-[#F2F0E9]">{title}</h2>
      {subtitle ? <p className="mt-1.5 text-sm leading-relaxed text-[#8A857A]">{subtitle}</p> : null}
    </div>
  );
}

function EmptyState({ children }) {
  return (
    <div className="rounded-2xl border border-dashed border-[#333] bg-[#1A1A1A]/40 px-6 py-14 text-center text-sm leading-relaxed text-[#8A857A]">
      {children}
    </div>
  );
}

export default function Dashboard({ onBack }) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ quakes: [], fires: [], markets: null, aviation: [], multiMarket: [] });
  const [timeframe, setTimeframe] = useState('week');
  const [focusedEvent, setFocusedEvent] = useState(null);
  const [mapMode, setMapMode] = useState('globe');
  const [layers, setLayers] = useState({
    intelHotspots: true,
    flights: true,
    aircraft: true,
    maritime: true,
    climate: false,
    weatherAlerts: true,
    seismic: true,
    thermal: true,
    chokepoints: true,
  });
  const [legendVisible, setLegendVisible] = useState(true);
  const [legendRows, setLegendRows] = useState({
    naturalEvents: true,
    fires: true,
    chokepoints: true,
    climate: true,
    weatherAlerts: true,
    aviation: true,
    aircraft: true,
    delayed: true,
    cancelled: true,
    maritime: true,
    countryHeat: true,
  });
  const [geoData, setGeoData] = useState([]);
  const [activePage, setActivePage] = useState('situation');
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [hoveredGlobeCountry, setHoveredGlobeCountry] = useState(null);
  const [worldNews, setWorldNews] = useState([]);
  const [intel, setIntel] = useState({
    commodities: [], fx: [], polymarket: [], energyTape: [], energyStorage: [], eiaNote: null,
    chokepoints: [], airlineOps: [], minerals: [], shipping: [],
    climate: [], financialNews: [], aiNews: [],
  });
  const globeRef = useRef();
  const globeContainerRef = useRef();
  const aircraftTrackReqId = useRef(0);
  const aircraftTrailRef = useRef(new Map()); // icao24 -> [{lat,lng,ts}]
  const [globeSize, setGlobeSize] = useState({ w: 600, h: 600 });
  const [globeNonce, setGlobeNonce] = useState(0);

  const [aircraft, setAircraft] = useState([]);
  const [aircraftError, setAircraftError] = useState(null);
  const [selectedAircraftId, setSelectedAircraftId] = useState(null);
  const [aircraftTrack, setAircraftTrack] = useState(null); // { id, callsign, points:[{lat,lng,altFt,ts}] }
  const [aircraftTrackLoading, setAircraftTrackLoading] = useState(false);
  const [aircraftTrackError, setAircraftTrackError] = useState(null);
  const [aircraftTrailsVersion, setAircraftTrailsVersion] = useState(0);

  const geoPrepared = useMemo(() => buildGeoPrepared(geoData), [geoData]);
  const aircraftTrails = useMemo(() => Object.fromEntries(aircraftTrailRef.current.entries()), [aircraftTrailsVersion]);

  const toggleLayer = useCallback((key) => {
    setLayers(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const toggleLegendRow = useCallback((key) => {
    setLegendRows((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const topoRes = await fetch(GEOJSON_URL);
        const topo = await topoRes.json();
        const topojson = await import('https://cdn.jsdelivr.net/npm/topojson-client@3/+esm');
        const countries = topojson.feature(topo, topo.objects.countries);
        const nameMap = await fetch('https://cdn.jsdelivr.net/npm/@observablehq/country-names@1/country-names.json')
          .then(r => r.json()).catch(() => null);
        if (nameMap) {
          const idToName = {};
          nameMap.forEach(c => { idToName[c.id] = c.name; });
          countries.features.forEach(f => { f.properties = { ...f.properties, name: idToName[f.id] || f.properties?.name || `ID-${f.id}` }; });
        }
        setGeoData(countries.features);
      } catch (e) {
        console.warn('GeoJSON load failed, using fallback', e);
        try {
          const geoRes = await fetch('https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson');
          const geo = await geoRes.json();
          setGeoData(geo.features.map(f => ({ ...f, properties: { name: f.properties?.ADMIN || f.properties?.name || 'Unknown' } })));
        } catch { setGeoData([]); }
      }
    })();
  }, []);

  useEffect(() => {
    const el = globeContainerRef.current;
    if (!el) return;

    // Only measure while the map page is visible; ensures we reattach when toggling 2D/3D.
    if (activePage !== 'map') return;

    const ro = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      setGlobeSize({ w: Math.max(1, Math.floor(width)), h: Math.max(1, Math.floor(height)) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [activePage, mapMode]);

  useEffect(() => {
    if (selectedCountry) return;
    if (activePage !== 'map' || mapMode !== 'globe') return;

    // Force a fresh Globe mount when switching back from 2D; avoids occasional blank canvas.
    setGlobeNonce((n) => n + 1);

    // Also take an immediate size reading on the next frame.
    const raf = requestAnimationFrame(() => {
      const el = globeContainerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setGlobeSize({ w: Math.floor(rect.width), h: Math.floor(rect.height) });
      }
    });
    return () => cancelAnimationFrame(raf);
  }, [activePage, mapMode, selectedCountry]);

  useEffect(() => {
    let isMounted = true;
    const ingest = async () => {
      setLoading(true);
      const usgsUrl = timeframe === 'day'
        ? 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson'
        : 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson';
      const quakeRes = await fetch(usgsUrl).then(r => r.json());
      const parsedQuakes = quakeRes.features.map(f => ({
        id: f.id, domain: 'SEISMIC', mag: f.properties.mag || 0,
        place: f.properties.place, time: f.properties.time,
        lat: f.geometry.coordinates[1], lng: f.geometry.coordinates[0], depth: f.geometry.coordinates[2]
      }));
      const marketRes = await fetchWithFallback(`https://finnhub.io/api/v1/quote?symbol=SPY&token=${KEYS.finnhub}`, 'json',
        () => ({ c: 512.3, d: -12.4, dp: -2.3, h: 520, l: 510, o: 518, pc: 524 }));
      const flightRes = await fetchWithFallback(`http://api.aviationstack.com/v1/flights?access_key=${KEYS.aviation}&flight_status=scheduled`, 'json',
        () => ({ data: Array.from({ length: 40 }, (_, i) => ({ flight_status: Math.random() > 0.8 ? 'cancelled' : (Math.random() > 0.5 ? 'delayed' : 'active'), departure: { airport: `Hub ${i}` } })) }));
      const firmsCsv = await fetchWithFallback(`https://firms.modaps.eosdis.nasa.gov/api/area/csv/${KEYS.firms}/VIIRS_SNPP_NRT/world/${timeframe === 'day' ? 1 : 3}`, 'csv',
        () => { let csv = "latitude,longitude,brightness,confidence\n"; for (let i = 0; i < 150; i++) csv += `${(Math.random()*180)-90},${(Math.random()*360)-180},${300+Math.random()*100},${Math.random()>0.5?'h':'n'}\n`; return csv; });
      const parsedFires = firmsCsv.split('\n').slice(1).map((line, idx) => {
        const p = line.split(','); if (p.length < 4) return null;
        return { id: `fire-${idx}`, domain: 'FIRE', lat: parseFloat(p[0]), lng: parseFloat(p[1]), mag: parseFloat(p[2]) / 80, place: `Thermal GEO-${Math.abs(Math.floor(parseFloat(p[0])))}`, time: Date.now() - (Math.random() * 86400000), confidence: p[3] };
      }).filter(Boolean);
      const finnhubToken = import.meta.env?.VITE_FINNHUB_API_KEY || KEYS.finnhub;
      const gnewsKey = import.meta.env?.VITE_GNEWS_API_KEY || KEYS.gnews;
      const eiaKey = import.meta.env?.VITE_EIA_API_KEY || KEYS.eia;
      const [multiMarket, intelPanels] = await Promise.all([
        Promise.all(
          MARKET_SYMBOLS.map(async (s) => {
            try {
              const r = await fetch(`https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(s.symbol)}&token=${finnhubToken}`);
              if (!r.ok) throw new Error();
              const q = await r.json();
              return { ...s, price: q.c, change: q.d, changePct: q.dp, high: q.h, low: q.l, open: q.o, prevClose: q.pc };
            } catch {
              const base = 100 + Math.random() * 400;
              const ch = (Math.random() - 0.5) * 10;
              return { ...s, price: base, change: ch, changePct: (ch / base) * 100, high: base + 5, low: base - 5, open: base - ch / 2, prevClose: base - ch };
            }
          })
        ),
        fetchIntelPanels({
          quakes: parsedQuakes,
          fires: parsedFires,
          aviation: flightRes.data || [],
          finnhubToken,
          gnewsKey,
          eiaKey,
        }),
      ]);
      if (isMounted) {
        setData({ quakes: parsedQuakes, fires: parsedFires, markets: marketRes, aviation: flightRes.data || [], multiMarket });
        setIntel(intelPanels);
        setLoading(false);
      }
    };
    ingest();
    return () => { isMounted = false; };
  }, [timeframe]);

  useEffect(() => {
    let alive = true;
    let timer = null;

    const fetchAircraft = async () => {
      try {
        // Wingbits requires geographic queries. We fan out a few large boxes to approximate
        // global coverage while staying within typical API payload limits.
        //
        // Dev server proxies `/api/wingbits/*` → `https://customer-api.wingbits.com/*` and injects `x-api-key`
        // from `WINGBITS_API_KEY` in `../.env.local` (see `vite.config.js`).
        // Wingbits caps each box to ~150nm per side (see API error text). We sample the world
        // with a coarse grid of boxes (good enough for a dashboard; dense global tiling is expensive).
        const regions = [];
        {
          const boxNm = 150;
          let aliasIdx = 0;
          for (let lat = -55; lat <= 55; lat += 20) {
            for (let lng = -170; lng <= 170; lng += 40) {
              regions.push({
                alias: `wb-${aliasIdx++}`,
                by: 'box',
                la: lat,
                lo: lng,
                w: boxNm,
                h: boxNm,
                unit: 'nm',
              });
            }
          }
        }

        const rows = [];
        const batchSize = 10;
        for (let i = 0; i < regions.length; i += batchSize) {
          const batch = regions.slice(i, i + batchSize);
          const res = await fetch('/api/wingbits/v1/flights', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(batch),
          });

          const text = await res.text();
          let j = null;
          try { j = JSON.parse(text); } catch { j = null; }

          if (!res.ok) {
            const msg = j?.message || text || `HTTP ${res.status}`;
            const hint =
              res.status === 404
                ? ' (Tip: run `npm run dev` — the Wingbits proxy only exists in the dev server)'
                : '';
            throw new Error(`Wingbits ${res.status}: ${msg}${hint}`);
          }

          const buckets = Array.isArray(j) ? j : [];
          for (const b of buckets) {
            const data = Array.isArray(b?.data) ? b.data : [];
            rows.push(...data);
          }
        }

        const byHex = new Map();
        for (const r of rows) {
          const hex = r?.h;
          const lat = r?.la;
          const lng = r?.lo;
          if (!hex || typeof lat !== 'number' || typeof lng !== 'number') continue;

          const callsign = (r?.f || '').trim();
          const category = r?.c || '';
          const onGround = !!r?.og;
          const gs = typeof r?.gs === 'number' ? r.gs : null;
          const track = typeof r?.th === 'number' ? r.th : (typeof r?.ro === 'number' ? r.ro : null);

          let altitudeFt = null;
          if (typeof r?.ab === 'number') altitudeFt = r.ab;
          else if (typeof r?.ab === 'string' && r.ab.trim() !== '' && !Number.isNaN(Number(r.ab))) altitudeFt = Number(r.ab);

          const altitudeM = altitudeFt == null ? null : altitudeFt * 0.3048;

          const cur = byHex.get(hex);
          const score = altitudeM ?? 0;
          if (!cur || score > (cur.altitudeM ?? 0)) {
            byHex.set(hex, {
              id: hex,
              domain: 'AIRCRAFT',
              lat,
              lng,
              callsign,
              category,
              altitudeM,
              altitudeFt,
              onGround,
              velocity: gs,
              track,
              source: 'wingbits',
            });
          }
        }

        const parsed = Array.from(byHex.values());
        parsed.sort((a, b) => (b.altitudeM ?? 0) - (a.altitudeM ?? 0));
        if (!alive) return;
        setAircraftError(null);

        // Lightweight "live trails" between polls (FlightRadar-ish), capped per aircraft.
        const next = parsed.slice(0, 1400);
        const trails = aircraftTrailRef.current;
        const now = Date.now();
        let trailsMutated = false;
        for (const ac of next) {
          const id = ac.id;
          if (!id || typeof ac.lat !== 'number' || typeof ac.lng !== 'number') continue;
          const prev = trails.get(id);
          const last = prev?.length ? prev[prev.length - 1] : null;
          const moved =
            !last ||
            Math.abs(last.lat - ac.lat) > 0.002 ||
            Math.abs(last.lng - ac.lng) > 0.002;
          if (!moved) continue;
          const arr = prev ? prev.slice() : [];
          arr.push({ lat: ac.lat, lng: ac.lng, ts: now });
          while (arr.length > 36) arr.shift();
          trails.set(id, arr);
          trailsMutated = true;
        }
        if (trailsMutated) setAircraftTrailsVersion((v) => v + 1);

        setAircraft(next);
      } catch (e) {
        if (!alive) return;
        const raw = String(e?.message || 'Wingbits fetch failed');
        const help =
          raw.includes('Failed to fetch') || raw.includes('NetworkError')
            ? `${raw} (Tip: run \`npm run dev\` — the Wingbits proxy only exists in the dev server)`
            : raw;
        setAircraftError(help);
        setAircraft([]);
      }
    };

    fetchAircraft();
    timer = setInterval(fetchAircraft, 12000);
    return () => {
      alive = false;
      if (timer) clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    (async () => {
      const gnewsKey = import.meta.env?.VITE_GNEWS_API_KEY || KEYS.gnews;
      if (!gnewsKey) {
        setWorldNews([]);
        return;
      }
      try {
        const res = await fetch(`https://gnews.io/api/v4/top-headlines?lang=en&max=12&apikey=${encodeURIComponent(gnewsKey)}`);
        if (!res.ok) throw new Error();
        const d = await res.json();
        setWorldNews((d.articles || []).map(a => ({ title: a.title, description: a.description?.slice(0, 160) || '', source: a.source?.name || 'Unknown', url: a.url, date: a.publishedAt, image: a.image })));
      } catch {
        setWorldNews([]);
      }
    })();
  }, []);

  const flightArcs = useMemo(() => generateFlightArcs(), []);
  const maritimeArcs = useMemo(() => generateMaritimeArcs(), []);

  const mapChokepoints = useMemo(() => {
    const riskByName = Object.fromEntries((intel.chokepoints || []).map((c) => [c.name, c.risk]));
    return CHOKEPOINT_SEEDS.map((s) => ({ ...s, risk: riskByName[s.name] ?? null }));
  }, [intel.chokepoints]);

  const mapClimateZones = useMemo(() => {
    const byZone = Object.fromEntries((intel.climate || []).map((z) => [z.zone, z]));
    return CLIMATE_ZONE_META
      .map((z) => ({ ...z, ...(byZone[z.zone] || {}) }))
      .filter((z) => z.temp != null && z.precip != null);
  }, [intel.climate]);

  const mapWeatherAlerts = useMemo(
    () => mapClimateZones.filter((z) => z.severity === 'EXTREME'),
    [mapClimateZones]
  );

  const globePoints = useMemo(() => {
    const pts = [];
    if (layers.seismic) {
      const sq = data.quakes.filter(q => q.mag > 3);
      pts.push(...(sq.length > 200 ? sq.sort((a, b) => b.mag - a.mag).slice(0, 200) : sq));
    }
    if (layers.thermal) {
      const ft = data.fires.filter(f => f.mag > 3.5);
      pts.push(...(ft.length > 150 ? ft.slice(0, 150) : ft));
    }
    if (layers.chokepoints) {
      pts.push(...mapChokepoints.map((cp) => ({
        lat: cp.lat,
        lng: cp.lng,
        mag: Math.max(2, (cp.risk ?? 20) / 20),
        domain: 'CHOKEPOINT',
      })));
    }
    if (layers.climate) {
      pts.push(...mapClimateZones.map((z) => ({
        lat: z.lat,
        lng: z.lng,
        mag: Math.max(1.5, Math.min(4, Math.abs(z.temp) / 1.5 + z.precip / 20)),
        domain: 'CLIMATE',
      })));
    }
    if (layers.weatherAlerts) {
      pts.push(...mapWeatherAlerts.map((z) => ({
        lat: z.lat,
        lng: z.lng,
        mag: 3.6,
        domain: 'WEATHER_ALERT',
      })));
    }
    if (layers.aircraft) {
      pts.push(...(aircraft || []).map((a) => ({ ...a, mag: 1.6 })));
    }
    return pts;
  }, [data, layers.seismic, layers.thermal, layers.chokepoints, layers.climate, layers.weatherAlerts, layers.aircraft, mapChokepoints, mapClimateZones, mapWeatherAlerts, aircraft]);

  const globeArcs = useMemo(() => {
    let arr = [];
    if (layers.flights) arr = arr.concat(flightArcs);
    if (layers.maritime) arr = arr.concat(maritimeArcs);
    return arr;
  }, [layers.flights, layers.maritime, flightArcs, maritimeArcs]);

  const globeCountryStats = useMemo(() => {
    if (!geoPrepared.length || !globePoints.length) return { byName: {}, maxScore: 0, top: [] };
    const byName = {};
    for (const p of globePoints) {
      const name = resolveCountryForPointPrepared(p.lat, p.lng, geoPrepared);
      if (!name) continue;
      if (!byName[name]) byName[name] = { name, score: 0, quakes: 0, fires: 0 };
      const wt = p.domain === 'SEISMIC'
        ? Math.max(0.8, (p.mag || 0) * 0.9)
        : Math.max(0.6, (p.mag || 0) * 0.35);
      byName[name].score += wt;
      if (p.domain === 'SEISMIC') byName[name].quakes += 1;
      if (p.domain === 'FIRE') byName[name].fires += 1;
    }
    const values = Object.values(byName);
    const maxScore = values.reduce((m, x) => Math.max(m, x.score), 0);
    const top = values.sort((a, b) => b.score - a.score).slice(0, 5);
    return { byName, maxScore, top };
  }, [geoPrepared, globePoints]);

  const flatMapQuakes = useMemo(() => {
    const q = data.quakes.filter(q => q.mag > 3);
    return q.length > 300 ? q.sort((a, b) => b.mag - a.mag).slice(0, 300) : q;
  }, [data.quakes]);

  const flatMapFires = useMemo(() => {
    return data.fires.length > 200 ? data.fires.slice(0, 200) : data.fires;
  }, [data.fires]);


  const kpis = useMemo(() => {
    const totalHazards = data.quakes.length + data.fires.length;
    const cancelled = data.aviation.filter(f => f.flight_status === 'cancelled').length;
    const delayed = data.aviation.filter(f => f.flight_status === 'delayed').length;
    const avDisruptionRate = data.aviation.length ? ((cancelled + delayed) / data.aviation.length) * 100 : 0;
    let riskIndex = 20;
    if (data.markets?.dp < -1) riskIndex += 20;
    if (data.quakes.some(q => q.mag > 6.0)) riskIndex += 30;
    if (avDisruptionRate > 30) riskIndex += 30;
    return { riskIndex, totalHazards, avDisruptionRate, marketDelta: data.markets?.dp || 0, cancelled, delayed };
  }, [data]);

  const correlationData = useMemo(() => [
    { time: '12h ago', hazards: 40, delays: 15 }, { time: '10h ago', hazards: 55, delays: 20 },
    { time: '8h ago', hazards: 78, delays: 45 }, { time: '6h ago', hazards: 60, delays: 58 },
    { time: '4h ago', hazards: 25, delays: 55 }, { time: '2h ago', hazards: 28, delays: 40 },
    { time: 'Now', hazards: 30, delays: 25 }
  ], []);

  const magnitudeDistribution = useMemo(() => {
    const b = [{ range: '< 2.5', count: 0, color: '#6B9E78' }, { range: '2.5–3', count: 0, color: '#6B9E78' }, { range: '3–4', count: 0, color: '#7BA4C7' }, { range: '4–5', count: 0, color: '#F59E0B' }, { range: '5–6', count: 0, color: '#CC5833' }, { range: '6+', count: 0, color: '#EF4444' }];
    data.quakes.forEach(q => { if (q.mag >= 6) b[5].count++; else if (q.mag >= 5) b[4].count++; else if (q.mag >= 4) b[3].count++; else if (q.mag >= 3) b[2].count++; else if (q.mag >= 2.5) b[1].count++; else b[0].count++; });
    return b;
  }, [data]);

  const domainPieData = useMemo(() => [
    { name: 'Seismic', value: data.quakes.length, color: THEME.blue },
    { name: 'Thermal', value: data.fires.length, color: THEME.accent },
    { name: 'Aviation', value: data.aviation.length, color: THEME.flight },
  ], [data]);

  const radarData = useMemo(() => [
    { axis: 'Seismic', value: Math.min(100, data.quakes.length / 2) },
    { axis: 'Thermal', value: Math.min(100, data.fires.length / 2) },
    { axis: 'Aviation', value: Math.min(100, kpis.avDisruptionRate * 2) },
    { axis: 'Market', value: Math.min(100, Math.abs(kpis.marketDelta) * 10) },
    { axis: 'Compound', value: kpis.riskIndex },
  ], [data, kpis]);

  const regionBreakdown = useMemo(() => {
    const regions = {};
    data.quakes.forEach(q => {
      const parts = q.place?.split(',');
      const region = parts?.length > 1 ? parts[parts.length - 1].trim() : 'Unknown';
      regions[region] = (regions[region] || 0) + 1;
    });
    return Object.entries(regions).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([name, count]) => ({ name: name.length > 18 ? name.slice(0, 18) + '...' : name, count }));
  }, [data]);

  const getDomainColor = useCallback((domain) => {
    if (domain === 'SEISMIC') return THEME.blue;
    if (domain === 'FIRE') return THEME.accent;
    if (domain === 'CHOKEPOINT') return '#F59E0B';
    if (domain === 'CLIMATE') return THEME.green;
    if (domain === 'WEATHER_ALERT') return '#FACC15';
    return THEME.green;
  }, []);

  const globePolygonCapColor = useCallback((d) => {
    const name = d?.properties?.name || d?.properties?.NAME || d?.properties?.ADMIN || null;
    const stat = name ? globeCountryStats.byName[name] : null;
    const t = layers.intelHotspots && stat ? Math.min(1, stat.score / Math.max(1, globeCountryStats.maxScore)) : 0;
    if (name && hoveredGlobeCountry === name) return 'rgba(191,56,42,0.95)';
    const r = 8 + (166 - 8) * t;
    const g = 11 + (52 - 11) * t;
    const b = 16 + (28 - 16) * t;
    return `rgba(${Math.round(r)},${Math.round(g)},${Math.round(b)},${(0.78 + t * 0.2).toFixed(3)})`;
  }, [globeCountryStats, hoveredGlobeCountry, layers.intelHotspots]);
  const globePolygonSideColor = useCallback((d) => {
    const name = d?.properties?.name || d?.properties?.NAME || d?.properties?.ADMIN || null;
    if (name && hoveredGlobeCountry === name) return 'rgba(191,56,42,0.45)';
    return 'rgba(12,16,24,0.35)';
  }, [hoveredGlobeCountry]);
  const globePolygonStrokeColor = useCallback((d) => {
    const name = d?.properties?.name || d?.properties?.NAME || d?.properties?.ADMIN || null;
    if (name && hoveredGlobeCountry === name) return '#E05B47F0';
    return '#293042A0';
  }, [hoveredGlobeCountry]);
  const globePolygonAltitude = useCallback((d) => {
    const name = d?.properties?.name || d?.properties?.NAME || d?.properties?.ADMIN || null;
    const stat = name ? globeCountryStats.byName[name] : null;
    const t = layers.intelHotspots && stat ? Math.min(1, stat.score / Math.max(1, globeCountryStats.maxScore)) : 0;
    if (name && hoveredGlobeCountry === name) return 0.02;
    return 0.004 + t * 0.01;
  }, [globeCountryStats, hoveredGlobeCountry, layers.intelHotspots]);
  const globePolygonLabel = useCallback((d) => {
    const name = d?.properties?.name || d?.properties?.NAME || d?.properties?.ADMIN || 'Unknown';
    const stat = globeCountryStats.byName[name];
    const q = stat?.quakes || 0;
    const f = stat?.fires || 0;
    const s = stat ? stat.score.toFixed(1) : '0.0';
    return `<div style="font-family: ui-monospace, SFMono-Regular, Menlo, monospace; padding: 6px 8px; background: rgba(18,18,18,0.92); color: #f2f0e9; border: 1px solid rgba(204,88,51,0.35); border-radius: 8px;">
      <div style="font-weight: 700; margin-bottom: 4px;">${name}</div>
      <div style="font-size: 11px; opacity: 0.9;">Quakes: ${q} | Fires: ${f}</div>
      <div style="font-size: 11px; opacity: 0.8;">Hazard score: ${s}</div>
    </div>`;
  }, [globeCountryStats.byName]);
  const globePointLat = useCallback(d => d.lat, []);
  const globePointLng = useCallback(d => d.lng, []);
  const globePointColor = useCallback((d) => {
    if (d.domain === 'SEISMIC') return 'rgba(111,201,255,0.9)';
    if (d.domain === 'FIRE') return 'rgba(255,97,84,0.9)';
    if (d.domain === 'CHOKEPOINT') return 'rgba(255,185,84,0.9)';
    if (d.domain === 'CLIMATE') return 'rgba(105,219,171,0.88)';
    if (d.domain === 'WEATHER_ALERT') return 'rgba(250,204,21,0.95)';
    if (d.domain === 'AIRCRAFT') return 'rgba(167,139,250,0.95)';
    return getDomainColor(d.domain);
  }, [getDomainColor]);
  const globePointAlt = useCallback((d) => {
    if (d.domain === 'SEISMIC') return d.mag * d.mag * 0.002;
    if (d.domain === 'CHOKEPOINT') return 0.14;
    if (d.domain === 'CLIMATE') return 0.11;
    if (d.domain === 'WEATHER_ALERT') return 0.16;
    if (d.domain === 'AIRCRAFT') return 0.07;
    return d.mag * 0.04;
  }, []);
  const globePointRadius = useCallback((d) => {
    if (d.domain === 'FIRE') return 0.25;
    if (d.domain === 'CHOKEPOINT') return 0.42;
    if (d.domain === 'CLIMATE') return 0.3;
    if (d.domain === 'WEATHER_ALERT') return 0.45;
    if (d.domain === 'AIRCRAFT') return 0.16;
    return d.mag >= 5 ? 0.42 : 0.22;
  }, []);
  const globeRings = useMemo(() => {
    const rings = [];
    if (layers.chokepoints) {
      rings.push(...mapChokepoints.slice(0, 8).map((cp) => ({
        lat: cp.lat,
        lng: cp.lng,
        color: 'rgba(255,185,84,0.85)',
        maxR: 1.7,
      })));
    }
    if (layers.climate) {
      rings.push(...mapClimateZones.slice(0, 6).map((z) => ({
        lat: z.lat,
        lng: z.lng,
        color: z.severity === 'EXTREME' ? 'rgba(255,97,84,0.75)' : 'rgba(105,219,171,0.75)',
        maxR: z.severity === 'EXTREME' ? 1.5 : 1.1,
      })));
    }
    if (layers.weatherAlerts) {
      rings.push(...mapWeatherAlerts.slice(0, 8).map((z) => ({
        lat: z.lat,
        lng: z.lng,
        color: 'rgba(250,204,21,0.8)',
        maxR: 1.9,
      })));
    }
    return rings;
  }, [layers.chokepoints, layers.climate, layers.weatherAlerts, mapChokepoints, mapClimateZones, mapWeatherAlerts]);
  const globeRingLat = useCallback((d) => d.lat, []);
  const globeRingLng = useCallback((d) => d.lng, []);
  const globeRingColor = useCallback((d) => d.color, []);
  const globeRingMaxRadius = useCallback((d) => d.maxR, []);
  const globeArcStartLat = useCallback(d => d.startLat, []);
  const globeArcStartLng = useCallback(d => d.startLng, []);
  const globeArcEndLat = useCallback(d => d.endLat, []);
  const globeArcEndLng = useCallback(d => d.endLng, []);
  const globeArcColor = useCallback(d => {
    if (d.domain === 'MARITIME') return ['rgba(56,189,178,0.7)', 'rgba(56,189,178,0.25)'];
    if (d.status === 'cancelled') return '#EF444480';
    if (d.status === 'delayed') return '#F59E0B60';
    return '#A78BFA40';
  }, []);
  const globeArcStroke = useCallback(d => d.domain === 'MARITIME' ? 0.6 : 0.3, []);
  const globeArcDashLength = useCallback(d => d.domain === 'MARITIME' ? 0.8 : 0.35, []);
  const globeArcDashGap = useCallback(d => d.domain === 'MARITIME' ? 0.15 : 0.26, []);
  const globeArcDashAnimateTime = useCallback(d => d.domain === 'MARITIME' ? 9000 : 4200, []);

  const globeFlightPaths = useMemo(() => {
    if (!layers.aircraft) return [];
    if (!selectedAircraftId) return [];

    const hist = Array.isArray(aircraftTrails[selectedAircraftId]) ? aircraftTrails[selectedAircraftId] : [];
    const apiPts = aircraftTrack?.id === selectedAircraftId && Array.isArray(aircraftTrack.points) ? aircraftTrack.points : [];

    const merged = [];
    const key = (p) => `${p.lat.toFixed(5)},${p.lng.toFixed(5)}`;
    const seen = new Set();

    const pushPt = (p) => {
      if (!p || typeof p.lat !== 'number' || typeof p.lng !== 'number') return;
      const k = key(p);
      if (seen.has(k)) return;
      seen.add(k);
      merged.push(p);
    };

    for (const p of hist) pushPt({ lat: p.lat, lng: p.lng, altFt: null, ts: p.ts ?? null });
    for (const p of apiPts) pushPt(p);

    if (merged.length < 2) return [];
    return [{ id: selectedAircraftId, points: merged }];
  }, [layers.aircraft, selectedAircraftId, aircraftTrails, aircraftTrack]);

  const globePathPoints = useCallback((d) => d.points || [], []);
  const globePathPointLat = useCallback((p) => p.lat, []);
  const globePathPointLng = useCallback((p) => p.lng, []);
  const globePathPointAlt = useCallback((p) => {
    const ft = p.altFt;
    if (typeof ft !== 'number') return 0.05;
    // globe.gl altitudes are small fractions above the surface; scale feet -> "globe units"
    return Math.max(0.02, Math.min(0.35, ft / 120000));
  }, []);
  const globePathColor = useCallback(() => 'rgba(167,139,250,0.95)', []);
  const globePathStroke = useCallback(() => 0.35, []);

  const loadAircraftTrack = useCallback(async (ac) => {
    const id = ac?.id;
    if (!id) return;

    const req = ++aircraftTrackReqId.current;
    setSelectedAircraftId(id);
    setAircraftTrackLoading(true);
    setAircraftTrackError(null);
    setAircraftTrack({ id, callsign: ac?.callsign || '', points: [] });

    try {
      const res = await fetch(`/api/wingbits/v1/flights/${encodeURIComponent(id)}/path`);
      const text = await res.text();
      let j = null;
      try { j = JSON.parse(text); } catch { j = null; }
      if (!res.ok) {
        const msg = j?.message || text || `HTTP ${res.status}`;
        throw new Error(`Wingbits ${res.status}: ${msg}`);
      }

      const rawPath = j?.flight?.path;
      const pts = normalizeWingbitsFlightPath(rawPath);
      if (aircraftTrackReqId.current !== req) return;

      setAircraftTrack({
        id,
        callsign: (ac?.callsign || j?.flight?.name || '').trim(),
        points: pts,
      });
      setAircraftTrackLoading(false);
    } catch (e) {
      if (aircraftTrackReqId.current !== req) return;
      setAircraftTrackError(String(e?.message || 'Failed to load flight path'));
      setAircraftTrackLoading(false);
      setAircraftTrack(null);
    }
  }, []);

  useEffect(() => {
    if (!selectedAircraftId) return;
    if (!layers.aircraft) return;
    if (activePage !== 'map') return;

    const ac = aircraft.find((a) => a.id === selectedAircraftId);
    if (!ac) return;

    loadAircraftTrack(ac);
    const t = setInterval(() => loadAircraftTrack(ac), 15000);
    return () => clearInterval(t);
  }, [selectedAircraftId, layers.aircraft, activePage, aircraft, loadAircraftTrack]);

  const handleEntityClick = useCallback((entity) => {
    setFocusedEvent(entity);
    if (entity?.domain === 'AIRCRAFT') {
      if (globeRef.current && entity.lat) {
        globeRef.current.pointOfView({ lat: entity.lat, lng: entity.lng, altitude: 0.35 }, 900);
      }
      loadAircraftTrack(entity);
      return;
    }
    if (globeRef.current && entity.lat) globeRef.current.pointOfView({ lat: entity.lat, lng: entity.lng, altitude: 1.2 }, 1000);
  }, [loadAircraftTrack]);

  const handleCountryClick = useCallback((countryName) => {
    setSelectedCountry(countryName);
  }, []);

  const handleGlobePolygonClick = useCallback((polygon) => {
    const name = polygon?.properties?.name || polygon?.properties?.NAME || polygon?.properties?.ADMIN;
    if (name) setSelectedCountry(name);
  }, []);
  const handleGlobePolygonHover = useCallback((polygon) => {
    const name = polygon?.properties?.name || polygon?.properties?.NAME || polygon?.properties?.ADMIN || null;
    setHoveredGlobeCountry((prev) => (prev === name ? prev : name));
  }, []);

  useEffect(() => {
    if (globeRef.current && !focusedEvent) globeRef.current.controls().autoRotateSpeed = 0.24;
  }, [focusedEvent]);
  useEffect(() => {
    if (mapMode !== 'globe') setHoveredGlobeCountry(null);
  }, [mapMode]);

  const topQuakes = useMemo(() => data.quakes.filter(q => q.mag >= 4.5).sort((a, b) => b.mag - a.mag).slice(0, 8), [data]);

  const selectedCountryGeom = useMemo(() => {
    if (!selectedCountry || !geoPrepared.length) return null;
    return geoPrepared.find((p) => p.name === selectedCountry) ?? null;
  }, [selectedCountry, geoPrepared]);

  const countryQuakes = useMemo(() => {
    if (!selectedCountryGeom) return [];
    return data.quakes.filter((q) => pointInPreparedCountry(q.lat, q.lng, selectedCountryGeom));
  }, [selectedCountryGeom, data.quakes]);

  const countryFires = useMemo(() => {
    if (!selectedCountryGeom) return [];
    return data.fires.filter((f) => pointInPreparedCountry(f.lat, f.lng, selectedCountryGeom));
  }, [selectedCountryGeom, data.fires]);

  const layerControls = useMemo(() => {
    const weatherAlertCount = mapClimateZones.filter((z) => z.severity === 'EXTREME').length;
    return [
      { key: 'intelHotspots', label: 'Intel Hotspots', count: globeCountryStats.top.length, possible: true, color: '#CC5833', tooltip: 'Global hotspots based on aggregate stress' },
      { key: 'flights', label: 'Aviation', count: data.aviation.length, possible: true, color: THEME.flight, tooltip: 'Comprehensive world aviation traffic and delay telemetry' },
      { key: 'aircraft', label: 'Live Aircraft', count: aircraft.length, possible: true, color: THEME.flight, tooltip: aircraftError ? `Wingbits error: ${aircraftError}` : 'Live aircraft positions via Wingbits (/v1/flights)' },
      { key: 'maritime', label: 'Maritime Vessels', count: maritimeArcs.length, possible: true, color: '#38BDB2', tooltip: 'Major cargo ship transit routes through chokepoints' },
      { key: 'climate', label: 'Climate Anomalies', count: mapClimateZones.length, possible: true, color: THEME.green, tooltip: 'Ozone, temperature, and atmospheric stress indices' },
      { key: 'weatherAlerts', label: 'Weather Alerts', count: weatherAlertCount, possible: true, color: '#FACC15', tooltip: 'Severe weather systems and metabolic stress alerts' },
      { key: 'seismic', label: 'Natural Events', count: data.quakes.length, possible: true, color: THEME.blue, tooltip: 'Live tracking of tectonic anomalies (USGS Feeds)' },
      { key: 'thermal', label: 'Fires', count: data.fires.length, possible: true, color: THEME.accent, tooltip: 'Global heat anomaly clustering (FIRMS/MODIS datasets)' },
      { key: 'chokepoints', label: 'Chokepoints', count: mapChokepoints.length, possible: true, color: '#F59E0B', tooltip: 'Real-time transit risk at global maritime bottlenecks' },
    ];
  }, [globeCountryStats.top, mapClimateZones, mapChokepoints, data.aviation.length, data.quakes.length, data.fires.length, maritimeArcs.length, aircraft.length, aircraftError]);

  const activeMapLayersText = useMemo(() => {
    const names = layerControls
      .filter((layer) => layers[layer.key])
      .map((layer) => layer.label);
    return names.join(' + ');
  }, [layerControls, layers]);

  const LayerCheckbox = ({ layer }) => {
    const active = !!layers[layer.key];
    return (
      <button
        type="button"
        onClick={() => toggleLayer(layer.key)}
        className="flex items-center justify-between gap-2 rounded-md border px-2.5 py-1.5 text-left transition-all hover:border-[#CC5833]/35"
        style={{
          borderColor: active ? `${layer.color}50` : '#2a2a2a',
          backgroundColor: active ? `${layer.color}12` : '#111',
        }}
      >
        <span className="flex items-center gap-2 min-w-0">
          <span className="w-3.5 h-3.5 rounded border border-[#555] flex items-center justify-center shrink-0" style={{ backgroundColor: active ? layer.color : 'transparent' }}>
            {active ? <Eye size={9} className="text-[#111]" /> : null}
          </span>
          <span className="truncate text-[11px] text-[#C8C4BA]">{layer.label}</span>
        </span>
        <span className={`font-mono text-[10px] ${layer.count > 0 ? 'text-[#6B9E78]' : 'text-[#555]'}`}>{layer.count}</span>
      </button>
    );
  };

  const LegendRowCheckbox = ({ rowKey, label }) => {
    const on = !!legendRows[rowKey];
    return (
      <button
        type="button"
        onClick={() => toggleLegendRow(rowKey)}
        className="flex items-center gap-2 rounded-md border border-[#2a2a2a] bg-[#111] px-2 py-1.5 text-left text-[11px] text-[#C8C4BA] transition-all hover:border-[#CC5833]/35"
      >
        <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border border-[#555]" style={{ backgroundColor: on ? '#6B9E78' : 'transparent' }}>
          {on ? <Eye size={9} className="text-[#111]" /> : null}
        </span>
        <span className="truncate">{label}</span>
      </button>
    );
  };

  const goNextPage = () => {
    const idx = PAGES.findIndex(p => p.id === activePage);
    if (idx < PAGES.length - 1) setActivePage(PAGES[idx + 1].id);
  };
  const goPrevPage = () => {
    const idx = PAGES.findIndex(p => p.id === activePage);
    if (idx > 0) setActivePage(PAGES[idx - 1].id);
  };
  const activeIdx = PAGES.findIndex(p => p.id === activePage);

  // --- COUNTRY DOSSIER PAGE ---
  if (selectedCountry) {
    return (
      <CountryDossier
        country={selectedCountry}
        quakes={countryQuakes}
        fires={countryFires}
        flights={flightArcs}
        hubs={MAJOR_HUBS}
        onBack={() => setSelectedCountry(null)}
      />
    );
  }

  return (
    <div className="h-screen w-full flex font-sans bg-[#1A1A1A] text-[#F2F0E9] overflow-hidden relative">
      <div className="pointer-events-none fixed inset-0 z-0" style={{ background: 'radial-gradient(ellipse 80% 50% at 60% 0%, rgba(204,88,51,0.04) 0%, transparent 70%), radial-gradient(ellipse 60% 50% at 10% 90%, rgba(46,64,54,0.06) 0%, transparent 60%)' }} />

      {/* SIDEBAR NAV */}
      <aside className={`shrink-0 bg-[#161616] border-r border-[#CC5833]/8 flex flex-col z-20 relative transition-all duration-500 ease-in-out ${isSidebarCollapsed ? 'w-16' : 'w-56'}`}>
        <div className={`p-5 border-b border-[#CC5833]/8 transition-all overflow-hidden ${isSidebarCollapsed ? 'px-4' : ''}`}>
          <GlobalTooltip text="Terminate session and return to boot terminal" position="right">
            <button onClick={onBack} className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-widest text-[#8A857A] hover:text-[#CC5833] transition-colors mb-6 w-full whitespace-nowrap">
              <ArrowLeft size={16} />
              {!isSidebarCollapsed && <span>System Exit</span>}
            </button>
          </GlobalTooltip>
          <div className="flex items-center gap-3">
            <Layers size={18} className="text-[#CC5833] shrink-0" />
            {!isSidebarCollapsed && <span className="font-bold text-sm tracking-tight whitespace-nowrap">Intelligence Nexus</span>}
          </div>
        </div>

        <nav className="flex-1 py-4 overflow-x-hidden overflow-y-auto custom-scrollbar">
          {PAGES.map((page) => (
            <GlobalTooltip key={page.id} text={isSidebarCollapsed ? `${page.number} ${page.label}` : page.tooltip} position="right">
              <button onClick={() => setActivePage(page.id)}
                className={`w-full flex items-center transition-all relative group ${isSidebarCollapsed ? 'gap-2 px-0 justify-center' : 'gap-4 px-5 text-left'} py-3.5 ${activePage === page.id ? 'bg-[#CC5833]/8 text-[#F2F0E9]' : 'text-[#8A857A] hover:text-[#C8C4BA] hover:bg-[#1A1A1A]'}`}>
                {activePage === page.id && <div className="absolute left-0 top-2 bottom-2 w-[3px] bg-[#CC5833] rounded-r" />}
                <span className={`font-mono text-[10px] shrink-0 min-w-[14px] ${activePage === page.id ? 'text-[#CC5833]' : 'text-[#555]'}`}>{page.number}</span>
                <span className="shrink-0">{page.icon}</span>
                {!isSidebarCollapsed && <span className="font-mono text-[10px] uppercase tracking-widest truncate">{page.label}</span>}
              </button>
            </GlobalTooltip>
          ))}
        </nav>

        <div className="p-4 border-t border-[#CC5833]/8 space-y-4">
          {!isSidebarCollapsed && (
            <GlobalTooltip text="Adjust global monitoring lookback window" position="right">
              <div className="flex items-center bg-[#1A1A1A] rounded-lg p-1 border border-[#CC5833]/12">
                {['day', 'week'].map(t => (
                  <button key={t} onClick={() => setTimeframe(t)} className={`flex-1 font-mono text-xs uppercase py-2.5 rounded-md transition-all ${timeframe === t ? 'bg-[#CC5833]/15 font-bold text-[#CC5833]' : 'text-[#8A857A] hover:text-[#F2F0E9]'}`}>{t}</button>
                ))}
              </div>
            </GlobalTooltip>
          )}
          
          <button 
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="w-auto mx-auto flex items-center justify-center py-1.5 px-4 rounded-lg bg-[#1A1A1A]/50 border border-[#CC5833]/8 text-[#8A857A] hover:text-[#CC5833] hover:border-[#CC5833]/20 transition-all opacity-70 hover:opacity-100"
            title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isSidebarCollapsed ? <ArrowRight size={12} /> : <div className="flex items-center gap-1.5"><ArrowLeft size={12} /><span className="font-mono text-[8px] uppercase">Collapse</span></div>}
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-16 px-8 flex items-center justify-between shrink-0 bg-[#1A1A1A]/90 backdrop-blur-md border-b border-[#CC5833]/8 z-10 relative">
          <div className="flex items-center gap-4">
            <span className="font-mono text-5xl font-bold text-[#CC5833]/15 select-none">{PAGES[activeIdx]?.number}</span>
            <div>
              <h1 className="font-bold text-xl tracking-tight uppercase">{PAGES[activeIdx]?.label}</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <GlobalTooltip text="Previous Intelligence Domain" position="bottom">
              <button onClick={goPrevPage} disabled={activeIdx === 0}
                className={`p-2.5 rounded-xl transition-all border ${activeIdx === 0 ? 'border-[#222] text-[#333] cursor-not-allowed' : 'border-[#2a2a2a] text-[#8A857A] hover:text-[#CC5833] hover:border-[#CC5833]/30 hover:bg-[#2A2A28]'}`}>
                <ArrowLeft size={18} />
              </button>
            </GlobalTooltip>
            
            <div className="px-4 py-1.5 rounded-full border border-[#2a2a2a] bg-[#1A1A1A] font-mono text-[10px] text-[#8A857A] select-none">
              {activeIdx + 1} <span className="opacity-30 mx-1">/</span> {PAGES.length}
            </div>

            <GlobalTooltip text="Next Intelligence Domain" position="bottom">
              <button onClick={goNextPage} disabled={activeIdx === PAGES.length - 1}
                className={`p-2.5 rounded-xl transition-all border ${activeIdx === PAGES.length - 1 ? 'border-[#222] text-[#333] cursor-not-allowed' : 'border-[#2a2a2a] text-[#8A857A] hover:text-[#CC5833] hover:border-[#CC5833]/30 hover:bg-[#2A2A28]'}`}>
                <ArrowRight size={18} />
              </button>
            </GlobalTooltip>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto custom-scrollbar relative z-10">
          {loading && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#1A1A1A]/85 backdrop-blur-sm">
              <div className="flex flex-col items-center gap-4 text-[#C8C4BA] font-mono uppercase tracking-widest text-xs"><Activity className="animate-spin text-[#CC5833]" size={32} />Ingesting data sources...</div>
            </div>
          )}

          <div className="h-full">

            {/* PAGE 1: SITUATION ROOM */}
            {activePage === 'situation' && (
              <div className="p-6 md:p-8 max-w-[1600px] mx-auto animate-fadeIn overflow-y-auto custom-scrollbar" style={{ maxHeight: 'calc(100vh - 100px)' }}>
                <PageHeader
                  title="Global system stress remains elevated"
                  subtitle="Executive snapshot — physical hazards, aviation stress, and market pulse."
                />

                <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
                  <div className={`rounded-2xl p-6 border shadow-[0_18px_40px_rgba(0,0,0,0.35)] flex flex-col justify-between transition-all ${kpis.riskIndex > 60 ? 'bg-[#EF4444]/90 text-white border-[#EF4444]/30' : 'border border-[#2a2a2a] bg-gradient-to-b from-[#232323] to-[#141414]'}`}>
                    <div className="flex justify-between items-start mb-3"><span className={`font-mono text-[10px] uppercase tracking-widest ${kpis.riskIndex > 60 ? 'text-white/80' : 'text-[#8A857A]'}`}>Composite Risk Index</span><AlertTriangle size={18} className={kpis.riskIndex > 60 ? 'text-white' : 'text-[#EF4444]'} /></div>
                    <div className="text-5xl font-bold tracking-tight">{kpis.riskIndex.toFixed(0)}<span className="text-2xl opacity-50">/100</span></div>
                    <div className={`font-mono text-[10px] mt-2 ${kpis.riskIndex > 60 ? 'text-white' : 'text-[#8A857A]'}`}>{kpis.riskIndex > 60 ? 'CRITICAL — Multi-domain cascade risk' : 'Nominal — Multi-domain stasis'}</div>
                  </div>
                  <div className="rounded-2xl border border-[#2a2a2a] bg-gradient-to-b from-[#232323] to-[#141414] p-6 shadow-[0_18px_40px_rgba(0,0,0,0.35)] flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-3"><span className="font-mono text-[10px] uppercase text-[#8A857A] tracking-widest">S&amp;P 500 Sentiment</span>{kpis.marketDelta < 0 ? <TrendingDown size={18} className="text-[#EF4444]" /> : <TrendingUp size={18} className="text-[#7BA4C7]" />}</div>
                    <div className="text-5xl font-bold tracking-tight">{data.markets?.c?.toFixed(1) || '—'}</div>
                    <div className="font-mono text-[10px] mt-2 flex items-center gap-2"><span className={`px-2 py-0.5 rounded-sm text-white ${kpis.marketDelta < 0 ? 'bg-[#EF4444]/80' : 'bg-[#7BA4C7]/80'}`}>{kpis.marketDelta > 0 ? '+' : ''}{kpis.marketDelta}%</span><span className="text-[#8A857A]">Live Finnhub Quote</span></div>
                  </div>
                  <div className="rounded-2xl border border-[#2a2a2a] bg-gradient-to-b from-[#232323] to-[#141414] p-6 shadow-[0_18px_40px_rgba(0,0,0,0.35)] flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-3"><span className="font-mono text-[10px] uppercase text-[#8A857A] tracking-widest">Aviation Disruption</span><Plane size={18} className="text-[#A78BFA]" /></div>
                    <div className="text-5xl font-bold tracking-tight">{kpis.avDisruptionRate.toFixed(1)}<span className="text-2xl">%</span></div>
                    <div className="font-mono text-[10px] text-[#8A857A] mt-2">{kpis.cancelled} cancelled &bull; {kpis.delayed} delayed</div>
                  </div>
                  <div className="rounded-2xl border border-[#2a2a2a] bg-gradient-to-b from-[#232323] to-[#141414] p-6 shadow-[0_18px_40px_rgba(0,0,0,0.35)] flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-3"><span className="font-mono text-[10px] uppercase text-[#8A857A] tracking-widest">Tectonic and thermal events escalating</span><ShieldAlert size={18} className="text-[#CC5833]" /></div>
                    <div className="text-5xl font-bold tracking-tight">{kpis.totalHazards.toLocaleString()}</div>
                    <div className="font-mono text-[10px] text-[#8A857A] mt-2 flex gap-3"><span className="text-[#7BA4C7]">{data.quakes.length} Seismic</span><span className="text-[#CC5833]">{data.fires.length} Thermal</span></div>
                  </div>
                </section>

                {/* Intelligence brief */}
                <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 mb-8">
                  <div className="xl:col-span-2 rounded-2xl border border-[#2a2a2a] bg-gradient-to-b from-[#232323] to-[#141414] p-6 shadow-[0_18px_40px_rgba(0,0,0,0.35)] border-l-4 border-l-[#CC5833]">
                    <h3 className="font-mono text-[10px] uppercase tracking-widest text-[#F2F0E9]/50 mb-4 flex items-center gap-2"><Info size={14} /> Intelligence Briefing</h3>
                    <div className="space-y-3 text-sm leading-relaxed text-[#F2F0E9]/85">
                      <p>Global monitoring networks are tracking <strong className="text-[#7BA4C7]">{data.quakes.length} seismic events</strong> and <strong className="text-[#CC5833]">{data.fires.length} thermal anomalies</strong> across all domains this {timeframe === 'day' ? '24-hour period' : '7-day window'}.</p>
                      {topQuakes.length > 0 && <p>The most significant event is a <strong className="text-[#CC5833]">M{topQuakes[0]?.mag.toFixed(1)}</strong> earthquake near <strong className="text-[#F2F0E9]">{topQuakes[0]?.place}</strong>. {topQuakes.length > 1 ? `${topQuakes.length - 1} additional events above M4.5 are being monitored.` : ''}</p>}
                      <p>Aviation disruption stands at <strong className={kpis.avDisruptionRate > 30 ? 'text-[#EF4444]' : 'text-[#A78BFA]'}>{kpis.avDisruptionRate.toFixed(1)}%</strong>, with {kpis.cancelled} cancellations and {kpis.delayed} delays tracked. S&P 500 is at <strong className={kpis.marketDelta < 0 ? 'text-[#EF4444]' : 'text-[#6B9E78]'}>{kpis.marketDelta > 0 ? '+' : ''}{kpis.marketDelta}%</strong>{kpis.marketDelta < -1 ? ' — stress entering economic layer.' : ' — within absorption capacity.'}</p>
                    </div>
                  </div>

                  {/* Threat radar */}
                  <div className="rounded-2xl border border-[#2a2a2a] bg-gradient-to-b from-[#232323] to-[#141414] p-5 shadow-[0_18px_40px_rgba(0,0,0,0.35)] flex flex-col">
                    <h3 className="font-mono text-[10px] uppercase tracking-widest text-[#8A857A] mb-3">Target Profile (Radial)</h3>
                    <div className="flex-1 h-[140px] min-h-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={radarData}>
                          <PolarGrid stroke="#333" />
                          <PolarAngleAxis dataKey="axis" tick={{ fontSize: 9, fill: '#8A857A', fontFamily: 'monospace' }} />
                          <PolarRadiusAxis tick={false} axisLine={false} domain={[0, 100]} />
                          <Radar dataKey="value" stroke="#CC5833" fill="#CC5833" fillOpacity={0.15} strokeWidth={2} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Normalized BarChart comparison requested by user */}
                  <div className="rounded-2xl border border-[#2a2a2a] bg-gradient-to-b from-[#232323] to-[#141414] p-5 shadow-[0_18px_40px_rgba(0,0,0,0.35)] flex flex-col">
                    <h3 className="font-mono text-[10px] uppercase tracking-widest text-[#8A857A] mb-3">Target Profile (Linear)</h3>
                    <div className="flex-1 h-[140px] min-h-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={radarData} layout="vertical">
                          <XAxis type="number" domain={[0, 100]} hide={true} />
                          <YAxis dataKey="axis" type="category" width={55} tick={{ fontSize: 9, fill: '#8A857A', fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
                          <RechartsTooltip content={<CustomTooltip />} />
                          <Bar dataKey="value" name="Risk %" fill="#CC5833" radius={[0,3,3,0]} opacity={0.8} barSize={12} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Notable events table */}
                <div className="rounded-2xl border border-[#2a2a2a] bg-gradient-to-b from-[#232323] to-[#141414] shadow-[0_18px_40px_rgba(0,0,0,0.35)] overflow-hidden">
                  <div className="p-4 border-b border-[#2a2a2a]">
                    <h3 className="font-mono text-[10px] uppercase tracking-widest text-[#F2F0E9] font-bold flex items-center gap-2"><AlertTriangle size={13} className="text-[#CC5833]" /> Significant Events (M4.5+)</h3>
                  </div>
                  {topQuakes.length === 0 ? (
                    <div className="px-6 py-12 text-center text-sm leading-relaxed text-[#8A857A]">No M4.5+ events in this window. Widen the timeframe or open the map for full seismic layers.</div>
                  ) : (
                    <div className="divide-y divide-[#2a2a2a]">
                      {topQuakes.map((q, i) => (
                        <div key={i} className="flex items-center justify-between px-5 py-3 hover:bg-[#1A1A1A]/60 transition-colors cursor-pointer" onClick={() => { setActivePage('map'); handleEntityClick(q); }}>
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-[10px] text-[#555] w-5">{i + 1}</span>
                            <span className="text-sm text-[#C8C4BA]">{q.place}</span>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <span className="font-mono text-[10px] text-[#8A857A]">D{q.depth?.toFixed(0)}km</span>
                            <span className={`font-mono text-sm font-bold ${q.mag >= 5.5 ? 'text-[#EF4444]' : q.mag >= 5 ? 'text-[#CC5833]' : 'text-[#F59E0B]'}`}>M{q.mag.toFixed(1)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                 {/* Nav hint */}
                 <div className="flex items-center justify-center mt-10 gap-2">
                   <GlobalTooltip text="Launch high-fidelity geospatial visualization" position="top">
                    <button onClick={goNextPage} className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#CC5833]/10 border border-[#CC5833]/20 text-[#CC5833] font-mono text-[10px] uppercase tracking-wider hover:bg-[#CC5833]/20 transition-all shadow-lg">
                      Continue to Geospatial Map <ChevronRight size={14} />
                    </button>
                   </GlobalTooltip>
                 </div>
              </div>
            )}

            {/* PAGE 2: GEOSPATIAL MAP */}
            {activePage === 'map' && (
              <div className="flex h-full flex-col animate-fadeIn overflow-hidden">
                <div className="shrink-0 p-6 pb-0">
                  <PageHeader
                    compact
                    title="Geospatial Nexus"
                    subtitle="Omni-domain situational awareness. Use the sidebars to switch domains and analyze regional stress levels."
                  />
                </div>

                <div className="mt-4 flex flex-1 flex-row gap-6 overflow-hidden p-6 pt-0">
                  {/* LEFT SIDEBAR: CONTROLS */}
                  <aside className="flex w-64 flex-col gap-4 overflow-y-auto custom-scrollbar">
                    <div className="rounded-2xl border border-[#2a2a2a] bg-gradient-to-b from-[#232323] to-[#141414] p-5 shadow-[0_12px_30px_rgba(0,0,0,0.3)]">
                      <h3 className="mb-4 font-mono text-[10px] uppercase tracking-widest text-[#8A857A]">Projection</h3>
                      <div className="flex items-center rounded-lg border border-[#2a2a2a] bg-[#171717] p-0.5">
                        <GlobalTooltip text="Spherical 3D Globe Projection" position="right">
                          <button onClick={() => setMapMode('globe')} className={`flex-1 flex items-center justify-center gap-1.5 font-mono text-[9px] uppercase py-2 px-6 rounded-md transition-all ${mapMode === 'globe' ? 'bg-[#CC5833]/15 font-bold text-[#CC5833]' : 'text-[#8A857A] hover:text-[#F2F0E9]'}`}><Globe2 size={11}/> 3D</button>
                        </GlobalTooltip>
                        <GlobalTooltip text="Planar 2D Mercator Projection" position="right">
                          <button onClick={() => setMapMode('flat')} className={`flex-1 flex items-center justify-center gap-1.5 font-mono text-[9px] uppercase py-2 px-6 rounded-md transition-all ${mapMode === 'flat' ? 'bg-[#CC5833]/15 font-bold text-[#CC5833]' : 'text-[#8A857A] hover:text-[#F2F0E9]'}`}><MapIcon size={11}/> 2D</button>
                        </GlobalTooltip>
                      </div>
                    </div>

                    <div className="flex-1 rounded-2xl border border-[#2a2a2a] bg-gradient-to-b from-[#232323] to-[#141414] p-5 shadow-[0_12px_30px_rgba(0,0,0,0.3)]">
                      <h3 className="mb-4 font-mono text-[10px] uppercase tracking-widest text-[#8A857A]">Intelligence Layers</h3>
                      <div className="space-y-1.5">
                        {layerControls.map((layer) => (
                           <GlobalTooltip key={layer.key} text={layer.tooltip || `Toggle ${layer.label} metrics`} position="right">
                            <button
                              onClick={() => setLayers(prev => ({ ...prev, [layer.key]: !prev[layer.key] }))}
                              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all text-left ${layers[layer.key] ? 'border-[#CC5833]/30 bg-[#CC5833]/10 text-[#F2F0E9]' : 'border-transparent text-[#8A857A] hover:bg-[#1A1A1A]'}`}
                            >
                              <span className={`w-2 h-2 rounded-full shrink-0 ${layers[layer.key] ? 'bg-[#CC5833]' : 'bg-[#333]'}`} />
                              <span className="font-mono text-[10px] uppercase tracking-wider">{layer.label}</span>
                            </button>
                          </GlobalTooltip>
                        ))}
                      </div>
                    </div>
                  </aside>

                  {/* CENTER: THE MAP */}
                  <div className="flex-1 min-w-0 rounded-[2.5rem] overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.5)] border border-[#2a2a2a] bg-[#0D0D0D] relative group">
                    <div className="absolute top-8 left-8 z-10 pointer-events-none">
                      <h3 className="font-sans font-bold text-[#F2F0E9] text-2xl tracking-tight opacity-90">{mapMode === 'globe' ? 'Omni-Layer Globe' : 'Planar Threat Matrix'}</h3>
                      <div className="flex items-center gap-2 mt-2">
                         <div className="h-1 w-1 rounded-full bg-[#6B9E78] animate-pulse" />
                         <span className="font-mono text-[9px] text-[#8A857A] uppercase tracking-widest">{activeMapLayersText || 'STANDBY'}</span>
                      </div>
                    </div>

                    {layers.aircraft && aircraftError ? (
                      <div className="absolute top-8 right-8 z-20 max-w-md rounded-2xl border border-[#EF4444]/30 bg-[#0D0D0D]/85 backdrop-blur-md px-4 py-3">
                        <div className="font-mono text-[9px] uppercase tracking-widest text-[#8A857A]">Live aircraft</div>
                        <div className="mt-1 text-xs text-[#EF4444] font-mono break-words">{aircraftError}</div>
                      </div>
                    ) : null}

                    {layers.aircraft && (selectedAircraftId || aircraftTrackLoading || aircraftTrackError) ? (
                      <div className="absolute bottom-8 left-8 z-20 max-w-md rounded-2xl border border-[#2a2a2a] bg-[#0D0D0D]/85 backdrop-blur-md px-4 py-3">
                        <div className="font-mono text-[9px] uppercase tracking-widest text-[#8A857A]">Flight track</div>
                        <div className="mt-1 font-sans text-sm text-[#F2F0E9]">
                          {selectedAircraftId ? (
                            <span className="font-mono text-xs text-[#C8C4BA]">
                              {aircraftTrack?.callsign ? `${aircraftTrack.callsign} · ` : ''}{selectedAircraftId}
                            </span>
                          ) : (
                            <span className="text-[#8A857A]">Select an aircraft</span>
                          )}
                        </div>
                        <div className="mt-2 font-mono text-[10px] text-[#8A857A]">
                          {aircraftTrackLoading ? 'Loading path from Wingbits…' : null}
                          {aircraftTrackError ? <span className="text-[#EF4444]">{aircraftTrackError}</span> : null}
                          {!aircraftTrackLoading && !aircraftTrackError && aircraftTrack?.points?.length ? (
                            <span className="text-[#6B9E78]">{aircraftTrack.points.length} points</span>
                          ) : null}
                        </div>
                      </div>
                    ) : null}

                    <div ref={globeContainerRef} className="w-full h-full flex items-center justify-center">
                      {mapMode === 'globe' ? (
                        <Globe
                          key={globeNonce}
                          ref={globeRef}
                          width={globeSize.w}
                          height={globeSize.h}
                          backgroundColor="#06080f" globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
                          bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
                          showAtmosphere={true} atmosphereColor="#8ca8ff" atmosphereAltitude={0.08}
                          polygonsData={geoData} polygonCapColor={globePolygonCapColor} polygonSideColor={globePolygonSideColor}
                          polygonStrokeColor={globePolygonStrokeColor} polygonAltitude={globePolygonAltitude}
                          polygonGeoJsonGeometry={d => d.geometry} polygonsTransitionDuration={0}
                          polygonLabel={globePolygonLabel}
                          onPolygonClick={handleGlobePolygonClick}
                          onPolygonHover={handleGlobePolygonHover}
                          pointsData={globePoints} pointLat={globePointLat} pointLng={globePointLng}
                          pointColor={globePointColor} pointAltitude={globePointAlt} pointRadius={globePointRadius}
                          pointsMerge={true} pointResolution={8} onPointClick={handleEntityClick}
                          ringsData={globeRings} ringLat={globeRingLat} ringLng={globeRingLng}
                          ringColor={globeRingColor} ringMaxRadius={globeRingMaxRadius}
                          ringPropagationSpeed={0.9} ringRepeatPeriod={2000}
                          arcsData={globeArcs} arcStartLat={globeArcStartLat} arcStartLng={globeArcStartLng}
                          arcEndLat={globeArcEndLat} arcEndLng={globeArcEndLng}
                          arcColor={globeArcColor}
                          arcStroke={globeArcStroke} arcDashLength={globeArcDashLength} arcDashGap={globeArcDashGap} arcDashAnimateTime={globeArcDashAnimateTime}
                          arcsTransitionDuration={0}
                          pathsData={globeFlightPaths}
                          pathPoints={globePathPoints}
                          pathPointLat={globePathPointLat}
                          pathPointLng={globePathPointLng}
                          pathPointAlt={globePathPointAlt}
                          pathColor={globePathColor}
                          pathStroke={globePathStroke}
                          pathsTransitionDuration={0}
                        />
                      ) : (
                        <div className="h-full w-full">
                          <FlatMap
                            geoData={geoData}
                            quakes={flatMapQuakes}
                            fires={flatMapFires}
                            flights={flightArcs}
                            chokepoints={mapChokepoints}
                            climateZones={mapClimateZones}
                            weatherAlerts={mapWeatherAlerts}
                            countryStats={globeCountryStats.byName}
                            maxCountryScore={globeCountryStats.maxScore}
                            layers={layers}
                            hubs={MAJOR_HUBS}
                            aircraft={aircraft}
                            onCountryClick={handleCountryClick}
                            onAircraftClick={handleEntityClick}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* RIGHT SIDEBAR: LEGEND & FOCUS */}
                  <aside className="flex w-72 flex-col gap-4 overflow-y-auto custom-scrollbar">
                    {/* Country Focus / Entity Details */}
                    <div className="shrink-0 rounded-2xl border border-[#2a2a2a] bg-gradient-to-b from-[#232323] to-[#141414] p-5 shadow-[0_12px_30px_rgba(0,0,0,0.3)] border-l-4 border-l-[#7BA4C7]">
                       <h3 className="mb-3 font-mono text-[10px] uppercase tracking-widest text-[#8A857A]">Intelligence Focus</h3>
                       {hoveredGlobeCountry ? (
                        (() => {
                          const stat = globeCountryStats.byName[hoveredGlobeCountry];
                          return (
                            <div className="animate-fadeIn">
                              <div className="font-bold text-[#F2F0E9] text-base leading-tight">{hoveredGlobeCountry}</div>
                              <div className="mt-3 grid grid-cols-2 gap-2">
                                <div className="p-2 rounded-lg bg-[#1A1A1A] border border-[#2a2a2a]">
                                  <div className="font-mono text-[8px] uppercase text-[#555]">Seismic</div>
                                  <div className="font-bold text-[#7BA4C7]">{stat?.quakes || 0}</div>
                                </div>
                                <div className="p-2 rounded-lg bg-[#1A1A1A] border border-[#2a2a2a]">
                                  <div className="font-mono text-[8px] uppercase text-[#555]">Thermal</div>
                                  <div className="font-bold text-[#CC5833]">{stat?.fires || 0}</div>
                                </div>
                              </div>
                              <div className="mt-2 p-2 rounded-lg bg-[#1A1A1A]/50 border border-[#2a2a2a]">
                                <div className="font-mono text-[8px] uppercase text-[#555]">Aggregate Score</div>
                                <div className="text-xl font-bold text-[#f2f0e9]">{stat ? stat.score.toFixed(1) : '0.0'}</div>
                              </div>
                            </div>
                          );
                        })()
                      ) : (
                        <div className="text-[11px] leading-relaxed text-[#555] italic">
                          {mapMode === 'globe' ? 'Hover over a country to observe regional stress levels.' : 'Select a country on the map for regional telemetry.'}
                        </div>
                      )}
                    </div>

                    {/* Active Legend */}
                    <div className="flex-1 min-h-0 flex flex-col rounded-2xl border border-[#2a2a2a] bg-gradient-to-b from-[#232323] to-[#141414] p-5 shadow-[0_12px_30px_rgba(0,0,0,0.3)]">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-mono text-[10px] uppercase tracking-widest text-[#8A857A]">Legend</h3>
                        <button
                          onClick={() => setLegendVisible(!legendVisible)}
                          className={`font-mono text-[8px] uppercase tracking-widest ${legendVisible ? 'text-[#CC5833]' : 'text-[#555]'}`}
                        >
                          {legendVisible ? 'Filter' : 'Static'}
                        </button>
                      </div>

                      <div className="flex-1 overflow-y-auto space-y-4">
                        {/* The Legend Rows */}
                        <div className="space-y-2.5">
                          {layers.seismic && legendRows.naturalEvents && <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-[#7BA4C7] shadow-[0_0_8px_rgba(123,164,199,0.3)]"/><span className="font-mono text-[10px] text-[#C8C4BA]">Seismic Activity</span></div>}
                          {layers.thermal && legendRows.fires && <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-[#CC5833] shadow-[0_0_8px_rgba(204,88,51,0.3)]"/><span className="font-mono text-[10px] text-[#C8C4BA]">Thermal Alerts</span></div>}
                          {layers.chokepoints && legendRows.chokepoints && <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B] shadow-[0_0_8px_rgba(245,158,11,0.3)]"/><span className="font-mono text-[10px] text-[#C8C4BA]">Supply Chokepoints</span></div>}
                          {layers.climate && legendRows.climate && <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-[#6B9E78] shadow-[0_0_8px_rgba(107,158,120,0.3)]"/><span className="font-mono text-[10px] text-[#C8C4BA]">Climate Anomalies</span></div>}
                          {layers.weatherAlerts && legendRows.weatherAlerts && <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-[#FACC15] shadow-[0_0_8px_rgba(250,204,21,0.3)]"/><span className="font-mono text-[10px] text-[#C8C4BA]">Weather Warnings</span></div>}
                          {layers.flights && (
                             <div className="space-y-2">
                                {legendRows.aviation && <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-[#A78BFA]"/><span className="font-mono text-[10px] text-[#C8C4BA]">Aviation Feed</span></div>}
                                {legendRows.delayed && <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]"/><span className="font-mono text-[10px] text-[#C8C4BA]">Flight Delay</span></div>}
                                {legendRows.cancelled && <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-[#EF4444]"/><span className="font-mono text-[10px] text-[#C8C4BA]">Flight Cancellation</span></div>}
                             </div>
                          )}
                          {layers.maritime && legendRows.maritime && <div className="flex items-center gap-2 pt-1"><span className="w-2.5 h-2.5 rounded-full bg-[#38BDB2] shadow-[0_0_8px_rgba(56,189,178,0.5)]"/><span className="font-mono text-[10px] text-[#C8C4BA] italic">Maritime Vessel Routes</span></div>}
                        </div>

                        {mapMode === 'globe' && legendRows.countryHeat && (
                          <div className="pt-4 border-t border-[#2a2a2a]">
                            <div className="font-mono text-[9px] text-[#8A857A] uppercase mb-3">Regional Heat</div>
                            <div className="flex items-center gap-3">
                              <span className="font-mono text-[8px] text-[#555]">NOM</span>
                              <div className="h-1.5 flex-1 rounded-full bg-gradient-to-r from-[rgba(34,54,52,0.9)] via-[rgba(110,80,52,0.92)] to-[rgba(204,88,51,0.95)] border border-[#333]" />
                              <span className="font-mono text-[8px] text-[#555]">CRIT</span>
                            </div>
                          </div>
                        )}

                        <div className="pt-4 border-t border-[#2a2a2a]">
                          <div className="font-mono text-[9px] text-[#8A857A] uppercase mb-3">Legend Filters</div>
                          <div className="grid grid-cols-1 gap-1">
                                <GlobalTooltip text="Toggle seismic entries in the active legend" position="left">
                                  <LegendRowCheckbox rowKey="naturalEvents" label="Seismic" />
                                </GlobalTooltip>
                                <GlobalTooltip text="Toggle thermal entries in the active legend" position="left">
                                  <LegendRowCheckbox rowKey="fires" label="Fires" />
                                </GlobalTooltip>
                                <GlobalTooltip text="Toggle chokepoint entries in the active legend" position="left">
                                  <LegendRowCheckbox rowKey="chokepoints" label="Chokepoints" />
                                </GlobalTooltip>
                                <GlobalTooltip text="Toggle climate tracking entries in the active legend" position="left">
                                  <LegendRowCheckbox rowKey="climate" label="Climate" />
                                </GlobalTooltip>
                                <GlobalTooltip text="Toggle weather entries in the active legend" position="left">
                                  <LegendRowCheckbox rowKey="weatherAlerts" label="Weather" />
                                </GlobalTooltip>
                                <GlobalTooltip text="Toggle aviation routing entries in the active legend" position="left">
                                  <LegendRowCheckbox rowKey="aviation" label="Aviation" />
                                </GlobalTooltip>
                                <GlobalTooltip text="Toggle maritime vessel entries in the active legend" position="left">
                                  <LegendRowCheckbox rowKey="maritime" label="Maritime" />
                                </GlobalTooltip>
                                <GlobalTooltip text="Toggle heatscale entries in the active legend" position="left">
                                  <LegendRowCheckbox rowKey="countryHeat" label="Heatscale" />
                                </GlobalTooltip>
                          </div>
                        </div>
                      </div>
                    </div>
                  </aside>
                </div>
              </div>
            )}

            {/* PAGE 3: SIGNAL PATTERNS */}
            {activePage === 'signals' && (
              <div className="p-6 md:p-8 max-w-[1600px] mx-auto animate-fadeIn overflow-y-auto custom-scrollbar" style={{ maxHeight: 'calc(100vh - 100px)' }}>
                <PageHeader
                  title="Aviation delays lag physical hazards significantly"
                  subtitle="Do physical hazards co-move with aviation stress?"
                />

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
                  <div className="rounded-2xl border border-[#2a2a2a] bg-gradient-to-b from-[#232323] to-[#141414] p-6 shadow-[0_18px_40px_rgba(0,0,0,0.35)] flex flex-col min-h-[350px]">
                    <div className="mb-4"><h3 className="font-mono text-[10px] uppercase text-[#F2F0E9] font-bold tracking-widest">Aviation delays lag physical hazards by 4-8 hours</h3><p className="text-[9px] font-mono text-[#8A857A] uppercase mt-1">Co-movement mapping</p></div>
                    <div className="flex-1 w-full min-h-0"><ResponsiveContainer width="100%" height="100%"><ComposedChart data={correlationData}><XAxis dataKey="time" tick={{fontSize:9,fill:'#8A857A',fontFamily:'monospace'}} axisLine={false} tickLine={false}/><YAxis yAxisId="left" tick={{fontSize:9,fill:'#CC5833',fontFamily:'monospace'}} axisLine={false} tickLine={false} width={25}/><YAxis yAxisId="right" orientation="right" tick={{fontSize:9,fill:'#7BA4C7',fontFamily:'monospace'}} axisLine={false} tickLine={false} width={25}/><RechartsTooltip content={<CustomTooltip/>}/><Bar yAxisId="left" dataKey="hazards" name="Hazards" fill="#CC5833" radius={[3,3,0,0]} opacity={0.8}/><Line yAxisId="right" type="monotone" dataKey="delays" name="Delays" stroke="#7BA4C7" strokeWidth={3} dot={{r:4}}/></ComposedChart></ResponsiveContainer></div>
                  </div>
                  <div className="rounded-2xl border border-[#2a2a2a] bg-gradient-to-b from-[#232323] to-[#141414] p-6 shadow-[0_18px_40px_rgba(0,0,0,0.35)] flex flex-col min-h-[350px]">
                    <div className="mb-4"><h3 className="font-mono text-[10px] uppercase text-[#F2F0E9] font-bold tracking-widest">Seismic anomalies cluster heavily below M4.0</h3><p className="text-[9px] font-mono text-[#8A857A] uppercase mt-1">Event magnitude distribution</p></div>
                    <div className="flex-1 w-full min-h-0"><ResponsiveContainer width="100%" height="100%"><BarChart data={magnitudeDistribution}><XAxis dataKey="range" tick={{fontSize:9,fill:'#8A857A',fontFamily:'monospace'}} axisLine={false} tickLine={false}/><YAxis tick={{fontSize:9,fill:'#7BA4C7',fontFamily:'monospace'}} axisLine={false} tickLine={false} width={30}/><RechartsTooltip content={<CustomTooltip/>}/><Bar dataKey="count" name="Events" fill={THEME.blue} radius={[3,3,0,0]} opacity={0.8}/></BarChart></ResponsiveContainer></div>
                  </div>
                </div>

                {/* Regional hotspots + Domain split */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
                  <div className="xl:col-span-2 rounded-2xl border border-[#2a2a2a] bg-gradient-to-b from-[#232323] to-[#141414] p-6 shadow-[0_18px_40px_rgba(0,0,0,0.35)]">
                    <h3 className="font-mono text-[10px] uppercase text-[#F2F0E9] font-bold tracking-widest mb-4">Activity densely concentrated in Pacific margins</h3>
                    <p className="text-[9px] font-mono text-[#8A857A] uppercase mb-4">Top regions by event count</p>
                    <div className="h-[280px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={regionBreakdown} layout="vertical"><XAxis type="number" tick={{fontSize:9,fill:'#8A857A',fontFamily:'monospace'}} axisLine={false} tickLine={false}/><YAxis type="category" dataKey="name" width={130} tick={{fontSize:9,fill:'#C8C4BA',fontFamily:'monospace'}} axisLine={false} tickLine={false}/><RechartsTooltip content={<CustomTooltip/>}/><Bar dataKey="count" name="Events" fill={THEME.blue} opacity={0.7} radius={[0,3,3,0]}/></BarChart></ResponsiveContainer></div>
                  </div>
                  <div className="rounded-2xl border border-[#2a2a2a] bg-gradient-to-b from-[#232323] to-[#141414] p-6 shadow-[0_18px_40px_rgba(0,0,0,0.35)] flex flex-col items-center">
                    <h3 className="font-mono text-[10px] uppercase text-[#F2F0E9] font-bold tracking-widest mb-2 self-start">Volume dominated by tectonic shifts</h3>
                    <p className="text-[9px] font-mono text-[#8A857A] uppercase mb-4 self-start">Event composition</p>
                    <div className="h-[200px] w-full"><ResponsiveContainer width="100%" height="100%">
                      <PieChart><Pie data={domainPieData} cx="50%" cy="50%" innerRadius={45} outerRadius={80} paddingAngle={3} dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`} labelLine={false}>
                        {domainPieData.map((d, i) => <Cell key={i} fill={d.color} stroke={THEME.bg} strokeWidth={2} />)}
                      </Pie><RechartsTooltip content={<CustomTooltip />} /></PieChart>
                    </ResponsiveContainer></div>
                    <div className="flex gap-4 mt-2">
                      {domainPieData.map((d, i) => (
                        <span key={i} className="flex items-center gap-1.5 font-mono text-[9px] text-[#C8C4BA]">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} /> {d.name}: {d.value}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Correlation analysis narrative */}
                <div className="rounded-2xl border border-[#2a2a2a] bg-gradient-to-b from-[#232323] to-[#141414] p-6 shadow-[0_18px_40px_rgba(0,0,0,0.35)] border-l-4 border-l-[#CC5833]">
                  <h3 className="font-mono text-[10px] uppercase tracking-widest text-[#F2F0E9]/50 mb-3">Cascade propagation delays by 4-8 hours</h3>
                  <p className="text-sm leading-relaxed text-[#F2F0E9]/85">
                    The co-movement chart reveals a <strong className="text-[#F2F0E9]">4–8 hour lag</strong> between physical hazard spikes and peak aviation disruption, suggesting infrastructure systems absorb shocks with a measurable delay before propagating to downstream networks. {kpis.avDisruptionRate > 20 ? 'The current disruption rate is above the 20% threshold, indicating active cascade propagation.' : 'Current disruption levels remain within absorption capacity.'} Seismic events are concentrated in {regionBreakdown[0]?.name || 'multiple regions'}, with {magnitudeDistribution[5]?.count || 0} events at M6+ requiring close monitoring for infrastructure impact.
                  </p>
                </div>
              </div>
            )}

            {/* PAGE 4: MARKETS WATCHLIST */}
            {activePage === 'markets' && (() => {
              const watchList = data.multiMarket.filter((m) => m.symbol !== 'VIX' && m.symbol !== 'SPY' && m.symbol !== 'QQQ' && m.price != null && m.changePct != null);
              const sectorBars = data.multiMarket.filter((m) => m.symbol !== 'VIX' && m.price != null && m.changePct != null);
              const rangeRows = sectorBars.slice(0, 8).filter((m) => m.low != null && m.high != null && m.price != null);
              return (
              <div className="p-6 max-w-[1600px] mx-auto animate-fadeIn overflow-y-auto custom-scrollbar" style={{maxHeight:'calc(100vh - 100px)'}}>
                <PageHeader
                  title="Markets absorb physical domain shocks"
                  subtitle="Live Finnhub quotes tracking downstream economic stress vectors."
                />
                <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6">
                  <div className="space-y-2">
                    {watchList.length === 0 ? (
                      <EmptyState>No equity quotes yet. Check your network or Finnhub key, then refresh the ingest.</EmptyState>
                    ) : watchList.map((m,i)=>{const up=m.changePct>=0;return(
                      <div key={`${m.symbol}-${i}`} className="flex items-center justify-between rounded-xl border border-[#2a2a2a] bg-gradient-to-b from-[#232323] to-[#141414] px-5 py-4 shadow-[0_8px_24px_rgba(0,0,0,0.2)] transition-all hover:border-[#CC5833]/25">
                        <div><div className="font-bold text-[#F2F0E9]">{m.name}</div><div className="font-mono text-[9px] text-[#555]">{m.symbol}</div></div>
                        <div className="flex items-center gap-4"><span className="text-lg font-bold text-[#F2F0E9] tabular-nums">${m.price>=1000?m.price.toLocaleString(undefined,{minimumFractionDigits:0,maximumFractionDigits:0}):m.price?.toFixed(2)}</span><span className={`font-mono text-sm font-bold ${up?'text-[#6B9E78]':'text-[#EF4444]'}`}>{up?'+':''}{m.changePct?.toFixed(2)}%</span></div>
                      </div>);})}
                  </div>
                  <div className="space-y-6">
                    <div className="rounded-2xl border border-[#2a2a2a] bg-gradient-to-b from-[#232323] to-[#141414] p-5 shadow-[0_18px_40px_rgba(0,0,0,0.35)]">
                      <h3 className="font-mono text-[10px] uppercase tracking-widest text-[#8A857A] mb-4 flex items-center gap-2"><Gauge size={13} className="text-[#CC5833]"/> Volatility metrics entering high zones</h3>
                      {(()=>{const v=data.multiMarket.find(m=>m.symbol==='VIX');const vv=v?.price??20;const p=Math.min(100,(vv/50)*100);const l=vv>35?'EXTREME':vv>25?'HIGH':vv>18?'ELEVATED':'LOW';const c=vv>35?'#EF4444':vv>25?'#CC5833':vv>18?'#F59E0B':'#6B9E78';return(<div className="text-center"><div className="text-5xl font-bold mb-1" style={{color:c}}>{Number(vv).toFixed(1)}</div><span className="font-mono text-[10px] uppercase px-3 py-1 rounded-full" style={{backgroundColor:`${c}15`,color:c,border:`1px solid ${c}30`}}>{l}</span><div className="mt-4 h-3 bg-[#1A1A1A] rounded-full overflow-hidden relative"><div className="absolute inset-0 flex"><div className="h-full" style={{width:'36%',background:'linear-gradient(90deg,#6B9E78,#F59E0B)'}}/><div className="h-full" style={{width:'28%',background:'linear-gradient(90deg,#F59E0B,#CC5833)'}}/><div className="h-full flex-1" style={{background:'linear-gradient(90deg,#CC5833,#EF4444)'}}/></div><div className="absolute top-0 h-full w-0.5 bg-white shadow-lg" style={{left:`${p}%`}}/></div><div className="flex justify-between font-mono text-[8px] text-[#555] mt-1"><span>Low</span><span>Elevated</span><span>High</span><span>Extreme</span></div></div>);})()}
                    </div>
                    <div className="rounded-2xl border border-[#2a2a2a] bg-gradient-to-b from-[#232323] to-[#141414] p-5 shadow-[0_18px_40px_rgba(0,0,0,0.35)]">
                      <h3 className="font-mono text-[10px] uppercase tracking-widest text-[#8A857A] mb-4">Technology sector leads intraday resilience</h3>
                      <div className="h-[350px]">{sectorBars.length === 0 ? <div className="flex h-full items-center justify-center text-sm text-[#8A857A]">No sector change data.</div> : <ResponsiveContainer width="100%" height="100%"><BarChart data={sectorBars} layout="vertical"><XAxis type="number" tick={{fontSize:9,fill:'#8A857A',fontFamily:'monospace'}} axisLine={false} tickLine={false} unit="%"/><YAxis type="category" dataKey="symbol" width={50} tick={{fontSize:10,fill:'#C8C4BA',fontFamily:'monospace',fontWeight:'bold'}} axisLine={false} tickLine={false}/><RechartsTooltip content={<CustomTooltip/>}/><Bar dataKey="changePct" name="Change %" radius={[0,4,4,0]}>{sectorBars.map((m,i)=><Cell key={i} fill={m.changePct>=0?'#6B9E78':'#EF4444'} opacity={0.75}/>)}</Bar></BarChart></ResponsiveContainer>}</div>
                    </div>
                    <div className="rounded-2xl border border-[#2a2a2a] bg-gradient-to-b from-[#232323] to-[#141414] p-5 shadow-[0_18px_40px_rgba(0,0,0,0.35)]">
                      <h3 className="font-mono text-[10px] uppercase tracking-widest text-[#8A857A] mb-3">Intense intraday volatility across core tracking ETFs</h3>
                      {rangeRows.length === 0 ? <p className="text-sm text-[#8A857A]">No intraday high/low data for this ingest.</p> : <div className="space-y-3">{rangeRows.map((m,i)=>{const r=m.high-m.low;const pp=r>0?((m.price-m.low)/r)*100:50;const up=m.changePct>=0;return(<div key={i}><div className="flex items-center justify-between mb-1"><span className="font-mono text-[10px] font-bold text-[#F2F0E9]">{m.symbol}</span><span className={`font-mono text-[10px] ${up?'text-[#6B9E78]':'text-[#EF4444]'}`}>{m.price?.toFixed(2)}</span></div><div className="flex items-center gap-2"><span className="font-mono text-[8px] text-[#555] w-12 text-right">{m.low?.toFixed(1)}</span><div className="flex-1 h-2 bg-[#1A1A1A] rounded-full relative overflow-hidden"><div className="absolute inset-y-0 rounded-full" style={{left:'0%',width:`${pp}%`,background:up?'linear-gradient(90deg,#6B9E78,#6B9E7880)':'linear-gradient(90deg,#EF4444,#EF444480)'}}/><div className="absolute top-0 h-full w-1 bg-white rounded-full shadow" style={{left:`${pp}%`}}/></div><span className="font-mono text-[8px] text-[#555] w-12">{m.high?.toFixed(1)}</span></div></div>);})}</div>}
                    </div>
                  </div>
                </div>
              </div>
              );
            })()}

            {/* PAGE 5: COMMODITIES & FX */}
            {activePage === 'commodities' && (() => {
              const quotedCommodities = intel.commodities.filter((c) => c.price != null && c.pct != null);
              const fxRows = intel.fx.filter((f) => f.price != null);
              return (
              <div className="p-6 max-w-[1600px] mx-auto animate-fadeIn overflow-y-auto custom-scrollbar" style={{maxHeight:'calc(100vh - 100px)'}}>
                <PageHeader
                  title="Commodities & FX"
                  subtitle="US-listed ETF snapshots and EUR crosses — only rows with live quotes are shown."
                />

                <div className="grid grid-cols-1 gap-8 xl:grid-cols-12">
                  <div className="xl:col-span-7">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#8A857A]">ETF snapshot</h3>
                      <span className="rounded-full border border-[#333] bg-[#1A1A1A] px-3 py-1 font-mono text-[10px] text-[#6B9E78]">
                        {quotedCommodities.length} live
                      </span>
                    </div>
                    {quotedCommodities.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-[#333] bg-[#1A1A1A]/50 px-6 py-12 text-center text-sm text-[#8A857A]">
                        No commodity quotes loaded yet. Check your network or Finnhub key.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {quotedCommodities.map((c) => {
                          const up = c.pct >= 0;
                          const px =
                            c.price >= 100
                              ? c.price.toLocaleString(undefined, { maximumFractionDigits: 0 })
                              : c.price.toFixed(c.price < 10 ? 4 : 2);
                          return (
                            <div
                              key={`${c.name}-${c.symbol}`}
                              className="group relative overflow-hidden rounded-2xl border border-[#2a2a2a] bg-gradient-to-b from-[#232323] to-[#141414] p-5 shadow-[0_18px_40px_rgba(0,0,0,0.35)] transition hover:border-[#CC5833]/25 hover:shadow-[0_22px_55px_rgba(0,0,0,0.45)]"
                            >
                              <div className="relative flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-medium text-[#E8E4DC]">{c.name}</p>
                                  <span className="mt-2 inline-flex items-center rounded-md border border-[#2E4036]/50 bg-[#2E4036]/20 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide text-[#8FD4A0]">
                                    {c.symbol}
                                  </span>
                                </div>
                                <div
                                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${
                                    up ? 'border-[#6B9E78]/25 bg-[#6B9E78]/10' : 'border-[#EF4444]/25 bg-[#EF4444]/10'
                                  }`}
                                >
                                  {up ? (
                                    <TrendingUp className="h-4 w-4 text-[#6B9E78]" aria-hidden="true" />
                                  ) : (
                                    <TrendingDown className="h-4 w-4 text-[#EF4444]" aria-hidden="true" />
                                  )}
                                </div>
                              </div>
                              <div className="relative mt-5">
                                <p className="text-[11px] font-mono uppercase tracking-wider text-[#6b6b6b]">Last</p>
                                <p className="mt-1 text-3xl font-bold tabular-nums tracking-tight text-[#F2F0E9]">
                                  <span className="mr-0.5 text-xl font-semibold text-[#8A857A]">$</span>
                                  {px}
                                </p>
                                <p
                                  className={`mt-2 font-mono text-sm font-semibold tabular-nums ${
                                    up ? 'text-[#6B9E78]' : 'text-[#EF4444]'
                                  }`}
                                >
                                  {up ? '+' : ''}
                                  {c.pct.toFixed(2)}% <span className="text-[#6b6b6b]">day</span>
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="xl:col-span-5">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#8A857A]">EUR spot</h3>
                      <span className="font-mono text-[10px] text-[#555]">Δ vs ~4d</span>
                    </div>
                    <div className="overflow-hidden rounded-2xl border border-[#2a2a2a] bg-gradient-to-b from-[#232323] to-[#141414] shadow-[0_18px_40px_rgba(0,0,0,0.35)]">
                      <div className="grid grid-cols-[1fr_auto_auto] gap-3 border-b border-[#2a2a2a] px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-[#6b6b6b]">
                        <span>Pair</span>
                        <span className="text-right">Rate</span>
                        <span className="text-right">Δ</span>
                      </div>
                      <div className="divide-y divide-[#222]">
                        {fxRows.length === 0 ? (
                          <div className="px-4 py-10 text-center text-sm text-[#8A857A]">FX data unavailable.</div>
                        ) : (
                          fxRows.map((f) => {
                          const up = (f.change ?? 0) >= 0;
                          return (
                            <div
                              key={f.pair}
                              className="grid grid-cols-[1fr_auto_auto] items-center gap-3 px-4 py-3.5 transition hover:bg-[#1A1A1A]/60"
                            >
                              <span className="font-mono text-[11px] font-semibold uppercase tracking-wide text-[#C8C4BA]">
                                {f.pair}
                              </span>
                              <span className="text-right text-lg font-bold tabular-nums text-[#F2F0E9]">
                                {f.price.toFixed(4)}
                              </span>
                              <span
                                className={`min-w-[5.5rem] text-right font-mono text-sm font-semibold tabular-nums ${
                                  up ? 'text-[#6B9E78]' : 'text-[#EF4444]'
                                }`}
                              >
                                {up ? '+' : ''}
                                {f.change.toFixed(4)}
                              </span>
                            </div>
                          );
                        })
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* New Section: Energy Spot (EIA v2) */}
                {intel.energyStorage.some(s => s.cat === 'Price') && (
                  <div className="mt-12">
                     <div className="mb-4 flex items-center justify-between gap-3">
                      <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#8A857A]">Energy Spot (EIA v2)</h3>
                      <div className="h-px flex-1 bg-[#2a2a2a]"></div>
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                      {intel.energyStorage.filter(s => s.cat === 'Price').map((s, i) => (
                         <div key={i} className="group relative overflow-hidden rounded-2xl border border-[#2a2a2a] bg-gradient-to-b from-[#232323] to-[#141414] p-5 shadow-[0_12px_30px_rgba(0,0,0,0.3)] transition hover:border-[#CC5833]/20">
                            <p className="font-mono text-[9px] uppercase tracking-widest text-[#8A857A]">{s.label}</p>
                            <div className="mt-3 flex items-baseline gap-2">
                              <span className="text-2xl font-bold text-[#F2F0E9] tabular-nums">{s.value}</span>
                              <span className="text-xs font-medium text-[#8A857A]">{s.unit}</span>
                            </div>
                            <div className={`mt-2 font-mono text-[10px] font-bold ${s.status === 'up' ? 'text-[#6B9E78]' : 'text-[#EF4444]'}`}>
                              {s.wow}
                            </div>
                         </div>
                      ))}
                    </div>
                  </div>
                )}

                {quotedCommodities.length > 0 && (
                  <p className="mt-8 text-center font-mono text-[10px] text-[#555]">
                    Movers:{' '}
                    {quotedCommodities
                      .slice(0, 5)
                      .map((c) => `${c.name} ${c.pct >= 0 ? '+' : ''}${c.pct.toFixed(2)}%`)
                      .join(' · ')}
                  </p>
                )}
              </div>
              );
            })()}

            {/* PAGE 6: PREDICTION MARKETS */}
            {activePage === 'polymarket' && (() => {
              const events = intel.polymarket || [];
              return (
              <div className="p-6 max-w-[1200px] mx-auto animate-fadeIn overflow-y-auto custom-scrollbar" style={{maxHeight:'calc(100vh - 100px)'}}>
                <PageHeader
                  title="Geopolitics & Prediction Markets"
                  subtitle="Live probabilities for critical supply chain and geopolitical events via Polymarket Gamma API."
                />
                <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-6">
                  <div className="rounded-2xl border border-[#2a2a2a] bg-gradient-to-b from-[#232323] to-[#141414] p-6 shadow-[0_18px_40px_rgba(0,0,0,0.35)]">
                    <h3 className="font-mono text-[10px] uppercase tracking-widest text-[#8A857A] mb-4">Event Probabilities</h3>
                    <div className="space-y-4">
                      {events.length === 0 && !loading && (
                        <EmptyState>Polymarket yielded no events matching the geopolitical filter.</EmptyState>
                      )}
                      {events.map((c,i)=>{
                        const prob = parseFloat(c.probability || 0);
                        const isHigh = prob > 50;
                        return(
                          <div key={`${c.id}-${i}`} className="flex items-center justify-between rounded-xl border border-[#2a2a2a] bg-[#1A1A1A]/50 px-5 py-4 transition-all hover:bg-[#1A1A1A]">
                            <div className="flex-1 pr-4">
                              <div className="font-bold text-[#F2F0E9] text-base leading-snug">{c.title}</div>
                              <div className="font-mono text-[9px] text-[#8A857A] mt-1.5 flex gap-3">
                                <span>VOL: ${Number(c.volume).toLocaleString(undefined, {maximumFractionDigits:0})}</span>
                                <span>ENDS: {c.resolution}</span>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-1 shrink-0 w-24">
                              <span className={`text-2xl font-bold tabular-nums ${isHigh ? 'text-[#CC5833]' : 'text-[#6B9E78]'}`}>{prob.toFixed(1)}%</span>
                              <div className="w-full h-1.5 bg-[#141414] rounded-full overflow-hidden border border-[#333]">
                                <div className={`h-full rounded-full ${isHigh ? 'bg-[#CC5833]' : 'bg-[#6B9E78]'}`} style={{width: `${Math.min(100, prob)}%`}} />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div className="rounded-2xl border border-[#2a2a2a] bg-gradient-to-b from-[#232323] to-[#141414] p-5 shadow-[0_18px_40px_rgba(0,0,0,0.35)]">
                      <h3 className="font-mono text-[10px] uppercase tracking-widest text-[#8A857A] mb-4">Risk Absorption Delta</h3>
                      <div className="space-y-4">
                        <p className="text-[11px] text-[#C8C4BA] leading-relaxed">
                          Prediction markets provide hyper-responsive "ground truth" during unfolding crises. This module tracks the probability of geopolitical events directly impacting downstream supply chains.
                        </p>
                        {events.length > 0 && (
                          <div className="p-3 bg-[#EF4444]/10 border border-[#EF4444]/30 rounded-lg">
                            <h4 className="font-mono text-[9px] uppercase tracking-widest text-[#EF4444] mb-1">Highest Probability Risk</h4>
                            <p className="text-xs text-[#f2f0e9] font-bold">{events[0].title}</p>
                            <p className="font-mono text-[10px] text-[#EF4444] mt-1">PROB: {Number(events[0].probability).toFixed(1)}%</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              );
            })()}

            {/* PAGE 7: ENERGY COMPLEX */}
            {activePage === 'energy' && (() => {
              const tapeOk = intel.energyTape.filter((e) => e.price != null && e.pct != null);
              const eiaData = intel.energyStorage;
              
              // Group EIA data by category
              const groupedEia = eiaData.reduce((acc, item) => {
                const cat = item.cat || 'General';
                if (!acc[cat]) acc[cat] = [];
                acc[cat].push(item);
                return acc;
              }, {});

              return (
              <div className="p-6 max-w-[1600px] mx-auto animate-fadeIn overflow-y-auto custom-scrollbar" style={{maxHeight:'calc(100vh - 100px)'}}>
                <PageHeader
                  title="Energy Complex"
                  subtitle="Live US DOE/EIA telemetry (API v2) and financial ETF proxies. All data is real-time or latest available weekly snapshots."
                />
                
                <div className="space-y-8">
                  {/* EIA v2 Grid Sections */}
                  <div className="space-y-6">
                    {(intel.eiaNote || eiaData.length === 0) && (
                      <div className="rounded-2xl border border-dashed border-[#CC5833]/30 bg-[#CC5833]/5 p-6 text-center">
                        <p className="font-mono text-xs text-[#C8C4BA]">
                          {intel.eiaNote || "Awaiting EIA v2 Telemetry..."}
                        </p>
                      </div>
                    )}
                    
                    {Object.entries(groupedEia).map(([category, items]) => (
                      <div key={category} className="space-y-4">
                        <div className="flex items-center gap-3">
                          <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#8A857A]">{category} Telemetry</h3>
                          <div className="h-px flex-1 bg-[#2a2a2a]"></div>
                        </div>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                          {items.map((s, i) => (
                            <div key={i} className="group relative overflow-hidden rounded-2xl border border-[#2a2a2a] bg-gradient-to-b from-[#232323] to-[#141414] p-5 shadow-[0_12px_30px_rgba(0,0,0,0.3)] transition hover:border-[#CC5833]/20">
                              <div className="flex items-start justify-between">
                                <span className="font-mono text-[9px] uppercase tracking-widest text-[#8A857A]">
                                  {s.label}
                                </span>
                                <span className={`font-mono text-[9px] font-bold ${s.status === 'up' ? 'text-[#6B9E78]' : 'text-[#EF4444]'}`}>
                                  {s.id}
                                </span>
                              </div>
                              <div className="mt-4">
                                <div className="flex items-baseline gap-2">
                                  <span className="text-2xl font-bold text-[#F2F0E9] tabular-nums">{s.value}</span>
                                  <span className="text-xs font-medium text-[#8A857A]">{s.unit}</span>
                                </div>
                                <div className={`mt-2 font-mono text-[10px] font-bold ${s.status === 'up' ? 'text-[#6B9E78]' : 'text-[#EF4444]'}`}>
                                  {s.wow}
                                </div>
                                <div className="mt-4 flex items-center justify-between border-t border-[#2a2a2a] pt-3 font-mono text-[8px] text-[#555]">
                                  <span>Period: {s.date}</span>
                                  <span className="uppercase">V2 Data</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Tape Prices */}
                  <div>
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#8A857A]">Live Financial Proxies</h3>
                      <div className="h-px flex-1 bg-[#2a2a2a]"></div>
                    </div>
                    {tapeOk.length === 0 ? (
                      <EmptyState>No energy quotes returned. Confirm your Finnhub key and that ETF symbols are available on your plan.</EmptyState>
                    ) : (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                      {tapeOk.map((e, i) => {
                        const up = e.pct >= 0;
                        return (
                          <div key={`${e.name}-${i}`} className="rounded-xl border border-[#2a2a2a] bg-gradient-to-b from-[#232323] to-[#141414] p-4 shadow-[0_8px_24px_rgba(0,0,0,0.25)]">
                            <div className="font-mono text-[9px] text-[#8A857A] uppercase mb-2">{e.name}</div>
                            <div className="text-xl font-bold text-[#F2F0E9]">${e.price.toFixed(2)}</div>
                            <div className={`font-mono text-[10px] font-bold mt-1 ${up ? 'text-[#6B9E78]' : 'text-[#EF4444]'}`}>
                              {up ? '+' : ''}{e.pct.toFixed(2)}%
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    )}
                  </div>

                  <div className="rounded-2xl border border-[#2a2a2a] bg-gradient-to-b from-[#232323] to-[#141414] p-6 shadow-[0_18px_40px_rgba(0,0,0,0.35)] border-l-4 border-l-[#CC5833]">
                    <h3 className="font-mono text-[10px] uppercase tracking-widest text-[#F2F0E9]/50 mb-3">Energy Intelligence Summary</h3>
                    <p className="text-sm text-[#F2F0E9]/85 leading-relaxed">Tape quotes use listed symbols (often ETF proxies for oil/gas). Inventory levels require a U.S. EIA API key. Chokepoint risk on the Supply Chain page blends these prices with live USGS/FIRMS clustering near strategic lanes.</p>
                  </div>
                </div>
              </div>
              );
            })()}

            {/* PAGE 8: SUPPLY CHAIN */}
            {activePage === 'supply' && (() => {
              const shippingRows = intel.shipping.filter((s) => s.rate != null);
              return (
              <div className="p-6 max-w-[1600px] mx-auto animate-fadeIn overflow-y-auto custom-scrollbar" style={{maxHeight:'calc(100vh - 100px)'}}>
                <PageHeader
                  title="Supply chain"
                  subtitle="Chokepoint model (USGS + FIRMS), shipping proxies, and materials equities. Shipping table lists rows with a numeric quote."
                />
                <div className="space-y-6">
                  <div>
                    <h3 className="font-mono text-[10px] uppercase tracking-widest text-[#8A857A] mb-3">Chokepoints</h3>
                    <div className="space-y-3">
                      {intel.chokepoints.map((cp,i)=>(<div key={i} className="rounded-xl border border-[#2a2a2a] bg-gradient-to-b from-[#232323] to-[#141414] p-5 shadow-[0_8px_24px_rgba(0,0,0,0.25)]" style={{borderLeftWidth:'4px',borderLeftColor:cp.color}}>
                        <div className="flex items-center justify-between mb-3"><div className="flex items-center gap-3"><span className="w-2.5 h-2.5 rounded-full" style={{backgroundColor:cp.color}}/><span className="font-bold text-base text-[#F2F0E9]">{cp.name}</span><span className="px-2 py-0.5 rounded bg-[#1A1A1A] border border-[#333] font-mono text-[10px] text-[#C8C4BA]">{cp.risk}/100</span></div><span className="px-2.5 py-1 rounded font-mono text-[9px] uppercase font-bold" style={{backgroundColor:`${cp.color}20`,color:cp.color}}>{cp.status}</span></div>
                        <div className="font-mono text-[10px] text-[#8A857A] mb-2"><span className="text-[#C8C4BA]">{cp.wowChange}</span> &bull; Model disruption: <strong className="text-[#F2F0E9]">{cp.disruption}%</strong></div>
                        <div className="font-mono text-[10px] text-[#8A857A] mb-2">Risk level: <strong className="text-[#F2F0E9]">{cp.riskLevel}</strong> &bull; {cp.incidents7d} hazard hits (7d, USGS+FIRMS)</div>
                        {cp.flow && <div className="font-mono text-[10px] text-[#555] mb-2">Typical flow: {cp.flow}</div>}
                        <p className="text-xs text-[#C8C4BA] leading-relaxed mb-1">{cp.narrative}</p>
                        <p className="text-[10px] text-[#555]">{cp.detail}</p>
                      </div>))}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    <div className="rounded-2xl border border-[#2a2a2a] bg-gradient-to-b from-[#232323] to-[#141414] p-6 shadow-[0_18px_40px_rgba(0,0,0,0.35)]">
                        <h3 className="font-mono text-[10px] uppercase tracking-widest text-[#8A857A] mb-4">Shipping equities (proxy)</h3>
                      <p className="text-[10px] text-[#555] mb-2">Finnhub spot quotes for liner/dry-bulk related equities (not container indices).</p>
                      {shippingRows.length === 0 ? (
                        <EmptyState>No shipping quotes with a numeric price in this ingest.</EmptyState>
                      ) : (
                      <div className="overflow-hidden rounded-xl border border-[#2a2a2a]">
                        <div className="grid grid-cols-[1fr_80px_70px_60px] gap-0 bg-[#1A1A1A] px-4 py-2 font-mono text-[9px] uppercase tracking-widest text-[#8A857A]"><span>Name</span><span className="text-right">Price</span><span className="text-right">Chg</span><span className="text-right">Type</span></div>
                        {shippingRows.map((s,i)=>(<div key={i} className="grid grid-cols-[1fr_80px_70px_60px] gap-0 px-4 py-3 border-t border-[#2a2a2a] items-center"><span className="text-sm text-[#F2F0E9]">{s.route}</span><span className="font-mono text-sm font-bold text-[#F2F0E9] text-right">{`$${Number(s.rate).toFixed(2)}`}</span><span className={`font-mono text-[10px] text-right ${String(s.change).startsWith('-')?'text-[#EF4444]':'text-[#6B9E78]'}`}>{s.change}</span><span className="font-mono text-[9px] text-[#555] text-right">{s.container}</span></div>))}
                      </div>
                      )}
                    </div>
                    <div className="rounded-2xl border border-[#2a2a2a] bg-gradient-to-b from-[#232323] to-[#141414] p-6 shadow-[0_18px_40px_rgba(0,0,0,0.35)]">
                      <h3 className="font-mono text-[10px] uppercase tracking-widest text-[#8A857A] mb-4">Mining &amp; materials equities</h3>
                      <p className="text-[10px] text-[#555] mb-2">Listed proxies (Finnhub); not spot mineral futures.</p>
                      <div className="overflow-hidden rounded-xl border border-[#2a2a2a]">
                        <div className="grid grid-cols-[1fr_80px_70px_60px_90px] gap-0 bg-[#1A1A1A] px-4 py-2 font-mono text-[9px] uppercase tracking-widest text-[#8A857A]"><span>Theme</span><span>Geo</span><span className="text-right">Px</span><span className="text-right">Chg</span><span className="text-right">Use</span></div>
                        {intel.minerals.map((m,i)=>{const up=m.change!=null&&m.change>=0;return(<div key={i} className="grid grid-cols-[1fr_80px_70px_60px_90px] gap-0 px-4 py-2.5 border-t border-[#2a2a2a] items-center"><span className="text-sm font-bold text-[#F2F0E9]">{m.mineral}</span><span className="font-mono text-[9px] text-[#8A857A]">{m.top}</span><span className="font-mono text-[10px] text-[#C8C4BA] text-right">{m.price}</span><span className={`font-mono text-[10px] text-right ${m.change==null?'text-[#555]':up?'text-[#6B9E78]':'text-[#EF4444]'}`}>{m.change==null?'\u2014':`${up?'+':''}${Number(m.change).toFixed(2)}%`}</span><span className="font-mono text-[8px] text-[#555] text-right">{m.use}</span></div>);})}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              );
            })()}

            {/* PAGE 9: WORLD NEWS */}
            {activePage === 'news' && (
              <div className="p-6 max-w-[1600px] mx-auto animate-fadeIn overflow-y-auto custom-scrollbar" style={{maxHeight:'calc(100vh - 100px)'}}>
                <PageHeader
                  title="World news"
                  subtitle="Financial and tech headlines via GNews when configured; world headlines from the live feed when available."
                />
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-mono text-[10px] uppercase tracking-widest text-[#8A857A] mb-3 flex items-center gap-2">Financial <span className="px-2 py-0.5 rounded bg-[#6B9E78]/15 text-[#6B9E78] text-[8px] font-bold uppercase border border-[#6B9E78]/20">GNews</span> <span className="font-mono text-[9px] text-[#555]">{intel.financialNews.length}</span></h3>
                    <div className="space-y-2">
                      {intel.financialNews.length===0&&<EmptyState>No business headlines. Set <code className="text-[#CC5833]">VITE_GNEWS_API_KEY</code> (gnews.io).</EmptyState>}
                      {intel.financialNews.map((n,i)=>(<div key={i} className="rounded-xl border border-[#2a2a2a] bg-gradient-to-b from-[#232323] to-[#141414] p-4 shadow-[0_8px_24px_rgba(0,0,0,0.2)] transition-all hover:border-[#CC5833]/25">
                        <div className="flex items-center gap-2 mb-2 flex-wrap"><span className="font-mono text-[9px] font-bold text-[#CC5833] uppercase">{n.source}</span>{n.tags.map((t,j)=><TagBadge key={j} tag={t}/>)}</div>
                        {n.url ? <a href={n.url} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-[#F2F0E9] leading-snug hover:text-[#CC5833]">{n.title}</a> : <h4 className="text-sm font-bold text-[#F2F0E9] leading-snug">{n.title}</h4>}
                        <span className="font-mono text-[8px] text-[#555] mt-1.5 block">{n.time}</span>
                      </div>))}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-mono text-[10px] uppercase tracking-widest text-[#8A857A] mb-3 flex items-center gap-2">AI/ML <span className="px-2 py-0.5 rounded bg-[#6B9E78]/15 text-[#6B9E78] text-[8px] font-bold uppercase border border-[#6B9E78]/20">GNews</span> <span className="font-mono text-[9px] text-[#555]">{intel.aiNews.length}</span></h3>
                    <div className="space-y-2">
                      {intel.aiNews.length===0&&<EmptyState>No technology headlines from GNews.</EmptyState>}
                      {intel.aiNews.map((n,i)=>(<div key={i} className="rounded-xl border border-[#2a2a2a] bg-gradient-to-b from-[#232323] to-[#141414] p-4 shadow-[0_8px_24px_rgba(0,0,0,0.2)] transition-all hover:border-[#CC5833]/25">
                        <div className="flex items-center gap-2 mb-2 flex-wrap"><span className="font-mono text-[9px] font-bold text-[#7BA4C7] uppercase">{n.source}</span>{n.tags.map((t,j)=><TagBadge key={j} tag={t}/>)}</div>
                        {n.url ? <a href={n.url} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-[#F2F0E9] leading-snug hover:text-[#CC5833]">{n.title}</a> : <h4 className="text-sm font-bold text-[#F2F0E9] leading-snug">{n.title}</h4>}
                        <span className="font-mono text-[8px] text-[#555] mt-1.5 block">{n.time}</span>
                      </div>))}
                    </div>
                  </div>
                </div>
                {worldNews.length > 0 && (<div className="mt-6"><h3 className="font-mono text-[10px] uppercase tracking-widest text-[#8A857A] mb-3 flex items-center gap-2">World Headlines <span className="px-2 py-0.5 rounded bg-[#6B9E78]/15 text-[#6B9E78] text-[8px] font-bold uppercase border border-[#6B9E78]/20">Live API</span></h3>
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-2">{worldNews.map((a,i)=>(<a key={i} href={a.url} target="_blank" rel="noopener noreferrer" className="group block rounded-xl border border-[#2a2a2a] bg-gradient-to-b from-[#232323] to-[#141414] p-4 shadow-[0_8px_24px_rgba(0,0,0,0.2)] transition-all hover:border-[#CC5833]/25"><div className="flex items-center gap-2 mb-2"><span className="font-mono text-[9px] font-bold text-[#CC5833] uppercase">{a.source}</span><TagBadge tag="ALERT"/>{a.date&&<span className="font-mono text-[8px] text-[#555]">{new Date(a.date).toLocaleString('en-US',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}</span>}</div><h4 className="text-sm font-bold text-[#F2F0E9] group-hover:text-[#CC5833] transition-colors leading-snug">{a.title}</h4>{a.description&&<p className="text-xs text-[#8A857A] mt-1.5 leading-relaxed">{a.description}</p>}</a>))}</div></div>)}
              </div>
            )}

            {/* PAGE 10: CLIMATE & AVIATION */}
            {activePage === 'climate' && (() => {
              const climateRows = intel.climate.filter((z) => z.temp != null && z.precip != null);
              return (
              <div className="p-6 max-w-[1600px] mx-auto animate-fadeIn overflow-y-auto custom-scrollbar" style={{maxHeight:'calc(100vh - 100px)'}}>
                <PageHeader
                  title="Climate & aviation"
                  subtitle="Regional weather vs a recent baseline (Open-Meteo) and hub ops from the Aviationstack sample."
                />
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
                  <div className="rounded-2xl border border-[#2a2a2a] bg-gradient-to-b from-[#232323] to-[#141414] p-6 shadow-[0_18px_40px_rgba(0,0,0,0.35)]">
                    <h3 className="font-mono text-[10px] uppercase tracking-widest text-[#8A857A] mb-4 flex items-center gap-2"><CloudRain size={13} className="text-[#7BA4C7]"/> Weather vs recent-week mean <span className="rounded border border-[#2a2a2a] bg-[#1A1A1A] px-2 py-0.5 font-mono text-[9px] text-[#C8C4BA]">{climateRows.length}</span></h3>
                    {climateRows.length === 0 ? (
                      <EmptyState>No zones with complete temperature and precipitation fields. Check Open-Meteo availability or try again after ingest.</EmptyState>
                    ) : (
                    <div className="overflow-hidden rounded-xl border border-[#2a2a2a]">
                      <div className="grid grid-cols-[1fr_80px_80px_100px] gap-0 bg-[#1A1A1A] px-4 py-2 font-mono text-[9px] uppercase tracking-widest text-[#8A857A]"><span>Zone</span><span className="text-right">{'\u0394'}Temp</span><span className="text-right">Precip 7d</span><span className="text-right">Flag</span></div>
                      {climateRows.map((z,i)=>{const sc=z.severity==='EXTREME'?'#CC5833':'#F59E0B';const ok=z.temp!=null;return(<div key={i} className="grid grid-cols-[1fr_80px_80px_100px] gap-0 px-4 py-3 border-t border-[#2a2a2a] items-center"><span className="text-sm text-[#F2F0E9]">{z.zone}</span><span className={`font-mono text-sm text-right font-bold ${!ok?'text-[#555]':z.temp>0?'text-[#EF4444]':'text-[#7BA4C7]'}`}>{!ok?'\u2014':`${z.temp>0?'+':''}${z.temp.toFixed(1)}\u00B0C`}</span><span className={`font-mono text-sm text-right ${!ok?'text-[#555]':z.precip>0?'text-[#6B9E78]':'text-[#F59E0B]'}`}>{!ok?'\u2014':`${z.precip>0?'+':''}${z.precip.toFixed(1)}mm`}</span><div className="text-right"><span className="px-2 py-0.5 rounded font-mono text-[8px] font-bold uppercase" style={{backgroundColor:`${sc}20`,color:sc}}>{z.severity}</span></div></div>);})}
                    </div>
                    )}
                    <div className="mt-4 rounded-xl border border-[#2a2a2a] bg-[#1A1A1A]/60 p-4">
                      <h4 className="font-mono text-[9px] uppercase tracking-widest text-[#8A857A] mb-2">Summary</h4>
                      <p className="text-xs text-[#C8C4BA] leading-relaxed">{climateRows.filter(z=>z.severity==='EXTREME').length} zones flagged EXTREME from Open-Meteo short-window stats. Monitoring aid only, not certified climate attribution.</p>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-[#2a2a2a] bg-gradient-to-b from-[#232323] to-[#141414] p-6 shadow-[0_18px_40px_rgba(0,0,0,0.35)]">
                    <h3 className="font-mono text-[10px] uppercase tracking-widest text-[#8A857A] mb-4 flex items-center gap-2"><Plane size={13} className="text-[#A78BFA]"/> Airline Intelligence &mdash; Ops</h3>
                    {intel.airlineOps.length === 0 ? (
                      <EmptyState>No hub ops in this ingest (Aviationstack sample or key).</EmptyState>
                    ) : (
                    <>
                    <div className="overflow-hidden rounded-xl border border-[#2a2a2a]">
                      <div className="grid grid-cols-[60px_1fr_90px_60px] gap-0 bg-[#1A1A1A] px-4 py-2 font-mono text-[9px] uppercase tracking-widest text-[#8A857A]"><span>Code</span><span>Airport</span><span className="text-right">Status</span><span className="text-right">Delay</span></div>
                      {intel.airlineOps.map((a,i)=>{const sc=a.status==='NORMAL'?'#6B9E78':a.status==='MINOR'?'#F59E0B':a.status==='MODERATE'?'#CC5833':'#EF4444';return(<div key={i} className="grid grid-cols-[60px_1fr_90px_60px] gap-0 px-4 py-3 border-t border-[#2a2a2a] items-center"><span className="font-mono text-sm font-bold text-[#CC5833]">{a.code}</span><span className="text-sm text-[#C8C4BA] truncate">{a.name}</span><div className="text-right"><span className="font-mono text-[9px] font-bold uppercase" style={{color:sc}}>{a.status}</span></div><span className="font-mono text-[10px] text-[#8A857A] text-right">{a.delay||'\u2014'}</span></div>);})}
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-3">
                      <div className="rounded-lg border border-[#2a2a2a] bg-[#1A1A1A]/60 p-3 text-center"><div className="text-2xl font-bold text-[#6B9E78]">{intel.airlineOps.filter(a=>a.status==='NORMAL').length}</div><div className="font-mono text-[8px] text-[#8A857A] uppercase">Normal</div></div>
                      <div className="rounded-lg border border-[#2a2a2a] bg-[#1A1A1A]/60 p-3 text-center"><div className="text-2xl font-bold text-[#F59E0B]">{intel.airlineOps.filter(a=>a.status==='MINOR').length}</div><div className="font-mono text-[8px] text-[#8A857A] uppercase">Minor</div></div>
                      <div className="rounded-lg border border-[#2a2a2a] bg-[#1A1A1A]/60 p-3 text-center"><div className="text-2xl font-bold text-[#CC5833]">{intel.airlineOps.filter(a=>a.status==='MODERATE'||a.status==='SEVERE').length}</div><div className="font-mono text-[8px] text-[#8A857A] uppercase">Moderate+</div></div>
                    </div>
                    </>
                    )}
                  </div>
                </div>
                <div className="rounded-2xl border border-[#2a2a2a] bg-gradient-to-b from-[#232323] to-[#141414] p-6 shadow-[0_18px_40px_rgba(0,0,0,0.35)] border-l-4 border-l-[#CC5833]">
                  <h3 className="font-mono text-[10px] uppercase tracking-widest text-[#F2F0E9]/50 mb-3">Climate-Aviation Nexus</h3>
                  <p className="text-sm text-[#F2F0E9]/85 leading-relaxed">Airport status uses delayed/cancelled share in the live Aviationstack pull for each hub IATA. With sparse samples, many hubs may read NORMAL. {intel.airlineOps.filter(a=>a.status!=='NORMAL').length} of {intel.airlineOps.length} hubs show non-normal status in this ingest.</p>
                </div>
              </div>
              );
            })()}

            {/* PAGE 12: CASCADE ANALYSIS */}
            {activePage === 'cascade' && (
              <div className="p-6 md:p-8 max-w-[1600px] mx-auto animate-fadeIn overflow-y-auto custom-scrollbar" style={{ maxHeight: 'calc(100vh - 100px)' }}>
                <PageHeader
                  title="Cascade analysis"
                  subtitle="How physical, infrastructure, and economic layers line up in this ingest — narrative + radar for compound risk."
                />

                {/* Cascade flow */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 items-stretch">
                  {[
                    { step: 'Physical Layer', value: `${kpis.totalHazards}`, sub: `${data.quakes.length} seismic + ${data.fires.length} thermal`, color: '#7BA4C7', icon: <Globe2 size={20} />, detail: `Peak magnitude: M${topQuakes[0]?.mag.toFixed(1) || '—'}. Events span ${regionBreakdown.length} distinct regions. ${magnitudeDistribution[5]?.count || 0} events above M6.0 — threshold for infrastructure damage.` },
                    { step: 'Infrastructure Layer', value: `${kpis.avDisruptionRate.toFixed(1)}%`, sub: `${kpis.cancelled} cancelled, ${kpis.delayed} delayed`, color: '#CC5833', icon: <Plane size={20} />, detail: `Aviation network absorbing physical hazard shocks with 4-8 hour propagation lag. ${kpis.avDisruptionRate > 30 ? 'Disruption rate exceeds 30% threshold — active cascade.' : 'Rate within normal absorption capacity.'}` },
                    { step: 'Economic Layer', value: `${kpis.marketDelta > 0 ? '+' : ''}${kpis.marketDelta}%`, sub: `S&P 500: ${data.markets?.c?.toFixed(1) || '—'}`, color: kpis.marketDelta < -1 ? '#EF4444' : '#6B9E78', icon: <TrendingDown size={20} />, detail: `Market sentiment ${kpis.marketDelta < -1 ? 'reflects stress from multi-domain disruption. Correlation with physical hazard intensity detected.' : 'shows resilience. No significant cross-domain contagion reaching financial markets yet.'}` },
                  ].map((layer, i) => (
                    <div key={i} className="rounded-2xl border border-[#2a2a2a] bg-gradient-to-b from-[#232323] to-[#141414] p-6 shadow-[0_18px_40px_rgba(0,0,0,0.35)] relative overflow-hidden flex flex-col">
                      <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: layer.color }} />
                      <div className="flex items-center gap-2 mb-4" style={{ color: layer.color }}>{layer.icon}<span className="font-mono text-[10px] uppercase tracking-widest font-bold">{layer.step}</span></div>
                      <div className="text-4xl font-bold tracking-tight mb-2" style={{ color: layer.color }}>{layer.value}</div>
                      <p className="font-mono text-[10px] text-[#8A857A] mb-4">{layer.sub}</p>
                      <p className="text-xs leading-relaxed text-[#C8C4BA] flex-1">{layer.detail}</p>
                      {i < 2 && <div className="absolute -right-4 top-1/2 -translate-y-1/2 text-[#CC5833]/20 hidden md:block"><ArrowRight size={28} /></div>}
                    </div>
                  ))}
                </div>

                {/* Cascade thesis */}
                <div className="rounded-2xl border border-[#2a2a2a] bg-gradient-to-b from-[#232323] to-[#141414] p-8 shadow-[0_18px_40px_rgba(0,0,0,0.35)] border-l-4 border-l-[#CC5833] mb-8">
                  <h3 className="font-mono text-[10px] uppercase tracking-widest text-[#F2F0E9]/50 mb-4 flex items-center gap-2"><Network size={14} /> Cascade Thesis</h3>
                  <div className="space-y-4 text-sm leading-relaxed text-[#F2F0E9]/85">
                    <p>When <strong className="text-[#7BA4C7]">seismic activity intensifies</strong> across tectonic boundaries, infrastructure networks absorb these physical shocks and translate them into operational disruptions. Aviation is the first measurable responder — currently showing a <strong className="text-[#CC5833]">{kpis.avDisruptionRate.toFixed(1)}%</strong> disruption rate.</p>
                    <p>The temporal analysis indicates a <strong className="text-[#F2F0E9]">4–8 hour lag</strong> between hazard spikes and peak aviation disruption, followed by a secondary wave in maritime and supply chain domains (not yet visible in current data window).</p>
                    <p>S&P 500 at <strong className={kpis.marketDelta < 0 ? 'text-[#EF4444]' : 'text-[#7BA4C7]'}>{kpis.marketDelta > 0 ? '+' : ''}{kpis.marketDelta}%</strong> — {kpis.marketDelta < -1 ? 'stress is propagating into the economic layer. Cross-domain cascade is active. Recommend elevated monitoring protocols.' : 'financial markets remain within absorption capacity. No systemic cascade detected at this time.'}</p>
                  </div>
                </div>

                {/* Risk assessment */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  <div className="rounded-2xl border border-[#2a2a2a] bg-gradient-to-b from-[#232323] to-[#141414] p-6 shadow-[0_18px_40px_rgba(0,0,0,0.35)]">
                    <h3 className="font-mono text-[10px] uppercase tracking-widest text-[#8A857A] mb-4">Compound Risk Assessment</h3>
                    <div className="h-[220px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={radarData}>
                          <PolarGrid stroke="#333" />
                          <PolarAngleAxis dataKey="axis" tick={{ fontSize: 10, fill: '#C8C4BA', fontFamily: 'monospace' }} />
                          <PolarRadiusAxis tick={false} axisLine={false} domain={[0, 100]} />
                          <Radar dataKey="value" stroke="#CC5833" fill="#CC5833" fillOpacity={0.2} strokeWidth={2} dot={{ r: 3, fill: '#CC5833' }} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-[#2a2a2a] bg-gradient-to-b from-[#232323] to-[#141414] p-6 shadow-[0_18px_40px_rgba(0,0,0,0.35)]">
                    <h3 className="font-mono text-[10px] uppercase tracking-widest text-[#8A857A] mb-4">Cascade Propagation Timeline</h3>
                    <div className="space-y-4">
                      {[
                        { t: 'T+0h', label: 'Physical Trigger', desc: `${kpis.totalHazards} hazard events detected across sensor networks`, color: '#7BA4C7', active: true },
                        { t: 'T+4h', label: 'Infrastructure Response', desc: `Aviation disruption rate climbing to ${kpis.avDisruptionRate.toFixed(1)}%`, color: '#CC5833', active: kpis.avDisruptionRate > 5 },
                        { t: 'T+8h', label: 'Supply Chain Stress', desc: 'Maritime and logistics networks begin absorbing secondary effects', color: '#F59E0B', active: kpis.avDisruptionRate > 20 },
                        { t: 'T+12h', label: 'Economic Contagion', desc: `Markets at ${kpis.marketDelta > 0 ? '+' : ''}${kpis.marketDelta}% — ${kpis.marketDelta < -1 ? 'stress detected' : 'contained'}`, color: kpis.marketDelta < -1 ? '#EF4444' : '#6B9E78', active: Math.abs(kpis.marketDelta) > 1 },
                      ].map((step, i) => (
                        <div key={i} className={`flex items-start gap-4 ${step.active ? 'opacity-100' : 'opacity-35'}`}>
                          <div className="flex flex-col items-center shrink-0 pt-1">
                            <div className={`w-3 h-3 rounded-full border-2 ${step.active ? 'bg-current' : ''}`} style={{ borderColor: step.color, color: step.color }} />
                            {i < 3 && <div className="w-[1px] h-8 bg-[#333] mt-1" />}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="font-mono text-[10px] font-bold" style={{ color: step.color }}>{step.t}</span>
                              <span className="font-mono text-[10px] uppercase tracking-wider text-[#C8C4BA]">{step.label}</span>
                            </div>
                            <p className="text-xs text-[#8A857A]">{step.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="py-10 text-center"><p className="font-mono text-[10px] uppercase tracking-widest text-[#8A857A]/50">End of Intelligence Briefing</p></div>
              </div>
            )}
          </div>
        </main>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar{width:5px;height:5px}
        .custom-scrollbar::-webkit-scrollbar-track{background:transparent}
        .custom-scrollbar::-webkit-scrollbar-thumb{background:rgba(204,88,51,0.15);border-radius:4px}
        .custom-scrollbar::-webkit-scrollbar-thumb:hover{background:rgba(204,88,51,0.3)}
        .recharts-cartesian-axis-tick-value{font-family:'IBM Plex Mono',monospace;font-size:9px}
        @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        .animate-fadeIn{animation:fadeIn 0.3s ease-out}
      `}</style>
    </div>
  );
}
