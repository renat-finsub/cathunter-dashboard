import { useState, useMemo } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
} from 'react-simple-maps';
import { formatNumber } from '../utils/formatNumber';
import { countryData } from '../data/fakeData';

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

const METRICS = [
  { key: 'users', label: 'Users' },
  { key: 'cats', label: 'Cats' },
  { key: 'shots', label: 'Shots' },
];

// ISO-3166-1 numeric to Alpha-3 mapping for our countries
const NUMERIC_TO_ALPHA3 = {
  '840': 'USA', '076': 'BRA', '826': 'GBR', '276': 'DEU', '250': 'FRA',
  '356': 'IND', '156': 'CHN', '392': 'JPN', '410': 'KOR', '036': 'AUS',
  '124': 'CAN', '484': 'MEX', '032': 'ARG', '152': 'CHL', '643': 'RUS',
  '792': 'TUR', '360': 'IDN', '764': 'THA', '724': 'ESP', '380': 'ITA',
  '566': 'NGA', '710': 'ZAF', '818': 'EGY', '170': 'COL', '608': 'PHL',
};

// Large countries that get labels
const LARGE_COUNTRIES = new Set([
  'USA', 'BRA', 'CHN', 'RUS', 'CAN', 'AUS', 'IND', 'ARG',
]);

export default function WorldHeatmap() {
  const [metric, setMetric] = useState('users');
  const [tooltip, setTooltip] = useState(null);

  const dataMap = useMemo(() => {
    const map = {};
    countryData.forEach((c) => {
      map[c.code] = c;
    });
    return map;
  }, []);

  const maxVal = useMemo(() => {
    return Math.max(...countryData.map((c) => c[metric]), 1);
  }, [metric]);

  const getColor = (value) => {
    if (!value) return '#f1f5f9';
    const intensity = Math.pow(value / maxVal, 0.5); // sqrt scale for better distribution
    const r = Math.round(241 - intensity * (241 - 30));
    const g = Math.round(245 - intensity * (245 - 64));
    const b = Math.round(249 - intensity * (249 - 175));
    return `rgb(${r}, ${g}, ${b})`;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 relative">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700">World Heatmap</h3>
        <select
          value={metric}
          onChange={(e) => setMetric(e.target.value)}
          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-100 text-gray-600 border-none cursor-pointer"
        >
          {METRICS.map((m) => (
            <option key={m.key} value={m.key}>{m.label}</option>
          ))}
        </select>
      </div>

      <div className="relative">
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{
            scale: 120,
            center: [0, 30],
          }}
          style={{ width: '100%', height: 'auto' }}
        >
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const numericCode = geo.id;
                const alpha3 = NUMERIC_TO_ALPHA3[numericCode];
                const countryInfo = alpha3 ? dataMap[alpha3] : null;
                const value = countryInfo ? countryInfo[metric] : 0;

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={getColor(value)}
                    stroke="#cbd5e1"
                    strokeWidth={0.5}
                    onMouseEnter={() => {
                      if (alpha3 && value) {
                        setTooltip(`${alpha3}, ${formatNumber(value)}`);
                      }
                    }}
                    onMouseLeave={() => setTooltip(null)}
                    style={{
                      default: { outline: 'none' },
                      hover: { outline: 'none', fill: value ? '#93c5fd' : '#e2e8f0' },
                      pressed: { outline: 'none' },
                    }}
                  />
                );
              })
            }
          </Geographies>
        </ComposableMap>

        {tooltip && (
          <div className="absolute top-2 left-2 bg-gray-900 text-white text-xs px-2 py-1 rounded shadow pointer-events-none">
            {tooltip}
          </div>
        )}
      </div>

      {/* Color legend */}
      <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
        <span>Low</span>
        <div
          className="h-2 flex-1 rounded"
          style={{
            background: 'linear-gradient(to right, #f1f5f9, #1e40af)',
          }}
        />
        <span>High</span>
      </div>
    </div>
  );
}
