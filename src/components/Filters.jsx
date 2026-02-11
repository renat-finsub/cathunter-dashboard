import { COUNTRIES, CONTINENTS } from '../data/fakeData';

const PERIODS = ['D', 'W', 'M', 'Y', 'ALL'];

const COUNTRY_FLAGS = {
  USA: '\u{1F1FA}\u{1F1F8}', CAN: '\u{1F1E8}\u{1F1E6}', MEX: '\u{1F1F2}\u{1F1FD}',
  BRA: '\u{1F1E7}\u{1F1F7}', ARG: '\u{1F1E6}\u{1F1F7}', CHL: '\u{1F1E8}\u{1F1F1}',
  COL: '\u{1F1E8}\u{1F1F4}', GBR: '\u{1F1EC}\u{1F1E7}', DEU: '\u{1F1E9}\u{1F1EA}',
  FRA: '\u{1F1EB}\u{1F1F7}', ESP: '\u{1F1EA}\u{1F1F8}', ITA: '\u{1F1EE}\u{1F1F9}',
  RUS: '\u{1F1F7}\u{1F1FA}', TUR: '\u{1F1F9}\u{1F1F7}', IND: '\u{1F1EE}\u{1F1F3}',
  CHN: '\u{1F1E8}\u{1F1F3}', JPN: '\u{1F1EF}\u{1F1F5}', KOR: '\u{1F1F0}\u{1F1F7}',
  IDN: '\u{1F1EE}\u{1F1E9}', THA: '\u{1F1F9}\u{1F1ED}', PHL: '\u{1F1F5}\u{1F1ED}',
  NGA: '\u{1F1F3}\u{1F1EC}', ZAF: '\u{1F1FF}\u{1F1E6}', EGY: '\u{1F1EA}\u{1F1EC}',
  AUS: '\u{1F1E6}\u{1F1FA}',
};

const CONTINENT_OPTIONS = [
  { value: 'ALL', label: 'All' },
  { value: 'North America', label: 'N. America' },
  { value: 'South America', label: 'S. America' },
  { value: 'Europe', label: 'Europe' },
  { value: 'Asia', label: 'Asia' },
  { value: 'Africa', label: 'Africa' },
  { value: 'Oceania', label: 'Oceania' },
];

const PLATFORMS = [
  { value: 'ALL', label: 'All' },
  { value: 'iOS', label: 'iOS' },
  { value: 'Android', label: 'Android' },
];

const CAT_TYPES = [
  { value: 'ALL', label: 'All' },
  { value: 'Stray', label: 'Stray' },
  { value: 'Home', label: 'Home' },
];

function Btn({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
        active
          ? 'bg-blue-600 text-white'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
    >
      {children}
    </button>
  );
}

export default function Filters({ filters, onChange }) {
  const { period, continent, country, platform, catType } = filters;

  const visibleCountries = (continent === 'ALL'
    ? COUNTRIES
    : COUNTRIES.filter((c) => c.continent === continent)
  ).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="flex flex-wrap items-center gap-3 mb-6 bg-white rounded-xl shadow-sm p-4 border border-gray-100 sticky top-0 z-30">
      {/* Period */}
      <div className="flex items-center gap-1">
        <span className="text-xs text-gray-500 mr-1 font-medium">Period</span>
        {PERIODS.map((p) => (
          <Btn key={p} active={period === p} onClick={() => onChange({ ...filters, period: p })}>
            {p}
          </Btn>
        ))}
      </div>

      {/* Continent */}
      <div className="flex items-center gap-1">
        <span className="text-xs text-gray-500 mr-1 font-medium">Continent</span>
        <select
          value={continent}
          onChange={(e) => onChange({ ...filters, continent: e.target.value, country: 'ALL' })}
          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-100 text-gray-600 border-none cursor-pointer"
        >
          {CONTINENT_OPTIONS.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
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
            <option key={c.code} value={c.code}>{COUNTRY_FLAGS[c.code] || ''} {c.name}</option>
          ))}
        </select>
      </div>

      {/* Platform */}
      <div className="flex items-center gap-1">
        <span className="text-xs text-gray-500 mr-1 font-medium">Platform</span>
        {PLATFORMS.map((p) => (
          <Btn key={p.value} active={platform === p.value} onClick={() => onChange({ ...filters, platform: p.value })}>
            {p.label}
          </Btn>
        ))}
      </div>

      {/* Cat Type */}
      <div className="flex items-center gap-1">
        <span className="text-xs text-gray-500 mr-1 font-medium">Cat Type</span>
        {CAT_TYPES.map((t) => (
          <Btn key={t.value} active={catType === t.value} onClick={() => onChange({ ...filters, catType: t.value })}>
            {t.label}
          </Btn>
        ))}
      </div>
    </div>
  );
}
