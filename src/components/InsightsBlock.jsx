import { useMemo } from 'react';
import { formatNumber } from '../utils/formatNumber';

function safe(v) {
  return Number.isFinite(v) ? v : 0;
}

function avg(arr) {
  if (arr.length === 0) return 0;
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}

function pct(a, b) {
  return b > 0 ? ((a - b) / b) * 100 : 0;
}

function fmtDate(d) {
  if (!d) return '';
  // "Aug 12" style
  const dt = new Date(d + 'T00:00:00Z');
  return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
}

function detectInsights(data) {
  if (!data || data.length < 3) return [];

  const insights = [];
  const n = data.length;

  const users = data.map((d) => safe(d.newUsers));
  const cats = data.map((d) => safe(d.newCats));
  const shots = data.map((d) => safe(d.shots));
  const dauMau = data.map((d) => safe(d.dauMau));

  // --- 1. Overall trend (first quarter vs last quarter) ---
  const q = Math.max(1, Math.floor(n / 4));
  const firstUsers = avg(users.slice(0, q));
  const lastUsers = avg(users.slice(-q));
  const usersTrend = pct(lastUsers, firstUsers);

  if (Math.abs(usersTrend) > 15) {
    const dir = usersTrend > 0 ? 'up' : 'down';
    const icon = usersTrend > 0 ? 'trending_up' : 'trending_down';
    insights.push({
      type: dir === 'up' ? 'positive' : 'negative',
      text: `New users trending ${dir} ${Math.abs(usersTrend).toFixed(0)}% — from ~${formatNumber(Math.round(firstUsers))}/day to ~${formatNumber(Math.round(lastUsers))}/day`,
    });
  }

  // --- 2. Biggest spike (7-day rolling window) ---
  if (n >= 14) {
    let bestSpike = { pct: 0, from: 0, to: 0 };
    const windowSize = Math.min(7, Math.floor(n / 3));

    for (let i = windowSize; i <= n - windowSize; i++) {
      const before = avg(users.slice(i - windowSize, i));
      const after = avg(users.slice(i, i + windowSize));
      const change = pct(after, before);
      if (change > bestSpike.pct) {
        bestSpike = { pct: change, from: i - windowSize, to: i + windowSize - 1 };
      }
    }

    if (bestSpike.pct > 25) {
      const fromDate = fmtDate(data[bestSpike.from]?.date);
      const toDate = fmtDate(data[bestSpike.to]?.date);
      insights.push({
        type: 'positive',
        text: `Explosive growth ${fromDate} — ${toDate}: users surged +${bestSpike.pct.toFixed(0)}%`,
      });
    }
  }

  // --- 3. Biggest dip ---
  if (n >= 14) {
    let worstDip = { pct: 0, from: 0, to: 0 };
    const windowSize = Math.min(7, Math.floor(n / 3));

    for (let i = windowSize; i <= n - windowSize; i++) {
      const before = avg(users.slice(i - windowSize, i));
      const after = avg(users.slice(i, i + windowSize));
      const change = pct(after, before);
      if (change < worstDip.pct) {
        worstDip = { pct: change, from: i - windowSize, to: i + windowSize - 1 };
      }
    }

    if (worstDip.pct < -20) {
      const fromDate = fmtDate(data[worstDip.from]?.date);
      const toDate = fmtDate(data[worstDip.to]?.date);
      insights.push({
        type: 'negative',
        text: `Notable dip ${fromDate} — ${toDate}: users dropped ${worstDip.pct.toFixed(0)}%`,
      });
    }
  }

  // --- 4. Record day ---
  const maxUsersIdx = users.indexOf(Math.max(...users));
  const maxCatsIdx = cats.indexOf(Math.max(...cats));
  const maxShotsIdx = shots.indexOf(Math.max(...shots));

  if (users[maxUsersIdx] > 0) {
    insights.push({
      type: 'info',
      text: `Peak day: ${fmtDate(data[maxUsersIdx]?.date)} with ${formatNumber(users[maxUsersIdx])} users, ${formatNumber(cats[maxCatsIdx])} cats, ${formatNumber(shots[maxShotsIdx])} shots`,
    });
  }

  // --- 5. DAU/MAU trend ---
  if (n >= 7) {
    const firstDau = avg(dauMau.slice(0, q));
    const lastDau = avg(dauMau.slice(-q));
    const dauChange = pct(lastDau, firstDau);

    if (Math.abs(dauChange) > 10 && firstDau > 0.01) {
      const dir = dauChange > 0 ? 'improved' : 'declined';
      insights.push({
        type: dauChange > 0 ? 'positive' : 'warning',
        text: `Engagement ${dir}: DAU/MAU moved from ${firstDau.toFixed(2)} to ${lastDau.toFixed(2)} (${dauChange > 0 ? '+' : ''}${dauChange.toFixed(0)}%)`,
      });
    }
  }

  // --- 6. Cats/User ratio ---
  const totalUsers = users.reduce((s, v) => s + v, 0);
  const totalCats = cats.reduce((s, v) => s + v, 0);
  if (totalUsers > 0) {
    const ratio = totalCats / totalUsers;
    if (ratio < 0.9) {
      insights.push({
        type: 'warning',
        text: `Low discovery rate: ${ratio.toFixed(2)} cats per user — many users find zero cats`,
      });
    } else if (ratio > 2.0) {
      insights.push({
        type: 'positive',
        text: `High discovery: ${ratio.toFixed(1)} cats per user on average`,
      });
    }
  }

  // --- 7. Stray share ---
  const totalStray = data.reduce((s, d) => s + safe(d.newCatsStray), 0);
  if (totalCats > 0) {
    const strayPct = (totalStray / totalCats) * 100;
    if (strayPct > 75) {
      insights.push({
        type: 'info',
        text: `${strayPct.toFixed(0)}% of discovered cats are strays — high street population`,
      });
    } else if (strayPct < 30) {
      insights.push({
        type: 'info',
        text: `Only ${strayPct.toFixed(0)}% strays — users mostly photograph home cats`,
      });
    }
  }

  // --- 8. Shots growth ---
  const firstShots = avg(shots.slice(0, q));
  const lastShots = avg(shots.slice(-q));
  const shotsTrend = pct(lastShots, firstShots);

  if (shotsTrend > 30 && n >= 14) {
    insights.push({
      type: 'positive',
      text: `Photo volume surging: +${shotsTrend.toFixed(0)}% growth (existing users keep shooting)`,
    });
  }

  return insights.slice(0, 6);
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
      <h3 className="text-sm font-semibold text-gray-700 mb-3">
        NB — Key Insights
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
        {insights.map((insight, i) => {
          const style = TYPE_STYLES[insight.type] || TYPE_STYLES.info;
          return (
            <div
              key={i}
              className={`flex items-start gap-2 px-3 py-2 rounded-lg border text-sm ${style.bg} ${style.border}`}
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
