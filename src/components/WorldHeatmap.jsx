import { useState, useMemo, useCallback } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
  Marker,
} from 'react-simple-maps';
import { formatNumber } from '../utils/formatNumber';
import {
  COUNTRIES,
  CAT_REGIONS,
  CAT_CITIES,
  catEvents,
  dailyData,
  filterData,
} from '../data/fakeData';

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

// world-atlas TopoJSON uses numeric IDs without leading zeros
const NUMERIC_TO_ALPHA3 = {
  '840': 'USA', '76': 'BRA', '826': 'GBR', '276': 'DEU', '250': 'FRA',
  '356': 'IND', '156': 'CHN', '392': 'JPN', '410': 'KOR', '36': 'AUS',
  '124': 'CAN', '484': 'MEX', '32': 'ARG', '152': 'CHL', '643': 'RUS',
  '792': 'TUR', '360': 'IDN', '764': 'THA', '724': 'ESP', '380': 'ITA',
  '566': 'NGA', '710': 'ZAF', '818': 'EGY', '170': 'COL', '608': 'PHL',
};

const PERIOD_DAYS = { D: 1, W: 7, M: 30, Y: 365, ALL: 365 };
const MAX_ZOOM = 12;
const CAT_ZOOM_MIN = 5.6;
const CITY_ZOOM_MIN = 2.6;
const REGION_ZOOM_MIN = 1.6;

const COUNTRY_BY_CODE = Object.fromEntries(COUNTRIES.map((c) => [c.code, c]));
const CITY_BY_ID = Object.fromEntries(CAT_CITIES.map((c) => [c.id, c]));
const REGION_BY_ID = Object.fromEntries(CAT_REGIONS.map((r) => [r.id, r]));

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function getGeoTarget(filters) {
  const country = filters?.country ?? 'ALL';
  const continent = filters?.continent ?? 'ALL';

  if (country !== 'ALL') {
    const c = COUNTRY_BY_CODE[country];
    return { coordinates: c?.center ?? [0, 30], zoom: 3.0 };
  }

  if (continent !== 'ALL') {
    const list = COUNTRIES.filter((c) => c.continent === continent);
    if (list.length > 0) {
      const lng = list.reduce((s, c) => s + (c.center?.[0] ?? 0), 0) / list.length;
      const lat = list.reduce((s, c) => s + (c.center?.[1] ?? 0), 0) / list.length;
      return { coordinates: [lng, lat], zoom: 1.6 };
    }
  }

  return { coordinates: [0, 30], zoom: 1.1 };
}

function getEnabledCountryCodes(filters) {
  const country = filters?.country ?? 'ALL';
  const continent = filters?.continent ?? 'ALL';

  if (country !== 'ALL') return [country];
  if (continent !== 'ALL') return COUNTRIES.filter((c) => c.continent === continent).map((c) => c.code);
  return COUNTRIES.map((c) => c.code);
}

function sum(arr, key) {
  return arr.reduce((s, d) => s + (d[key] || 0), 0);
}

function markerRadius(count, kind) {
  const base = kind === 'region' ? 4 : 3;
  const k = kind === 'region' ? 0.22 : 0.25;
  const maxR = kind === 'region' ? 18 : 14;
  return clamp(base + Math.sqrt(count) * k, 2.5, maxR);
}

function pickCatsInRadius(cats, center, zoom) {
  const [cx, cy] = center;
  const radius = 18 / Math.max(zoom, 1);
  const r2 = radius * radius;

  return cats.filter((c) => {
    const dx = c.coordinates[0] - cx;
    const dy = c.coordinates[1] - cy;
    return (dx * dx + dy * dy) <= r2;
  });
}

export default function WorldHeatmap({ filters }) {
  const {
    period = 'M',
    continent = 'ALL',
    country = 'ALL',
    platform = 'ALL',
    catType = 'ALL',
  } = filters || {};

  const [tooltip, setTooltip] = useState(null); // { type, ... }
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 });
  const [focus, setFocus] = useState(null); // { type: 'region'|'city', id }

  const geoTarget = useMemo(() => getGeoTarget({ country, continent }), [country, continent]);
  const [position, setPosition] = useState(() => geoTarget);
  const enabledCountryCodes = useMemo(() => getEnabledCountryCodes({ country, continent }), [country, continent]);

  const countryAgg = useMemo(() => {
    const out = {};
    COUNTRIES.forEach((c) => {
      const series = filterData(dailyData, {
        period,
        continent: 'ALL',
        country: c.code,
        platform,
        catType,
      });

      out[c.code] = {
        code: c.code,
        name: c.name,
        users: sum(series, 'newUsers'),
        cats: sum(series, 'newCats'),
        shots: sum(series, 'shots'),
      };
    });
    return out;
  }, [period, platform, catType]);

  const maxVal = useMemo(() => {
    const values = enabledCountryCodes.map((code) => (countryAgg[code]?.cats ?? 0));
    return Math.max(...values, 1);
  }, [enabledCountryCodes, countryAgg]);

  const getColor = (value) => {
    if (!value) return '#f1f5f9';
    const intensity = Math.pow(value / maxVal, 0.5);
    const r = Math.round(241 - intensity * (241 - 30));
    const g = Math.round(245 - intensity * (245 - 64));
    const b = Math.round(249 - intensity * (249 - 175));
    return `rgb(${r}, ${g}, ${b})`;
  };

  const handleMouseMove = useCallback((e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setContainerSize((s) => {
      const w = Math.round(rect.width);
      const h = Math.round(rect.height);
      return s.w === w && s.h === h ? s : { w, h };
    });
  }, []);

  const tooltipStyle = useMemo(() => {
    const pad = 12;
    const offset = 14;
    const maxWidth = containerSize.w ? Math.min(280, containerSize.w - pad * 2) : 280;

    let left = mousePos.x + offset;
    let top = mousePos.y - 10;
    let transform = 'translate(0, 0)';

    if (containerSize.w && (left + maxWidth + pad) > containerSize.w) {
      left = mousePos.x - offset;
      transform = 'translate(-100%, 0)';
    }

    if (containerSize.h) {
      top = clamp(top, pad, Math.max(pad, containerSize.h - 140));
    }

    return { left, top, maxWidth, transform };
  }, [mousePos.x, mousePos.y, containerSize.w, containerSize.h]);

  const dateRange = useMemo(() => {
    const days = PERIOD_DAYS[period] ?? 30;
    const window = dailyData.slice(-days);
    return {
      start: window[0]?.date,
      end: window[window.length - 1]?.date,
      days,
    };
  }, [period]);

  const filteredCats = useMemo(() => {
    const start = dateRange.start;
    const end = dateRange.end;
    if (!start || !end) return [];

    return catEvents.filter((c) => {
      if (c.date < start || c.date > end) return false;
      if (country !== 'ALL') {
        if (c.countryCode !== country) return false;
      } else if (continent !== 'ALL') {
        if (c.continent !== continent) return false;
      }
      if (platform !== 'ALL' && c.platform !== platform) return false;
      if (catType !== 'ALL' && c.catType !== catType) return false;
      return true;
    });
  }, [
    dateRange.start,
    dateRange.end,
    continent,
    country,
    platform,
    catType,
  ]);

  const catsByRegion = useMemo(() => {
    const map = {};
    filteredCats.forEach((c) => {
      map[c.regionId] = (map[c.regionId] || 0) + 1;
    });
    return map;
  }, [filteredCats]);

  const catsByCity = useMemo(() => {
    const map = {};
    filteredCats.forEach((c) => {
      map[c.cityId] = (map[c.cityId] || 0) + 1;
    });
    return map;
  }, [filteredCats]);

  const regionMarkers = useMemo(() => {
    return CAT_REGIONS
      .map((r) => ({
        id: r.id,
        name: r.name,
        countryCode: r.countryCode,
        coordinates: r.center,
        count: catsByRegion[r.id] || 0,
      }))
      .filter((r) => r.count > 0);
  }, [catsByRegion]);

  const cityMarkers = useMemo(() => {
    return CAT_CITIES
      .map((c) => ({
        id: c.id,
        name: c.name,
        countryCode: c.countryCode,
        regionId: c.regionId,
        coordinates: c.coordinates,
        count: catsByCity[c.id] || 0,
      }))
      .filter((c) => c.count > 0);
  }, [catsByCity]);

  const catsToRender = useMemo(() => {
    if (position.zoom < CAT_ZOOM_MIN) return [];

    let base = filteredCats;
    if (focus?.type === 'city') base = base.filter((c) => c.cityId === focus.id);
    else if (focus?.type === 'region') base = base.filter((c) => c.regionId === focus.id);
    else base = pickCatsInRadius(base, position.coordinates, position.zoom);

    const MAX = 1500;
    if (base.length <= MAX) return base;
    const step = Math.ceil(base.length / MAX);
    return base.filter((_, idx) => idx % step === 0);
  }, [position.zoom, position.coordinates, filteredCats, focus]);

  const showRegions = position.zoom >= REGION_ZOOM_MIN && position.zoom < CITY_ZOOM_MIN;
  const showCities = position.zoom >= CITY_ZOOM_MIN && position.zoom < CAT_ZOOM_MIN;
  const showCats = position.zoom >= CAT_ZOOM_MIN;

  return (
    <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 relative">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700">Cats Map</h3>
      </div>

      <div className="relative" onMouseMove={handleMouseMove}>
        {/* Controls */}
        <div className="absolute left-3 top-3 z-10 flex flex-col gap-2">
          <button
            type="button"
            className="w-9 h-9 rounded-lg bg-white/90 border border-gray-200 text-gray-700 text-sm font-semibold shadow-sm hover:bg-white"
            onClick={() =>
              setPosition((p) => ({ ...p, zoom: clamp(p.zoom * 1.35, 1, MAX_ZOOM) }))
            }
            title="Zoom in"
          >
            +
          </button>
          <button
            type="button"
            className="w-9 h-9 rounded-lg bg-white/90 border border-gray-200 text-gray-700 text-sm font-semibold shadow-sm hover:bg-white"
            onClick={() =>
              setPosition((p) => ({ ...p, zoom: clamp(p.zoom / 1.35, 1, MAX_ZOOM) }))
            }
            title="Zoom out"
          >
            −
          </button>
          <button
            type="button"
            className="w-9 h-9 rounded-lg bg-white/90 border border-gray-200 text-gray-700 text-[10px] font-semibold shadow-sm hover:bg-white"
            onClick={() => {
              setFocus(null);
              setPosition(geoTarget);
            }}
            title="Reset view"
          >
            Reset
          </button>
        </div>

        <ComposableMap
          projection="geoMercator"
          projectionConfig={{ scale: 135, center: [0, 25] }}
          style={{ width: '100%', height: 'auto' }}
        >
          <ZoomableGroup
            center={position.coordinates}
            zoom={position.zoom}
            minZoom={1}
            maxZoom={MAX_ZOOM}
            onMoveEnd={setPosition}
          >
            <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const numericCode = String(geo.id);
                const alpha3 = NUMERIC_TO_ALPHA3[numericCode];
                const enabled = alpha3 ? enabledCountryCodes.includes(alpha3) : false;
                const info = alpha3 ? countryAgg[alpha3] : null;
                const value = enabled && info ? info.cats : 0;

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={getColor(value)}
                    stroke="#cbd5e1"
                    strokeWidth={0.5}
                      onMouseEnter={() => {
                        if (!enabled || !alpha3 || !info) return;
                        setTooltip({
                          type: 'country',
                          code: alpha3,
                          name: info.name,
                          users: info.users,
                          cats: info.cats,
                          shots: info.shots,
                        });
                      }}
                      onMouseLeave={() => setTooltip(null)}
                      style={{
                        default: { outline: 'none' },
                        hover: { outline: 'none', fill: enabled && value ? '#93c5fd' : '#e2e8f0' },
                        pressed: { outline: 'none' },
                      }}
                    />
                  );
                })
              }
            </Geographies>

            {/* Regions */}
            {showRegions && regionMarkers.map((r) => (
              <Marker key={`region-${r.id}`} coordinates={r.coordinates}>
                <circle
                  r={markerRadius(r.count, 'region')}
                  fill="rgba(59,130,246,0.20)"
                  stroke="rgba(30,64,175,0.55)"
                  strokeWidth={1}
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={() => setTooltip({ type: 'region', id: r.id, name: r.name, count: r.count })}
                  onMouseLeave={() => setTooltip(null)}
                  onClick={() => {
                    setFocus({ type: 'region', id: r.id });
                    setPosition({ coordinates: r.coordinates, zoom: 4.2 });
                  }}
                />
              </Marker>
            ))}

            {/* Cities */}
            {showCities && cityMarkers.map((c) => (
              <Marker key={`city-${c.id}`} coordinates={c.coordinates}>
                <circle
                  r={markerRadius(c.count, 'city')}
                  fill="rgba(249,115,22,0.18)"
                  stroke="rgba(154,52,18,0.55)"
                  strokeWidth={1}
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={() => setTooltip({ type: 'city', id: c.id, name: c.name, count: c.count })}
                  onMouseLeave={() => setTooltip(null)}
                  onClick={() => {
                    setFocus({ type: 'city', id: c.id });
                    setPosition({ coordinates: c.coordinates, zoom: 6.6 });
                  }}
                />
              </Marker>
            ))}

            {/* Cats */}
            {showCats && catsToRender.map((cat) => {
              const fill = cat.catType === 'Home' ? '#a855f7' : '#f97316';
              const stroke = cat.platform === 'iOS' ? '#3b82f6' : '#22c55e';
              const city = CITY_BY_ID[cat.cityId];
              const region = REGION_BY_ID[cat.regionId];

              return (
                <Marker key={cat.id} coordinates={cat.coordinates}>
                  <circle
                    r={1.9}
                    fill={fill}
                    stroke={stroke}
                    strokeWidth={0.8}
                    opacity={0.9}
                    onMouseEnter={() =>
                      setTooltip({
                        type: 'cat',
                        id: cat.id,
                        city: city?.name,
                        region: region?.name,
                        country: cat.countryCode,
                        catType: cat.catType,
                        platform: cat.platform,
                      })
                    }
                    onMouseLeave={() => setTooltip(null)}
                  />
                </Marker>
              );
            })}
          </ZoomableGroup>
        </ComposableMap>

        {tooltip && (
          <div
            className="absolute bg-gray-900 text-white text-xs px-3 py-2 rounded shadow-lg pointer-events-none z-10 whitespace-normal break-words leading-4"
            style={tooltipStyle}
          >
            {tooltip.type === 'country' && (
              <div className="flex flex-col gap-0.5">
                <div className="font-semibold">
                  {tooltip.code}
                  <span className="font-normal text-gray-300"> {tooltip.name}</span>
                </div>
                <div className="text-gray-300">
                  Cats <span className="text-white font-medium">{formatNumber(tooltip.cats)}</span>
                </div>
                <div className="text-gray-300">
                  Users <span className="text-white font-medium">{formatNumber(tooltip.users)}</span>
                </div>
                <div className="text-gray-300">
                  Shots <span className="text-white font-medium">{formatNumber(tooltip.shots)}</span>
                </div>
              </div>
            )}
            {tooltip.type === 'region' && (
              <div className="flex flex-col gap-0.5">
                <div className="font-semibold">{tooltip.name}</div>
                <div className="text-gray-300">
                  Cats <span className="text-white font-medium">{formatNumber(tooltip.count)}</span>
                </div>
              </div>
            )}
            {tooltip.type === 'city' && (
              <div className="flex flex-col gap-0.5">
                <div className="font-semibold">{tooltip.name}</div>
                <div className="text-gray-300">
                  Cats <span className="text-white font-medium">{formatNumber(tooltip.count)}</span>
                </div>
              </div>
            )}
            {tooltip.type === 'cat' && (
              <div className="flex flex-col gap-0.5">
                <div className="font-semibold">{tooltip.id}</div>
                <div className="text-gray-300">
                  {tooltip.country}
                  {tooltip.region ? <span className="text-gray-400"> · {tooltip.region}</span> : null}
                  {tooltip.city ? <span className="text-gray-400"> · {tooltip.city}</span> : null}
                </div>
                <div className="text-gray-300">
                  Type <span className="text-white font-medium">{tooltip.catType}</span>
                </div>
                <div className="text-gray-300">
                  Platform <span className="text-white font-medium">{tooltip.platform}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
        <span>Low</span>
        <div
          className="h-2 flex-1 rounded"
          style={{ background: 'linear-gradient(to right, #f1f5f9, #1e40af)' }}
        />
        <span>High</span>
      </div>

      <div className="mt-2 text-[11px] text-gray-400">
        Drag to pan, scroll to zoom. Window: last {dateRange.days}d.
      </div>
    </div>
  );
}
