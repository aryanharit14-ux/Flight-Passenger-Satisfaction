import { useState, useEffect } from 'react';

const SAMPLE_DATA = [
  { id: 1, gender: 'Male', age: 48, customerType: 'First-time', travelType: 'Business', cls: 'Business', distance: 821, depDelay: 2, arrDelay: 5, satisfaction: 'Neutral or Dissatisfied' },
  { id: 2, gender: 'Female', age: 35, customerType: 'Returning', travelType: 'Business', cls: 'Business', distance: 821, depDelay: 26, arrDelay: 39, satisfaction: 'Satisfied' },
  { id: 3, gender: 'Male', age: 41, customerType: 'Returning', travelType: 'Business', cls: 'Business', distance: 853, depDelay: 0, arrDelay: 0, satisfaction: 'Satisfied' },
  { id: 4, gender: 'Male', age: 50, customerType: 'Returning', travelType: 'Business', cls: 'Business', distance: 1905, depDelay: 0, arrDelay: 0, satisfaction: 'Satisfied' },
  { id: 5, gender: 'Female', age: 29, customerType: 'First-time', travelType: 'Personal', cls: 'Economy', distance: 412, depDelay: 0, arrDelay: 0, satisfaction: 'Neutral or Dissatisfied' },
  { id: 6, gender: 'Male', age: 56, customerType: 'Returning', travelType: 'Business', cls: 'Business', distance: 2456, depDelay: 10, arrDelay: 8, satisfaction: 'Satisfied' },
  { id: 7, gender: 'Female', age: 23, customerType: 'First-time', travelType: 'Personal', cls: 'Economy', distance: 315, depDelay: 45, arrDelay: 42, satisfaction: 'Neutral or Dissatisfied' },
  { id: 8, gender: 'Male', age: 38, customerType: 'Returning', travelType: 'Business', cls: 'Economy Plus', distance: 1123, depDelay: 0, arrDelay: 2, satisfaction: 'Satisfied' },
  { id: 9, gender: 'Female', age: 67, customerType: 'Returning', travelType: 'Personal', cls: 'Business', distance: 892, depDelay: 0, arrDelay: 0, satisfaction: 'Satisfied' },
  { id: 10, gender: 'Male', age: 19, customerType: 'First-time', travelType: 'Personal', cls: 'Economy', distance: 198, depDelay: 120, arrDelay: 135, satisfaction: 'Neutral or Dissatisfied' },
  { id: 11, gender: 'Female', age: 44, customerType: 'Returning', travelType: 'Business', cls: 'Business', distance: 3410, depDelay: 0, arrDelay: 0, satisfaction: 'Satisfied' },
  { id: 12, gender: 'Male', age: 33, customerType: 'Returning', travelType: 'Business', cls: 'Economy', distance: 765, depDelay: 5, arrDelay: 4, satisfaction: 'Neutral or Dissatisfied' },
  { id: 13, gender: 'Female', age: 52, customerType: 'Returning', travelType: 'Personal', cls: 'Economy Plus', distance: 558, depDelay: 0, arrDelay: 0, satisfaction: 'Neutral or Dissatisfied' },
  { id: 14, gender: 'Male', age: 61, customerType: 'Returning', travelType: 'Business', cls: 'Business', distance: 2100, depDelay: 3, arrDelay: 1, satisfaction: 'Satisfied' },
  { id: 15, gender: 'Female', age: 27, customerType: 'First-time', travelType: 'Business', cls: 'Economy', distance: 640, depDelay: 0, arrDelay: 0, satisfaction: 'Satisfied' },
  { id: 16, gender: 'Male', age: 45, customerType: 'Returning', travelType: 'Business', cls: 'Business', distance: 1750, depDelay: 0, arrDelay: 0, satisfaction: 'Satisfied' },
  { id: 17, gender: 'Female', age: 36, customerType: 'First-time', travelType: 'Personal', cls: 'Economy', distance: 287, depDelay: 22, arrDelay: 18, satisfaction: 'Neutral or Dissatisfied' },
  { id: 18, gender: 'Male', age: 72, customerType: 'Returning', travelType: 'Personal', cls: 'Business', distance: 1240, depDelay: 0, arrDelay: 0, satisfaction: 'Satisfied' },
  { id: 19, gender: 'Female', age: 31, customerType: 'Returning', travelType: 'Business', cls: 'Economy Plus', distance: 895, depDelay: 8, arrDelay: 6, satisfaction: 'Neutral or Dissatisfied' },
  { id: 20, gender: 'Male', age: 42, customerType: 'Returning', travelType: 'Business', cls: 'Business', distance: 2987, depDelay: 0, arrDelay: 0, satisfaction: 'Satisfied' },
];

const PAGE_SIZE = 10;

export function DataExplorer() {
  const [filterClass, setFilterClass] = useState('All');
  const [filterSat, setFilterSat] = useState('All');
  const [filterTravel, setFilterTravel] = useState('All');
  const [sortCol, setSortCol] = useState('id');
  const [sortDir, setSortDir] = useState('asc');
  const [page, setPage] = useState(0);

  const filtered = SAMPLE_DATA.filter(r => {
    if (filterClass !== 'All' && r.cls !== filterClass) return false;
    if (filterSat !== 'All' && r.satisfaction !== filterSat) return false;
    if (filterTravel !== 'All' && r.travelType !== filterTravel) return false;
    return true;
  }).sort((a, b) => {
    const v = (a[sortCol] < b[sortCol] ? -1 : a[sortCol] > b[sortCol] ? 1 : 0);
    return sortDir === 'asc' ? v : -v;
  });

  const total = filtered.length;
  const rows = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const handleSort = (col) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
  };

  const sortIcon = (col) => sortCol === col ? (sortDir === 'asc' ? ' ↑' : ' ↓') : '';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div className="page-header">
        <h1>Data Explorer</h1>
        <p>Browse and filter sample records from the dataset. Showing first 20 rows of 136,374 total passengers.</p>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar">
        <span className="filter-label">Filters</span>

        <div className="filter-group">
          <span style={{ fontSize: '0.78rem', color: 'hsl(215,12%,55%)', marginRight: '4px' }}>Class:</span>
          {['All', 'Business', 'Economy', 'Economy Plus'].map(v => (
            <button key={v} className={`filter-btn ${filterClass === v ? 'active' : ''}`} onClick={() => { setFilterClass(v); setPage(0); }}>
              {v}
            </button>
          ))}
        </div>

        <div className="filter-divider" />

        <div className="filter-group">
          <span style={{ fontSize: '0.78rem', color: 'hsl(215,12%,55%)', marginRight: '4px' }}>Satisfaction:</span>
          {['All', 'Satisfied', 'Neutral or Dissatisfied'].map(v => (
            <button key={v} className={`filter-btn ${filterSat === v ? 'active' : ''}`} onClick={() => { setFilterSat(v); setPage(0); }}>
              {v === 'Neutral or Dissatisfied' ? 'Dissatisfied' : v}
            </button>
          ))}
        </div>

        <div className="filter-divider" />

        <div className="filter-group">
          <span style={{ fontSize: '0.78rem', color: 'hsl(215,12%,55%)', marginRight: '4px' }}>Travel:</span>
          {['All', 'Business', 'Personal'].map(v => (
            <button key={v} className={`filter-btn ${filterTravel === v ? 'active' : ''}`} onClick={() => { setFilterTravel(v); setPage(0); }}>
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              {[
                ['id', 'ID'],
                ['gender', 'Gender'],
                ['age', 'Age'],
                ['customerType', 'Customer Type'],
                ['travelType', 'Travel Type'],
                ['cls', 'Class'],
                ['distance', 'Distance (km)'],
                ['depDelay', 'Dep. Delay'],
                ['arrDelay', 'Arr. Delay'],
                ['satisfaction', 'Satisfaction'],
              ].map(([col, label]) => (
                <th key={col} onClick={() => handleSort(col)}>
                  {label}{sortIcon(col)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={10} style={{ textAlign: 'center', padding: '32px', color: 'hsl(215,12%,42%)' }}>
                  No records match the current filters.
                </td>
              </tr>
            ) : rows.map(r => (
              <tr key={r.id}>
                <td>#{r.id}</td>
                <td>{r.gender}</td>
                <td>{r.age}</td>
                <td>{r.customerType}</td>
                <td>{r.travelType}</td>
                <td>
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: '99px',
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    background: r.cls === 'Business'
                      ? 'hsl(212,92%,58%,0.15)'
                      : r.cls === 'Economy Plus'
                        ? 'hsl(168,76%,48%,0.15)'
                        : 'hsl(220,14%,20%)',
                    color: r.cls === 'Business'
                      ? 'hsl(212,92%,65%)'
                      : r.cls === 'Economy Plus'
                        ? 'hsl(168,76%,55%)'
                        : 'hsl(215,15%,65%)',
                  }}>{r.cls}</span>
                </td>
                <td>{r.distance.toLocaleString()}</td>
                <td style={{ color: r.depDelay > 30 ? 'hsl(354,86%,60%)' : r.depDelay > 0 ? 'hsl(36,96%,58%)' : 'hsl(168,76%,48%)' }}>
                  {r.depDelay === 0 ? '—' : `${r.depDelay} min`}
                </td>
                <td style={{ color: r.arrDelay > 30 ? 'hsl(354,86%,60%)' : r.arrDelay > 0 ? 'hsl(36,96%,58%)' : 'hsl(168,76%,48%)' }}>
                  {r.arrDelay === 0 ? '—' : `${r.arrDelay} min`}
                </td>
                <td>
                  <span className={`sat-badge ${r.satisfaction === 'Satisfied' ? 'satisfied' : 'dissatisfied'}`}>
                    {r.satisfaction === 'Satisfied' ? '✓' : '✗'} {r.satisfaction === 'Satisfied' ? 'Satisfied' : 'Dissatisfied'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="tbl-pagination">
          <span className="tbl-info">
            Showing {Math.min(page * PAGE_SIZE + 1, total)}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total} filtered records
          </span>
          <div className="tbl-btns">
            <button className="tbl-btn" disabled={page === 0} onClick={() => setPage(0)}>«</button>
            <button className="tbl-btn" disabled={page === 0} onClick={() => setPage(p => p - 1)}>‹ Prev</button>
            <span style={{ padding: '5px 12px', fontSize: '0.8rem', color: 'hsl(215,15%,60%)' }}>
              {page + 1} / {totalPages}
            </span>
            <button className="tbl-btn" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>Next ›</button>
            <button className="tbl-btn" disabled={page >= totalPages - 1} onClick={() => setPage(totalPages - 1)}>»</button>
          </div>
        </div>
      </div>
    </div>
  );
}
