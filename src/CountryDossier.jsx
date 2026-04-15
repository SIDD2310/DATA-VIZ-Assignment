import React, { useMemo, useState, useEffect } from 'react';
import {
  ArrowLeft, Shield, Flame, Globe2, Plane, Anchor, Zap, AlertTriangle,
  TrendingUp, TrendingDown, Users, Fuel, Radio, Cable, BarChart3,
  Clock, Eye, MapPin, Activity, FileText, Newspaper, ExternalLink, Loader2
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts';

const THEME = {
  bg: '#1A1A1A', surface: '#2A2A28', text: '#F2F0E9',
  textSecondary: '#C8C4BA', textMuted: '#8A857A', accent: '#CC5833',
  primary: '#2E4036', danger: '#EF4444', blue: '#7BA4C7',
  green: '#6B9E78', flight: '#A78BFA', warning: '#F59E0B',
};

const INFRA_DATA = {
  'United States of America': { ports: ['Port of Los Angeles', 'Port of Houston', 'Port of New York/NJ', 'Port of Savannah', 'Port of Long Beach'], cables: ['MAREA', 'Dunant', 'AC-1', 'TAT-14'], energy: [{ name: 'Gas', pct: 40 }, { name: 'Nuclear', pct: 19 }, { name: 'Coal', pct: 10 }, { name: 'Wind', pct: 11 }, { name: 'Hydro', pct: 6 }, { name: 'Solar', pct: 6 }, { name: 'Other', pct: 8 }] },
  'Russia': { ports: ['Novorossiysk', 'Primorsk', 'Port of Vladivostok', 'Ust-Luga', 'Baltiysk'], cables: ['ROTACS', 'TEA'], energy: [{ name: 'Gas', pct: 45 }, { name: 'Nuclear', pct: 18 }, { name: 'Coal', pct: 18 }, { name: 'Hydro', pct: 17 }, { name: 'Oil', pct: 1 }, { name: 'Other', pct: 1 }] },
  'China': { ports: ['Port of Shanghai', 'Port of Shenzhen', 'Port of Ningbo-Zhoushan', 'Port of Qingdao'], cables: ['APG', 'APCN-2', 'SJC', 'EAC-C2C'], energy: [{ name: 'Coal', pct: 60 }, { name: 'Hydro', pct: 15 }, { name: 'Wind', pct: 9 }, { name: 'Nuclear', pct: 5 }, { name: 'Solar', pct: 5 }, { name: 'Gas', pct: 4 }, { name: 'Other', pct: 2 }] },
  'India': { ports: ['Mundra', 'Jawaharlal Nehru Port', 'Chennai Port', 'Visakhapatnam'], cables: ['i2i', 'MENA/Gulf Bridge', 'TGN-IA'], energy: [{ name: 'Coal', pct: 55 }, { name: 'Solar', pct: 12 }, { name: 'Gas', pct: 8 }, { name: 'Wind', pct: 8 }, { name: 'Hydro', pct: 10 }, { name: 'Nuclear', pct: 3 }, { name: 'Other', pct: 4 }] },
  'Japan': { ports: ['Port of Tokyo', 'Port of Yokohama', 'Port of Kobe', 'Port of Osaka'], cables: ['APCN-2', 'FASTER', 'SJC', 'Unity'], energy: [{ name: 'Gas', pct: 35 }, { name: 'Coal', pct: 28 }, { name: 'Nuclear', pct: 7 }, { name: 'Hydro', pct: 8 }, { name: 'Solar', pct: 10 }, { name: 'Oil', pct: 6 }, { name: 'Other', pct: 6 }] },
  'United Kingdom': { ports: ['Port of Felixstowe', 'Port of Southampton', 'Port of London'], cables: ['DANICE', 'SHEFA-2', 'Hibernia Express', 'AEConnect-1'], energy: [{ name: 'Gas', pct: 38 }, { name: 'Wind', pct: 27 }, { name: 'Nuclear', pct: 15 }, { name: 'Solar', pct: 5 }, { name: 'Hydro', pct: 2 }, { name: 'Other', pct: 13 }] },
  'Brazil': { ports: ['Port of Santos', 'Port of Paranaguá', 'Port of Rio de Janeiro'], cables: ['EllaLink', 'SACS', 'BRUSA'], energy: [{ name: 'Hydro', pct: 63 }, { name: 'Wind', pct: 12 }, { name: 'Gas', pct: 8 }, { name: 'Solar', pct: 5 }, { name: 'Biomass', pct: 8 }, { name: 'Nuclear', pct: 2 }, { name: 'Other', pct: 2 }] },
  'Australia': { ports: ['Port of Melbourne', 'Port of Sydney', 'Port of Brisbane'], cables: ['JGA-S', 'INDIGO', 'Australia-Singapore'], energy: [{ name: 'Coal', pct: 43 }, { name: 'Gas', pct: 20 }, { name: 'Solar', pct: 15 }, { name: 'Wind', pct: 12 }, { name: 'Hydro', pct: 6 }, { name: 'Other', pct: 4 }] },
  'Germany': { ports: ['Port of Hamburg', 'Port of Bremerhaven', 'Port of Wilhelmshaven'], cables: ['TAE', 'SeaLion-1'], energy: [{ name: 'Wind', pct: 27 }, { name: 'Coal', pct: 22 }, { name: 'Gas', pct: 13 }, { name: 'Solar', pct: 12 }, { name: 'Nuclear', pct: 6 }, { name: 'Biomass', pct: 9 }, { name: 'Other', pct: 11 }] },
  'France': { ports: ['Port of Marseille', 'Port of Le Havre', 'Port of Dunkirk'], cables: ['Dunant', 'AEConnect-1', 'IMEWE'], energy: [{ name: 'Nuclear', pct: 63 }, { name: 'Hydro', pct: 11 }, { name: 'Wind', pct: 10 }, { name: 'Gas', pct: 7 }, { name: 'Solar', pct: 5 }, { name: 'Other', pct: 4 }] },
  'Indonesia': { ports: ['Tanjung Priok', 'Tanjung Perak', 'Makassar'], cables: ['SEA-ME-WE 5', 'IGG'], energy: [{ name: 'Coal', pct: 62 }, { name: 'Gas', pct: 18 }, { name: 'Hydro', pct: 7 }, { name: 'Other', pct: 13 }] },
  'Mexico': { ports: ['Manzanillo', 'Lázaro Cárdenas', 'Veracruz'], cables: ['AMX-1', 'ARCOS'], energy: [{ name: 'Gas', pct: 54 }, { name: 'Oil', pct: 11 }, { name: 'Wind', pct: 7 }, { name: 'Hydro', pct: 10 }, { name: 'Solar', pct: 5 }, { name: 'Nuclear', pct: 4 }, { name: 'Other', pct: 9 }] },
  'Turkey': { ports: ['Ambarlı', 'Mersin', 'İzmit'], cables: ['KAFOS', 'MedNautilus'], energy: [{ name: 'Gas', pct: 33 }, { name: 'Coal', pct: 33 }, { name: 'Hydro', pct: 20 }, { name: 'Wind', pct: 8 }, { name: 'Solar', pct: 4 }, { name: 'Other', pct: 2 }] },
  'South Korea': { ports: ['Port of Busan', 'Port of Incheon', 'Port of Gwangyang'], cables: ['APG', 'EAC-C2C', 'KJCN'], energy: [{ name: 'Coal', pct: 32 }, { name: 'Gas', pct: 29 }, { name: 'Nuclear', pct: 27 }, { name: 'Solar', pct: 5 }, { name: 'Other', pct: 7 }] },
  'Italy': { ports: ['Port of Genoa', 'Port of Trieste', 'Port of Gioia Tauro'], cables: ['SEA-ME-WE 5', 'FLAG Europe-Asia'], energy: [{ name: 'Gas', pct: 42 }, { name: 'Solar', pct: 11 }, { name: 'Hydro', pct: 11 }, { name: 'Wind', pct: 7 }, { name: 'Coal', pct: 5 }, { name: 'Other', pct: 24 }] },
  'Canada': { ports: ['Port of Vancouver', 'Port of Montreal', 'Port of Halifax'], cables: ['Hibernia Atlantic', 'CANTAT-3'], energy: [{ name: 'Hydro', pct: 59 }, { name: 'Nuclear', pct: 15 }, { name: 'Gas', pct: 11 }, { name: 'Wind', pct: 6 }, { name: 'Coal', pct: 3 }, { name: 'Other', pct: 6 }] },
  'South Africa': { ports: ['Port of Durban', 'Port of Cape Town', 'Port of Richards Bay'], cables: ['WACS', 'SAT-3/WASC', 'SAFE'], energy: [{ name: 'Coal', pct: 80 }, { name: 'Nuclear', pct: 5 }, { name: 'Wind', pct: 5 }, { name: 'Solar', pct: 4 }, { name: 'Other', pct: 6 }] },
  'Saudi Arabia': { ports: ['Jeddah Islamic Port', 'King Abdulaziz Port', 'Jubail Commercial Port'], cables: ['FLAG', 'IMEWE', 'JADI'], energy: [{ name: 'Gas', pct: 57 }, { name: 'Oil', pct: 38 }, { name: 'Solar', pct: 3 }, { name: 'Other', pct: 2 }] },
  'Nigeria': { ports: ['Port of Lagos (Apapa)', 'Tin Can Island', 'Onne Port'], cables: ['SAT-3/WASC', 'MainOne', 'ACE'], energy: [{ name: 'Gas', pct: 80 }, { name: 'Hydro', pct: 17 }, { name: 'Other', pct: 3 }] },
  'Egypt': { ports: ['Port of Alexandria', 'Port Said', 'Damietta Port'], cables: ['SEA-ME-WE 5', 'FLAG', 'IMEWE', 'TE North'], energy: [{ name: 'Gas', pct: 76 }, { name: 'Oil', pct: 5 }, { name: 'Wind', pct: 8 }, { name: 'Solar', pct: 4 }, { name: 'Hydro', pct: 5 }, { name: 'Other', pct: 2 }] },
};

function computeInstability(quakes, fires, flights, hubs, country) {
  const hubsHere = hubs.filter(h => h.country === country);
  const flightsHere = flights.filter(f => { const fh = hubs.find(h => h.code === f.from); const th = hubs.find(h => h.code === f.to); return fh?.country === country || th?.country === country; });
  const cancelled = flightsHere.filter(f => f.status === 'cancelled').length;
  const delayed = flightsHere.filter(f => f.status === 'delayed').length;

  let unrest = Math.min(100, quakes.filter(q => q.mag > 3).length * 3 + fires.length * 2);
  let conflict = Math.min(100, quakes.filter(q => q.mag > 5).length * 15);
  let security = Math.min(100, (cancelled + delayed) * 8 + fires.length);
  let info = Math.min(100, Math.floor(Math.random() * 30 + (quakes.length > 20 ? 40 : 10)));
  let total = Math.round((unrest * 0.3 + conflict * 0.25 + security * 0.25 + info * 0.2));

  let label = 'stable';
  if (total > 70) label = 'critical';
  else if (total > 50) label = 'high';
  else if (total > 30) label = 'elevated';

  return { total, label, unrest, conflict, security, info, hubsHere, flightsHere, cancelled, delayed };
}

const ScoreBar = ({ label, value, icon, color }) => (
  <div className="flex items-center gap-3 py-2">
    <div className="w-5 text-center">{icon}</div>
    <span className="font-mono text-[10px] uppercase tracking-wider text-[#C8C4BA] w-24">{label}</span>
    <div className="flex-1 h-2 bg-[#1A1A1A] rounded-full overflow-hidden">
      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${value}%`, background: `linear-gradient(90deg, ${color}, ${color}90)` }} />
    </div>
    <span className="font-mono text-sm font-bold w-8 text-right" style={{ color }}>{value}</span>
  </div>
);

const SectionHeader = ({ icon, title }) => (
  <div className="flex items-center gap-2 mb-4 mt-8 first:mt-0">
    <span className="text-[#CC5833]">{icon}</span>
    <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#8A857A]">{title}</h3>
    <div className="flex-1 h-[1px] bg-[#2A2A28] ml-2" />
  </div>
);

const EnergyBar = ({ data }) => {
  const colors = { Coal: '#555', Oil: '#888', Gas: '#CC5833', Nuclear: '#F59E0B', Hydro: '#7BA4C7', Wind: '#6B9E78', Solar: '#F59E0B', Biomass: '#6B9E78', Other: '#555' };
  return (
    <div>
      <div className="flex h-4 rounded-full overflow-hidden mb-3">
        {data.map((d, i) => <div key={i} style={{ width: `${d.pct}%`, backgroundColor: colors[d.name] || '#555' }} title={`${d.name} ${d.pct}%`} />)}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {data.map((d, i) => (
          <span key={i} className="flex items-center gap-1.5 font-mono text-[10px] text-[#C8C4BA]">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: colors[d.name] || '#555' }} />
            {d.name} {d.pct}%
          </span>
        ))}
      </div>
    </div>
  );
};

const GEONAME_TO_API = {
  'United States of America': 'United States',
  'Dem. Rep. Congo': 'DR Congo',
  'Central African Rep.': 'Central African Republic',
  'S. Sudan': 'South Sudan',
  'Côte d\'Ivoire': 'Ivory Coast',
  'Eq. Guinea': 'Equatorial Guinea',
  'W. Sahara': 'Western Sahara',
  'Solomon Is.': 'Solomon Islands',
  'Dominican Rep.': 'Dominican Republic',
  'Falkland Is.': 'Falkland Islands',
  'Fr. S. Antarctic Lands': 'French Southern Territories',
  'N. Cyprus': 'Cyprus',
  'Somaliland': 'Somalia',
  'Bosnia and Herz.': 'Bosnia and Herzegovina',
  'Czech Rep.': 'Czech Republic',
  'Czechia': 'Czech Republic',
  'Macedonia': 'North Macedonia',
  'N. Macedonia': 'North Macedonia',
  'Lao PDR': 'Laos',
  'Myanmar': 'Myanmar',
  'Korea': 'South Korea',
  'Dem. Rep. Korea': 'North Korea',
  'Rep. Congo': 'Republic of the Congo',
  'Congo': 'Republic of the Congo',
  'eSwatini': 'Eswatini',
  'Timor-Leste': 'Timor-Leste',
  'Brunei Darussalam': 'Brunei',
  'Russian Federation': 'Russia',
  'Iran (Islamic Republic of)': 'Iran',
  'Syrian Arab Republic': 'Syria',
  'Viet Nam': 'Vietnam',
  'Türkiye': 'Turkey',
  'Palestine': 'Palestine',
  'Taiwan': 'Taiwan',
  'Kosovo': 'Kosovo',
};

function parseCountryData(c) {
  return {
    capital: c.capital?.[0] || '—',
    population: c.population ? (c.population >= 1e9 ? `${(c.population / 1e9).toFixed(1)}B` : c.population >= 1e6 ? `${(c.population / 1e6).toFixed(1)}M` : c.population.toLocaleString()) : '—',
    area: c.area ? `${c.area.toLocaleString()} km\u00B2` : '—',
    region: c.subregion || c.region || '—',
    languages: c.languages ? Object.values(c.languages).slice(0, 3).join(', ') : '—',
    currency: c.currencies ? Object.values(c.currencies).map(cu => `${cu.name} (${cu.symbol || ''})`).slice(0, 2).join(', ') : '—',
    iso: c.cca2 || '',
    flag: c.flags?.svg || c.flags?.png || '',
    coatOfArms: c.coatOfArms?.svg || '',
    borders: c.borders || [],
    timezones: c.timezones?.slice(0, 3) || [],
    latlng: c.latlng || [],
    independent: c.independent,
    unMember: c.unMember,
    landlocked: c.landlocked,
    continents: c.continents || [],
    gini: c.gini ? Object.values(c.gini)[0] : null,
    demonym: c.demonyms?.eng?.m || '—',
    tld: c.tld?.[0] || '—',
    callingCode: c.idd?.root ? `${c.idd.root}${c.idd.suffixes?.[0] || ''}` : '—',
    officialName: c.name?.official || c.name?.common || '',
  };
}

function emptyInfo(name) {
  return {
    capital: '—', population: '—', area: '—', region: '—', languages: '—', currency: '—',
    iso: name.slice(0, 2).toUpperCase(), flag: '', coatOfArms: '', borders: [],
    timezones: [], latlng: [], independent: null, unMember: null, landlocked: null, continents: [],
    gini: null, demonym: '—', tld: '—', callingCode: '—', officialName: '',
  };
}

/** Google News RSS titles are usually "Headline - Outlet". */
function splitGoogleNewsTitle(raw) {
  if (!raw || typeof raw !== 'string') return { title: '', source: 'News' };
  const i = raw.lastIndexOf(' - ');
  if (i <= 0) return { title: raw.trim(), source: 'News' };
  return { title: raw.slice(0, i).trim(), source: raw.slice(i + 3).trim() };
}

function stripHtml(s) {
  return String(s || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

const RESTCOUNTRIES_FIELDS =
  'name,cca2,capital,population,area,subregion,region,languages,currencies,flags,coatOfArms,borders,timezones,latlng,independent,unMember,landlocked,continents,gini,demonyms,tld,idd';

function fetchSignal(ms) {
  if (typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function') {
    return AbortSignal.timeout(ms);
  }
  const c = new AbortController();
  setTimeout(() => c.abort(), ms);
  return c.signal;
}

/** No browser CORS issues; works without API keys (rss2json + Google News RSS). */
async function fetchCountryHeadlinesFromGoogleNewsRss(searchQuery, signal) {
  const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(searchQuery)}&hl=en-US&gl=US&ceid=US:en`;
  const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`;
  const res = await fetch(apiUrl, signal ? { signal } : undefined);
  if (!res.ok) return null;
  const data = await res.json();
  if (data.status !== 'ok' || !Array.isArray(data.items) || data.items.length === 0) return null;
  return data.items.slice(0, 10).map((item) => {
    const { title, source } = splitGoogleNewsTitle(item.title);
    const desc = stripHtml(item.description || item.content || '');
    return {
      title: title || item.title,
      description: desc.slice(0, 220),
      source,
      url: item.link,
      date: item.pubDate,
      image: item.thumbnail || '',
      category: 'general',
    };
  });
}

export default function CountryDossier({ country, quakes, fires, flights, hubs, onBack }) {
  const [countryInfo, setCountryInfo] = useState(null);
  const [news, setNews] = useState([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [infoLoading, setInfoLoading] = useState(true);

  const infra = INFRA_DATA[country] || { ports: [], cables: [], energy: [] };
  const inst = useMemo(() => computeInstability(quakes, fires, flights, hubs, country), [country, quakes, fires, flights, hubs]);

  useEffect(() => {
    let cancelled = false;
    const searchName = GEONAME_TO_API[country] || country;

    (async () => {
      setInfoLoading(true);
      const sig = fetchSignal(12000);
      const tryFetch = async (url) => {
        try {
          const res = await fetch(url, { signal: sig });
          if (!res.ok) return null;
          const data = await res.json();
          if (!Array.isArray(data) || data.length === 0) return null;
          return data;
        } catch {
          return null;
        }
      };

      try {
        const base = `https://restcountries.com/v3.1/name/${encodeURIComponent(searchName)}`;
        const f = `fields=${RESTCOUNTRIES_FIELDS}`;
        const [strict, fuzzy] = await Promise.all([
          tryFetch(`${base}?fullText=true&${f}`),
          tryFetch(`${base}?${f}`),
        ]);
        let data = strict || fuzzy;

        if (!data && searchName !== country) {
          data = await tryFetch(`https://restcountries.com/v3.1/name/${encodeURIComponent(country)}?${f}`);
        }

        if (data && !cancelled) {
          const nameLower = searchName.toLowerCase();
          const best = data.find(c =>
            c.name?.common?.toLowerCase() === nameLower ||
            c.name?.official?.toLowerCase() === nameLower
          ) || data.find(c =>
            c.name?.common?.toLowerCase().includes(nameLower) ||
            nameLower.includes(c.name?.common?.toLowerCase())
          ) || data[0];

          setCountryInfo(parseCountryData(best));
        } else if (!cancelled) {
          setCountryInfo(emptyInfo(country));
        }
      } catch {
        if (!cancelled) setCountryInfo(emptyInfo(country));
      }
      if (!cancelled) setInfoLoading(false);
    })();
    return () => { cancelled = true; };
  }, [country]);

  useEffect(() => {
    let cancelled = false;
    const searchTerm = GEONAME_TO_API[country] || country;
    const newsSig = fetchSignal(12000);
    /* Reset must run before parallel fetches start (same tick). */
    /* eslint-disable react-hooks/set-state-in-effect */
    setNewsLoading(true);
    setNews([]);
    /* eslint-enable react-hooks/set-state-in-effect */

    const mapGnews = (data) =>
      data.articles?.map((a) => ({
        title: a.title,
        description: (a.description || '').slice(0, 200),
        source: a.source?.name || 'Unknown',
        url: a.url,
        date: a.publishedAt,
        image: a.image,
        category: 'general',
      }));

    const mapNewsdata = (data) =>
      data.results?.map((a) => ({
        title: a.title,
        description: (a.description || '').slice(0, 200),
        source: a.source_name || a.source_id || 'Unknown',
        url: a.link,
        date: a.pubDate,
        image: a.image_url,
        category: a.category?.[0] || 'general',
      }));

    let settled = false;

    const acceptFirst = (list) => {
      if (cancelled || settled || !list?.length) return;
      settled = true;
      setNews(list);
      setNewsLoading(false);
    };

    const gnewsKey = import.meta.env?.VITE_GNEWS_API_KEY || 'demo';
    const newsdataKey = import.meta.env?.VITE_NEWSDATA_API_KEY || '';
    const isoCode = countryInfo?.iso?.toLowerCase();

    const tasks = [
      (async () => {
        try {
          const res = await fetch(
            `https://gnews.io/api/v4/search?q=${encodeURIComponent(searchTerm)}&lang=en&max=8&apikey=${encodeURIComponent(gnewsKey)}`,
            { signal: newsSig },
          );
          if (!res.ok) return;
          const data = await res.json();
          const list = mapGnews(data);
          acceptFirst(list?.length ? list : null);
        } catch { /* ignore */ }
      })(),
      (async () => {
        try {
          const list = await fetchCountryHeadlinesFromGoogleNewsRss(searchTerm, newsSig);
          acceptFirst(list);
        } catch { /* ignore */ }
      })(),
    ];

    if (newsdataKey && isoCode) {
      tasks.push(
        (async () => {
          try {
            const res = await fetch(
              `https://newsdata.io/api/1/latest?apikey=${encodeURIComponent(newsdataKey)}&country=${encodeURIComponent(isoCode)}&language=en&size=8`,
              { signal: newsSig },
            );
            if (!res.ok) return;
            const data = await res.json();
            const list = mapNewsdata(data);
            acceptFirst(list?.length ? list : null);
          } catch { /* ignore */ }
        })(),
      );
    }

    Promise.allSettled(tasks).then(() => {
      if (cancelled) return;
      if (!settled) setNewsLoading(false);
    });

    return () => { cancelled = true; };
  }, [country, countryInfo?.iso]);

  const magChart = useMemo(() => {
    const b = [{ range: '< 3', count: 0, color: '#6B9E78' }, { range: '3\u20134', count: 0, color: '#7BA4C7' }, { range: '4\u20135', count: 0, color: '#F59E0B' }, { range: '5\u20136', count: 0, color: '#CC5833' }, { range: '6+', count: 0, color: '#EF4444' }];
    quakes.forEach(q => { if (q.mag >= 6) b[4].count++; else if (q.mag >= 5) b[3].count++; else if (q.mag >= 4) b[2].count++; else if (q.mag >= 3) b[1].count++; else b[0].count++; });
    return b;
  }, [quakes]);

  const topQuakes = useMemo(() => [...quakes].sort((a, b) => b.mag - a.mag).slice(0, 10), [quakes]);
  const maxMag = topQuakes[0]?.mag || 0;

  const riskColor = inst.label === 'critical' ? '#EF4444' : inst.label === 'high' ? '#CC5833' : inst.label === 'elevated' ? '#F59E0B' : '#6B9E78';
  const now = new Date();
  const iso = countryInfo?.iso || country.slice(0, 2).toUpperCase();

  return (
    <div className="h-full overflow-y-auto custom-scrollbar bg-[#1A1A1A] text-[#F2F0E9]">
      <div className="sticky top-0 z-20 bg-[#1A1A1A]/95 backdrop-blur-md border-b border-[#CC5833]/10 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-[#C8C4BA] hover:text-[#CC5833] transition-colors">
            <ArrowLeft size={14} /> Back to Map
          </button>
          <div className="w-[1px] h-5 bg-[#CC5833]/20" />
          <div className="flex items-center gap-3">
            {countryInfo?.flag && <img src={countryInfo.flag} alt="" className="h-6 rounded shadow" />}
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] text-[#8A857A] uppercase">{iso}</span>
                <h1 className="font-sans font-bold text-xl">{country}</h1>
              </div>
              <p className="font-mono text-[9px] text-[#8A857A] uppercase tracking-wider">{iso} &bull; Country Intelligence</p>
            </div>
          </div>
        </div>
        <div className="font-mono text-[9px] text-[#8A857A]">Updated {now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, {now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>
      </div>

      <div className="max-w-[1200px] mx-auto px-6 py-6">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          {/* LEFT COLUMN */}
          <div className="xl:col-span-2 space-y-1">

            <SectionHeader icon={<Shield size={14} />} title="Instability Index" />
            <div className="bg-[#2A2A28] rounded-2xl p-6 border border-[#CC5833]/10">
              <div className="flex items-baseline gap-3 mb-5">
                <span className="text-5xl font-bold" style={{ color: riskColor }}>{inst.total}/100</span>
                <span className="font-mono text-sm" style={{ color: riskColor }}>&rarr; {inst.label}</span>
              </div>
              <ScoreBar label="Unrest" value={inst.unrest} color="#CC5833" icon={<AlertTriangle size={13} className="text-[#CC5833]" />} />
              <ScoreBar label="Conflict" value={inst.conflict} color="#EF4444" icon={<Zap size={13} className="text-[#EF4444]" />} />
              <ScoreBar label="Security" value={inst.security} color="#F59E0B" icon={<Shield size={13} className="text-[#F59E0B]" />} />
              <ScoreBar label="Information" value={inst.info} color="#A78BFA" icon={<Radio size={13} className="text-[#A78BFA]" />} />
            </div>

            <SectionHeader icon={<FileText size={14} />} title="Intelligence Brief" />
            <div className="bg-[#2A2A28] rounded-2xl p-6 border border-[#CC5833]/10 space-y-5">
              <div>
                <h4 className="font-mono text-[9px] uppercase tracking-widest text-[#8A857A] mb-2">Situation Now</h4>
                <p className="text-sm leading-relaxed text-[#C8C4BA]">
                  {quakes.length > 0 || fires.length > 0
                    ? `${country} is currently experiencing ${quakes.length > 0 ? `${quakes.length} seismic event${quakes.length > 1 ? 's' : ''} (peak magnitude ${maxMag.toFixed(1)})` : ''}${quakes.length > 0 && fires.length > 0 ? ' alongside ' : ''}${fires.length > 0 ? `${fires.length} active thermal anomal${fires.length > 1 ? 'ies' : 'y'} detected by NASA FIRMS` : ''}. ${inst.label === 'critical' || inst.label === 'high' ? 'The combination of physical hazards and infrastructure stress poses significant compound risk to regional stability and economic operations.' : 'Current activity levels suggest localized disruption potential without systemic cascade risk.'}`
                    : `No significant physical hazard activity currently detected in ${country}. The geophysical environment appears stable, though monitoring continues across all sensor networks.`}
                </p>
              </div>
              {topQuakes.length > 0 && (
                <div>
                  <h4 className="font-mono text-[9px] uppercase tracking-widest text-[#8A857A] mb-2">What This Means for {country}</h4>
                  <ul className="space-y-2">
                    {topQuakes.slice(0, 4).map((q, i) => (
                      <li key={i} className="flex gap-2 text-sm text-[#C8C4BA]">
                        <span className="text-[#CC5833] shrink-0">&bull;</span>
                        <span><strong className="text-[#F2F0E9]">{q.place}</strong> (M{q.mag.toFixed(1)}) &mdash; {q.mag > 5 ? 'Significant seismic event with potential for infrastructure damage, aftershock sequences, and regional displacement.' : q.mag > 4 ? 'Moderate event. Limited structural risk but may trigger heightened alert status.' : 'Minor event. Within normal seismological parameters for this region.'}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <SectionHeader icon={<Clock size={14} />} title="Outlook" />
            <div className="bg-[#2A2A28] rounded-2xl p-6 border border-[#CC5833]/10 space-y-4">
              {[
                { t: 'Next 24H', text: quakes.length > 5 ? `Continued seismic activity likely. ${maxMag > 5 ? 'Aftershock sequences expected near recent epicenters.' : 'Monitor for escalation above M5.0 threshold.'}` : 'No significant change expected. Baseline monitoring continues.' },
                { t: 'Next 48H', text: inst.flightsHere.length > 0 ? `Aviation routes through ${country} may experience ${inst.cancelled > 0 ? 'continued cancellations' : 'delays'} if physical hazard activity persists.` : 'Infrastructure exposure remains within normal operating parameters.' },
                { t: 'Next 72H', text: inst.total > 50 ? `Elevated instability index suggests sustained pressure on government response capacity and potential economic disruption.` : `Current trajectory suggests gradual return to baseline conditions barring new trigger events.` },
              ].map((o, i) => (
                <div key={i}>
                  <span className="font-mono text-[10px] text-[#CC5833] font-bold uppercase">{o.t}:</span>
                  <span className="text-sm text-[#C8C4BA] ml-2">{o.text}</span>
                </div>
              ))}
              <div className="mt-3 pt-3 border-t border-[#1A1A1A]">
                <h4 className="font-mono text-[9px] uppercase tracking-widest text-[#8A857A] mb-2">Watch Items</h4>
                <p className="font-mono text-sm text-[#F2F0E9]">
                  {[quakes.length > 0 && 'Seismic Activity', fires.length > 0 && 'Thermal Anomalies', inst.cancelled > 0 && 'Flight Disruptions', inst.total > 40 && 'Instability Escalation'].filter(Boolean).join(' \u00B7 ') || 'Standard monitoring protocols'}
                </p>
              </div>
            </div>

            {/* NEWS */}
            <SectionHeader icon={<Newspaper size={14} />} title={`Latest News \u2014 ${country}`} />
            <div className="bg-[#2A2A28] rounded-2xl p-6 border border-[#CC5833]/10">
              {newsLoading ? (
                <div className="flex items-center gap-3 py-8 justify-center text-[#8A857A]">
                  <Loader2 size={16} className="animate-spin" />
                  <span className="font-mono text-[10px] uppercase tracking-widest">Fetching intelligence feeds...</span>
                </div>
              ) : news.length === 0 ? (
                <p className="text-sm text-[#8A857A] text-center py-6">No recent news articles found for {country}.</p>
              ) : (
                <div className="space-y-4">
                  {news.map((article, i) => (
                    <a key={i} href={article.url} target="_blank" rel="noopener noreferrer"
                      className="block bg-[#1A1A1A]/60 rounded-xl p-4 border border-[#CC5833]/5 hover:border-[#CC5833]/20 transition-all group">
                      <div className="flex gap-4">
                        {article.image && (
                          <img src={article.image} alt="" className="w-20 h-20 rounded-lg object-cover shrink-0 bg-[#333]"
                            onError={e => e.target.style.display = 'none'} />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="px-2 py-0.5 rounded bg-[#CC5833]/10 font-mono text-[8px] uppercase tracking-wider text-[#CC5833]">{article.category}</span>
                            <span className="font-mono text-[8px] text-[#555]">{article.source}</span>
                            {article.date && <span className="font-mono text-[8px] text-[#555]">{new Date(article.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>}
                          </div>
                          <h4 className="text-sm font-bold text-[#F2F0E9] group-hover:text-[#CC5833] transition-colors leading-snug mb-1">{article.title}</h4>
                          {article.description && <p className="text-xs text-[#8A857A] leading-relaxed line-clamp-2">{article.description}</p>}
                        </div>
                        <ExternalLink size={12} className="text-[#555] group-hover:text-[#CC5833] transition-colors shrink-0 mt-1" />
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>

            <SectionHeader icon={<Activity size={14} />} title="Active Signals" />
            <div className="bg-[#2A2A28] rounded-2xl p-6 border border-[#CC5833]/10">
              <div className="flex flex-wrap gap-2 mb-4">
                {quakes.length > 0 && <span className="px-3 py-1 rounded-full bg-[#7BA4C7]/15 border border-[#7BA4C7]/30 font-mono text-[10px] text-[#7BA4C7]"><Globe2 size={10} className="inline mr-1" />{quakes.length} Earthquakes</span>}
                {fires.length > 0 && <span className="px-3 py-1 rounded-full bg-[#CC5833]/15 border border-[#CC5833]/30 font-mono text-[10px] text-[#CC5833]"><Flame size={10} className="inline mr-1" />{fires.length} Thermal</span>}
                {inst.hubsHere.length > 0 && <span className="px-3 py-1 rounded-full bg-[#A78BFA]/15 border border-[#A78BFA]/30 font-mono text-[10px] text-[#A78BFA]"><Plane size={10} className="inline mr-1" />{inst.flightsHere.length} Flights</span>}
                {inst.cancelled > 0 && <span className="px-3 py-1 rounded-full bg-[#EF4444]/15 border border-[#EF4444]/30 font-mono text-[10px] text-[#EF4444]"><AlertTriangle size={10} className="inline mr-1" />{inst.cancelled} Cancelled</span>}
                {inst.delayed > 0 && <span className="px-3 py-1 rounded-full bg-[#F59E0B]/15 border border-[#F59E0B]/30 font-mono text-[10px] text-[#F59E0B]"><Clock size={10} className="inline mr-1" />{inst.delayed} Delayed</span>}
              </div>
              {quakes.length > 0 && (
                <div>
                  <h4 className="font-mono text-[9px] uppercase tracking-widest text-[#8A857A] mb-2">Seismic Events &mdash; Magnitude Distribution</h4>
                  <div className="h-[140px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={magChart}>
                        <XAxis dataKey="range" tick={{ fontSize: 9, fill: '#8A857A', fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 9, fill: '#8A857A', fontFamily: 'monospace' }} axisLine={false} tickLine={false} width={25} />
                        <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                          {magChart.map((d, i) => <Cell key={i} fill={d.color} opacity={0.8} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
              {topQuakes.length > 0 && (
                <div className="mt-4 space-y-1.5 max-h-[200px] overflow-y-auto custom-scrollbar">
                  {topQuakes.map((q, i) => (
                    <div key={i} className="flex items-center justify-between bg-[#1A1A1A]/60 rounded-lg px-3 py-2">
                      <span className="text-xs text-[#C8C4BA] truncate max-w-[300px]">{q.place}</span>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        <span className={`font-mono text-[10px] font-bold ${q.mag >= 5 ? 'text-[#EF4444]' : q.mag >= 4 ? 'text-[#F59E0B]' : 'text-[#7BA4C7]'}`}>M{q.mag.toFixed(1)}</span>
                        <span className="font-mono text-[9px] text-[#8A857A]">D{q.depth?.toFixed(0) || '\u2014'}km</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {infra.energy.length > 0 && (
              <>
                <SectionHeader icon={<Fuel size={14} />} title="Energy Profile" />
                <div className="bg-[#2A2A28] rounded-2xl p-6 border border-[#CC5833]/10">
                  <EnergyBar data={infra.energy} />
                  <p className="font-mono text-[9px] text-[#8A857A] mt-3">Data: 2024 (OWID)</p>
                </div>
              </>
            )}
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-1">

            <SectionHeader icon={<MapPin size={14} />} title="Country Facts" />
            <div className="bg-[#2A2A28] rounded-2xl p-6 border border-[#CC5833]/10">
              {infoLoading ? (
                <div className="flex items-center gap-3 py-8 justify-center text-[#8A857A]">
                  <Loader2 size={14} className="animate-spin" />
                  <span className="font-mono text-[9px] uppercase tracking-widest">Loading...</span>
                </div>
              ) : countryInfo ? (
                <>
                  <div className="flex items-center gap-3 mb-4">
                    {countryInfo.flag && <img src={countryInfo.flag} alt={country} className="h-12 rounded shadow" />}
                    <div>
                      <p className="font-sans font-bold text-lg">{country}</p>
                      <p className="font-mono text-[9px] text-[#8A857A] uppercase">{countryInfo.region}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: 'Population', value: countryInfo.population },
                      { label: 'Capital', value: countryInfo.capital },
                      { label: 'Area', value: countryInfo.area },
                      { label: 'Languages', value: countryInfo.languages },
                      { label: 'Currency', value: countryInfo.currency },
                      { label: 'Demonym', value: countryInfo.demonym },
                      { label: 'Calling Code', value: countryInfo.callingCode },
                      { label: 'TLD', value: countryInfo.tld },
                    ].map((f, i) => (
                      <div key={i}>
                        <p className="font-mono text-[9px] uppercase tracking-widest text-[#8A857A]">{f.label}</p>
                        <p className="text-sm font-bold text-[#F2F0E9]">{f.value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t border-[#1A1A1A] flex flex-wrap gap-2">
                    {countryInfo.independent && <span className="px-2 py-0.5 rounded bg-[#6B9E78]/15 font-mono text-[8px] text-[#6B9E78] border border-[#6B9E78]/20">Independent</span>}
                    {countryInfo.unMember && <span className="px-2 py-0.5 rounded bg-[#7BA4C7]/15 font-mono text-[8px] text-[#7BA4C7] border border-[#7BA4C7]/20">UN Member</span>}
                    {countryInfo.landlocked && <span className="px-2 py-0.5 rounded bg-[#F59E0B]/15 font-mono text-[8px] text-[#F59E0B] border border-[#F59E0B]/20">Landlocked</span>}
                    {countryInfo.continents.map(c => <span key={c} className="px-2 py-0.5 rounded bg-[#CC5833]/10 font-mono text-[8px] text-[#CC5833] border border-[#CC5833]/15">{c}</span>)}
                  </div>
                  {countryInfo.timezones.length > 0 && (
                    <div className="mt-3">
                      <p className="font-mono text-[9px] uppercase tracking-widest text-[#8A857A] mb-1">Timezones</p>
                      <p className="font-mono text-[10px] text-[#C8C4BA]">{countryInfo.timezones.join(', ')}{countryInfo.timezones.length >= 3 ? '...' : ''}</p>
                    </div>
                  )}
                  {countryInfo.gini && (
                    <div className="mt-3">
                      <p className="font-mono text-[9px] uppercase tracking-widest text-[#8A857A] mb-1">Gini Index</p>
                      <p className="text-sm font-bold text-[#F59E0B]">{countryInfo.gini.toFixed(1)}</p>
                    </div>
                  )}
                </>
              ) : null}
            </div>

            <SectionHeader icon={<BarChart3 size={14} />} title="Economic Indicators" />
            <div className="bg-[#2A2A28] rounded-2xl p-5 border border-[#CC5833]/10 space-y-3">
              <div className="bg-[#CC5833]/10 rounded-xl p-4 border border-[#CC5833]/15">
                <p className="font-mono text-[10px] text-[#C8C4BA]">Instability Regime &rarr;</p>
                <p className="text-xl font-bold" style={{ color: riskColor }}>{inst.total}/100 ({inst.label})</p>
                <p className="font-mono text-[9px] text-[#8A857A] mt-1">CII &mdash; Country Instability Index</p>
              </div>
              <div className="bg-[#2E4036]/40 rounded-xl p-4 border border-[#2E4036]/40">
                <p className="font-mono text-[10px] text-[#C8C4BA]">Physical Hazard Exposure</p>
                <p className="text-xl font-bold text-[#7BA4C7]">{quakes.length + fires.length} <span className="text-sm font-normal text-[#8A857A]">events</span></p>
                <p className="font-mono text-[9px] text-[#8A857A] mt-1">Seismic + Thermal combined</p>
              </div>
              {inst.hubsHere.length > 0 && (
                <div className="bg-[#A78BFA]/8 rounded-xl p-4 border border-[#A78BFA]/15">
                  <p className="font-mono text-[10px] text-[#C8C4BA]">Aviation Disruption</p>
                  <p className="text-xl font-bold text-[#A78BFA]">{inst.flightsHere.length} <span className="text-sm font-normal text-[#8A857A]">routes monitored</span></p>
                  <p className="font-mono text-[9px] text-[#8A857A] mt-1">{inst.cancelled} cancelled &bull; {inst.delayed} delayed</p>
                </div>
              )}
            </div>

            <SectionHeader icon={<Cable size={14} />} title="Infrastructure Exposure" />
            <div className="bg-[#2A2A28] rounded-2xl p-5 border border-[#CC5833]/10">
              {infra.cables.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 bg-[#1A1A1A] rounded-xl px-4 py-2.5 mb-2">
                    <Globe2 size={14} className="text-[#7BA4C7]" />
                    <span className="font-mono text-[10px] text-[#C8C4BA] uppercase">Undersea Cables</span>
                    <span className="ml-auto font-mono text-sm font-bold text-[#F2F0E9]">{infra.cables.length}</span>
                  </div>
                  {infra.cables.map((c, i) => (
                    <div key={i} className="flex items-center justify-between px-4 py-1.5 border-b border-[#1A1A1A] last:border-0">
                      <span className="font-mono text-xs text-[#C8C4BA]">{c}</span>
                    </div>
                  ))}
                </div>
              )}
              {infra.ports.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Anchor size={13} className="text-[#CC5833]" />
                    <span className="font-mono text-[10px] text-[#C8C4BA] uppercase">Major Ports</span>
                  </div>
                  {infra.ports.map((p, i) => (
                    <div key={i} className="flex items-center justify-between px-4 py-1.5 border-b border-[#1A1A1A] last:border-0">
                      <span className="text-xs text-[#C8C4BA]">{p}</span>
                    </div>
                  ))}
                </div>
              )}
              {inst.hubsHere.length > 0 && (
                <div className="mt-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Plane size={13} className="text-[#A78BFA]" />
                    <span className="font-mono text-[10px] text-[#C8C4BA] uppercase">Aviation Hubs</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {inst.hubsHere.map(h => (
                      <span key={h.code} className="px-2.5 py-1 rounded-lg bg-[#A78BFA]/10 border border-[#A78BFA]/20 font-mono text-[10px] text-[#A78BFA]">{h.code}</span>
                    ))}
                  </div>
                </div>
              )}
              {infra.cables.length === 0 && infra.ports.length === 0 && inst.hubsHere.length === 0 && (
                <p className="text-xs text-[#8A857A] text-center py-4">No infrastructure data available for this country.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
