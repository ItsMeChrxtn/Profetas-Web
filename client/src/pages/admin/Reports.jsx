import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { adminReportsApi } from '../../api/admin/reports.js';
import { PageHeader } from '../../components/admin/PageHeader.jsx';
import { StatCard } from '../../components/admin/StatCard.jsx';
import { peso } from '../../utils/peso.js';
import { todayDateString } from '../../utils/dateFormat.js';
import { exportReport } from '../../utils/adminExports.js';
import { showToast } from '../../utils/toast.js';

const PIE_COLORS = ['#7B1E2B', '#C97B2E', '#3B82F6', '#EF4444', '#8B5CF6'];

function dateString(d) {
  return d.toISOString().slice(0, 10);
}

function daysAgoString(days) {
  return dateString(new Date(Date.now() - days * 24 * 60 * 60 * 1000));
}

// Quick ranges ending today.
const PRESETS = [
  { key: 'weekly', label: 'Weekly', start: () => daysAgoString(6) },
  { key: 'monthly', label: 'Monthly', start: () => daysAgoString(29) },
  { key: 'yearly', label: 'Yearly', start: () => daysAgoString(364) },
];

const EXPORTS = [
  { kind: 'customers', label: 'Customers', icon: 'fa-users' },
  { kind: 'inventory', label: 'Inventory', icon: 'fa-warehouse' },
  { kind: 'products', label: 'Products', icon: 'fa-box' },
];

function ExportCard() {
  const [busy, setBusy] = useState(null);

  async function run(kind, format) {
    setBusy(`${kind}-${format}`);
    try {
      await exportReport(kind, format);
    } catch {
      showToast('error', 'Could not export that report.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">
          <i className="fas fa-file-export" /> Export Reports
        </h3>
      </div>
      <div className="export-grid">
        {EXPORTS.map((e) => (
          <div className="export-item" key={e.kind}>
            <div className="export-item-title">
              <i className={`fas ${e.icon}`} /> {e.label}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-outline" disabled={busy !== null} onClick={() => run(e.kind, 'csv')}>
                <i className="fas fa-file-csv" /> {busy === `${e.kind}-csv` ? 'Exporting...' : 'CSV'}
              </button>
              <button className="btn btn-outline" disabled={busy !== null} onClick={() => run(e.kind, 'pdf')}>
                <i className="fas fa-file-pdf" /> {busy === `${e.kind}-pdf` ? 'Exporting...' : 'PDF'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Reports() {
  const [startDate, setStartDate] = useState(daysAgoString(29));
  const [endDate, setEndDate] = useState(todayDateString());
  const [preset, setPreset] = useState('monthly');
  const [data, setData] = useState(null);

  function load(range = { startDate, endDate }) {
    adminReportsApi.get(range).then(setData);
  }

  useEffect(() => load(), []); // eslint-disable-line react-hooks/exhaustive-deps

  function applyPreset(p) {
    const range = { startDate: p.start(), endDate: todayDateString() };
    setPreset(p.key);
    setStartDate(range.startDate);
    setEndDate(range.endDate);
    load(range);
  }

  if (!data) return null;

  const { summary, salesByCategory, topProducts } = data;

  return (
    <>
      <PageHeader
        title="Reports"
        subtitle="Analyze your sales performance and farm productivity."
        actions={
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
        }
      />

      <div className="stats-grid">
        <StatCard label="Total Revenue" value={peso(summary.revenue)} trend={`${summary.completedOrders} completed orders`} />
        <StatCard label="Average Order Value" value={peso(summary.averageOrderValue)} trend="Per completed order" />
        <StatCard label="Total Orders" value={summary.totalOrders} trend="All statuses in range" />
      </div>

      <div className="dashboard-row cols-wide-2-1">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <i className="fas fa-chart-area" /> Sales by Category
            </h3>
          </div>
          {salesByCategory.length === 0 ? (
            <div style={{ height: 350, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb', borderRadius: 'var(--radius-md)' }}>
              <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                <i className="fas fa-chart-line" style={{ fontSize: 48, marginBottom: 15, opacity: 0.3 }} />
                <p>No sales data available for the selected period</p>
              </div>
            </div>
          ) : (
            <div style={{ height: 350 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesByCategory} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <XAxis dataKey="_id" fontSize={12} />
                  <YAxis fontSize={11} width={60} />
                  <Tooltip formatter={(v) => peso(v)} />
                  <Bar dataKey="revenue" fill="#7B1E2B" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <i className="fas fa-chart-pie" /> Category Share
            </h3>
          </div>
          {salesByCategory.length === 0 ? (
            <div style={{ height: 350, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb', borderRadius: 'var(--radius-md)' }}>
              <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                <i className="fas fa-chart-pie" style={{ fontSize: 48, marginBottom: 15, opacity: 0.3 }} />
                <p>No category data available</p>
              </div>
            </div>
          ) : (
            <div style={{ height: 350 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={salesByCategory} dataKey="revenue" nameKey="_id" outerRadius={90} label>
                    {salesByCategory.map((entry, i) => (
                      <Cell key={entry._id} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => peso(v)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            <i className="fas fa-table" /> Top Performing Products
          </h3>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Units Sold</th>
                <th>Revenue</th>
              </tr>
            </thead>
            <tbody>
              {topProducts.length === 0 && (
                <tr>
                  <td colSpan={3} style={{ textAlign: 'center', padding: 50, color: 'var(--text-muted)' }}>
                    No product data found
                  </td>
                </tr>
              )}
              {topProducts.map((p) => (
                <tr key={p._id}>
                  <td>{p.name}</td>
                  <td>{p.unitsSold}</td>
                  <td>{peso(p.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ExportCard />
    </>
  );
}
