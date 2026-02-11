import { useMemo } from 'react';
import { formatNumber } from '../utils/formatNumber';
import { COUNTRIES, countryDailyData } from '../data/fakeData';

function safe(v) {
  return Number.isFinite(v) ? v : 0;
}

function avg(arr) {
  if (arr.length === 0) return 0;
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}

function sum(arr) {
  return arr.reduce((s, v) => s + v, 0);
}

function fmtDate(d) {
  if (!d) return '';
  const dt = new Date(d + 'T00:00:00Z');
  return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
}

// --- Detector 1: Single-day record vs 30-day average per country ---
function detectRecordDays() {
  const results = [];

  for (const c of COUNTRIES) {
    const series = countryDailyData[c.code];
    if (!series || series.length < 14) continue;

    const last30 = series.slice(-30);
    const users = last30.map((d) => safe(d.newUsers));
    const monthAvg = avg(users);
    if (monthAvg < 5) continue;

    const maxVal = Math.max(...users);
    const maxIdx = users.indexOf(maxVal);
    const ratio = maxVal / monthAvg;

    if (ratio >= 2.0) {
      results.push({
        type: 'positive',
        priority: ratio * Math.log2(monthAvg + 1) * 10,
        country: c.code,
        text: `${c.name}: ${formatNumber(maxVal)} users on ${fmtDate(last30[maxIdx]?.date)} — ${ratio.toFixed(1)}x the monthly avg`,
      });
    }
  }

  results.sort((a, b) => b.priority - a.priority);
  return results;
}

// --- Detector 2: Week-over-week change per country ---
function detectWeekOverWeek() {
  const results = [];

  for (const c of COUNTRIES) {
    const series = countryDailyData[c.code];
    if (!series || series.length < 14) continue;

    const last14 = series.slice(-14);
    const thisWeek = last14.slice(-7);
    const lastWeek = last14.slice(0, 7);

    const thisTotal = sum(thisWeek.map((d) => safe(d.newUsers)));
    const lastTotal = sum(lastWeek.map((d) => safe(d.newUsers)));

    if (lastTotal < 20) continue;
    const change = ((thisTotal - lastTotal) / lastTotal) * 100;

    if (Math.abs(change) > 30) {
      results.push({
        type: change > 0 ? 'positive' : 'negative',
        priority: Math.abs(change) * Math.log2(lastTotal + 1) * 0.5,
        country: c.code,
        text: `${c.name}: ${change > 0 ? '+' : ''}${change.toFixed(0)}% users week-over-week (${formatNumber(lastTotal)} → ${formatNumber(thisTotal)})`,
      });
    }
  }

  results.sort((a, b) => b.priority - a.priority);
  return results;
}

// --- Detector 3: Growth/decline streak per country ---
function detectStreaks() {
  const results = [];

  for (const c of COUNTRIES) {
    const series = countryDailyData[c.code];
    if (!series || series.length < 14) continue;

    const last30 = series.slice(-30);
    const users = last30.map((d) => safe(d.newUsers));
    if (avg(users) < 3) continue;

    // Smooth with 3-day moving average to reduce noise
    const smooth = [];
    for (let i = 0; i < users.length; i++) {
      const from = Math.max(0, i - 1);
      const to = Math.min(users.length, i + 2);
      smooth.push(avg(users.slice(from, to)));
    }

    // Find longest growth streak
    let bestLen = 0, bestEnd = 0;
    let curLen = 0;
    for (let i = 1; i < smooth.length; i++) {
      if (smooth[i] > smooth[i - 1] * 1.01) {
        curLen++;
        if (curLen > bestLen) { bestLen = curLen; bestEnd = i; }
      } else {
        curLen = 0;
      }
    }

    if (bestLen >= 5) {
      const startIdx = bestEnd - bestLen;
      const startVal = Math.round(users[startIdx]);
      const endVal = Math.round(users[bestEnd]);
      results.push({
        type: 'positive',
        priority: bestLen * Math.log2(avg(users) + 1) * 5,
        country: c.code,
        text: `${c.name}: ${bestLen + 1}-day growth streak ${fmtDate(last30[startIdx]?.date)} – ${fmtDate(last30[bestEnd]?.date)}`,
      });
    }

    // Find longest decline streak
    bestLen = 0; bestEnd = 0; curLen = 0;
    for (let i = 1; i < smooth.length; i++) {
      if (smooth[i] < smooth[i - 1] * 0.99) {
        curLen++;
        if (curLen > bestLen) { bestLen = curLen; bestEnd = i; }
      } else {
        curLen = 0;
      }
    }

    if (bestLen >= 5) {
      const startIdx = bestEnd - bestLen;
      results.push({
        type: 'negative',
        priority: bestLen * Math.log2(avg(users) + 1) * 4,
        country: c.code,
        text: `${c.name}: ${bestLen + 1}-day decline streak ${fmtDate(last30[startIdx]?.date)} – ${fmtDate(last30[bestEnd]?.date)}`,
      });
    }
  }

  results.sort((a, b) => b.priority - a.priority);
  return results;
}

// --- Detector 4: Best engagement (photos per cat) across countries ---
function detectEngagement() {
  const results = [];

  for (const c of COUNTRIES) {
    const series = countryDailyData[c.code];
    if (!series || series.length < 7) continue;

    const last30 = series.slice(-30);
    const totalCats = sum(last30.map((d) => safe(d.newCats)));
    const totalShots = sum(last30.map((d) => safe(d.shots)));
    if (totalCats < 50) continue;

    const shotsPerCat = totalShots / totalCats;
    results.push({
      country: c.code,
      name: c.name,
      shotsPerCat,
      totalCats,
    });
  }

  results.sort((a, b) => b.shotsPerCat - a.shotsPerCat);

  const out = [];
  if (results.length >= 3) {
    const top = results[0];
    out.push({
      type: 'info',
      priority: 35,
      country: top.country,
      text: `${top.name} leads in engagement: ${top.shotsPerCat.toFixed(1)} photos per cat (${formatNumber(top.totalCats)} cats total)`,
    });
  }

  return out;
}

// --- Detector 5: Stray dominance by country ---
function detectStrayLeader() {
  const results = [];

  for (const c of COUNTRIES) {
    const series = countryDailyData[c.code];
    if (!series || series.length < 7) continue;

    const last30 = series.slice(-30);
    const totalCats = sum(last30.map((d) => safe(d.newCats)));
    const totalStray = sum(last30.map((d) => safe(d.newCatsStray)));
    if (totalCats < 30) continue;

    const strayPct = (totalStray / totalCats) * 100;
    results.push({ country: c.code, name: c.name, strayPct, totalCats });
  }

  results.sort((a, b) => b.strayPct - a.strayPct);

  const out = [];
  if (results.length >= 3 && results[0].strayPct > 75) {
    const r = results[0];
    out.push({
      type: 'info',
      priority: 25,
      country: r.country,
      text: `${r.name}: ${r.strayPct.toFixed(0)}% of cats are strays — highest across all markets`,
    });
  }

  return out;
}

// --- Detector 6: Platform shift (iOS/Android) ---
function detectPlatformShift() {
  const results = [];

  for (const c of COUNTRIES) {
    const series = countryDailyData[c.code];
    if (!series || series.length < 14) continue;

    const last14 = series.slice(-14);
    const prev14 = series.slice(-28, -14);
    if (prev14.length < 7) continue;

    const totalNow = sum(last14.map((d) => safe(d.newUsers)));
    const iosNow = sum(last14.map((d) => safe(d.newUsersIos)));
    const totalPrev = sum(prev14.map((d) => safe(d.newUsers)));
    const iosPrev = sum(prev14.map((d) => safe(d.newUsersIos)));

    if (totalNow < 30 || totalPrev < 30) continue;

    const iosShareNow = (iosNow / totalNow) * 100;
    const iosSharePrev = (iosPrev / totalPrev) * 100;
    const shift = iosShareNow - iosSharePrev;

    if (Math.abs(shift) > 10) {
      const platform = shift > 0 ? 'iOS' : 'Android';
      const shareVal = shift > 0 ? iosShareNow : (100 - iosShareNow);
      results.push({
        type: 'info',
        priority: Math.abs(shift) * Math.log2(totalNow + 1) * 0.3,
        country: c.code,
        text: `${c.name}: ${platform} share grew to ${shareVal.toFixed(0)}% (${shift > 0 ? '+' : ''}${shift.toFixed(0)}pp vs prior 2 weeks)`,
      });
    }
  }

  results.sort((a, b) => b.priority - a.priority);
  return results;
}

// --- Detector 7: DAU/MAU global movement ---
function detectDauMau(data) {
  if (!data || data.length < 7) return [];

  const dauMau = data.map((d) => safe(d.dauMau));
  const n = dauMau.length;
  const q = Math.max(1, Math.floor(n / 4));
  const early = avg(dauMau.slice(0, q));
  const latest = dauMau[n - 1];

  if (early < 0.01) return [];
  const change = ((latest - early) / early) * 100;
  if (Math.abs(change) <= 8) return [];

  const dir = change > 0 ? 'up' : 'down';
  return [{
    type: change > 0 ? 'positive' : 'warning',
    priority: Math.abs(change) * 0.8,
    country: '__global__',
    text: `DAU/MAU ${dir} globally: ${early.toFixed(2)} → ${latest.toFixed(2)} (${change > 0 ? '+' : ''}${change.toFixed(0)}%)`,
  }];
}

function detectInsights(data) {
  if (!data || data.length < 2) return [];

  // Gather candidates from all detectors
  const allCandidates = [
    ...detectRecordDays(),
    ...detectWeekOverWeek(),
    ...detectStreaks(),
    ...detectEngagement(),
    ...detectStrayLeader(),
    ...detectPlatformShift(),
    ...detectDauMau(data),
  ];

  // Pick top 3: diverse countries, diverse types
  allCandidates.sort((a, b) => b.priority - a.priority);
  const picked = [];
  const usedCountries = new Set();
  const usedTypes = new Set();

  for (const c of allCandidates) {
    if (picked.length >= 3) break;
    // No more than 1 insight per country (except global)
    if (c.country !== '__global__' && usedCountries.has(c.country)) continue;
    // No more than 2 of same type
    if (picked.filter((p) => p.type === c.type).length >= 2) continue;
    picked.push(c);
    if (c.country !== '__global__') usedCountries.add(c.country);
    usedTypes.add(c.type);
  }

  return picked;
}

const TYPE_STYLES = {
  positive: { bg: 'bg-emerald-50', border: 'border-emerald-200', icon: '▲', iconColor: 'text-emerald-600' },
  negative: { bg: 'bg-red-50', border: 'border-red-200', icon: '▼', iconColor: 'text-red-500' },
  warning: { bg: 'bg-amber-50', border: 'border-amber-200', icon: '●', iconColor: 'text-amber-500' },
  info: { bg: 'bg-blue-50', border: 'border-blue-200', icon: '◆', iconColor: 'text-blue-500' },
};

export default function InsightsBlock({ data }) {
  const insights = useMemo(() => detectInsights(data), [data]);

  if (insights.length === 0) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 mb-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">AI Insights — last 30 days</h3>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
        {insights.map((insight, i) => {
          const style = TYPE_STYLES[insight.type] || TYPE_STYLES.info;
          return (
            <div
              key={i}
              className={`flex items-start gap-2 px-3 py-2.5 rounded-lg border text-sm leading-snug ${style.bg} ${style.border}`}
            >
              <span className={`${style.iconColor} text-xs mt-0.5 flex-shrink-0`}>{style.icon}</span>
              <span className="text-gray-700">{insight.text}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
