import React, { useEffect, useMemo, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

function lerpColor(a, b, t) {
  const u = clamp(t, 0, 1);
  const ar = (a >> 16) & 255;
  const ag = (a >> 8) & 255;
  const ab = a & 255;
  const br = (b >> 16) & 255;
  const bg = (b >> 8) & 255;
  const bb = b & 255;
  const r = Math.round(ar + (br - ar) * u);
  const g = Math.round(ag + (bg - ag) * u);
  const bl = Math.round(ab + (bb - ab) * u);
  return (r << 16) | (g << 8) | bl;
}

function rgbHex(n) {
  const x = n & 0xffffff;
  return `#${x.toString(16).padStart(6, '0')}`;
}

function colorForAltitudeFt(altFt, onGround) {
  if (onGround) return '#9CA3AF';
  if (altFt == null || Number.isNaN(altFt)) return '#A78BFA';
  const t = clamp((altFt - 2000) / 36000, 0, 1);
  const c = lerpColor(0xf97316, 0x22d3ee, t); // orange -> cyan
  return rgbHex(c);
}

function planeIconHtml({ color, headingDeg, selected, label }) {
  const rot = typeof headingDeg === 'number' ? headingDeg : 0;
  const ring = selected ? '0 0 0 2px rgba(242,240,233,0.95)' : '0 0 0 1px rgba(0,0,0,0.55)';
  const cs = label ? `<div style="margin-top:2px;font:600 10px ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto;color:rgba(242,240,233,0.92);text-shadow:0 1px 2px rgba(0,0,0,0.85)">${label}</div>` : '';
  return `
    <div style="display:flex;flex-direction:column;align-items:center;transform:translate(-50%,-50%);pointer-events:auto;">
      <div style="width:18px;height:18px;display:grid;place-items:center;filter:drop-shadow(${ring});">
        <svg width="18" height="18" viewBox="0 0 24 24" style="transform:rotate(${rot}deg);">
          <path fill="${color}" d="M21.3 11.1 14 9.2V5.5c0-.8-.7-1.5-1.5-1.5h-1C10.7 4 10 4.7 10 5.5v3.7l-7.3 1.9c-.5.1-.7.7-.3 1.1l1.6 1.6c.2.2.5.3.8.3l5.6-.7v3.1l-2.2 1.8c-.3.2-.4.6-.2.9l.8 1.3c.2.4.8.4 1.1.1l1.7-1.7 1.7 1.7c.3.3.9.3 1.1-.1l.8-1.3c.2-.3.1-.7-.2-.9l-2.2-1.8v-3.1l5.6.7c.3 0 .6-.1.8-.3l1.6-1.6c.4-.4.2-1-.3-1.1Z"/>
        </svg>
      </div>
      ${cs}
    </div>
  `;
}

function mergeTrack({ selectedId, trailsByAircraftId, aircraftTrack }) {
  if (!selectedId) return [];

  const hist = Array.isArray(trailsByAircraftId?.[selectedId]) ? trailsByAircraftId[selectedId] : [];
  const apiPts = aircraftTrack?.id === selectedId && Array.isArray(aircraftTrack.points) ? aircraftTrack.points : [];

  const merged = [];
  const seen = new Set();
  const key = (p) => `${p[0].toFixed(5)},${p[1].toFixed(5)}`;
  const push = (lat, lng) => {
    if (typeof lat !== 'number' || typeof lng !== 'number') return;
    const k = key([lat, lng]);
    if (seen.has(k)) return;
    seen.add(k);
    merged.push([lng, lat]);
  };

  for (const p of hist) push(p.lat, p.lng);
  for (const p of apiPts) push(p.lat, p.lng);
  return merged;
}

export default function FlightRadarMap({
  aircraft,
  trailsByAircraftId,
  selectedAircraftId,
  aircraftTrack,
  onAircraftClick,
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef(new Map());
  const initedRef = useRef(false);

  const trackGeoJson = useMemo(() => {
    const coords = mergeTrack({
      selectedId: selectedAircraftId,
      trailsByAircraftId,
      aircraftTrack,
    });
    return {
      type: 'FeatureCollection',
      features: coords.length >= 2
        ? [{ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: coords } }]
        : [],
    };
  }, [selectedAircraftId, trailsByAircraftId, aircraftTrack]);

  useEffect(() => {
    if (!containerRef.current || initedRef.current) return;
    initedRef.current = true;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: 'https://tiles.openfreemap.org/styles/dark',
      center: [151.2, -33.9],
      zoom: 5.2,
      pitch: 0,
      bearing: 0,
      attributionControl: true,
    });

    map.addControl(new maplibregl.NavigationControl({ visualizePitch: false }), 'top-right');
    mapRef.current = map;

    map.on('load', () => {
      if (map.getSource('flight-track')) return;
      map.addSource('flight-track', { type: 'geojson', data: trackGeoJson });
      map.addLayer({
        id: 'flight-track-line',
        type: 'line',
        source: 'flight-track',
        paint: {
          'line-color': '#A78BFA',
          'line-width': 3,
          'line-opacity': 0.9,
        },
      });
    });

    return () => {
      try {
        map.remove();
      } catch {
        // ignore
      }
      mapRef.current = null;
      markersRef.current.clear();
      initedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const src = map.getSource('flight-track');
    if (src && typeof src.setData === 'function') src.setData(trackGeoJson);
  }, [trackGeoJson]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const nextIds = new Set();
    const planes = Array.isArray(aircraft) ? aircraft.slice(0, 1800) : [];

    for (const ac of planes) {
      if (!ac?.id || typeof ac.lat !== 'number' || typeof ac.lng !== 'number') continue;
      nextIds.add(ac.id);

      const color = colorForAltitudeFt(ac.altitudeFt, !!ac.onGround);
      const selected = !!selectedAircraftId && ac.id === selectedAircraftId;
      const label = selected ? (ac.callsign || ac.id) : '';
      const html = planeIconHtml({ color, headingDeg: ac.track, selected, label });

      let m = markersRef.current.get(ac.id);
      if (!m) {
        const el = document.createElement('div');
        el.style.cursor = 'pointer';
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          onAircraftClick?.(ac);
        });
        m = new maplibregl.Marker({ element: el, anchor: 'center' }).setLngLat([ac.lng, ac.lat]).addTo(map);
        markersRef.current.set(ac.id, m);
      }

      const el = m.getElement();
      el.innerHTML = html;
      m.setLngLat([ac.lng, ac.lat]);
    }

    for (const [id, m] of markersRef.current.entries()) {
      if (!nextIds.has(id)) {
        try { m.remove(); } catch { /* ignore */ }
        markersRef.current.delete(id);
      }
    }
  }, [aircraft, selectedAircraftId, onAircraftClick]);

  return <div ref={containerRef} className="h-full w-full" />;
}
