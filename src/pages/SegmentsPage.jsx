import { useState, useEffect, useRef } from 'react';
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, BarChart, Bar,
} from 'recharts';
import { getAnalytics, predictCluster, getClusterHistory } from '../services/api';
import { COLORS } from '../data/stats';

// ── Constants ──────────────────────────────────────────────────────────────
const CLUSTER_COLORS = ['#3b82f6', '#2dd4bf', '#a78bfa', '#fb923c'];
const CLUSTER_NAMES  = ['Premium Loyalists', 'Budget Travelers', 'Business Regulars', 'Leisure Seekers'];

const CustomTooltipScatter = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  return (
    <div className="custom-tooltip">
      <div className="custom-tooltip-label">Cluster {d.cluster}</div>
      <div className="custom-tooltip-row"><span>PC1</span><span>{d.x?.toFixed(3)}</span></div>
      <div className="custom-tooltip-row"><span>PC2</span><span>{d.y?.toFixed(3)}</span></div>
    </div>
  );
};

const CustomTooltipBar = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="custom-tooltip">
      <div className="custom-tooltip-label">{label}</div>
      {payload.map((p, i) => (
        <div className="custom-tooltip-row" key={i}>
          <span style={{ color: p.fill }}>{p.name}</span>
          <span>{p.value?.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
};

function Spinner() {
  return <div className="spinner" role="status" aria-label="Loading" />;
}

function ApiError({ message }) {
  return (
    <div className="api-error" role="alert">
      <span className="api-error-icon">⚠</span>
      <div>
        <div className="api-error-title">Backend Error</div>
        <div className="api-error-msg">{message}</div>
      </div>
    </div>
  );
}

// ── PCA Scatter Plot ──────────────────────────────────────────────────────────
function PcaScatterPlot({ data, variance, highlightPoint }) {
  // Group by cluster for ScatterChart
  const byCluster = [0, 1, 2, 3].map(cid => ({
    id: cid,
    name: `Cluster ${cid}`,
    points: data.filter(d => d.cluster === cid),
  }));

  return (
    <div className="chart-card">
      <div className="chart-header">
        <div>
          <div className="chart-title">PCA Scatter Plot — Passenger Segments</div>
          <div className="chart-desc">
            1,000 sample passengers projected to 2D via PCA.{' '}
            Variance explained: PC1={((variance?.[0] || 0) * 100).toFixed(1)}%, PC2={((variance?.[1] || 0) * 100).toFixed(1)}%
          </div>
        </div>
        <span className="chart-badge">{data.length} points</span>
      </div>

      <ResponsiveContainer width="100%" height={360}>
        <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,14%,20%)" />
          <XAxis
            dataKey="x" type="number" name="PC1"
            tick={{ fill: 'hsl(215,15%,60%)', fontSize: 11 }}
            axisLine={false} tickLine={false}
            label={{ value: 'PC1', position: 'insideBottom', offset: -8, fill: 'hsl(215,12%,42%)', fontSize: 11 }}
          />
          <YAxis
            dataKey="y" type="number" name="PC2"
            tick={{ fill: 'hsl(215,15%,60%)', fontSize: 11 }}
            axisLine={false} tickLine={false}
            label={{ value: 'PC2', angle: -90, position: 'insideLeft', offset: 10, fill: 'hsl(215,12%,42%)', fontSize: 11 }}
          />
          <Tooltip content={<CustomTooltipScatter />} cursor={{ strokeDasharray: '3 3' }} />
          {byCluster.map(c => (
            <Scatter key={c.id} name={c.name} data={c.points} fill={CLUSTER_COLORS[c.id]} fillOpacity={0.6} r={3} />
          ))}
          {/* Highlight predicted point */}
          {highlightPoint && (
            <Scatter
              name="Your Passenger"
              data={[highlightPoint]}
              fill="#ffffff"
              stroke={CLUSTER_COLORS[highlightPoint.cluster]}
              strokeWidth={2}
              r={8}
            />
          )}
        </ScatterChart>
      </ResponsiveContainer>

      <div className="legend" style={{ justifyContent: 'center' }}>
        {CLUSTER_NAMES.map((name, i) => (
          <div key={i} className="legend-item">
            <div className="legend-dot" style={{ background: CLUSTER_COLORS[i] }} />
            Cluster {i}: {name}
          </div>
        ))}
        {highlightPoint && (
          <div className="legend-item">
            <div className="legend-dot" style={{ background: '#fff', border: `2px solid ${CLUSTER_COLORS[highlightPoint.cluster]}` }} />
            Your Passenger
          </div>
        )}
      </div>
    </div>
  );
}

// ── Cluster Distribution Chart ────────────────────────────────────────────────
function ClusterDistChart({ sizes }) {
  const data = Object.entries(sizes).map(([k, v]) => ({
    name: `Cluster ${k}`,
    size: v,
    label: CLUSTER_NAMES[parseInt(k)] || `Cluster ${k}`,
  }));

  return (
    <div className="chart-card">
      <div className="chart-header">
        <div>
          <div className="chart-title">Cluster Distribution</div>
          <div className="chart-desc">Number of passengers per segment</div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} barSize={52}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,14%,20%)" vertical={false} />
          <XAxis dataKey="name" tick={{ fill: 'hsl(215,15%,60%)', fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: 'hsl(215,15%,60%)', fontSize: 11 }} axisLine={false} tickLine={false}
            tickFormatter={v => `${(v / 1000).toFixed(0)}K`} />
          <Tooltip content={<CustomTooltipBar />} cursor={{ fill: 'hsl(220,14%,20%)' }} />
          <Bar dataKey="size" name="Passengers" radius={[4, 4, 0, 0]}>
            {data.map((_, i) => <Cell key={i} fill={CLUSTER_COLORS[i]} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="legend" style={{ justifyContent: 'center' }}>
        {data.map((d, i) => (
          <div key={i} className="legend-item">
            <div className="legend-dot" style={{ background: CLUSTER_COLORS[i] }} />
            {d.label} — {d.size.toLocaleString()}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Cluster Characteristics Table ────────────────────────────────────────────
function ClusterCharsTable({ chars }) {
  const keys = [
    'Age', 'Flight Distance', 'Seat Comfort', 'In-flight Wifi Service',
    'On-board Service', 'Cleanliness', 'Departure Delay',
    'Type of Travel', 'Class',
  ];

  return (
    <div className="chart-card full">
      <div className="chart-header">
        <div>
          <div className="chart-title">Cluster Characteristics</div>
          <div className="chart-desc">Median feature values per passenger segment (numerical) and most frequent category</div>
        </div>
      </div>
      <div className="table-wrap" style={{ marginTop: '8px' }}>
        <table>
          <thead>
            <tr>
              <th>Feature</th>
              {[0, 1, 2, 3].map(c => (
                <th key={c} style={{ color: CLUSTER_COLORS[c] }}>
                  Cluster {c} — {CLUSTER_NAMES[c]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {keys.map(k => (
              <tr key={k}>
                <td style={{ color: 'hsl(215,25%,85%)', fontWeight: 500 }}>{k}</td>
                {[0, 1, 2, 3].map(c => {
                  const val = chars?.[c]?.[k] ?? chars?.[String(c)]?.[k] ?? '—';
                  return (
                    <td key={c} style={{ color: 'hsl(215,15%,65%)' }}>
                      {typeof val === 'number' ? val.toFixed(1) : val}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Predict Cluster Form ───────────────────────────────────────────────────────
const CAT_OPTS = {
  Gender: ['Female', 'Male'],
  'Customer Type': ['First-time', 'Returning'],
  'Type of Travel': ['Business', 'Personal'],
  Class: ['Business', 'Economy', 'Economy Plus'],
};

function SegmentPredictForm({ onResult }) {
  const [form, setForm] = useState({
    Gender: 'Male',
    'Customer Type': 'Returning',
    'Type of Travel': 'Business',
    Class: 'Business',
    Age: 40,
    'Flight Distance': 1200,
    'Departure Delay': 0,
    'Arrival Delay': 0,
    'Departure and Arrival Time Convenience': 3,
    'Ease of Online Booking': 3,
    'Check-in Service': 3,
    'Online Boarding': 3,
    'Gate Location': 3,
    'On-board Service': 3,
    'Seat Comfort': 3,
    'Leg Room Service': 3,
    'Cleanliness': 3,
    'Food and Drink': 3,
    'In-flight Service': 4,
    'In-flight Wifi Service': 2,
    'In-flight Entertainment': 3,
    'Baggage Handling': 4,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await predictCluster(form);
      onResult(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chart-card">
      <div className="chart-header">
        <div>
          <div className="chart-title">Predict Passenger Segment</div>
          <div className="chart-desc">Enter passenger details to find their cluster on the scatter plot</div>
        </div>
      </div>
      <form onSubmit={handleSubmit} id="segment-form">
        <div className="form-grid-2" style={{ marginBottom: '16px' }}>
          {Object.entries(CAT_OPTS).map(([k, opts]) => (
            <div className="form-field" key={k}>
              <label className="form-label">{k}</label>
              <select className="form-select" value={form[k]} onChange={e => update(k, e.target.value)}>
                {opts.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          ))}
          {[
            { k: 'Age', min: 7, max: 85 },
            { k: 'Flight Distance', min: 31, max: 4983 },
            { k: 'Seat Comfort', min: 1, max: 5 },
            { k: 'In-flight Wifi Service', min: 0, max: 5 },
          ].map(({ k, min, max }) => (
            <div className="form-field" key={k}>
              <label className="form-label">{k}
                <span className="form-range-hint">{min}–{max}</span>
              </label>
              <input type="number" className="form-input" min={min} max={max} value={form[k]}
                onChange={e => update(k, parseFloat(e.target.value) || 0)} />
            </div>
          ))}
        </div>
        {error && <ApiError message={error} />}
        <button type="submit" className="btn-primary" disabled={loading} id="btn-segment-predict">
          {loading ? <><Spinner /> Finding…</> : '🔍 Find My Segment'}
        </button>
      </form>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function SegmentsPage() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [highlightPoint, setHighlightPoint] = useState(null);
  const [history, setHistory] = useState([]);

  const loadHistory = async () => {
    try {
      const hist = await getClusterHistory(5);
      setHistory(hist);
    } catch (e) {
      console.error("Failed to load cluster history", e);
    }
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getAnalytics()
      .then(data => { if (!cancelled) setAnalytics(data); })
      .catch(err  => { if (!cancelled) setError(err.message); })
      .finally(()  => { if (!cancelled) setLoading(false); });
    
    loadHistory();
    return () => { cancelled = true; };
  }, []);

  const handleClusterResult = result => {
    setHighlightPoint({ x: result.pca_x, y: result.pca_y, cluster: result.cluster_id });
    loadHistory(); // refresh history
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="page-header">
        <h1>Passenger Segmentation</h1>
        <p>
          K-Means clustering on {(analytics?.cluster_sizes
            ? Object.values(analytics.cluster_sizes).reduce((a, b) => a + b, 0).toLocaleString()
            : '~128K')} passengers into 4 segments. PCA reduces features to 2D for visualization.
        </p>
      </div>

      {/* KPI Row */}
      {analytics && (
        <div className="kpi-grid">
          <div className="kpi-card primary">
            <div className="kpi-top"><span className="kpi-label">Silhouette Score</span><div className="kpi-icon primary">📐</div></div>
            <div className="kpi-value">{analytics.silhouette_score?.toFixed(3)}</div>
            <div className="kpi-sub">Clustering quality (–1 to +1, higher = better)</div>
          </div>
          <div className="kpi-card success">
            <div className="kpi-top"><span className="kpi-label">Clusters</span><div className="kpi-icon success">🔵</div></div>
            <div className="kpi-value">{analytics.n_clusters}</div>
            <div className="kpi-sub">K-Means passenger segments</div>
          </div>
          <div className="kpi-card warning">
            <div className="kpi-top"><span className="kpi-label">PCA Variance PC1</span><div className="kpi-icon warning">📊</div></div>
            <div className="kpi-value">{analytics.pca_variance?.[0] ? (analytics.pca_variance[0] * 100).toFixed(1) + '%' : '—'}</div>
            <div className="kpi-sub">Explained by first principal component</div>
          </div>
          <div className="kpi-card danger">
            <div className="kpi-top"><span className="kpi-label">PCA Variance PC2</span><div className="kpi-icon danger">📉</div></div>
            <div className="kpi-value">{analytics.pca_variance?.[1] ? (analytics.pca_variance[1] * 100).toFixed(1) + '%' : '—'}</div>
            <div className="kpi-sub">Explained by second principal component</div>
          </div>
        </div>
      )}

      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '40px 0' }}>
          <Spinner /> <span style={{ color: 'hsl(215,15%,65%)' }}>Loading cluster analytics from backend…</span>
        </div>
      )}

      {error && <ApiError message={error} />}

      {analytics && (
        <>
          <div className="chart-grid cols-2">
            <ClusterDistChart sizes={analytics.cluster_sizes} />
            <SegmentPredictForm onResult={handleClusterResult} />
          </div>

          {highlightPoint && (
            <div className="result-card" style={{ 
              borderColor: `${CLUSTER_COLORS[highlightPoint.cluster]}55`,
              marginTop: '16px' 
            }}>
              <div className="result-badge" style={{ background: `${CLUSTER_COLORS[highlightPoint.cluster]}22` }}>
                <span style={{ 
                  color: CLUSTER_COLORS[highlightPoint.cluster], 
                  fontFamily: 'var(--font-display)', 
                  fontSize: '1.4rem', 
                  fontWeight: 700 
                }}>
                  #{highlightPoint.cluster}
                </span>
                <span className="result-label" style={{ color: CLUSTER_COLORS[highlightPoint.cluster] }}>
                  Cluster {highlightPoint.cluster} — {CLUSTER_NAMES[highlightPoint.cluster]}
                </span>
              </div>
              <div className="result-body" style={{ display: 'flex', gap: '24px', padding: '16px' }}>
                <div style={{ flex: 1 }}>
                  <span className="result-key">PCA 1 (X)</span>
                  <div className="result-val">{highlightPoint.x.toFixed(4)}</div>
                </div>
                <div style={{ flex: 1 }}>
                  <span className="result-key">PCA 2 (Y)</span>
                  <div className="result-val">{highlightPoint.y.toFixed(4)}</div>
                </div>
              </div>
            </div>
          )}

          <PcaScatterPlot
            data={analytics.scatter_sample || []}
            variance={analytics.pca_variance}
            highlightPoint={highlightPoint}
          />

          <ClusterCharsTable chars={analytics.cluster_chars} />
          
          {/* ── History Section ── */}
          {history.length > 0 && (
            <div className="chart-card full" style={{ marginTop: '16px' }}>
              <div className="chart-header">
                <div>
                  <div className="chart-title">Recent Segmentation Requests</div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '16px 20px' }}>
                {history.map(item => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid hsl(220,14%,20%)' }}>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: '0.85rem', color: 'hsl(215,15%,65%)', display: 'block' }}>
                        {new Date(item.timestamp).toLocaleString()}
                      </span>
                      <span style={{ fontSize: '0.8rem', color: 'hsl(215,12%,50%)' }}>
                        {item.passenger_input.Class} • {item.passenger_input['Type of Travel']} • {item.passenger_input.Age} yrs
                      </span>
                    </div>
                    <div className="result-badge" style={{ margin: 0, padding: '4px 10px', background: `${CLUSTER_COLORS[item.cluster_id]}22`, color: CLUSTER_COLORS[item.cluster_id] }}>
                      #{item.cluster_id} — {CLUSTER_NAMES[item.cluster_id]}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
