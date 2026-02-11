// Seeded pseudo-random for reproducible fake data
function seededRandom(seed) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const rand = seededRandom(42);
const randInt = (min, max) => Math.floor(rand() * (max - min + 1)) + min;

// Box-Muller transform for normal distribution
function randNormal(mean, stddev) {
  const u1 = rand();
  const u2 = rand();
  const z = Math.sqrt(-2 * Math.log(u1 + 0.0001)) * Math.cos(2 * Math.PI * u2);
  return mean + z * stddev;
}

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

function sumBy(arr, fn) {
  return arr.reduce((s, x) => s + fn(x), 0);
}

function averageBy(arr, valueFn, weightFn) {
  if (arr.length === 0) return 0;
  if (!weightFn) return sumBy(arr, valueFn) / arr.length;
  const w = sumBy(arr, weightFn);
  if (w <= 0) return 0;
  return sumBy(arr, (x) => valueFn(x) * weightFn(x)) / w;
}

export function distributeInt(total, weights) {
  const n = weights.length;
  if (n === 0) return [];
  if (total <= 0) return Array.from({ length: n }, () => 0);

  const sumW = weights.reduce((s, w) => s + Math.max(0, w), 0);
  if (sumW <= 0) {
    const out = Array.from({ length: n }, () => 0);
    out[0] = total;
    return out;
  }

  const raw = weights.map((w) => (total * Math.max(0, w)) / sumW);
  const base = raw.map((x) => Math.floor(x));
  let remaining = total - base.reduce((s, x) => s + x, 0);

  // Largest remainder method, stable tie-breaker by index.
  const order = raw
    .map((x, idx) => ({ idx, frac: x - base[idx] }))
    .sort((a, b) => (b.frac - a.frac) || (a.idx - b.idx));

  for (let i = 0; i < remaining; i++) {
    base[order[i % order.length].idx] += 1;
  }

  return base;
}

// --- Continents ---
export const CONTINENTS = [
  'North America', 'South America', 'Europe', 'Asia', 'Africa', 'Oceania',
];

// --- Countries with unique behavioral profiles ---
export const COUNTRIES = [
  {
    code: 'USA', name: 'United States', continent: 'North America',
    userWeight: 100, catsPerUser: 1.9, shotsPerCat: 4.8, iosShare: 0.58, strayShare: 0.55,
    center: [-98, 39],
  },
  {
    code: 'CAN', name: 'Canada', continent: 'North America',
    userWeight: 15, catsPerUser: 1.7, shotsPerCat: 4.2, iosShare: 0.56, strayShare: 0.50,
    center: [-106, 56],
  },
  {
    code: 'MEX', name: 'Mexico', continent: 'North America',
    userWeight: 20, catsPerUser: 2.2, shotsPerCat: 6.6, iosShare: 0.18, strayShare: 0.70,
    center: [-102, 23],
  },
  {
    code: 'BRA', name: 'Brazil', continent: 'South America',
    userWeight: 45, catsPerUser: 2.1, shotsPerCat: 6.0, iosShare: 0.20, strayShare: 0.68,
    center: [-52, -10],
  },
  {
    code: 'ARG', name: 'Argentina', continent: 'South America',
    userWeight: 8, catsPerUser: 1.9, shotsPerCat: 5.2, iosShare: 0.15, strayShare: 0.60,
    center: [-64, -34],
  },
  {
    code: 'CHL', name: 'Chile', continent: 'South America',
    userWeight: 4, catsPerUser: 1.7, shotsPerCat: 4.6, iosShare: 0.22, strayShare: 0.58,
    center: [-71, -35],
  },
  {
    code: 'COL', name: 'Colombia', continent: 'South America',
    userWeight: 7, catsPerUser: 1.8, shotsPerCat: 5.0, iosShare: 0.16, strayShare: 0.62,
    center: [-74, 4.7],
  },
  {
    code: 'GBR', name: 'United Kingdom', continent: 'Europe',
    userWeight: 30, catsPerUser: 1.4, shotsPerCat: 3.8, iosShare: 0.52, strayShare: 0.40,
    center: [-2, 54],
  },
  {
    code: 'DEU', name: 'Germany', continent: 'Europe',
    userWeight: 25, catsPerUser: 1.3, shotsPerCat: 3.5, iosShare: 0.35, strayShare: 0.38,
    center: [10, 51],
  },
  {
    code: 'FRA', name: 'France', continent: 'Europe',
    userWeight: 22, catsPerUser: 1.5, shotsPerCat: 4.2, iosShare: 0.40, strayShare: 0.42,
    center: [2, 46],
  },
  {
    code: 'ESP', name: 'Spain', continent: 'Europe',
    userWeight: 15, catsPerUser: 1.4, shotsPerCat: 3.9, iosShare: 0.38, strayShare: 0.50,
    center: [-3, 40],
  },
  {
    code: 'ITA', name: 'Italy', continent: 'Europe',
    userWeight: 17, catsPerUser: 1.4, shotsPerCat: 3.7, iosShare: 0.32, strayShare: 0.55,
    center: [12.5, 42.5],
  },
  {
    code: 'RUS', name: 'Russia', continent: 'Europe',
    userWeight: 28, catsPerUser: 2.0, shotsPerCat: 5.2, iosShare: 0.30, strayShare: 0.66,
    center: [100, 60],
  },
  {
    code: 'TUR', name: 'Turkey', continent: 'Europe',
    userWeight: 16, catsPerUser: 2.6, shotsPerCat: 8.2, iosShare: 0.22, strayShare: 0.80,
    center: [35, 39],
  },
  {
    code: 'IND', name: 'India', continent: 'Asia',
    userWeight: 80, catsPerUser: 2.4, shotsPerCat: 6.6, iosShare: 0.08, strayShare: 0.75,
    center: [78, 22],
  },
  {
    code: 'CHN', name: 'China', continent: 'Asia',
    userWeight: 60, catsPerUser: 1.2, shotsPerCat: 3.1, iosShare: 0.25, strayShare: 0.55,
    center: [104, 35],
  },
  {
    code: 'JPN', name: 'Japan', continent: 'Asia',
    userWeight: 35, catsPerUser: 2.2, shotsPerCat: 7.8, iosShare: 0.70, strayShare: 0.35,
    center: [138, 37],
  },
  {
    code: 'KOR', name: 'South Korea', continent: 'Asia',
    userWeight: 18, catsPerUser: 1.9, shotsPerCat: 6.0, iosShare: 0.30, strayShare: 0.45,
    center: [127.5, 36.5],
  },
  {
    code: 'IDN', name: 'Indonesia', continent: 'Asia',
    userWeight: 40, catsPerUser: 2.2, shotsPerCat: 7.2, iosShare: 0.10, strayShare: 0.72,
    center: [117, -2],
  },
  {
    code: 'THA', name: 'Thailand', continent: 'Asia',
    userWeight: 14, catsPerUser: 2.1, shotsPerCat: 6.2, iosShare: 0.25, strayShare: 0.70,
    center: [101, 15],
  },
  {
    code: 'PHL', name: 'Philippines', continent: 'Asia',
    userWeight: 13, catsPerUser: 1.9, shotsPerCat: 6.4, iosShare: 0.12, strayShare: 0.70,
    center: [122, 12],
  },
  {
    code: 'NGA', name: 'Nigeria', continent: 'Africa',
    userWeight: 10, catsPerUser: 2.5, shotsPerCat: 8.0, iosShare: 0.06, strayShare: 0.78,
    center: [8, 9],
  },
  {
    code: 'ZAF', name: 'South Africa', continent: 'Africa',
    userWeight: 6, catsPerUser: 1.7, shotsPerCat: 5.4, iosShare: 0.20, strayShare: 0.55,
    center: [25, -29],
  },
  {
    code: 'EGY', name: 'Egypt', continent: 'Africa',
    userWeight: 9, catsPerUser: 2.2, shotsPerCat: 7.0, iosShare: 0.12, strayShare: 0.82,
    center: [30, 26],
  },
  {
    code: 'AUS', name: 'Australia', continent: 'Oceania',
    userWeight: 12, catsPerUser: 1.8, shotsPerCat: 5.1, iosShare: 0.55, strayShare: 0.35,
    center: [133, -25],
  },
];

// --- Cat geo taxonomy (cat regions + cat cities) ---
export const CAT_REGIONS = [
  { id: 'USA-W', countryCode: 'USA', name: 'Catifornia', center: [-120.0, 36.5] },
  { id: 'USA-C', countryCode: 'USA', name: 'Midpurr', center: [-93.0, 41.5] },
  { id: 'USA-E', countryCode: 'USA', name: 'Meow York', center: [-77.0, 40.5] },

  { id: 'CAN-W', countryCode: 'CAN', name: 'Purrific Coast', center: [-125.0, 52.0] },
  { id: 'CAN-C', countryCode: 'CAN', name: 'Maple Plains', center: [-97.0, 53.0] },
  { id: 'CAN-E', countryCode: 'CAN', name: 'Meowntreal', center: [-71.0, 46.0] },

  { id: 'MEX-N', countryCode: 'MEX', name: 'Desert Whiskers', center: [-102.0, 25.5] },
  { id: 'MEX-C', countryCode: 'MEX', name: 'Central Paws', center: [-101.0, 20.5] },

  { id: 'BRA-SE', countryCode: 'BRA', name: 'Purr Paulista', center: [-46.5, -23.0] },
  { id: 'BRA-NE', countryCode: 'BRA', name: 'Tropic Tails', center: [-38.0, -8.0] },
  { id: 'BRA-C', countryCode: 'BRA', name: 'Brasilia Belt', center: [-47.8, -15.8] },

  { id: 'ARG-P', countryCode: 'ARG', name: 'Pampas Purr', center: [-62.0, -34.0] },
  { id: 'ARG-N', countryCode: 'ARG', name: 'Andes Whiskers', center: [-65.0, -31.5] },

  { id: 'CHL-C', countryCode: 'CHL', name: 'Central Claws', center: [-71.0, -34.5] },
  { id: 'CHL-S', countryCode: 'CHL', name: 'Southern Paws', center: [-73.0, -36.8] },

  { id: 'COL-A', countryCode: 'COL', name: 'Andean Alley', center: [-74.5, 5.0] },
  { id: 'COL-P', countryCode: 'COL', name: 'Pacific Purr', center: [-76.5, 3.4] },

  { id: 'GBR-S', countryCode: 'GBR', name: 'South Meowland', center: [-1.0, 51.0] },
  { id: 'GBR-N', countryCode: 'GBR', name: 'North Whiskers', center: [-2.5, 54.5] },

  { id: 'DEU-N', countryCode: 'DEU', name: 'Nordic Naps', center: [10.0, 53.0] },
  { id: 'DEU-S', countryCode: 'DEU', name: 'Bavarian Beans', center: [11.0, 48.5] },

  { id: 'FRA-N', countryCode: 'FRA', name: 'Paris Paws', center: [2.3, 48.9] },
  { id: 'FRA-S', countryCode: 'FRA', name: 'Riviera Roam', center: [5.3, 43.3] },

  { id: 'ESP-C', countryCode: 'ESP', name: 'Castile Cats', center: [-3.7, 40.4] },
  { id: 'ESP-E', countryCode: 'ESP', name: 'Catalan Claws', center: [2.2, 41.4] },

  { id: 'ITA-N', countryCode: 'ITA', name: 'Northern Naps', center: [9.2, 45.3] },
  { id: 'ITA-C', countryCode: 'ITA', name: 'Roman Roam', center: [12.5, 41.9] },
  { id: 'ITA-S', countryCode: 'ITA', name: 'Napoli Nights', center: [14.3, 40.9] },

  { id: 'RUS-W', countryCode: 'RUS', name: 'Western Whiskers', center: [34.0, 57.0] },
  { id: 'RUS-S', countryCode: 'RUS', name: 'Siberian Snooze', center: [83.0, 55.0] },

  { id: 'TUR-M', countryCode: 'TUR', name: 'Marmara Meows', center: [29.0, 41.0] },
  { id: 'TUR-A', countryCode: 'TUR', name: 'Anatolian Alley', center: [32.8, 39.9] },

  { id: 'IND-N', countryCode: 'IND', name: 'North Purr', center: [77.2, 28.6] },
  { id: 'IND-W', countryCode: 'IND', name: 'West Whiskers', center: [72.9, 19.1] },
  { id: 'IND-S', countryCode: 'IND', name: 'South Snooze', center: [77.6, 13.0] },

  { id: 'CHN-N', countryCode: 'CHN', name: 'Northern Paws', center: [116.4, 39.9] },
  { id: 'CHN-E', countryCode: 'CHN', name: 'Eastern Tails', center: [121.5, 31.2] },
  { id: 'CHN-S', countryCode: 'CHN', name: 'Southern Claws', center: [113.3, 23.1] },

  { id: 'JPN-K', countryCode: 'JPN', name: 'Kanto Kitties', center: [139.7, 35.7] },
  { id: 'JPN-KS', countryCode: 'JPN', name: 'Kansai Cats', center: [135.5, 34.7] },
  { id: 'JPN-H', countryCode: 'JPN', name: 'Hokkaido Hugs', center: [141.3, 43.1] },

  { id: 'KOR-S', countryCode: 'KOR', name: 'Seoul Spots', center: [127.0, 37.6] },
  { id: 'KOR-C', countryCode: 'KOR', name: 'Coastal Claws', center: [129.1, 35.2] },

  { id: 'IDN-J', countryCode: 'IDN', name: 'Java Jumps', center: [107.6, -6.9] },
  { id: 'IDN-E', countryCode: 'IDN', name: 'East Islands', center: [112.8, -7.3] },

  { id: 'THA-C', countryCode: 'THA', name: 'Bangkok Beans', center: [100.5, 13.8] },
  { id: 'THA-N', countryCode: 'THA', name: 'Northern Naps', center: [99.0, 18.7] },
  { id: 'THA-S', countryCode: 'THA', name: 'Island Purr', center: [98.3, 7.9] },

  { id: 'PHL-N', countryCode: 'PHL', name: 'Manila Meows', center: [121.0, 14.6] },
  { id: 'PHL-S', countryCode: 'PHL', name: 'Southern Paws', center: [125.6, 7.2] },

  { id: 'NGA-SW', countryCode: 'NGA', name: 'Lagos Laps', center: [3.4, 6.5] },
  { id: 'NGA-C', countryCode: 'NGA', name: 'Abuja Alley', center: [7.4, 9.1] },
  { id: 'NGA-N', countryCode: 'NGA', name: 'Kano Kittens', center: [8.5, 12.0] },

  { id: 'ZAF-G', countryCode: 'ZAF', name: 'Gauteng Groom', center: [28.0, -26.2] },
  { id: 'ZAF-WC', countryCode: 'ZAF', name: 'Cape Claws', center: [18.4, -33.9] },
  { id: 'ZAF-KZN', countryCode: 'ZAF', name: 'Durban Doze', center: [31.0, -29.9] },

  { id: 'EGY-N', countryCode: 'EGY', name: 'Nile Naps', center: [31.2, 30.0] },
  { id: 'EGY-C', countryCode: 'EGY', name: 'Alex Alley', center: [29.9, 31.2] },

  { id: 'AUS-NSW', countryCode: 'AUS', name: 'Sydney Snooze', center: [151.2, -33.9] },
  { id: 'AUS-VIC', countryCode: 'AUS', name: 'Melbourne Meows', center: [145.0, -37.8] },
  { id: 'AUS-QLD', countryCode: 'AUS', name: 'Brisbane Beans', center: [153.0, -27.5] },
];

export const CAT_CITIES = [
  // USA
  { id: 'USA-SF', countryCode: 'USA', regionId: 'USA-W', name: 'San Meowcisco', coordinates: [-122.4194, 37.7749], weight: 10, spread: 0.25 },
  { id: 'USA-CHI', countryCode: 'USA', regionId: 'USA-C', name: 'Chi-cat-go', coordinates: [-87.6298, 41.8781], weight: 8, spread: 0.22 },
  { id: 'USA-NYC', countryCode: 'USA', regionId: 'USA-E', name: 'Meow York', coordinates: [-74.0060, 40.7128], weight: 10, spread: 0.22 },

  // CAN
  { id: 'CAN-VAN', countryCode: 'CAN', regionId: 'CAN-W', name: 'Vancouvfur', coordinates: [-123.1207, 49.2827], weight: 6, spread: 0.20 },
  { id: 'CAN-TOR', countryCode: 'CAN', regionId: 'CAN-C', name: 'Torontomeow', coordinates: [-79.3832, 43.6532], weight: 7, spread: 0.18 },
  { id: 'CAN-MTL', countryCode: 'CAN', regionId: 'CAN-E', name: 'Meowntreal', coordinates: [-73.5673, 45.5017], weight: 5, spread: 0.18 },

  // MEX
  { id: 'MEX-MTY', countryCode: 'MEX', regionId: 'MEX-N', name: 'Monterrey Purr', coordinates: [-100.3161, 25.6866], weight: 5, spread: 0.20 },
  { id: 'MEX-GDL', countryCode: 'MEX', regionId: 'MEX-C', name: 'Guadalapawra', coordinates: [-103.3496, 20.6597], weight: 4, spread: 0.22 },
  { id: 'MEX-MXC', countryCode: 'MEX', regionId: 'MEX-C', name: 'Meowxico City', coordinates: [-99.1332, 19.4326], weight: 7, spread: 0.18 },

  // BRA
  { id: 'BRA-SAO', countryCode: 'BRA', regionId: 'BRA-SE', name: 'Sao Purrlo', coordinates: [-46.6333, -23.5505], weight: 9, spread: 0.20 },
  { id: 'BRA-RIO', countryCode: 'BRA', regionId: 'BRA-SE', name: 'Rio de Jameowro', coordinates: [-43.1729, -22.9068], weight: 7, spread: 0.20 },
  { id: 'BRA-BSB', countryCode: 'BRA', regionId: 'BRA-C', name: 'Brasilia', coordinates: [-47.8825, -15.7942], weight: 4, spread: 0.22 },

  // ARG
  { id: 'ARG-BUE', countryCode: 'ARG', regionId: 'ARG-P', name: 'Buenos A-meow-res', coordinates: [-58.3816, -34.6037], weight: 7, spread: 0.18 },
  { id: 'ARG-COR', countryCode: 'ARG', regionId: 'ARG-N', name: 'Cordoba', coordinates: [-64.1888, -31.4201], weight: 4, spread: 0.22 },
  { id: 'ARG-ROS', countryCode: 'ARG', regionId: 'ARG-P', name: 'Rosario', coordinates: [-60.6505, -32.9442], weight: 3, spread: 0.22 },

  // CHL
  { id: 'CHL-SCL', countryCode: 'CHL', regionId: 'CHL-C', name: 'Santiago', coordinates: [-70.6693, -33.4489], weight: 6, spread: 0.16 },
  { id: 'CHL-VAP', countryCode: 'CHL', regionId: 'CHL-C', name: 'Valparaiso', coordinates: [-71.6127, -33.0472], weight: 3, spread: 0.18 },
  { id: 'CHL-CCP', countryCode: 'CHL', regionId: 'CHL-S', name: 'Concepcion', coordinates: [-73.0498, -36.8260], weight: 3, spread: 0.20 },

  // COL
  { id: 'COL-BOG', countryCode: 'COL', regionId: 'COL-A', name: 'Bogota', coordinates: [-74.0721, 4.7110], weight: 6, spread: 0.20 },
  { id: 'COL-MDE', countryCode: 'COL', regionId: 'COL-A', name: 'Medellin', coordinates: [-75.5812, 6.2442], weight: 4, spread: 0.18 },
  { id: 'COL-CLO', countryCode: 'COL', regionId: 'COL-P', name: 'Cali', coordinates: [-76.5320, 3.4516], weight: 4, spread: 0.18 },

  // GBR
  { id: 'GBR-LON', countryCode: 'GBR', regionId: 'GBR-S', name: 'London', coordinates: [-0.1276, 51.5072], weight: 8, spread: 0.10 },
  { id: 'GBR-MAN', countryCode: 'GBR', regionId: 'GBR-N', name: 'Manchester', coordinates: [-2.2426, 53.4808], weight: 4, spread: 0.12 },
  { id: 'GBR-EDI', countryCode: 'GBR', regionId: 'GBR-N', name: 'Edinburgh', coordinates: [-3.1883, 55.9533], weight: 3, spread: 0.12 },

  // DEU
  { id: 'DEU-BER', countryCode: 'DEU', regionId: 'DEU-N', name: 'Berlin', coordinates: [13.4050, 52.5200], weight: 6, spread: 0.12 },
  { id: 'DEU-HAM', countryCode: 'DEU', regionId: 'DEU-N', name: 'Hamburg', coordinates: [9.9937, 53.5511], weight: 4, spread: 0.12 },
  { id: 'DEU-MUC', countryCode: 'DEU', regionId: 'DEU-S', name: 'Munich', coordinates: [11.5820, 48.1351], weight: 4, spread: 0.12 },

  // FRA
  { id: 'FRA-PAR', countryCode: 'FRA', regionId: 'FRA-N', name: 'Paris', coordinates: [2.3522, 48.8566], weight: 7, spread: 0.10 },
  { id: 'FRA-LYO', countryCode: 'FRA', regionId: 'FRA-N', name: 'Lyon', coordinates: [4.8357, 45.7640], weight: 4, spread: 0.12 },
  { id: 'FRA-MRS', countryCode: 'FRA', regionId: 'FRA-S', name: 'Marseille', coordinates: [5.3698, 43.2965], weight: 4, spread: 0.12 },

  // ESP
  { id: 'ESP-MAD', countryCode: 'ESP', regionId: 'ESP-C', name: 'Madrid', coordinates: [-3.7038, 40.4168], weight: 6, spread: 0.12 },
  { id: 'ESP-BCN', countryCode: 'ESP', regionId: 'ESP-E', name: 'Barcelona', coordinates: [2.1734, 41.3851], weight: 6, spread: 0.12 },
  { id: 'ESP-VLC', countryCode: 'ESP', regionId: 'ESP-E', name: 'Valencia', coordinates: [-0.3763, 39.4699], weight: 4, spread: 0.12 },

  // ITA
  { id: 'ITA-MIL', countryCode: 'ITA', regionId: 'ITA-N', name: 'Milan', coordinates: [9.1900, 45.4642], weight: 6, spread: 0.12 },
  { id: 'ITA-ROM', countryCode: 'ITA', regionId: 'ITA-C', name: 'Rome', coordinates: [12.4964, 41.9028], weight: 6, spread: 0.12 },
  { id: 'ITA-NAP', countryCode: 'ITA', regionId: 'ITA-S', name: 'Naples', coordinates: [14.2681, 40.8518], weight: 4, spread: 0.12 },

  // RUS
  { id: 'RUS-MOW', countryCode: 'RUS', regionId: 'RUS-W', name: 'Moscow', coordinates: [37.6173, 55.7558], weight: 8, spread: 0.14 },
  { id: 'RUS-LED', countryCode: 'RUS', regionId: 'RUS-W', name: 'Saint Petersburg', coordinates: [30.3351, 59.9343], weight: 6, spread: 0.14 },
  { id: 'RUS-NVS', countryCode: 'RUS', regionId: 'RUS-S', name: 'Novosibirsk', coordinates: [82.9204, 55.0302], weight: 4, spread: 0.18 },

  // TUR
  { id: 'TUR-IST', countryCode: 'TUR', regionId: 'TUR-M', name: 'Istanbul', coordinates: [28.9784, 41.0082], weight: 7, spread: 0.14 },
  { id: 'TUR-ANK', countryCode: 'TUR', regionId: 'TUR-A', name: 'Ankara', coordinates: [32.8597, 39.9334], weight: 4, spread: 0.14 },
  { id: 'TUR-IZM', countryCode: 'TUR', regionId: 'TUR-A', name: 'Izmir', coordinates: [27.1428, 38.4237], weight: 4, spread: 0.14 },

  // IND
  { id: 'IND-DEL', countryCode: 'IND', regionId: 'IND-N', name: 'Delhi', coordinates: [77.2090, 28.6139], weight: 8, spread: 0.18 },
  { id: 'IND-BOM', countryCode: 'IND', regionId: 'IND-W', name: 'Mumbai', coordinates: [72.8777, 19.0760], weight: 7, spread: 0.20 },
  { id: 'IND-BLR', countryCode: 'IND', regionId: 'IND-S', name: 'Bengaluru', coordinates: [77.5946, 12.9716], weight: 6, spread: 0.20 },

  // CHN
  { id: 'CHN-BJS', countryCode: 'CHN', regionId: 'CHN-N', name: 'Beijing', coordinates: [116.4074, 39.9042], weight: 8, spread: 0.18 },
  { id: 'CHN-SHA', countryCode: 'CHN', regionId: 'CHN-E', name: 'Shanghai', coordinates: [121.4737, 31.2304], weight: 8, spread: 0.18 },
  { id: 'CHN-CAN', countryCode: 'CHN', regionId: 'CHN-S', name: 'Guangzhou', coordinates: [113.2644, 23.1291], weight: 6, spread: 0.18 },

  // JPN
  { id: 'JPN-TYO', countryCode: 'JPN', regionId: 'JPN-K', name: 'Tokyo', coordinates: [139.6917, 35.6895], weight: 9, spread: 0.14 },
  { id: 'JPN-OSA', countryCode: 'JPN', regionId: 'JPN-KS', name: 'Osaka', coordinates: [135.5022, 34.6937], weight: 6, spread: 0.14 },
  { id: 'JPN-SPK', countryCode: 'JPN', regionId: 'JPN-H', name: 'Sapporo', coordinates: [141.3545, 43.0621], weight: 4, spread: 0.16 },

  // KOR
  { id: 'KOR-SEL', countryCode: 'KOR', regionId: 'KOR-S', name: 'Seoul', coordinates: [126.9780, 37.5665], weight: 8, spread: 0.14 },
  { id: 'KOR-INC', countryCode: 'KOR', regionId: 'KOR-S', name: 'Incheon', coordinates: [126.7052, 37.4563], weight: 4, spread: 0.14 },
  { id: 'KOR-PUS', countryCode: 'KOR', regionId: 'KOR-C', name: 'Busan', coordinates: [129.0756, 35.1796], weight: 5, spread: 0.14 },

  // IDN
  { id: 'IDN-JKT', countryCode: 'IDN', regionId: 'IDN-J', name: 'Jakarta', coordinates: [106.8456, -6.2088], weight: 8, spread: 0.22 },
  { id: 'IDN-BDG', countryCode: 'IDN', regionId: 'IDN-J', name: 'Bandung', coordinates: [107.6191, -6.9175], weight: 4, spread: 0.22 },
  { id: 'IDN-SBY', countryCode: 'IDN', regionId: 'IDN-E', name: 'Surabaya', coordinates: [112.7521, -7.2575], weight: 5, spread: 0.22 },

  // THA
  { id: 'THA-BKK', countryCode: 'THA', regionId: 'THA-C', name: 'Bangkok', coordinates: [100.5018, 13.7563], weight: 7, spread: 0.20 },
  { id: 'THA-CNX', countryCode: 'THA', regionId: 'THA-N', name: 'Chiang Mai', coordinates: [98.9817, 18.7061], weight: 3, spread: 0.22 },
  { id: 'THA-HKT', countryCode: 'THA', regionId: 'THA-S', name: 'Phuket', coordinates: [98.3381, 7.8804], weight: 3, spread: 0.22 },

  // PHL
  { id: 'PHL-MNL', countryCode: 'PHL', regionId: 'PHL-N', name: 'Manila', coordinates: [120.9842, 14.5995], weight: 7, spread: 0.22 },
  { id: 'PHL-CEB', countryCode: 'PHL', regionId: 'PHL-N', name: 'Cebu', coordinates: [123.8854, 10.3157], weight: 4, spread: 0.22 },
  { id: 'PHL-DVO', countryCode: 'PHL', regionId: 'PHL-S', name: 'Davao', coordinates: [125.6128, 7.1907], weight: 3, spread: 0.22 },

  // NGA
  { id: 'NGA-LOS', countryCode: 'NGA', regionId: 'NGA-SW', name: 'Lagos', coordinates: [3.3792, 6.5244], weight: 7, spread: 0.24 },
  { id: 'NGA-ABV', countryCode: 'NGA', regionId: 'NGA-C', name: 'Abuja', coordinates: [7.3986, 9.0765], weight: 4, spread: 0.24 },
  { id: 'NGA-KAN', countryCode: 'NGA', regionId: 'NGA-N', name: 'Kano', coordinates: [8.5167, 12.0000], weight: 4, spread: 0.24 },

  // ZAF
  { id: 'ZAF-JNB', countryCode: 'ZAF', regionId: 'ZAF-G', name: 'Johannesburg', coordinates: [28.0473, -26.2041], weight: 6, spread: 0.20 },
  { id: 'ZAF-CPT', countryCode: 'ZAF', regionId: 'ZAF-WC', name: 'Cape Town', coordinates: [18.4241, -33.9249], weight: 5, spread: 0.20 },
  { id: 'ZAF-DUR', countryCode: 'ZAF', regionId: 'ZAF-KZN', name: 'Durban', coordinates: [31.0218, -29.8587], weight: 4, spread: 0.20 },

  // EGY
  { id: 'EGY-CAI', countryCode: 'EGY', regionId: 'EGY-N', name: 'Cairo', coordinates: [31.2357, 30.0444], weight: 7, spread: 0.18 },
  { id: 'EGY-ALE', countryCode: 'EGY', regionId: 'EGY-C', name: 'Alexandria', coordinates: [29.9187, 31.2001], weight: 4, spread: 0.18 },
  { id: 'EGY-GIZ', countryCode: 'EGY', regionId: 'EGY-N', name: 'Giza', coordinates: [31.2109, 30.0131], weight: 4, spread: 0.18 },

  // AUS
  { id: 'AUS-SYD', countryCode: 'AUS', regionId: 'AUS-NSW', name: 'Sydney', coordinates: [151.2093, -33.8688], weight: 6, spread: 0.18 },
  { id: 'AUS-MEL', countryCode: 'AUS', regionId: 'AUS-VIC', name: 'Melbourne', coordinates: [144.9631, -37.8136], weight: 6, spread: 0.18 },
  { id: 'AUS-BNE', countryCode: 'AUS', regionId: 'AUS-QLD', name: 'Brisbane', coordinates: [153.0251, -27.4698], weight: 4, spread: 0.20 },
];

const CAT_CITY_BY_ID = Object.fromEntries(CAT_CITIES.map((c) => [c.id, c]));
const CAT_CITIES_BY_COUNTRY = COUNTRIES.reduce((acc, c) => {
  acc[c.code] = CAT_CITIES.filter((x) => x.countryCode === c.code);
  return acc;
}, {});

// --- Generate daily data (365 days, ending on Feb 10, 2026) ---
const TOTAL_DAYS = 365;
const today = new Date(2026, 1, 10); // Feb 10, 2026

function buildDates() {
  const out = [];
  for (let i = TOTAL_DAYS - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    out.push(date.toISOString().slice(0, 10));
  }
  return out;
}

const DATES = buildDates();

function generateGlobalCurve() {
  const users = [];
  const dauMau = [];

  // Pre-generate dip events: 6-8 dips spread across the year, each 4-12 days
  const dips = [];
  const numDips = 6 + Math.floor(rand() * 3);
  for (let d = 0; d < numDips; d++) {
    const center = 30 + Math.floor(rand() * (TOTAL_DAYS - 60));
    const halfWidth = 2 + Math.floor(rand() * 5);
    const depth = 0.60 + rand() * 0.25;
    dips.push({ center, halfWidth, depth });
  }

  for (let dayIndex = 0; dayIndex < TOTAL_DAYS; dayIndex++) {
    const dateStr = DATES[dayIndex];
    const date = new Date(`${dateStr}T00:00:00Z`);
    const month = date.getUTCMonth(); // 0-11
    const dow = date.getUTCDay(); // 0=Sun

    const progress = dayIndex / TOTAL_DAYS;

    // Growth curve: starts at ~30, ends ~220
    const growthBase = 30 + 190 * Math.pow(progress, 1.25);

    const seasonalFactor = 1.0
      + 0.12 * Math.sin((month - 3) * Math.PI / 6)
      + 0.06 * Math.sin((month - 11) * Math.PI / 3);

    const weekendFactor = (dow === 0 || dow === 6) ? 1.10 + rand() * 0.08 : 1.0;
    const spikeFactor = rand() < 0.02 ? 1.25 + rand() * 0.6 : 1.0;

    let dipFactor = 1.0;
    for (const dip of dips) {
      const dist = Math.abs(dayIndex - dip.center);
      if (dist <= dip.halfWidth * 2) {
        const t = dist / dip.halfWidth;
        const dipAmount = (1.0 - dip.depth) * Math.exp(-t * t);
        dipFactor -= dipAmount;
      }
    }
    dipFactor = Math.max(dipFactor, 0.55);

    const noise = 0.88 + rand() * 0.28;

    const u = Math.max(15, Math.round(
      growthBase * seasonalFactor * weekendFactor * spikeFactor * dipFactor * noise,
    ));
    users.push(u);

    const dm = clamp(
      0.12 + progress * 0.14 + randNormal(0, 0.015),
      0.06,
      0.42,
    );
    dauMau.push(dm);
  }

  return { users, dauMau };
}

const GLOBAL_CURVE = generateGlobalCurve();
const totalUserWeight = COUNTRIES.reduce((s, c) => s + c.userWeight, 0);

function generateCountryDailyData() {
  const out = {};
  COUNTRIES.forEach((c) => { out[c.code] = []; });

  for (let dayIndex = 0; dayIndex < TOTAL_DAYS; dayIndex++) {
    const date = DATES[dayIndex];
    const globalUsers = GLOBAL_CURVE.users[dayIndex];

    // Country weights shift slightly day-to-day.
    const weights = COUNTRIES.map((c) => {
      const w = (c.userWeight / totalUserWeight) * clamp(randNormal(1.0, 0.18), 0.65, 1.55);
      return w;
    });
    const usersByCountry = distributeInt(globalUsers, weights);

    COUNTRIES.forEach((c, idx) => {
      const users = Math.max(0, usersByCountry[idx]);

      const catsPerU = clamp(randNormal(c.catsPerUser, 0.45), 1.05, 6.0);
      const cats = Math.max(users, Math.round(users * catsPerU));

      const shotsPerC = clamp(randNormal(c.shotsPerCat, 1.25), 1.0, 12.0);
      const shots = Math.max(0, Math.round(cats * shotsPerC));

      const iosR = clamp(randNormal(c.iosShare, 0.08), 0.02, 0.95);
      const usersIos = Math.round(users * iosR);
      const usersAndroid = Math.max(0, users - usersIos);

      const strayR = clamp(randNormal(c.strayShare ?? 0.62, 0.10), 0.20, 0.92);
      const catsStray = Math.round(cats * strayR);
      const catsHome = Math.max(0, cats - catsStray);

      const dauMau = clamp(GLOBAL_CURVE.dauMau[dayIndex] * randNormal(1.0, 0.06), 0.03, 0.45);

      out[c.code].push({
        date,
        newUsers: users,
        newUsersIos: usersIos,
        newUsersAndroid: usersAndroid,
        newCats: cats,
        newCatsStray: catsStray,
        newCatsHome: catsHome,
        shots,
        dauMau,
      });
    });
  }

  return out;
}

export const countryDailyData = generateCountryDailyData();

function generateDailyFromCountries() {
  return DATES.map((date, dayIndex) => {
    const days = COUNTRIES.map((c) => countryDailyData[c.code][dayIndex]).filter(Boolean);

    const newUsers = sumBy(days, (d) => d.newUsers);
    const newUsersIos = sumBy(days, (d) => d.newUsersIos);
    const newUsersAndroid = sumBy(days, (d) => d.newUsersAndroid);
    const newCats = sumBy(days, (d) => d.newCats);
    const newCatsStray = sumBy(days, (d) => d.newCatsStray);
    const newCatsHome = sumBy(days, (d) => d.newCatsHome);
    const shots = sumBy(days, (d) => d.shots);
    const dauMau = averageBy(days, (d) => d.dauMau, (d) => d.newUsers);

    return {
      date,
      newUsers,
      newUsersIos,
      newUsersAndroid,
      newCats,
      newCatsStray,
      newCatsHome,
      shots,
      dauMau,
    };
  });
}

export const dailyData = generateDailyFromCountries();

function generateCountryData() {
  return COUNTRIES.map((c) => {
    const days = countryDailyData[c.code] || [];
    return {
      code: c.code,
      name: c.name,
      users: sumBy(days, (d) => d.newUsers),
      cats: sumBy(days, (d) => d.newCats),
      shots: sumBy(days, (d) => d.shots),
    };
  });
}

export const countryData = generateCountryData();

// --- Generate per-cat events for the map (used only for map drill-down) ---
function makeWeightedPicker(items) {
  const weights = items.map((x) => Math.max(0, x.weight ?? 1));
  const cum = [];
  let total = 0;
  for (let i = 0; i < items.length; i++) {
    total += weights[i];
    cum.push(total);
  }

  return () => {
    if (items.length === 0 || total <= 0) return null;
    const r = rand() * total;
    let lo = 0;
    let hi = cum.length - 1;
    while (lo < hi) {
      const mid = Math.floor((lo + hi) / 2);
      if (r <= cum[mid]) hi = mid;
      else lo = mid + 1;
    }
    return items[lo];
  };
}

function jitterCoord([lng, lat], spread) {
  const dx = randNormal(0, spread);
  const dy = randNormal(0, spread * 0.7);
  const outLng = lng + dx;
  const outLat = clamp(lat + dy, -85, 85);
  return [outLng, outLat];
}

function splitPlatformCount(totalCats, iosRatio) {
  return distributeInt(totalCats, [iosRatio, 1 - iosRatio]);
}

function generateCatEvents() {
  const cityPickerByCountry = {};
  COUNTRIES.forEach((c) => {
    const cities = CAT_CITIES_BY_COUNTRY[c.code] || [];
    cityPickerByCountry[c.code] = makeWeightedPicker(cities);
  });

  let idCounter = 1;
  const catsByDate = {};
  const allCats = [];

  for (let dayIndex = 0; dayIndex < TOTAL_DAYS; dayIndex++) {
    const date = DATES[dayIndex];
    const list = [];

    COUNTRIES.forEach((country) => {
      const d = countryDailyData[country.code]?.[dayIndex];
      if (!d) return;

      const iosRatio = d.newUsers > 0 ? d.newUsersIos / d.newUsers : country.iosShare;
      const [strayIos, strayAndroid] = splitPlatformCount(d.newCatsStray, iosRatio);
      const [homeIos, homeAndroid] = splitPlatformCount(d.newCatsHome, iosRatio);

      const picker = cityPickerByCountry[country.code];

      function pushCats(count, catType, platform) {
        for (let i = 0; i < count; i++) {
          const city = picker?.();
          if (!city) return;
          const coord = jitterCoord(city.coordinates, city.spread ?? 0.2);
          const cat = {
            id: `CAT-${String(idCounter).padStart(7, '0')}`,
            date,
            countryCode: country.code,
            continent: country.continent,
            regionId: city.regionId,
            cityId: city.id,
            catType,
            platform,
            coordinates: coord,
          };
          idCounter += 1;
          list.push(cat);
          allCats.push(cat);
        }
      }

      pushCats(strayIos, 'Stray', 'iOS');
      pushCats(strayAndroid, 'Stray', 'Android');
      pushCats(homeIos, 'Home', 'iOS');
      pushCats(homeAndroid, 'Home', 'Android');
    });

    catsByDate[date] = list;
  }

  return { catsByDate, allCats };
}

const CAT_EVENTS = generateCatEvents();
export const catEventsByDate = CAT_EVENTS.catsByDate;
export const catEvents = CAT_EVENTS.allCats;

// --- Age/Sex distribution ---
export const AGE_GROUPS = [
  '13-17', '18-21', '22-25', '26-30', '31-35',
  '36-40', '41-49', '50-59', '60-69', '70+',
];

function generateAgeSexData() {
  // Bell curve peaking at 22-30 age range
  return AGE_GROUPS.map((group, idx) => {
    const peak = 4;
    const dist = Math.abs(idx - peak);
    const base = Math.round(4500 * Math.exp(-0.12 * dist * dist));
    return {
      ageGroup: group,
      male: Math.max(50, Math.round(base * clamp(randNormal(1.0, 0.2), 0.5, 1.6))),
      female: Math.max(50, Math.round(base * clamp(randNormal(0.90, 0.2), 0.4, 1.5))),
    };
  });
}

export const ageSexData = generateAgeSexData();

function generateCountryAgeSexData() {
  const result = {};
  COUNTRIES.forEach((c) => {
    const scale = c.userWeight / 100;
    result[c.code] = AGE_GROUPS.map((group, idx) => {
      const peak = 3 + randInt(0, 3);
      const dist = Math.abs(idx - peak);
      const base = Math.round(900 * scale * Math.exp(-0.10 * dist * dist));
      return {
        ageGroup: group,
        male: Math.max(5, Math.round(base * clamp(randNormal(1.0, 0.3), 0.3, 2.0))),
        female: Math.max(5, Math.round(base * clamp(randNormal(0.90, 0.3), 0.3, 1.8))),
      };
    });
  });
  return result;
}

export const countryAgeSexData = generateCountryAgeSexData();

// --- Retention curve (kept for now, even if UI no longer shows it) ---
const RETENTION_DAYS = [0, 1, 2, 3, 5, 7, 10, 14, 21, 30];

function generateRetentionCurve(d1Base, decayRate) {
  return RETENTION_DAYS.map((day) => {
    if (day === 0) return { day, rate: 100 };
    const base = 100 * Math.exp(-decayRate * day);
    const noisy = clamp(base + randNormal(0, 2.5), 1, 99);
    return { day, rate: Math.round(noisy * 10) / 10 };
  });
}

export const retentionData = generateRetentionCurve(42, 0.075);

export const retentionByPlatform = {
  ALL: retentionData,
  iOS: generateRetentionCurve(46, 0.065),
  Android: generateRetentionCurve(38, 0.085),
};

export const retentionByCountry = {};
COUNTRIES.forEach((c) => {
  const d1 = clamp(randNormal(42, 8), 25, 60);
  const decay = clamp(randNormal(0.075, 0.02), 0.03, 0.13);
  retentionByCountry[c.code] = {
    ALL: generateRetentionCurve(d1, decay),
    iOS: generateRetentionCurve(d1 + randNormal(4, 2), decay * 0.85),
    Android: generateRetentionCurve(d1 - randNormal(3, 2), decay * 1.15),
  };
});

// --- Aggregate KPIs ---
export function computeKpis(data, prevData) {
  const totalUsers = data.reduce((s, d) => s + d.newUsers, 0);
  const totalCats = data.reduce((s, d) => s + d.newCats, 0);
  const totalShots = data.reduce((s, d) => s + d.shots, 0);
  const avgDauMau = data.length > 0
    ? data.reduce((s, d) => s + d.dauMau, 0) / data.length
    : 0;

  const prevUsers = prevData ? prevData.reduce((s, d) => s + d.newUsers, 0) : null;
  const prevCats = prevData ? prevData.reduce((s, d) => s + d.newCats, 0) : null;
  const prevShots = prevData ? prevData.reduce((s, d) => s + d.shots, 0) : null;
  const prevDauMau = prevData && prevData.length > 0
    ? prevData.reduce((s, d) => s + d.dauMau, 0) / prevData.length
    : null;

  const pctChange = (curr, prev) =>
    prev && prev > 0 ? ((curr - prev) / prev) * 100 : null;

  return {
    users: { value: totalUsers, change: pctChange(totalUsers, prevUsers) },
    cats: { value: totalCats, change: pctChange(totalCats, prevCats) },
    shots: { value: totalShots, change: pctChange(totalShots, prevShots) },
    dauMau: { value: avgDauMau, change: pctChange(avgDauMau, prevDauMau) },
  };
}

// --- Filter & aggregate helpers ---
function resolveSource(data, { continent, country }) {
  if (country !== 'ALL') return countryDailyData[country] || [];
  if (continent !== 'ALL') return aggregateContinentData(continent);
  return data;
}

function aggregateContinentData(continent) {
  const codes = COUNTRIES.filter((c) => c.continent === continent).map((c) => c.code);
  if (codes.length === 0) return [];

  const len = dailyData.length;
  return Array.from({ length: len }, (_, i) => {
    const base = {
      date: dailyData[i].date,
      newUsers: 0,
      newUsersIos: 0,
      newUsersAndroid: 0,
      newCats: 0,
      newCatsStray: 0,
      newCatsHome: 0,
      shots: 0,
      dauMau: 0,
    };

    let dauWeightedUsers = 0;
    let dauWeightedSum = 0;

    codes.forEach((code) => {
      const d = countryDailyData[code]?.[i];
      if (!d) return;
      base.newUsers += d.newUsers;
      base.newUsersIos += d.newUsersIos;
      base.newUsersAndroid += d.newUsersAndroid;
      base.newCats += d.newCats;
      base.newCatsStray += d.newCatsStray;
      base.newCatsHome += d.newCatsHome;
      base.shots += d.shots;

      dauWeightedUsers += d.newUsers;
      dauWeightedSum += d.dauMau * d.newUsers;
    });

    base.dauMau = dauWeightedUsers > 0 ? dauWeightedSum / dauWeightedUsers : 0;
    return base;
  });
}

function normalizeUsersSplit(d) {
  const total = d.newUsersIos + d.newUsersAndroid;
  if (total === d.newUsers) return d;

  // Fix rounding drift by adjusting the larger bucket.
  const diff = d.newUsers - total;
  if (diff === 0) return d;
  if (d.newUsersIos >= d.newUsersAndroid) return { ...d, newUsersIos: Math.max(0, d.newUsersIos + diff) };
  return { ...d, newUsersAndroid: Math.max(0, d.newUsersAndroid + diff) };
}

// Scale all metrics proportionally by the platform's user share.
function applyPlatform(d, platform) {
  const total = d.newUsersIos + d.newUsersAndroid;
  if (total === 0) {
    return {
      ...d,
      newUsers: 0,
      newUsersIos: 0,
      newUsersAndroid: 0,
      newCats: 0,
      newCatsStray: 0,
      newCatsHome: 0,
      shots: 0,
    };
  }

  const platformUsers = platform === 'iOS' ? d.newUsersIos : d.newUsersAndroid;
  const ratio = platformUsers / total;

  let newCats = Math.round(d.newCats * ratio);
  let newCatsStray = Math.round(d.newCatsStray * ratio);
  let newCatsHome = Math.round(d.newCatsHome * ratio);

  // Keep sums consistent.
  let drift = newCats - (newCatsStray + newCatsHome);
  if (drift !== 0) {
    if (newCatsStray >= newCatsHome) newCatsStray += drift;
    else newCatsHome += drift;
  }

  // Enforce invariants (cats should never be < users).
  if (newCats < platformUsers) {
    const bump = platformUsers - newCats;
    newCats += bump;
    // Add bump into the dominant type bucket.
    if (newCatsStray >= newCatsHome) newCatsStray += bump;
    else newCatsHome += bump;
  }

  const out = {
    ...d,
    newUsers: platformUsers,
    newUsersIos: platform === 'iOS' ? d.newUsersIos : 0,
    newUsersAndroid: platform === 'Android' ? d.newUsersAndroid : 0,
    newCats,
    newCatsStray: Math.max(0, newCatsStray),
    newCatsHome: Math.max(0, newCatsHome),
    shots: Math.round(d.shots * ratio),
  };

  return normalizeUsersSplit(out);
}

function applyCatType(d, catType) {
  if (catType === 'ALL') return d;

  const totalCats = d.newCats;
  if (totalCats <= 0) {
    return {
      ...d,
      newUsers: 0,
      newUsersIos: 0,
      newUsersAndroid: 0,
      newCats: 0,
      newCatsStray: 0,
      newCatsHome: 0,
      shots: 0,
    };
  }

  const selectedCats = catType === 'Stray' ? d.newCatsStray : d.newCatsHome;
  const ratio = selectedCats / totalCats;

  let newUsers = Math.round(d.newUsers * ratio);
  let newUsersIos = Math.round(d.newUsersIos * ratio);
  let newUsersAndroid = Math.round(d.newUsersAndroid * ratio);

  // Enforce cats >= users after rounding.
  if (newUsers > selectedCats) {
    newUsers = selectedCats;
    const totalUsersSplit = d.newUsersIos + d.newUsersAndroid;
    if (totalUsersSplit > 0) {
      newUsersIos = Math.round((d.newUsersIos / totalUsersSplit) * newUsers);
      newUsersAndroid = newUsers - newUsersIos;
    } else {
      newUsersIos = 0;
      newUsersAndroid = 0;
    }
  } else {
    // Fix rounding drift between split and total.
    const diff = newUsers - (newUsersIos + newUsersAndroid);
    if (diff !== 0) {
      if (newUsersIos >= newUsersAndroid) newUsersIos += diff;
      else newUsersAndroid += diff;
    }
  }

  const out = {
    ...d,
    newUsers,
    newUsersIos: Math.max(0, newUsersIos),
    newUsersAndroid: Math.max(0, newUsersAndroid),
    newCats: selectedCats,
    newCatsStray: catType === 'Stray' ? selectedCats : 0,
    newCatsHome: catType === 'Home' ? selectedCats : 0,
    shots: Math.round(d.shots * ratio),
  };

  return normalizeUsersSplit(out);
}

export function filterData(
  data,
  {
    period,
    country,
    platform,
    catType = 'ALL',
    continent = 'ALL',
  },
) {
  let filtered = resolveSource(data, { continent, country });

  const periodDays = { D: 1, W: 7, M: 30, Y: 365, ALL: filtered.length };
  const days = periodDays[period] || 30;
  filtered = filtered.slice(-days);

  if (platform !== 'ALL') {
    filtered = filtered.map((d) => applyPlatform(d, platform));
  }
  if (catType !== 'ALL') {
    filtered = filtered.map((d) => applyCatType(d, catType));
  }

  return filtered;
}

export function getPreviousPeriodData(
  data,
  {
    period,
    country,
    platform,
    catType = 'ALL',
    continent = 'ALL',
  },
) {
  let source = resolveSource(data, { continent, country });
  const periodDays = { D: 1, W: 7, M: 30, Y: 365, ALL: source.length };
  const days = periodDays[period] || 30;

  const end = source.length - days;
  if (end <= 0) return null;
  const start = Math.max(0, end - days);
  let prev = source.slice(start, end);

  if (platform !== 'ALL') {
    prev = prev.map((d) => applyPlatform(d, platform));
  }
  if (catType !== 'ALL') {
    prev = prev.map((d) => applyCatType(d, catType));
  }

  return prev;
}

// --- Aggregate for charts ---
export function aggregateForChart(data, period) {
  if (period === 'D') {
    const day = data[data.length - 1] || data[0];
    if (!day) return [];
    return Array.from({ length: 24 }, (_, h) => ({
      label: `${h}:00`,
      ...spreadValues(day, 24, h),
    }));
  }
  if (period === 'W') {
    return data.slice(-7).map((d) => ({
      label: d.date.slice(5),
      ...d,
    }));
  }
  if (period === 'M') {
    return data.slice(-30).map((d) => ({
      label: d.date.slice(8),
      ...d,
    }));
  }
  if (period === 'Y') {
    return aggregateMonths(data).slice(-12);
  }
  return aggregateMonths(data);
}

function aggregateMonths(data) {
  const months = {};
  const counts = {};
  data.forEach((d) => {
    const m = d.date.slice(0, 7);
    if (!months[m]) {
      months[m] = { ...d, label: m.slice(2) };
      counts[m] = 1;
    } else {
      months[m].newUsers += d.newUsers;
      months[m].newUsersIos += d.newUsersIos;
      months[m].newUsersAndroid += d.newUsersAndroid;
      months[m].newCats += d.newCats;
      months[m].newCatsStray += d.newCatsStray;
      months[m].newCatsHome += d.newCatsHome;
      months[m].shots += d.shots;
      months[m].dauMau += d.dauMau;
      counts[m]++;
    }
  });
  Object.keys(months).forEach((m) => {
    months[m].dauMau /= counts[m];
  });
  return Object.values(months);
}

function spreadValues(day, n, hour) {
  // Hourly curve: peak at 12-20, low at 2-6
  const hourFactor = 0.3 + 0.7 * Math.exp(-0.03 * Math.pow(hour - 16, 2));
  const total = Array.from({ length: 24 }, (_, h) =>
    0.3 + 0.7 * Math.exp(-0.03 * Math.pow(h - 16, 2)),
  ).reduce((a, b) => a + b, 0);
  const share = hourFactor / total;

  return {
    newUsers: Math.round(day.newUsers * share),
    newUsersIos: Math.round(day.newUsersIos * share),
    newUsersAndroid: Math.round(day.newUsersAndroid * share),
    newCats: Math.round(day.newCats * share),
    newCatsStray: Math.round(day.newCatsStray * share),
    newCatsHome: Math.round(day.newCatsHome * share),
    shots: Math.round(day.shots * share),
    dauMau: day.dauMau,
  };
}
