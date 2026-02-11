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

// ============================================================
// SLOT 1 — PEAK / RECORD (always the most impressive stat)
// ============================================================

function findPeakCandidates() {
  const candidates = [];

  for (const c of COUNTRIES) {
    const series = countryDailyData[c.code];
    if (!series || series.length < 14) continue;

    const last30 = series.slice(-30);
    const firstDate = last30[0]?.date;
    const lastDate = last30[last30.length - 1]?.date;
    const users = last30.map((d) => safe(d.newUsers));
    const cats = last30.map((d) => safe(d.newCats));
    const shots = last30.map((d) => safe(d.shots));
    const monthAvg = avg(users);
    if (monthAvg < 3) continue;

    // a) Record single-day user count vs monthly avg
    const maxUsers = Math.max(...users);
    const maxIdx = users.indexOf(maxUsers);
    const ratio = maxUsers / monthAvg;
    if (ratio >= 1.8 && maxUsers >= 10) {
      candidates.push({
        priority: ratio * Math.log2(monthAvg + 1) * 10,
        text: `${c.name}: ${formatNumber(maxUsers)} users on ${fmtDate(last30[maxIdx]?.date)} — ${ratio.toFixed(1)}x the 30-day avg`,
      });
    }

    // b) Total monthly volume leader
    const totalUsers = sum(users);
    candidates.push({
      priority: Math.log2(totalUsers + 1) * 8,
      text: `${c.name}: ${formatNumber(totalUsers)} new users in ${fmtDate(firstDate)} – ${fmtDate(lastDate)} — #1 market`,
      _totalUsers: totalUsers,
      _isVolumeLeader: true,
    });

    // c) Engagement leader (photos per cat)
    const totalCats = sum(cats);
    const totalShots = sum(shots);
    if (totalCats >= 50) {
      const spc = totalShots / totalCats;
      candidates.push({
        priority: spc * Math.log2(totalCats + 1) * 2,
        text: `${c.name}: ${spc.toFixed(1)} photos per cat in ${fmtDate(firstDate)} – ${fmtDate(lastDate)} — highest engagement`,
        _shotsPerCat: spc,
        _isEngagement: true,
      });
    }
  }

  // Keep only the actual #1 for volume and engagement
  const volumeLeaders = candidates.filter((c) => c._isVolumeLeader);
  const engLeaders = candidates.filter((c) => c._isEngagement);
  const others = candidates.filter((c) => !c._isVolumeLeader && !c._isEngagement);

  volumeLeaders.sort((a, b) => b._totalUsers - a._totalUsers);
  engLeaders.sort((a, b) => b._shotsPerCat - a._shotsPerCat);

  const final = [...others];
  if (volumeLeaders.length > 0) final.push(volumeLeaders[0]);
  if (engLeaders.length > 0) final.push(engLeaders[0]);

  final.sort((a, b) => b.priority - a.priority);
  return final;
}

// ============================================================
// SLOT 2 — GROWTH (best upward signal)
// ============================================================

function findGrowthCandidates() {
  const candidates = [];

  for (const c of COUNTRIES) {
    const series = countryDailyData[c.code];
    if (!series || series.length < 14) continue;

    const last30 = series.slice(-30);
    const users = last30.map((d) => safe(d.newUsers));
    const monthAvg = avg(users);
    if (monthAvg < 3) continue;

    // a) Week-over-week growth
    const last14 = series.slice(-14);
    const thisWeek = last14.slice(-7);
    const lastWeek = last14.slice(0, 7);
    const twTotal = sum(thisWeek.map((d) => safe(d.newUsers)));
    const lwTotal = sum(lastWeek.map((d) => safe(d.newUsers)));
    if (lwTotal >= 15) {
      const change = ((twTotal - lwTotal) / lwTotal) * 100;
      if (change > 15) {
        candidates.push({
          priority: change * Math.log2(lwTotal + 1) * 0.6,
          text: `${c.name}: +${change.toFixed(0)}% users this week vs last (${formatNumber(lwTotal)} → ${formatNumber(twTotal)})`,
        });
      }
    }

    // b) Growth streak (smoothed 3-day MA)
    const smooth = [];
    for (let i = 0; i < users.length; i++) {
      const from = Math.max(0, i - 1);
      const to = Math.min(users.length, i + 2);
      smooth.push(avg(users.slice(from, to)));
    }
    let bestLen = 0, bestEnd = 0, curLen = 0;
    for (let i = 1; i < smooth.length; i++) {
      if (smooth[i] > smooth[i - 1] * 1.01) {
        curLen++;
        if (curLen > bestLen) { bestLen = curLen; bestEnd = i; }
      } else {
        curLen = 0;
      }
    }
    if (bestLen >= 4) {
      const startIdx = bestEnd - bestLen;
      candidates.push({
        priority: bestLen * Math.log2(monthAvg + 1) * 6,
        text: `${c.name}: ${bestLen + 1}-day growth streak ${fmtDate(last30[startIdx]?.date)} – ${fmtDate(last30[bestEnd]?.date)}`,
      });
    }

    // c) Rolling-window spike (5-day window before vs after)
    const n = last30.length;
    const w = Math.min(5, Math.floor(n / 4));
    let bestSpike = null;
    for (let i = w; i <= n - w; i++) {
      const before = avg(users.slice(Math.max(0, i - w), i));
      const after = avg(users.slice(i, i + w));
      if (before < 3) continue;
      const change = ((after - before) / before) * 100;
      if (change > 40 && (!bestSpike || change > bestSpike.change)) {
        bestSpike = {
          change,
          fromDate: last30[i]?.date,
          toDate: last30[Math.min(i + w - 1, n - 1)]?.date,
          before: Math.round(before),
          after: Math.round(after),
        };
      }
    }
    if (bestSpike) {
      const mult = (bestSpike.after / bestSpike.before).toFixed(1);
      candidates.push({
        priority: bestSpike.change * Math.log2(monthAvg + 1) * 0.5,
        text: `${c.name}: ${mult}x user surge ${fmtDate(bestSpike.fromDate)} – ${fmtDate(bestSpike.toDate)} vs prior period`,
      });
    }
  }

  candidates.sort((a, b) => b.priority - a.priority);
  return candidates;
}

// ============================================================
// SLOT 3 — DECLINE (worst downward signal)
// ============================================================

function findDeclineCandidates() {
  const candidates = [];

  for (const c of COUNTRIES) {
    const series = countryDailyData[c.code];
    if (!series || series.length < 14) continue;

    const last30 = series.slice(-30);
    const users = last30.map((d) => safe(d.newUsers));
    const monthAvg = avg(users);
    if (monthAvg < 3) continue;

    // a) Week-over-week decline
    const last14 = series.slice(-14);
    const thisWeek = last14.slice(-7);
    const lastWeek = last14.slice(0, 7);
    const twTotal = sum(thisWeek.map((d) => safe(d.newUsers)));
    const lwTotal = sum(lastWeek.map((d) => safe(d.newUsers)));
    if (lwTotal >= 15) {
      const change = ((twTotal - lwTotal) / lwTotal) * 100;
      if (change < -15) {
        candidates.push({
          priority: Math.abs(change) * Math.log2(lwTotal + 1) * 0.6,
          text: `${c.name}: ${change.toFixed(0)}% users this week vs last (${formatNumber(lwTotal)} → ${formatNumber(twTotal)})`,
        });
      }
    }

    // b) Decline streak (smoothed 3-day MA)
    const smooth = [];
    for (let i = 0; i < users.length; i++) {
      const from = Math.max(0, i - 1);
      const to = Math.min(users.length, i + 2);
      smooth.push(avg(users.slice(from, to)));
    }
    let bestLen = 0, bestEnd = 0, curLen = 0;
    for (let i = 1; i < smooth.length; i++) {
      if (smooth[i] < smooth[i - 1] * 0.99) {
        curLen++;
        if (curLen > bestLen) { bestLen = curLen; bestEnd = i; }
      } else {
        curLen = 0;
      }
    }
    if (bestLen >= 4) {
      const startIdx = bestEnd - bestLen;
      candidates.push({
        priority: bestLen * Math.log2(monthAvg + 1) * 5,
        text: `${c.name}: ${bestLen + 1}-day decline ${fmtDate(last30[startIdx]?.date)} – ${fmtDate(last30[bestEnd]?.date)}`,
      });
    }

    // c) Rolling-window dip (5-day window before vs after)
    const n = last30.length;
    const w = Math.min(5, Math.floor(n / 4));
    let worstDip = null;
    for (let i = w; i <= n - w; i++) {
      const before = avg(users.slice(Math.max(0, i - w), i));
      const after = avg(users.slice(i, i + w));
      if (before < 3) continue;
      const change = ((after - before) / before) * 100;
      if (change < -25 && (!worstDip || change < worstDip.change)) {
        worstDip = {
          change,
          fromDate: last30[i]?.date,
          toDate: last30[Math.min(i + w - 1, n - 1)]?.date,
          before: Math.round(before),
          after: Math.round(after),
        };
      }
    }
    if (worstDip) {
      candidates.push({
        priority: Math.abs(worstDip.change) * Math.log2(monthAvg + 1) * 0.5,
        text: `${c.name}: ${worstDip.change.toFixed(0)}% users ${fmtDate(worstDip.fromDate)} – ${fmtDate(worstDip.toDate)} (${formatNumber(worstDip.before)} → ${formatNumber(worstDip.after)} avg/day)`,
      });
    }
  }

  candidates.sort((a, b) => b.priority - a.priority);
  return candidates;
}

// ============================================================

function detectInsights(data) {
  if (!data || data.length < 2) return [];

  const peaks = findPeakCandidates();
  const growth = findGrowthCandidates();
  const decline = findDeclineCandidates();

  const insights = [];

  if (peaks.length > 0) {
    insights.push({ ...peaks[0], type: 'peak' });
  }
  if (growth.length > 0) {
    insights.push({ ...growth[0], type: 'positive' });
  }
  if (decline.length > 0) {
    insights.push({ ...decline[0], type: 'negative' });
  }

  return insights;
}

const TYPE_STYLES = {
  peak: { bg: 'bg-amber-50', border: 'border-amber-200', icon: '★', iconColor: 'text-amber-500' },
  positive: { bg: 'bg-emerald-50', border: 'border-emerald-200', icon: '▲', iconColor: 'text-emerald-600' },
  negative: { bg: 'bg-red-50', border: 'border-red-200', icon: '▼', iconColor: 'text-red-500' },
};

export default function InsightsBlock({ data }) {
  const insights = useMemo(() => detectInsights(data), [data]);

  if (insights.length === 0) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 mb-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">AI Insights — last 30 days</h3>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
        {insights.map((insight, i) => {
          const style = TYPE_STYLES[insight.type] || TYPE_STYLES.peak;
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
