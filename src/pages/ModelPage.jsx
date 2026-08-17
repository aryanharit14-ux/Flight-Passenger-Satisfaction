import { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { getModelInfo } from '../services/api';
import { COLORS } from '../data/stats';

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

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="custom-tooltip">
      <div className="custom-tooltip-label">{label}</div>
      {payload.map((p, i) => (
        <div className="custom-tooltip-row" key={i}>
          <span style={{ color: p.fill }}>{p.name}</span>
          <span>{typeof p.value === 'number' ? (p.value * 100).toFixed(2) + '%' : p.value}</span>
        </div>
      ))}
    </div>
  );
};

// ── Metric value formatter ───────────────────────────────────────────────────
const MetricBadge = ({ value, threshold = 0.8 }) => {
  const pct = (value * 100).toFixed(2);
  const color = value >= threshold ? '#2dd4bf' : value >= 0.7 ? '#fbbf24' : '#f87171';
  return (
    <span style={{
      padding: '2px 10px',
      borderRadius: '99px',
      fontSize: '0.82rem',
      fontWeight: 700,
      background: `${color}22`,
      color,
    }}>
      {pct}%
    </span>
  );
};

// ── Confusion Matrix ──────────────────────────────────────────────────────────
function ConfusionMatrix({ matrix, modelName }) {
  if (!matrix || matrix.length < 2) return null;
  const [[tn, fp], [fn, tp]] = matrix;
  const total = tn + fp + fn + tp;

  const cells = [
    { label: 'True Negative', abbr: 'TN', value: tn, pct: tn / total, color: '#2dd4bf', desc: 'Correctly predicted Dissatisfied' },
    { label: 'False Positive', abbr: 'FP', value: fp, pct: fp / total, color: '#f87171', desc: 'Predicted Satisfied, actually Dissatisfied' },
    { label: 'False Negative', abbr: 'FN', value: fn, pct: fn / total, color: '#fb923c', desc: 'Predicted Dissatisfied, actually Satisfied' },
    { label: 'True Positive', abbr: 'TP', value: tp, pct: tp / total, color: '#2dd4bf', desc: 'Correctly predicted Satisfied' },
  ];

  return (
    <div className="chart-card">
      <div className="chart-header">
        <div>
          <div className="chart-title">Confusion Matrix — {modelName}</div>
          <div className="chart-desc">Test set predictions vs actual labels</div>
        </div>
        <span className="chart-badge">{total.toLocaleString()} test samples</span>
      </div>

      {/* Matrix Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
        <div style={{ fontSize: '0.75rem', color: 'hsl(215,12%,42%)', textTransform: 'uppercase', letterSpacing: '0.07em', alignSelf: 'flex-start', marginLeft: '80px' }}>
          Predicted →
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', fontSize: '0.75rem', color: 'hsl(215,12%,42%)', textTransform: 'uppercase', letterSpacing: '0.07em', marginRight: '4px' }}>
            Actual ↓
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr 1fr', gap: '6px', alignItems: 'center' }}>
            <div />
            {['Dissatisfied', 'Satisfied'].map(l => (
              <div key={l} style={{ textAlign: 'center', fontSize: '0.75rem', fontWeight: 600, color: 'hsl(215,15%,60%)', padding: '0 8px' }}>{l}</div>
            ))}
            {['Dissatisfied', 'Satisfied'].map((rowLabel, ri) => (
              <>
                <div key={`rl-${ri}`} style={{ fontSize: '0.75rem', fontWeight: 600, color: 'hsl(215,15%,60%)', paddingRight: '12px', whiteSpace: 'nowrap' }}>
                  {rowLabel}
                </div>
                {cells.slice(ri * 2, ri * 2 + 2).map((cell, ci) => (
                  <div key={`cell-${ri}-${ci}`} className="cm-cell" style={{ background: `${cell.color}${ri === ci ? '30' : '10'}` }}>
                    <div className="cm-abbr" style={{ color: ri === ci ? cell.color : 'hsl(215,15%,55%)' }}>{cell.abbr}</div>
                    <div className="cm-value">{cell.value.toLocaleString()}</div>
                    <div className="cm-pct" style={{ color: ri === ci ? cell.color : 'hsl(215,12%,42%)' }}>
                      {(cell.pct * 100).toFixed(1)}%
                    </div>
                  </div>
                ))}
              </>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '12px' }}>
        {cells.map(c => (
          <div key={c.abbr} style={{ fontSize: '0.76rem', color: 'hsl(215,15%,65%)', display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
            <span style={{ color: c.color, fontWeight: 700, minWidth: '24px' }}>{c.abbr}</span>
            <span>{c.desc}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Feature Importance Chart ──────────────────────────────────────────────────
function FeatureImportance({ importances }) {
  if (!importances?.length) return null;
  const top12 = importances.slice(0, 12);
  const maxVal = Math.max(...top12.map(d => d.importance));

  return (
    <div className="chart-card">
      <div className="chart-header">
        <div>
          <div className="chart-title">Feature Importance (Top 12)</div>
          <div className="chart-desc">Most influential features in predicting satisfaction</div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={top12} layout="vertical" barSize={12} margin={{ left: 140 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,14%,20%)" horizontal={false} />
          <XAxis type="number" tick={{ fill: 'hsl(215,15%,60%)', fontSize: 11 }} axisLine={false} tickLine={false}
            tickFormatter={v => v.toFixed(3)} />
          <YAxis dataKey="feature" type="category" tick={{ fill: 'hsl(215,15%,60%)', fontSize: 10 }}
            axisLine={false} tickLine={false} width={140} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="importance" name="Importance" radius={[0, 4, 4, 0]}>
            {top12.map((d, i) => (
              <Cell key={i} fill={i === 0 ? '#3b82f6' : i < 4 ? '#2dd4bf' : i < 8 ? '#a78bfa' : '#6b7280'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Model Comparison Table ────────────────────────────────────────────────────
function ModelComparison({ models, bestModel }) {
  const metrics = ['accuracy', 'precision', 'recall', 'f1'];
  const metricLabels = {
    accuracy:  'Accuracy',
    precision: 'Precision',
    recall:    'Recall',
    f1:        'F1 Score',
  };

  const modelNames = Object.keys(models);

  // Bar chart data
  const chartData = metrics.map(m => {
    const row = { metric: metricLabels[m] };
    modelNames.forEach(name => { row[name] = models[name][m]; });
    return row;
  });

  const modelColors = ['#3b82f6', '#2dd4bf'];

  return (
    <>
      {/* Comparison Cards */}
      <div className="chart-grid cols-2">
        {modelNames.map((name, idx) => {
          const m = models[name];
          const isBest = name === bestModel;
          return (
            <div key={name} className={`chart-card model-card ${isBest ? 'model-best' : ''}`}>
              <div className="chart-header">
                <div>
                  <div className="chart-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {name}
                    {isBest && (
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: '99px', background: '#2dd4bf22', color: '#2dd4bf' }}>
                        ✓ BEST
                      </span>
                    )}
                  </div>
                  <div className="chart-desc">Train time: {m.train_time_s}s</div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '8px' }}>
                {metrics.map(metric => (
                  <div key={metric} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'hsl(215,12%,42%)' }}>
                      {metricLabels[metric]}
                    </span>
                    <MetricBadge value={m[metric]} />
                  </div>
                ))}
              </div>
              {/* Mini progress bars */}
              <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {metrics.map(metric => (
                  <div key={metric} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.72rem', color: 'hsl(215,12%,42%)', width: '64px' }}>{metricLabels[metric]}</span>
                    <div style={{ flex: 1, height: '6px', background: 'hsl(220,14%,17%)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${m[metric] * 100}%`,
                        background: modelColors[idx],
                        borderRadius: '3px',
                        transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)',
                      }} />
                    </div>
                    <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'hsl(215,25%,85%)', width: '40px', textAlign: 'right' }}>
                      {(m[metric] * 100).toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Side-by-side Bar Chart */}
      <div className="chart-card">
        <div className="chart-header">
          <div>
            <div className="chart-title">Model Comparison — All Metrics</div>
            <div className="chart-desc">Logistic Regression vs Random Forest on the test set</div>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={chartData} barGap={6}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,14%,20%)" vertical={false} />
            <XAxis dataKey="metric" tick={{ fill: 'hsl(215,15%,60%)', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 1]} tick={{ fill: 'hsl(215,15%,60%)', fontSize: 11 }} axisLine={false} tickLine={false}
              tickFormatter={v => `${(v * 100).toFixed(0)}%`} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(220,14%,20%)' }} />
            {modelNames.map((name, i) => (
              <Bar key={name} dataKey={name} fill={modelColors[i]} radius={[4, 4, 0, 0]} barSize={36} />
            ))}
          </BarChart>
        </ResponsiveContainer>
        <div className="legend">
          {modelNames.map((name, i) => (
            <div key={name} className="legend-item">
              <div className="legend-dot" style={{ background: modelColors[i] }} />
              {name} {name === bestModel ? '(Best)' : ''}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ModelPage() {
  const [info, setInfo]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    let cancelled = false;
    getModelInfo()
      .then(d => { if (!cancelled) setInfo(d); })
      .catch(e => { if (!cancelled) setError(e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const bestMetrics = info?.models?.[info?.best_model];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="page-header">
        <h1>Model Performance</h1>
        <p>
          Real metrics from training Logistic Regression and Random Forest on{' '}
          {info ? `${info.train_size?.toLocaleString()} training samples` : 'the dataset'}.
          Best model selected by F1-score.
        </p>
      </div>

      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '40px 0' }}>
          <Spinner /> <span style={{ color: 'hsl(215,15%,65%)' }}>Loading model metrics from backend…</span>
        </div>
      )}

      {error && <ApiError message={error} />}

      {info && (
        <>
          {/* KPIs for best model */}
          <div className="kpi-grid">
            <div className="kpi-card success">
              <div className="kpi-top"><span className="kpi-label">Best Model</span><div className="kpi-icon success">🏆</div></div>
              <div className="kpi-value" style={{ fontSize: '1.1rem', letterSpacing: '-0.01em' }}>{info.best_model}</div>
              <div className="kpi-sub">Selected by highest F1 score</div>
            </div>
            <div className="kpi-card primary">
              <div className="kpi-top"><span className="kpi-label">Accuracy</span><div className="kpi-icon primary">🎯</div></div>
              <div className="kpi-value">{bestMetrics ? (bestMetrics.accuracy * 100).toFixed(1) + '%' : '—'}</div>
              <div className="kpi-sub">{info.test_size?.toLocaleString()} test samples</div>
            </div>
            <div className="kpi-card warning">
              <div className="kpi-top"><span className="kpi-label">F1 Score</span><div className="kpi-icon warning">📐</div></div>
              <div className="kpi-value">{bestMetrics ? (bestMetrics.f1 * 100).toFixed(1) + '%' : '—'}</div>
              <div className="kpi-sub">Harmonic mean of precision & recall</div>
            </div>
            <div className="kpi-card danger">
              <div className="kpi-top"><span className="kpi-label">Train Samples</span><div className="kpi-icon danger">📚</div></div>
              <div className="kpi-value">{info.train_size ? Math.round(info.train_size / 1000) + 'K' : '—'}</div>
              <div className="kpi-sub">80/20 stratified split</div>
            </div>
          </div>

          {/* Model comparison cards + bar chart */}
          <ModelComparison models={info.models} bestModel={info.best_model} />

          {/* Confusion matrix + feature importance */}
          <div className="chart-grid cols-2">
            <ConfusionMatrix
              matrix={bestMetrics?.confusion_matrix}
              modelName={info.best_model}
            />
            <FeatureImportance importances={info.feature_importance} />
          </div>

          {/* Feature columns info */}
          <div className="chart-card">
            <div className="chart-header">
              <div>
                <div className="chart-title">Feature Schema</div>
                <div className="chart-desc">All {info.feature_columns?.length} features used in training</div>
              </div>
              <span className="chart-badge">22 Features</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginTop: '8px' }}>
              {info.feature_columns?.map((f, i) => {
                const isCat = info.categorical_features?.includes(f);
                return (
                  <div key={i} style={{
                    padding: '6px 10px',
                    borderRadius: '6px',
                    background: isCat ? 'hsl(212,92%,58%,0.08)' : 'hsl(168,76%,48%,0.08)',
                    border: `1px solid ${isCat ? 'hsl(212,92%,58%,0.2)' : 'hsl(168,76%,48%,0.2)'}`,
                    fontSize: '0.76rem',
                    color: isCat ? '#3b82f6' : '#2dd4bf',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}>
                    <span style={{ opacity: 0.6 }}>{isCat ? 'CAT' : 'NUM'}</span>
                    {f}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
