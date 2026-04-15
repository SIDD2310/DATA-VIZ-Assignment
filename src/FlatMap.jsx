import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const THEME = {
  blue: '#7BA4C7',
  accent: '#CC5833',
  green: '#6B9E78',
  flight: '#A78BFA',
};

const MAP_LABELS = [
  { name: 'New York', lat: 40.71, lng: -74.0 },
  { name: 'Los Angeles', lat: 34.05, lng: -118.24 },
  { name: 'Mexico City', lat: 19.43, lng: -99.13 },
  { name: 'London', lat: 51.51, lng: -0.13 },
  { name: 'Moscow', lat: 55.76, lng: 37.62 },
  { name: 'Dubai', lat: 25.2, lng: 55.27 },
  { name: 'Beijing', lat: 39.9, lng: 116.4 },
  { name: 'Tokyo', lat: 35.68, lng: 139.65 },
  { name: 'Jakarta', lat: -6.2, lng: 106.8 },
  { name: 'Sydney', lat: -33.87, lng: 151.21 },
];

function projectMercator(lat, lng, W, H) {
  const x = ((lng + 180) / 360) * W;
  const latRad = (lat * Math.PI) / 180;
  const mercN = Math.log(Math.tan(Math.PI / 4 + latRad / 2));
  const y = (H / 2) - (W * mercN) / (2 * Math.PI);
  return { x, y: Math.max(0, Math.min(H, y)) };
}

function geoToSvgPath(coords, W, H) {
  return coords
    .map((ring) => {
      const pts = ring.map(([lng, lat]) => {
        const { x, y } = projectMercator(lat, lng, W, H);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      });
      return `M${pts.join('L')}Z`;
    })
    .join(' ');
}

function aircraftPath(aircraft, W, H) {
  const pts = Array.isArray(aircraft) ? aircraft : [];
  let d = '';
  for (const a of pts) {
    if (!a?.id || typeof a.lat !== 'number' || typeof a.lng !== 'number') continue;
    const { x, y } = projectMercator(a.lat, a.lng, W, H);
    const r = a.onGround ? 1.6 : 1.8;
    d += `M${(x - r).toFixed(1)},${y.toFixed(1)}a${r},${r} 0 1,0 ${(r * 2).toFixed(1)},0a${r},${r} 0 1,0 -${(r * 2).toFixed(1)},0`;
  }
  return d;
}

export default React.memo(function FlatMap({
  geoData,
  quakes,
  fires,
  flights,
  chokepoints,
  climateZones,
  weatherAlerts,
  countryStats,
  maxCountryScore,
  layers,
  hubs,
  aircraft,
  onCountryClick,
  onAircraftClick,
}) {
  const W = 960;
  const H = 500;
  const [hoveredCountry, setHoveredCountry] = useState(null);
  const [viewBox, setViewBox] = useState({ x: 0, y: 0, w: W, h: H });
  const svgRef = useRef(null);
  const isPanning = useRef(false);
  const [panningUi, setPanningUi] = useState(false);
  const panStart = useRef({ x: 0, y: 0 });
  const viewBoxStart = useRef({ x: 0, y: 0 });

  const countryPaths = useMemo(() => {
    if (!geoData?.length) return [];
    return geoData
      .map((feature, idx) => {
        const geom = feature.geometry;
        if (!geom) return null;
        const polys =
          geom.type === 'Polygon'
            ? [geom.coordinates]
            : geom.type === 'MultiPolygon'
              ? geom.coordinates
              : [];
        const paths = polys.map((poly) => geoToSvgPath(poly, W, H)).join(' ');
        const name = feature.properties?.name || 'Unknown';
        const score = countryStats?.[name]?.score ?? 0;
        return { name, d: paths, idx, score };
      })
      .filter(Boolean);
  }, [geoData, countryStats]);

  const handleWheel = useCallback(
    (e) => {
      e.preventDefault();
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const mx = ((e.clientX - rect.left) / rect.width) * viewBox.w + viewBox.x;
      const my = ((e.clientY - rect.top) / rect.height) * viewBox.h + viewBox.y;
      const factor = e.deltaY > 0 ? 1.15 : 0.87;
      const nw = Math.max(120, Math.min(W, viewBox.w * factor));
      const nh = nw * (H / W);
      const nx = mx - (mx - viewBox.x) * (nw / viewBox.w);
      const ny = my - (my - viewBox.y) * (nh / viewBox.h);
      setViewBox({ x: nx, y: ny, w: nw, h: nh });
    },
    [viewBox, W, H],
  );

  const handleMouseDown = useCallback(
    (e) => {
      if (e.button !== 0) return;
      isPanning.current = true;
      setPanningUi(true);
      panStart.current = { x: e.clientX, y: e.clientY };
      viewBoxStart.current = { x: viewBox.x, y: viewBox.y };
    },
    [viewBox],
  );

  const handleMouseMove = useCallback(
    (e) => {
      if (!isPanning.current || !svgRef.current) return;
      const rect = svgRef.current.getBoundingClientRect();
      const scale = viewBox.w / rect.width;
      const dx = (e.clientX - panStart.current.x) * scale;
      const dy = (e.clientY - panStart.current.y) * scale;
      setViewBox((prev) => ({ ...prev, x: viewBoxStart.current.x - dx, y: viewBoxStart.current.y - dy }));
    },
    [viewBox.w],
  );

  const handleMouseUp = useCallback(() => {
    isPanning.current = false;
    setPanningUi(false);
  }, []);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return undefined;
    svg.addEventListener('wheel', handleWheel, { passive: false });
    return () => svg.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  const resetZoom = useCallback(() => setViewBox({ x: 0, y: 0, w: W, h: H }), []);
  const zoomLevel = Math.round((1 - viewBox.w / W) * 100);

  const seismicPts = useMemo(() => {
    if (!layers?.seismic) return '';
    return (quakes || [])
      .map((q) => {
        const { x, y } = projectMercator(q.lat, q.lng, W, H);
        const r = Math.max(1.2, (q.mag || 0) * 0.7);
        return `M${x - r},${y}a${r},${r} 0 1,0 ${r * 2},0a${r},${r} 0 1,0 -${r * 2},0`;
      })
      .join('');
  }, [quakes, layers?.seismic]);

  const thermalPts = useMemo(() => {
    if (!layers?.thermal) return '';
    return (fires || [])
      .map((f) => {
        const { x, y } = projectMercator(f.lat, f.lng, W, H);
        return `M${x - 1.3},${y}a1.3,1.3 0 1,0 2.6,0a1.3,1.3 0 1,0 -2.6,0`;
      })
      .join('');
  }, [fires, layers?.thermal]);

  const chokepointPts = useMemo(() => {
    if (!layers?.chokepoints) return '';
    return (chokepoints || [])
      .map((cp) => {
        const { x, y } = projectMercator(cp.lat, cp.lng, W, H);
        return `M${x - 2.2},${y}a2.2,2.2 0 1,0 4.4,0a2.2,2.2 0 1,0 -4.4,0`;
      })
      .join('');
  }, [chokepoints, layers?.chokepoints]);

  const climatePts = useMemo(() => {
    if (!layers?.climate) return '';
    return (climateZones || [])
      .map((z) => {
        const { x, y } = projectMercator(z.lat, z.lng, W, H);
        return `M${x - 2},${y}a2,2 0 1,0 4,0a2,2 0 1,0 -4,0`;
      })
      .join('');
  }, [climateZones, layers?.climate]);

  const weatherAlertPts = useMemo(() => {
    if (!layers?.weatherAlerts) return '';
    return (weatherAlerts || [])
      .map((z) => {
        const { x, y } = projectMercator(z.lat, z.lng, W, H);
        return `M${x - 2.6},${y}a2.6,2.6 0 1,0 5.2,0a2.6,2.6 0 1,0 -5.2,0`;
      })
      .join('');
  }, [weatherAlerts, layers?.weatherAlerts]);

  const aircraftPts = useMemo(() => {
    if (!layers?.aircraft) return '';
    return aircraftPath(aircraft, W, H);
  }, [aircraft, layers?.aircraft]);

  const utcHours = new Date().getUTCHours() + new Date().getUTCMinutes() / 60;
  const subsolarLng = 180 - utcHours * 15;
  const dayCenterX = ((subsolarLng + 180) / 360) * W;
  const dayHalfWidth = W * 0.28;
  const nightLeftW = Math.max(0, dayCenterX - dayHalfWidth);
  const nightRightX = dayCenterX + dayHalfWidth;
  const nightRightW = Math.max(0, W - nightRightX);

  const handleSvgClick = useCallback(
    (e) => {
      if (!layers?.aircraft || !onAircraftClick || !svgRef.current) return;
      // Cheap "pick": choose nearest aircraft within a small pixel radius.
      const rect = svgRef.current.getBoundingClientRect();
      const mx = ((e.clientX - rect.left) / rect.width) * viewBox.w + viewBox.x;
      const my = ((e.clientY - rect.top) / rect.height) * viewBox.h + viewBox.y;

      let best = null;
      let bestD2 = Infinity;
      const maxD = 7 * (viewBox.w / rect.width);
      const maxD2 = maxD * maxD;
      for (const a of aircraft || []) {
        if (!a?.id || typeof a.lat !== 'number' || typeof a.lng !== 'number') continue;
        const p = projectMercator(a.lat, a.lng, W, H);
        const dx = p.x - mx;
        const dy = p.y - my;
        const d2 = dx * dx + dy * dy;
        if (d2 < bestD2 && d2 <= maxD2) {
          bestD2 = d2;
          best = a;
        }
      }
      if (best) onAircraftClick(best);
    },
    [aircraft, layers?.aircraft, onAircraftClick, viewBox],
  );

  return (
    <div className="w-full h-full relative">
      <svg
        ref={svgRef}
        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
        className="w-full h-full select-none"
        style={{ background: '#0A0D13', cursor: panningUi ? 'grabbing' : 'grab' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleSvgClick}
      >
        <defs>
          <linearGradient id="nightFadeL" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="rgba(8,10,14,0.6)" />
            <stop offset="100%" stopColor="rgba(8,10,14,0.2)" />
          </linearGradient>
          <linearGradient id="nightFadeR" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="rgba(8,10,14,0.2)" />
            <stop offset="100%" stopColor="rgba(8,10,14,0.6)" />
          </linearGradient>
        </defs>

        {[-60, -30, 0, 30, 60].map((lat) => {
          const { y } = projectMercator(lat, 0, W, H);
          return (
            <line
              key={`lat-${lat}`}
              x1={0}
              y1={y}
              x2={W}
              y2={y}
              stroke="#1a1f2d"
              strokeWidth={0.35}
              opacity={0.45}
              style={{ pointerEvents: 'none' }}
            />
          );
        })}
        {[-120, -60, 0, 60, 120].map((lng) => {
          const x = ((lng + 180) / 360) * W;
          return (
            <line
              key={`lng-${lng}`}
              x1={x}
              y1={0}
              x2={x}
              y2={H}
              stroke="#1a1f2d"
              strokeWidth={0.35}
              opacity={0.35}
              style={{ pointerEvents: 'none' }}
            />
          );
        })}

        {countryPaths.map((c) => (
          <path
            key={c.idx}
            d={c.d}
            fill={(() => {
              const t = layers?.intelHotspots && maxCountryScore > 0 ? Math.min(1, c.score / maxCountryScore) : 0;
              if (hoveredCountry === c.name) return '#A02D20';
              const r = Math.round(17 + (166 - 17) * t);
              const g = Math.round(19 + (60 - 19) * t);
              const b = Math.round(28 + (22 - 28) * t);
              return `rgb(${r},${g},${b})`;
            })()}
            stroke={hoveredCountry === c.name ? '#DA5E4A' : '#23293A'}
            strokeWidth={hoveredCountry === c.name ? 0.7 : 0.45}
            style={{ cursor: 'pointer' }}
            onMouseEnter={() => setHoveredCountry(c.name)}
            onMouseLeave={() => setHoveredCountry(null)}
            onClick={(e) => {
              e.stopPropagation();
              onCountryClick?.(c.name);
            }}
          />
        ))}

        {layers?.flights &&
          (flights || []).map((f, i) => {
            const s = projectMercator(f.startLat, f.startLng, W, H);
            const e = projectMercator(f.endLat, f.endLng, W, H);
            const col = f.status === 'cancelled' ? '#EF4444' : f.status === 'delayed' ? '#F59E0B' : THEME.flight;
            return (
              <line
                key={`fl${i}`}
                x1={s.x}
                y1={s.y}
                x2={e.x}
                y2={e.y}
                stroke={col}
                strokeWidth={0.5}
                opacity={0.3}
                style={{ pointerEvents: 'none' }}
              />
            );
          })}

        {seismicPts ? <path d={seismicPts} fill={THEME.blue} opacity={0.55} style={{ pointerEvents: 'none' }} /> : null}
        {thermalPts ? <path d={thermalPts} fill={THEME.accent} opacity={0.45} style={{ pointerEvents: 'none' }} /> : null}
        {chokepointPts ? <path d={chokepointPts} fill="#F59E0B" opacity={0.8} style={{ pointerEvents: 'none' }} /> : null}
        {climatePts ? <path d={climatePts} fill={THEME.green} opacity={0.8} style={{ pointerEvents: 'none' }} /> : null}
        {weatherAlertPts ? <path d={weatherAlertPts} fill="#FACC15" opacity={0.88} style={{ pointerEvents: 'none' }} /> : null}
        {aircraftPts ? <path d={aircraftPts} fill={THEME.flight} opacity={0.9} style={{ pointerEvents: 'none' }} /> : null}

        {nightLeftW > 0 ? <rect x={0} y={0} width={nightLeftW} height={H} fill="url(#nightFadeL)" style={{ pointerEvents: 'none' }} /> : null}
        {nightRightW > 0 ? (
          <rect x={nightRightX} y={0} width={nightRightW} height={H} fill="url(#nightFadeR)" style={{ pointerEvents: 'none' }} />
        ) : null}
        <rect
          x={Math.max(0, dayCenterX - dayHalfWidth)}
          y={0}
          width={Math.min(W, dayHalfWidth * 2)}
          height={H}
          fill="rgba(255,240,200,0.05)"
          style={{ pointerEvents: 'none' }}
        />

        {layers?.flights &&
          (hubs || []).map((h) => {
            const { x, y } = projectMercator(h.lat, h.lng, W, H);
            return (
              <g key={h.code} style={{ pointerEvents: 'none' }}>
                <circle cx={x} cy={y} r={2.2} fill={THEME.flight} opacity={0.8} />
                <text x={x + 4} y={y + 3} fill="#C8C4BA" fontSize={5.5} fontFamily="monospace">
                  {h.code}
                </text>
              </g>
            );
          })}

        {MAP_LABELS.map((c) => {
          const { x, y } = projectMercator(c.lat, c.lng, W, H);
          return (
            <text
              key={c.name}
              x={x + 3}
              y={y - 2}
              fill="#6f788f"
              fontSize={6.5}
              fontFamily="sans-serif"
              opacity={0.8}
              style={{ pointerEvents: 'none' }}
            >
              {c.name}
            </text>
          );
        })}
        {hoveredCountry ? (
          <text
            x={viewBox.x + viewBox.w / 2}
            y={viewBox.y + 16}
            textAnchor="middle"
            fill="#F2F0E9"
            fontSize={11}
            fontFamily="sans-serif"
            fontWeight="bold"
            style={{ pointerEvents: 'none' }}
          >
            {hoveredCountry}
          </text>
        ) : null}
      </svg>

      {zoomLevel > 0 ? (
        <button
          onClick={resetZoom}
          className="absolute top-3 right-3 z-20 px-3 py-1.5 rounded-lg bg-[#1A1A1A]/90 border border-[#CC5833]/20 font-mono text-[9px] uppercase tracking-wider text-[#C8C4BA] hover:text-[#CC5833] transition-colors"
        >
          Reset Zoom ({zoomLevel}%)
        </button>
      ) : null}
    </div>
  );
});

