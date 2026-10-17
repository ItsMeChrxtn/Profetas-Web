import { useEffect, useState } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, CartesianGrid } from 'recharts';
import { adminReportsApi } from '../../api/admin/reports.js';
import { PageHeader } from '../../components/admin/PageHeader.jsx';
import { StatCard } from '../../components/admin/StatCard.jsx';
import { peso } from '../../utils/peso.js';
import { todayDateString } from '../../utils/dateFormat.js';
import { exportReport } from '../../utils/adminExports.js';
import { toCsv, downloadCsv } from '../../utils/csv.js';
import { downloadPdfTable } from '../../utils/pdf.js';
import { showToast } from '../../utils/toast.js';

const PIE_COLORS = ['#7B1E2B', '#C97B2E', '#3B82F6', '#10B981', '#8B5CF6', '#EF4444'];

const CATEGORIES = [
  { key: 'orders', label: 'Orders', icon: 'fa-shopping-bag' },
  { key: 'customers', label: 'Customers', icon: 'fa-users' },
  { key: 'inventory', label: 'Inventory', icon: 'fa-warehouse' },
  { key: 'products', label: 'Products', icon: 'fa-box' },
  { key: 'sales', label: 'Sales', icon: 'fa-coins' },
];

// Inventory is a snapshot of current stock, so it ignores the date range.
const RANGELESS = ['inventory'];
// These export the full record list; Orders and Sales export the report's own table.
const FULL_LIST_EXPORTS = ['customers', 'inventory', 'products'];

function dateString(d) {
  return d.toISOString().slice(0, 10);
}
function daysAgoString(days) {
  return dateString(new Date(Date.now() - days * 24 * 60 * 60 * 1000));
}

const PRESETS = [
  { key: 'weekly', label: 'Weekly', start: () => daysAgoString(6) },
  { key: 'monthly', label: 'Monthly', start: () => daysAgoString(29) },
  { key: 'yearly', label: 'Yearly', start: () => daysAgoString(364) },
];

const fmt = (kind, value) => (kind === 'money' ? peso(value) : Number(value || 0).toLocaleString('en-PH'));
// PDFs can't render the peso sign with jsPDF's built-in font.
const pdfFmt = (kind, value) => (kind === 'money' ? `PHP ${Number(value || 0).toFixed(2)}` : String(value ?? ''));

function EmptyChart({ icon, text }) {
  return (
    <div className="report-empty">
      <i className={`fas ${icon}`} />
      <p>{text}</p>
    </div>
  );
}

export default function Reports() {
  const [category, setCategory] = useState('sales');
  const [startDate, setStartDate] = useState(daysAgoString(29));
  const [endDate, setEndDate] = useState(todayDateString());
  const [preset, setPreset] = useState('monthly');
  const [data, setData] = useState(null);
  const [exporting, setExporting] = useState(null);

  function load(range = { startDate, endDate }, type = category) {
    adminReportsApi.get({ type, ...range }).then(setData);
  }

  useEffect(() => load(), [category]); // eslint-disable-line react-hooks/exhaustive-deps

  function applyPreset(p) {
    const range = { startDate: p.start(), endDate: todayDateString() };
    setPreset(p.key);
    setStartDate(range.startDate);
    setEndDate(range.endDate);
    load(range);
  }

  async function handleExport(format) {
    setExporting(format);
    try {
      if (FULL_LIST_EXPORTS.includes(category)) {
        await exportReport(category, format);
      } else {
        const { table } = data;
        const name = `${category}-report-${data.range.startDate}-to-${data.range.endDate}`;
        if (format === 'csv') {
          downloadCsv(`${name}.csv`, toCsv(table.headers, table.rows));
        } else {
          const rows = table.rows.map((row) => row.map((v, i) => pdfFmt(table.kinds[i], v)));
          await downloadPdfTable({ title: `${table.title} (${data.range.startDate} to ${data.range.endDate})`, headers: table.headers, rows, filename: `${name}.pdf` });
        }
      }
    } catch {
      showToast('error', 'Could not export this report.');
    } finally {
      setExporting(null);
    }
  }

  const current = CATEGORIES.find((c) => c.key === category);
  const ready = data && data.type === category;

  return (
    <>
      <PageHeader
        title="Reports"
        subtitle="Analyze your sales performance and farm productivity."
        actions={
          !RANGELESS.includes(category) && (
            <div className="report-range">
              <div className="status-filter-row">
                {PRESETS.map((p) => (
                  <button key={p.key} type="button" className={`status-filter-pill ${preset === p.key ? 'active' : ''}`} onClick={() => applyPreset(p)}>
                    {p.label}
                  </button>
                ))}
              </div>
              <div className="report-dates">
                <input
                  type="date"
                  className="form-control"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setPreset('');
                  }}
                />
                <span>to</span>
                <input
                  type="date"
                  className="form-control"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setPreset('');
                  }}
                />
                <button className="btn btn-primary" onClick={() => load()} title="Apply custom range">
                  <i className="fas fa-sync-alt" />
                </button>
              </div>
            </div>
          )
        }
      />

      <div className="report-tabs">
        {CATEGORIES.map((c) => (
          <button key={c.key} type="button" className={`report-tab ${category === c.key ? 'active' : ''}`} onClick={() => setCategory(c.key)}>
            <i className={`fas ${c.icon}`} />
            {c.label}
          </button>
        ))}
      </div>

      {!ready ? (
        <p style={{ color: 'var(--text-muted)' }}>Loading report...</p>
      ) : (
        <>
          <div className="stats-grid">
            {data.stats.map((s) => (
              <StatCard key={s.label} label={s.label} value={fmt(s.kind, s.value)} trend={s.note} />
            ))}
          </div>

          {data.line && (
            <div className="card" style={{ marginBottom: 30 }}>
              <div className="card-header">
                <h3 className="card-title">
                  <i className="fas fa-chart-line" /> {data.line.title}
                </h3>
              </div>
              <div style={{ height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.line.data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
                    <XAxis dataKey="name" fontSize={11} minTickGap={20} />
                    <YAxis fontSize={11} width={60} allowDecimals={data.line.kind === 'money'} />
                    <Tooltip formatter={(v) => fmt(data.line.kind, v)} />
                    <Line type="monotone" dataKey="value" stroke="#7B1E2B" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          <div className="dashboard-row cols-wide-2-1">
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">
                  <i className="fas fa-chart-bar" /> {data.bar.title}
                </h3>
              </div>
              {data.bar.data.length === 0 ? (
                <EmptyChart icon="fa-chart-bar" text="No data for the selected period" />
              ) : (
                <div style={{ height: 320 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.bar.data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                      <XAxis dataKey="name" fontSize={11} interval={0} angle={data.bar.data.length > 4 ? -20 : 0} textAnchor={data.bar.data.length > 4 ? 'end' : 'middle'} height={data.bar.data.length > 4 ? 60 : 30} />
                      <YAxis fontSize={11} width={60} />
                      <Tooltip formatter={(v) => fmt(data.bar.kind, v)} />
                      <Bar dataKey="value" fill="#7B1E2B" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">
                  <i className="fas fa-chart-pie" /> {data.pie.title}
                </h3>
              </div>
              {data.pie.data.length === 0 ? (
                <EmptyChart icon="fa-chart-pie" text="No data for the selected period" />
              ) : (
                <div style={{ height: 320 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={data.pie.data} dataKey="value" nameKey="name" outerRadius={90} label>
                        {data.pie.data.map((entry, i) => (
                          <Cell key={entry.name} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header" style={{ flexWrap: 'wrap', gap: 10 }}>
              <h3 className="card-title">
                <i className="fas fa-table" /> {data.table.title}
              </h3>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-outline" disabled={exporting !== null} onClick={() => handleExport('csv')}>
                  <i className="fas fa-file-csv" /> {exporting === 'csv' ? 'Exporting...' : `Export ${current.label} CSV`}
                </button>
                <button className="btn btn-outline" disabled={exporting !== null} onClick={() => handleExport('pdf')}>
                  <i className="fas fa-file-pdf" /> {exporting === 'pdf' ? 'Exporting...' : `Export ${current.label} PDF`}
                </button>
              </div>
            </div>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    {data.table.headers.map((h) => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.table.rows.length === 0 && (
                    <tr>
                      <td colSpan={data.table.headers.length} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                        No records for this period
                      </td>
                    </tr>
                  )}
                  {data.table.rows.map((row, i) => (
                    <tr key={i}>
                      {row.map((v, j) => (
                        <td key={j}>{data.table.kinds[j] === 'text' ? v : fmt(data.table.kinds[j], v)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </>
  );
}
