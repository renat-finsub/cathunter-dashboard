import { COUNTRIES, CONTINENTS } from '../data/fakeData';

const PERIODS = ['D', 'W', 'M', 'Y', 'ALL'];
const PLATFORMS = [
  { value: 'ALL', label: 'All' },
  { value: 'iOS', label: 'iOS' },
  { value: 'Android', label: 'Android' },
];

const CAT_TYPES = [
  { value: 'ALL', label: 'All' },
  { value: 'Home', label: 'Home' },
  { value: 'Stray', label: 'Stray' },
];

export default function Filters({ filters, onChange }) {
  const { period, continent, country, platform, catType } = filters;

  const visibleCountries = (continent === 'ALL'
    ? COUNTRIES
    : COUNTRIES.filter((c) => c.continent === continent)
  ).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="flex flex-wrap items-center gap-3 mb-6 bg-white rounded-xl shadow-sm p-4 border border-gray-100">
      {/* Period */}
      <div className="flex items-center gap-1">
        <span className="text-xs text-gray-500 mr-1 font-medium">Period</span>
        {PERIODS.map((p) => (
          <button
            key={p}
            onClick={() => onChange({ ...filters, period: p })}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
              period === p
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Continent */}
      <div className="flex items-center gap-1">
        <span className="text-xs text-gray-500 mr-1 font-medium">Continent</span>
        <select
          value={continent}
          onChange={(e) =>
            onChange({ ...filters, continent: e.target.value, country: 'ALL' })
          }
          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-100 text-gray-600 border-none cursor-pointer"
        >
          <option value="ALL">All</option>
          {CONTINENTS.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Country */}
      <div className="flex items-center gap-1">
        <span className="text-xs text-gray-500 mr-1 font-medium">Country</span>
        <select
          value={country}
          onChange={(e) => onChange({ ...filters, country: e.target.value })}
          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-100 text-gray-600 border-none cursor-pointer"
        >
          <option value="ALL">All Countries</option>
          {visibleCountries.map((c) => (
            <option key={c.code} value={c.code}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Platform */}
      <div className="flex items-center gap-1">
        <span className="text-xs text-gray-500 mr-1 font-medium">Platform</span>
        <select
          value={platform}
          onChange={(e) => onChange({ ...filters, platform: e.target.value })}
          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-100 text-gray-600 border-none cursor-pointer"
        >
          {PLATFORMS.map((p) => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
      </div>

      {/* Cat type */}
      <div className="flex items-center gap-1">
        <span className="text-xs text-gray-500 mr-1 font-medium">Cat Type</span>
        <select
          value={catType}
          onChange={(e) => onChange({ ...filters, catType: e.target.value })}
          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-100 text-gray-600 border-none cursor-pointer"
        >
          {CAT_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
