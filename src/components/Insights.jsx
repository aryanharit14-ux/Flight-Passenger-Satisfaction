import { STATS, COLORS } from '../data/stats';
import { fmtPct, fmt } from '../utils';

export function InsightsTab() {
  const insights = [
    {
      icon: '🏢',
      bg: 'hsl(212,92%,58%,0.12)',
      title: 'Business Class Drives Satisfaction',
      stat: '67.5%',
      desc: 'Business class passengers show a 67.5% satisfaction rate — 3.4× higher than Economy (18.7%). Premium experience directly correlates with passenger happiness.',
    },
    {
      icon: '✈️',
      bg: 'hsl(168,76%,48%,0.12)',
      title: 'Business Travel vs Personal',
      stat: '58.3%',
      desc: 'Business purpose travelers are 58.3% satisfied, while personal travelers are just 10.2% satisfied. Corporate flyers expect and receive a better experience.',
    },
    {
      icon: '🔄',
      bg: 'hsl(167,72%,48%,0.12)',
      title: 'Loyalty Matters — But Barely',
      stat: '47.8%',
      desc: 'Returning customers have a 47.8% satisfaction rate vs. 23.8% for first-timers — yet even loyal customers are more often dissatisfied than satisfied.',
    },
    {
      icon: '📶',
      bg: 'hsl(354,86%,60%,0.12)',
      title: 'In-flight Wifi is Worst Rated',
      stat: '2.73 / 5',
      desc: 'Wi-fi scored the lowest at 2.73/5 and Online Booking at 2.76/5 — digital services lag far behind physical comfort metrics.',
    },
    {
      icon: '🛄',
      bg: 'hsl(168,76%,48%,0.12)',
      title: 'Baggage & Service Lead Ratings',
      stat: '3.64 / 5',
      desc: 'In-flight Service (3.64) and Baggage Handling (3.63) are the highest-rated service dimensions — operational execution outperforms digital services.',
    },
    {
      icon: '⏰',
      bg: 'hsl(36,96%,58%,0.12)',
      title: 'Median Delay is Zero',
      stat: '0 min',
      desc: 'Despite average delays of ~15 min, the median is 0 — meaning most flights are on time. Extreme outliers (max 1,592 min) skew the average significantly.',
    },
    {
      icon: '🎂',
      bg: 'hsl(212,92%,58%,0.12)',
      title: 'Middle-aged Passengers Most Satisfied',
      stat: '46–60',
      desc: 'Passengers aged 46–60 have the highest satisfaction rate at ~52%. Young adults (19–30) and seniors (61+) are less satisfied — likely due to class differences.',
    },
    {
      icon: '⚠️',
      bg: 'hsl(354,86%,60%,0.12)',
      title: 'Overall Dissatisfaction Majority',
      stat: '56.5%',
      desc: 'More than half of all passengers — 74,757 out of 136,374 — are neutral or dissatisfied. The airline has significant room for systemic improvement.',
    },
    {
      icon: '📊',
      bg: 'hsl(168,76%,48%,0.12)',
      title: 'Short-haul Dominates',
      stat: '30.1%',
      desc: '41,074 passengers (30.1%) flew 0–500 km — short-haul routes are the most common segment, suggesting a hub-and-spoke heavy operation.',
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="page-header">
        <h1>Key Insights</h1>
        <p>Data-driven findings and actionable takeaways from the 136K+ passenger survey.</p>
      </div>

      {/* Summary Banner */}
      <div style={{
        background: 'linear-gradient(135deg, hsl(212,92%,15%), hsl(168,76%,12%))',
        border: '1px solid hsl(212,92%,25%)',
        borderRadius: '16px',
        padding: '24px 32px',
        display: 'flex',
        gap: '48px',
        flexWrap: 'wrap',
        alignItems: 'center',
      }}>
        <div>
          <div style={{ fontSize: '0.78rem', color: 'hsl(212,92%,70%)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>Dataset Summary</div>
          <div style={{ fontFamily: "'Sora', sans-serif", fontSize: '2.2rem', fontWeight: 700, color: 'white', letterSpacing: '-0.04em', marginTop: '4px' }}>
            136,374
          </div>
          <div style={{ fontSize: '0.85rem', color: 'hsl(212,40%,70%)' }}>Total Passenger Records</div>
        </div>
        {[
          { label: 'Satisfaction Rate', value: '43.5%', color: COLORS.satisfied },
          { label: 'Business Class Sat.', value: '67.5%', color: COLORS.primary },
          { label: 'Avg Service Rating', value: '3.22 / 5', color: COLORS.warn },
          { label: 'On-Time Rate', value: '52.3%', color: COLORS.accent },
        ].map((s, i) => (
          <div key={i}>
            <div style={{ fontSize: '0.78rem', color: 'hsl(212,40%,60%)', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 500 }}>{s.label}</div>
            <div style={{ fontFamily: "'Sora', sans-serif", fontSize: '1.6rem', fontWeight: 700, color: s.color, letterSpacing: '-0.03em', marginTop: '2px' }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* Insight Cards */}
      <div className="insight-grid">
        {insights.map((ins, i) => (
          <div className="insight-card" key={i}>
            <div className="insight-icon" style={{ background: ins.bg }}>{ins.icon}</div>
            <div className="insight-stat">{ins.stat}</div>
            <div className="insight-title">{ins.title}</div>
            <div className="insight-desc">{ins.desc}</div>
          </div>
        ))}
      </div>

      {/* Recommendations */}
      <div className="chart-card">
        <div className="chart-header">
          <div>
            <div className="chart-title">Recommended Actions</div>
            <div className="chart-desc">Priority improvements based on data analysis</div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginTop: '8px' }}>
          {[
            { priority: 'Critical', color: COLORS.dissatisfied, bg: 'hsl(354,86%,60%,0.1)', title: 'Upgrade In-flight Wifi', desc: 'Lowest rated service at 2.73/5. Modern travelers expect reliable connectivity — invest in satellite internet upgrades.' },
            { priority: 'Critical', color: COLORS.dissatisfied, bg: 'hsl(354,86%,60%,0.1)', title: 'Fix Economy Class Experience', desc: 'Economy passengers are 81.3% dissatisfied. Address seat comfort, food quality, and boarding process.' },
            { priority: 'High', color: COLORS.warn, bg: 'hsl(36,96%,58%,0.1)', title: 'Improve Online Booking', desc: 'Online Booking rated 2.76/5. A smoother digital journey increases pre-flight satisfaction.' },
            { priority: 'High', color: COLORS.warn, bg: 'hsl(36,96%,58%,0.1)', title: 'Target Personal Travelers', desc: 'Personal travel passengers are 89.8% dissatisfied. Offer leisure-focused packages and amenities.' },
            { priority: 'Medium', color: COLORS.primary, bg: 'hsl(212,92%,58%,0.1)', title: 'Onboard First-time Passengers', desc: 'First-time flyers show 23.8% satisfaction. Better onboarding, clear communication, and service orientation can build loyalty.' },
            { priority: 'Medium', color: COLORS.primary, bg: 'hsl(212,92%,58%,0.1)', title: 'Leverage Strengths in Marketing', desc: 'In-flight Service (3.64) and Baggage Handling (3.63) are clear strengths — feature them prominently in brand communications.' },
          ].map((r, i) => (
            <div key={i} style={{ background: r.bg, borderRadius: '10px', padding: '16px', border: `1px solid ${r.bg.replace('0.1', '0.3')}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: '99px', background: r.bg.replace('0.1', '0.2'), color: r.color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {r.priority}
                </span>
                <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'hsl(215,25%,92%)' }}>{r.title}</span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'hsl(215,15%,65%)', lineHeight: 1.7 }}>{r.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
