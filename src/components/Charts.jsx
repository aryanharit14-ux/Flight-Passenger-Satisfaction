import { STATS, COLORS } from '../data/stats';
import { useAnimatedValue, fmt, fmtPct } from '../utils';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

// ── Custom Tooltip ──
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="custom-tooltip">
      <div className="custom-tooltip-label">{label}</div>
      {payload.map((p, i) => (
        <div className="custom-tooltip-row" key={i}>
          <span style={{ color: p.color }}>{p.name}</span>
          <span>{typeof p.value === 'number' ? p.value.toLocaleString() : p.value}</span>
        </div>
      ))}
    </div>
  );
};

// ── Animated KPI Card ──
function KpiCard({ label, value, sub, icon, variant, badge, badgeDir }) {
  const animated = useAnimatedValue(value);
  return (
    <div className={`kpi-card ${variant}`}>
      <div className="kpi-top">
        <span className="kpi-label">{label}</span>
        <div className={`kpi-icon ${variant}`}>{icon}</div>
      </div>
      <div className="kpi-value">{typeof value === 'number' ? fmt(animated) : value}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span className="kpi-sub">{sub}</span>
        {badge && (
          <span className={`kpi-badge ${badgeDir}`}>
            {badgeDir === 'up' ? '↑' : '↓'} {badge}
          </span>
        )}
      </div>
    </div>
  );
}

// ── Satisfaction Donut ──
function SatisfactionDonut() {
  const data = [
    { name: 'Satisfied', value: STATS.satisfied },
    { name: 'Dissatisfied', value: STATS.dissatisfied },
  ];
  return (
    <div className="chart-card">
      <div className="chart-header">
        <div>
          <div className="chart-title">Overall Satisfaction</div>
          <div className="chart-desc">Satisfied vs. Neutral/Dissatisfied passengers</div>
        </div>
        <span className="chart-badge">{fmtPct(STATS.satisfactionRate)} Satisfied</span>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={65}
            outerRadius={95}
            paddingAngle={3}
            dataKey="value"
            startAngle={90}
            endAngle={-270}
          >
            <Cell fill={COLORS.satisfied} />
            <Cell fill={COLORS.dissatisfied} />
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      <div className="legend" style={{ justifyContent: 'center' }}>
        <div className="legend-item">
          <div className="legend-dot" style={{ background: COLORS.satisfied }} />
          Satisfied — {fmt(STATS.satisfied)}
        </div>
        <div className="legend-item">
          <div className="legend-dot" style={{ background: COLORS.dissatisfied }} />
          Dissatisfied — {fmt(STATS.dissatisfied)}
        </div>
      </div>
    </div>
  );
}

// ── Class Distribution Pie ──
function ClassPie() {
  const data = STATS.classDist.filter(d => d.name !== 'Unknown');
  return (
    <div className="chart-card">
      <div className="chart-header">
        <div>
          <div className="chart-title">Travel Class Distribution</div>
          <div className="chart-desc">Breakdown by seating class</div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" outerRadius={90} dataKey="value" paddingAngle={2}>
            {data.map((_, i) => <Cell key={i} fill={COLORS.chart[i]} />)}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      <div className="legend" style={{ justifyContent: 'center', flexWrap: 'wrap' }}>
        {data.map((d, i) => (
          <div className="legend-item" key={i}>
            <div className="legend-dot" style={{ background: COLORS.chart[i] }} />
            {d.name} — {fmt(d.value)}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Age Distribution Bar ──
function AgeBar() {
  return (
    <div className="chart-card">
      <div className="chart-header">
        <div>
          <div className="chart-title">Age Group Distribution</div>
          <div className="chart-desc">Number of passengers by age bracket</div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={STATS.ageGroups} barSize={36}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,14%,20%)" vertical={false} />
          <XAxis dataKey="group" tick={{ fill: 'hsl(215,15%,60%)', fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: 'hsl(215,15%,60%)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => fmt(v)} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(220,14%,20%)' }} />
          <Bar dataKey="count" name="Passengers" radius={[4, 4, 0, 0]}>
            {STATS.ageGroups.map((_, i) => (
              <Cell key={i} fill={COLORS.chart[i % COLORS.chart.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Gender Split ──
function GenderSplit() {
  const data = STATS.gender.filter(g => g.name !== 'Unknown');
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <div className="chart-card">
      <div className="chart-header">
        <div>
          <div className="chart-title">Gender Split</div>
          <div className="chart-desc">Female vs. Male passengers</div>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '12px' }}>
        {data.map((d, i) => (
          <div key={i}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '0.83rem', color: 'hsl(215,15%,65%)' }}>{d.name}</span>
              <span style={{ fontSize: '0.83rem', fontWeight: 600, color: 'hsl(215,25%,92%)' }}>
                {((d.value / total) * 100).toFixed(1)}%
              </span>
            </div>
            <div className="rating-bar-wrap" style={{ height: '10px' }}>
              <div
                className="rating-bar-fill"
                style={{
                  width: `${(d.value / total) * 100}%`,
                  background: i === 0 ? COLORS.primary : COLORS.accent
                }}
              />
            </div>
            <div style={{ fontSize: '0.74rem', color: 'hsl(215,12%,42%)', marginTop: '4px' }}>
              {fmt(d.value)} passengers
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Class Satisfaction Stacked ──
function ClassSatisfactionChart() {
  const data = STATS.classSatisfaction.map(d => {
    const total = d.satisfied + d.dissatisfied;
    return {
      cls: d.cls,
      Satisfied: d.satisfied,
      Dissatisfied: d.dissatisfied,
      satRate: ((d.satisfied / total) * 100).toFixed(1),
    };
  });

  return (
    <div className="chart-card">
      <div className="chart-header">
        <div>
          <div className="chart-title">Satisfaction by Travel Class</div>
          <div className="chart-desc">Business class passengers are most satisfied</div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} barSize={44}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,14%,20%)" vertical={false} />
          <XAxis dataKey="cls" tick={{ fill: 'hsl(215,15%,60%)', fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: 'hsl(215,15%,60%)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => fmt(v)} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(220,14%,20%)' }} />
          <Bar dataKey="Satisfied" stackId="a" fill={COLORS.satisfied} radius={[0, 0, 0, 0]} />
          <Bar dataKey="Dissatisfied" stackId="a" fill={COLORS.dissatisfied} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
      <div className="legend">
        {data.map((d, i) => (
          <div key={i} className="legend-item">
            <div className="legend-dot" style={{ background: COLORS.chart[i] }} />
            {d.cls}: {d.satRate}% satisfied
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Travel Type Satisfaction ──
function TravelTypeSatisfaction() {
  const data = STATS.travelSatisfaction.map(d => {
    const total = d.satisfied + d.dissatisfied;
    return {
      ...d,
      satPct: +((d.satisfied / total) * 100).toFixed(1),
      disPct: +((d.dissatisfied / total) * 100).toFixed(1),
    };
  });
  return (
    <div className="chart-card">
      <div className="chart-header">
        <div>
          <div className="chart-title">Satisfaction by Travel Purpose</div>
          <div className="chart-desc">Business travelers are significantly more satisfied</div>
        </div>
      </div>
      <div className="stacked-list" style={{ marginTop: '8px' }}>
        {data.map((d, i) => (
          <div className="stacked-row" key={i}>
            <div className="stacked-label">
              <span>{d.type}</span>
              <span style={{ color: 'hsl(215,12%,42%)' }}>
                {d.satPct}% satisfied of {fmt(d.satisfied + d.dissatisfied)}
              </span>
            </div>
            <div className="stacked-bar">
              <div
                className="stacked-fill"
                style={{ width: `${d.satPct}%`, background: COLORS.satisfied, color: '#0f2d2a' }}
              >
                {d.satPct}%
              </div>
              <div
                className="stacked-fill"
                style={{ width: `${d.disPct}%`, background: COLORS.dissatisfied, color: '#2d0f0f' }}
              >
                {d.disPct}%
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="legend">
        <div className="legend-item"><div className="legend-dot" style={{ background: COLORS.satisfied }} />Satisfied</div>
        <div className="legend-item"><div className="legend-dot" style={{ background: COLORS.dissatisfied }} />Dissatisfied</div>
      </div>
    </div>
  );
}

// ── Customer Type Satisfaction ──
function CustomerTypeSatisfaction() {
  const data = STATS.customerSatisfaction.map(d => {
    const total = d.satisfied + d.dissatisfied;
    return {
      ...d,
      satPct: +((d.satisfied / total) * 100).toFixed(1),
      disPct: +((d.dissatisfied / total) * 100).toFixed(1),
    };
  });
  return (
    <div className="chart-card">
      <div className="chart-header">
        <div>
          <div className="chart-title">Satisfaction by Customer Type</div>
          <div className="chart-desc">Returning customers vs first-time flyers</div>
        </div>
      </div>
      <div className="stacked-list" style={{ marginTop: '8px' }}>
        {data.map((d, i) => (
          <div className="stacked-row" key={i}>
            <div className="stacked-label">
              <span>{d.type}</span>
              <span style={{ color: 'hsl(215,12%,42%)' }}>
                {d.satPct}% satisfied of {fmt(d.satisfied + d.dissatisfied)}
              </span>
            </div>
            <div className="stacked-bar">
              <div
                className="stacked-fill"
                style={{ width: `${d.satPct}%`, background: COLORS.satisfied, color: '#0f2d2a' }}
              >
                {d.satPct > 10 ? `${d.satPct}%` : ''}
              </div>
              <div
                className="stacked-fill"
                style={{ width: `${d.disPct}%`, background: COLORS.dissatisfied, color: '#2d0f0f' }}
              >
                {d.disPct > 10 ? `${d.disPct}%` : ''}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="legend">
        <div className="legend-item"><div className="legend-dot" style={{ background: COLORS.satisfied }} />Satisfied</div>
        <div className="legend-item"><div className="legend-dot" style={{ background: COLORS.dissatisfied }} />Dissatisfied</div>
      </div>
    </div>
  );
}

// ── Service Ratings Horizontal Bars ──
function ServiceRatings() {
  const max = 5;
  const getColor = (avg) => {
    if (avg >= 3.5) return COLORS.satisfied;
    if (avg >= 3.0) return COLORS.warn;
    return COLORS.dissatisfied;
  };
  return (
    <div className="chart-card full">
      <div className="chart-header">
        <div>
          <div className="chart-title">Average Service Ratings</div>
          <div className="chart-desc">All 14 service dimensions rated by passengers (1–5 scale)</div>
        </div>
        <span className="chart-badge">Avg {(STATS.serviceRatings.reduce((s,r)=>s+r.avg,0)/STATS.serviceRatings.length).toFixed(2)} / 5</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 32px', marginTop: '4px' }}>
        {STATS.serviceRatings.map((r, i) => (
          <div className="rating-row" key={i}>
            <span className="rating-name">{r.name}</span>
            <div className="rating-bar-wrap" style={{ minWidth: '60px' }}>
              <div
                className="rating-bar-fill"
                style={{
                  width: `${(r.avg / max) * 100}%`,
                  background: getColor(r.avg)
                }}
              />
            </div>
            <span className="rating-value">{r.avg.toFixed(2)}</span>
          </div>
        ))}
      </div>
      <div className="legend" style={{ marginTop: '8px' }}>
        <div className="legend-item"><div className="legend-dot" style={{ background: COLORS.satisfied }} />≥ 3.5 (Good)</div>
        <div className="legend-item"><div className="legend-dot" style={{ background: COLORS.warn }} />3.0 – 3.5 (Fair)</div>
        <div className="legend-item"><div className="legend-dot" style={{ background: COLORS.dissatisfied }} />&lt; 3.0 (Needs Improvement)</div>
      </div>
    </div>
  );
}

// ── Service Ratings Radar ──
function ServiceRadar() {
  const data = STATS.serviceRatings.slice(0, 8).map(r => ({
    subject: r.short,
    rating: r.avg,
  }));
  return (
    <div className="chart-card">
      <div className="chart-header">
        <div>
          <div className="chart-title">Top Services Radar</div>
          <div className="chart-desc">Top 8 service dimensions overview</div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <RadarChart data={data} cx="50%" cy="50%" outerRadius={90}>
          <PolarGrid stroke="hsl(220,14%,20%)" />
          <PolarAngleAxis dataKey="subject" tick={{ fill: 'hsl(215,15%,60%)', fontSize: 10 }} />
          <PolarRadiusAxis domain={[0, 5]} tick={false} axisLine={false} />
          <Radar name="Rating" dataKey="rating" stroke={COLORS.primary} fill={COLORS.primary} fillOpacity={0.2} strokeWidth={2} />
          <Tooltip content={<CustomTooltip />} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Distance Distribution ──
function DistanceChart() {
  return (
    <div className="chart-card">
      <div className="chart-header">
        <div>
          <div className="chart-title">Flight Distance Distribution</div>
          <div className="chart-desc">Passenger count by flight distance range</div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={STATS.distanceDist} barSize={42}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,14%,20%)" vertical={false} />
          <XAxis dataKey="range" tick={{ fill: 'hsl(215,15%,60%)', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: 'hsl(215,15%,60%)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => fmt(v)} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(220,14%,20%)' }} />
          <Bar dataKey="count" name="Passengers" radius={[4, 4, 0, 0]} fill={COLORS.primary} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Delay Distribution ──
function DelayChart() {
  return (
    <div className="chart-card">
      <div className="chart-header">
        <div>
          <div className="chart-title">Delay Distribution</div>
          <div className="chart-desc">Departure & Arrival delays by bucket</div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={STATS.delayBuckets} barSize={20}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,14%,20%)" vertical={false} />
          <XAxis dataKey="range" tick={{ fill: 'hsl(215,15%,60%)', fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: 'hsl(215,15%,60%)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => fmt(v)} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(220,14%,20%)' }} />
          <Bar dataKey="dep" name="Departure Delay" fill={COLORS.warn} radius={[4, 4, 0, 0]} />
          <Bar dataKey="arr" name="Arrival Delay" fill={COLORS.accent} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
      <div className="legend">
        <div className="legend-item"><div className="legend-dot" style={{ background: COLORS.warn }} />Departure Delay</div>
        <div className="legend-item"><div className="legend-dot" style={{ background: COLORS.accent }} />Arrival Delay</div>
      </div>
    </div>
  );
}

// ── Age Satisfaction Chart ──
function AgeSatisfactionChart() {
  return (
    <div className="chart-card">
      <div className="chart-header">
        <div>
          <div className="chart-title">Satisfaction Rate by Age Group</div>
          <div className="chart-desc">% satisfied passengers in each age bracket</div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={STATS.ageSatisfaction} barSize={36}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,14%,20%)" vertical={false} />
          <XAxis dataKey="group" tick={{ fill: 'hsl(215,15%,60%)', fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis domain={[0, 70]} tick={{ fill: 'hsl(215,15%,60%)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(220,14%,20%)' }} />
          <Bar dataKey="satisfiedRate" name="Satisfaction Rate (%)" radius={[4, 4, 0, 0]}>
            {STATS.ageSatisfaction.map((d, i) => (
              <Cell key={i} fill={d.satisfiedRate >= 45 ? COLORS.satisfied : d.satisfiedRate >= 35 ? COLORS.warn : COLORS.dissatisfied} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Overview Tab ──
export function OverviewTab() {
  return (
    <>
      <div className="kpi-grid">
        <KpiCard label="Total Passengers" value={136374} sub="Records in dataset" icon="✈️" variant="primary" badge="136K+" badgeDir="up" />
        <KpiCard label="Satisfied" value={57506} sub="43.5% overall satisfaction" icon="😊" variant="success" badge="43.5%" badgeDir="up" />
        <KpiCard label="Dissatisfied" value={74757} sub="Neutral or dissatisfied" icon="😞" variant="danger" badge="56.5%" badgeDir="down" />
        <KpiCard label="Avg Delay" value={15} sub="Minutes avg departure delay" icon="⏱️" variant="warning" />
      </div>

      <div className="chart-grid cols-3">
        <SatisfactionDonut />
        <ClassPie />
        <GenderSplit />
      </div>

      <div className="chart-grid cols-2">
        <TravelTypeSatisfaction />
        <CustomerTypeSatisfaction />
      </div>

      <div className="chart-grid cols-2">
        <ClassSatisfactionChart />
        <AgeBar />
      </div>
    </>
  );
}

// ── Services Tab ──
export function ServicesTab() {
  return (
    <>
      <div className="chart-grid">
        <ServiceRatings />
      </div>
      <div className="chart-grid cols-2">
        <ServiceRadar />
        <div className="chart-card">
          <div className="chart-header">
            <div>
              <div className="chart-title">Service Ratings Bar Chart</div>
              <div className="chart-desc">All 14 service areas compared visually</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={STATS.serviceRatings} layout="vertical" barSize={10} margin={{ left: 100 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,14%,20%)" horizontal={false} />
              <XAxis type="number" domain={[0, 5]} tick={{ fill: 'hsl(215,15%,60%)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis dataKey="short" type="category" tick={{ fill: 'hsl(215,15%,60%)', fontSize: 11 }} axisLine={false} tickLine={false} width={100} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="avg" name="Avg Rating" radius={[0, 4, 4, 0]}>
                {STATS.serviceRatings.map((r, i) => (
                  <Cell key={i} fill={r.avg >= 3.5 ? COLORS.satisfied : r.avg >= 3.0 ? COLORS.warn : COLORS.dissatisfied} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  );
}

// ── Operations Tab ──
export function OperationsTab() {
  return (
    <>
      <div className="kpi-grid">
        <KpiCard label="Avg Departure Delay" value={15} sub="14.69 min average" icon="🛫" variant="warning" />
        <KpiCard label="Max Departure Delay" value={1592} sub="minutes (outlier)" icon="⚠️" variant="danger" />
        <KpiCard label="Avg Arrival Delay" value={15} sub="15.08 min average" icon="🛬" variant="warning" />
        <KpiCard label="On-Time Departures" value={71324} sub="Zero departure delay" icon="✅" variant="success" />
      </div>
      <div className="chart-grid cols-2">
        <DelayChart />
        <DistanceChart />
      </div>
      <div className="chart-grid cols-2">
        <AgeSatisfactionChart />
        <div className="chart-card">
          <div className="chart-header">
            <div>
              <div className="chart-title">Travel Type Breakdown</div>
              <div className="chart-desc">Business vs Personal travel distribution</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={STATS.travelType.filter(d => d.name !== 'Unknown')}
                cx="50%" cy="50%"
                outerRadius={90}
                dataKey="value"
                paddingAngle={3}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={{ stroke: 'hsl(215,15%,50%)' }}
              >
                {STATS.travelType.filter(d => d.name !== 'Unknown').map((_, i) => (
                  <Cell key={i} fill={COLORS.chart[i]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  );
}
