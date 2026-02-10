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
const randFloat = (min, max) => rand() * (max - min) + min;

// --- Countries ---
export const COUNTRIES = [
  { code: 'USA', name: 'United States' },
  { code: 'BRA', name: 'Brazil' },
  { code: 'GBR', name: 'United Kingdom' },
  { code: 'DEU', name: 'Germany' },
  { code: 'FRA', name: 'France' },
  { code: 'IND', name: 'India' },
  { code: 'CHN', name: 'China' },
  { code: 'JPN', name: 'Japan' },
  { code: 'KOR', name: 'South Korea' },
  { code: 'AUS', name: 'Australia' },
  { code: 'CAN', name: 'Canada' },
  { code: 'MEX', name: 'Mexico' },
  { code: 'ARG', name: 'Argentina' },
  { code: 'CHL', name: 'Chile' },
  { code: 'RUS', name: 'Russia' },
  { code: 'TUR', name: 'Turkey' },
  { code: 'IDN', name: 'Indonesia' },
  { code: 'THA', name: 'Thailand' },
  { code: 'ESP', name: 'Spain' },
  { code: 'ITA', name: 'Italy' },
  { code: 'NGA', name: 'Nigeria' },
  { code: 'ZAF', name: 'South Africa' },
  { code: 'EGY', name: 'Egypt' },
  { code: 'COL', name: 'Colombia' },
  { code: 'PHL', name: 'Philippines' },
];

// --- Generate daily data for 365 days ---
const TOTAL_DAYS = 365;
const today = new Date(2026, 1, 10); // Feb 10, 2026

function generateDailyData() {
  const days = [];
  for (let i = TOTAL_DAYS - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().slice(0, 10);

    // Base growth curve
    const progress = (TOTAL_DAYS - i) / TOTAL_DAYS;
    const baseUsers = Math.floor(50 + progress * 200 + rand() * 40);
    const baseCats = Math.floor(30 + progress * 150 + rand() * 30);
    const baseShots = Math.floor(100 + progress * 500 + rand() * 80);

    // Platform split
    const iosRatio = 0.55 + rand() * 0.1;
    const usersIos = Math.round(baseUsers * iosRatio);
    const usersAndroid = baseUsers - usersIos;

    // Cat type split
    const strayRatio = 0.6 + rand() * 0.15;
    const catsStray = Math.round(baseCats * strayRatio);
    const catsHome = baseCats - catsStray;

    // DAU/MAU
    const dauMau = 0.15 + progress * 0.1 + rand() * 0.05;

    days.push({
      date: dateStr,
      newUsers: baseUsers,
      newUsersIos: usersIos,
      newUsersAndroid: usersAndroid,
      newCats: baseCats,
      newCatsStray: catsStray,
      newCatsHome: catsHome,
      shots: baseShots,
      dauMau: Math.min(dauMau, 0.35),
    });
  }
  return days;
}

export const dailyData = generateDailyData();

// --- Country-level aggregation ---
function generateCountryData() {
  const weights = {};
  let totalWeight = 0;
  COUNTRIES.forEach((c) => {
    const w = randFloat(1, 50);
    weights[c.code] = w;
    totalWeight += w;
  });

  const totalUsers = dailyData.reduce((s, d) => s + d.newUsers, 0);
  const totalCats = dailyData.reduce((s, d) => s + d.newCats, 0);
  const totalShots = dailyData.reduce((s, d) => s + d.shots, 0);

  return COUNTRIES.map((c) => {
    const ratio = weights[c.code] / totalWeight;
    return {
      code: c.code,
      name: c.name,
      users: Math.round(totalUsers * ratio),
      cats: Math.round(totalCats * ratio),
      shots: Math.round(totalShots * ratio),
    };
  });
}

export const countryData = generateCountryData();

// Per-country daily data for filtering
function generateCountryDailyData() {
  const result = {};
  const weights = {};
  let totalWeight = 0;
  COUNTRIES.forEach((c) => {
    const w = randFloat(1, 50);
    weights[c.code] = w;
    totalWeight += w;
  });

  COUNTRIES.forEach((c) => {
    const ratio = weights[c.code] / totalWeight;
    result[c.code] = dailyData.map((d) => ({
      ...d,
      newUsers: Math.round(d.newUsers * ratio * (0.8 + rand() * 0.4)),
      newUsersIos: Math.round(d.newUsersIos * ratio * (0.8 + rand() * 0.4)),
      newUsersAndroid: Math.round(d.newUsersAndroid * ratio * (0.8 + rand() * 0.4)),
      newCats: Math.round(d.newCats * ratio * (0.8 + rand() * 0.4)),
      newCatsStray: Math.round(d.newCatsStray * ratio * (0.8 + rand() * 0.4)),
      newCatsHome: Math.round(d.newCatsHome * ratio * (0.8 + rand() * 0.4)),
      shots: Math.round(d.shots * ratio * (0.8 + rand() * 0.4)),
      dauMau: d.dauMau * (0.9 + rand() * 0.2),
    }));
  });
  return result;
}

export const countryDailyData = generateCountryDailyData();

// --- Age/Sex distribution ---
export const AGE_GROUPS = ['13-19', '20-29', '30-39', '40-49', '50+'];

function generateAgeSexData() {
  return AGE_GROUPS.map((group) => {
    const maleBase = randInt(500, 5000);
    const femaleBase = randInt(500, 5000);
    return {
      ageGroup: group,
      male: maleBase,
      female: femaleBase,
    };
  });
}

export const ageSexData = generateAgeSexData();

// Per-country age/sex data
function generateCountryAgeSexData() {
  const result = {};
  COUNTRIES.forEach((c) => {
    result[c.code] = AGE_GROUPS.map((group) => ({
      ageGroup: group,
      male: randInt(50, 1000),
      female: randInt(50, 1000),
    }));
  });
  return result;
}

export const countryAgeSexData = generateCountryAgeSexData();

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
export function filterData(data, { period, country, platform }) {
  let filtered = country === 'ALL' ? data : (countryDailyData[country] || []);

  // Period filter: get last N days
  const periodDays = { D: 1, W: 7, M: 30, Y: 365, ALL: filtered.length };
  const days = periodDays[period] || 30;
  filtered = filtered.slice(-days);

  // Platform filter: adjust user counts
  if (platform === 'iOS') {
    filtered = filtered.map((d) => ({
      ...d,
      newUsers: d.newUsersIos,
    }));
  } else if (platform === 'Android') {
    filtered = filtered.map((d) => ({
      ...d,
      newUsers: d.newUsersAndroid,
    }));
  }

  return filtered;
}

export function getPreviousPeriodData(data, { period, country, platform }) {
  let source = country === 'ALL' ? data : (countryDailyData[country] || []);
  const periodDays = { D: 1, W: 7, M: 30, Y: 365, ALL: source.length };
  const days = periodDays[period] || 30;

  // Get the period before the current one
  const end = source.length - days;
  if (end <= 0) return null;
  const start = Math.max(0, end - days);
  let prev = source.slice(start, end);

  if (platform === 'iOS') {
    prev = prev.map((d) => ({ ...d, newUsers: d.newUsersIos }));
  } else if (platform === 'Android') {
    prev = prev.map((d) => ({ ...d, newUsers: d.newUsersAndroid }));
  }

  return prev;
}

// --- Aggregate for charts ---
export function aggregateForChart(data, period) {
  if (period === 'D') {
    // 24 hourly bars (fake: divide day's data into 24)
    const day = data[data.length - 1] || data[0];
    if (!day) return [];
    return Array.from({ length: 24 }, (_, h) => ({
      label: `${h}:00`,
      ...spreadValues(day, 24),
    }));
  }
  if (period === 'W') {
    // 7 daily bars
    return data.slice(-7).map((d) => ({
      label: d.date.slice(5), // MM-DD
      ...d,
    }));
  }
  if (period === 'M') {
    // 30 daily bars
    return data.slice(-30).map((d) => ({
      label: d.date.slice(8), // DD
      ...d,
    }));
  }
  if (period === 'Y') {
    // 12 monthly bars
    const months = {};
    data.forEach((d) => {
      const m = d.date.slice(0, 7); // YYYY-MM
      if (!months[m]) months[m] = { ...d, label: m.slice(2) }; // YY-MM
      else {
        months[m].newUsers += d.newUsers;
        months[m].newUsersIos += d.newUsersIos;
        months[m].newUsersAndroid += d.newUsersAndroid;
        months[m].newCats += d.newCats;
        months[m].newCatsStray += d.newCatsStray;
        months[m].newCatsHome += d.newCatsHome;
        months[m].shots += d.shots;
        months[m].dauMau = (months[m].dauMau + d.dauMau) / 2;
      }
    });
    return Object.values(months).slice(-12);
  }
  // ALL
  const months = {};
  data.forEach((d) => {
    const m = d.date.slice(0, 7);
    if (!months[m]) months[m] = { ...d, label: m.slice(2) };
    else {
      months[m].newUsers += d.newUsers;
      months[m].newUsersIos += d.newUsersIos;
      months[m].newUsersAndroid += d.newUsersAndroid;
      months[m].newCats += d.newCats;
      months[m].newCatsStray += d.newCatsStray;
      months[m].newCatsHome += d.newCatsHome;
      months[m].shots += d.shots;
      months[m].dauMau = (months[m].dauMau + d.dauMau) / 2;
    }
  });
  return Object.values(months);
}

function spreadValues(day, n) {
  return {
    newUsers: Math.round(day.newUsers / n),
    newUsersIos: Math.round(day.newUsersIos / n),
    newUsersAndroid: Math.round(day.newUsersAndroid / n),
    newCats: Math.round(day.newCats / n),
    newCatsStray: Math.round(day.newCatsStray / n),
    newCatsHome: Math.round(day.newCatsHome / n),
    shots: Math.round(day.shots / n),
    dauMau: day.dauMau,
  };
}
