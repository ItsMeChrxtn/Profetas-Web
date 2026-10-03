import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { adminCustomersApi } from '../../api/admin/customers.js';
import { PageHeader } from '../../components/admin/PageHeader.jsx';
import { peso } from '../../utils/peso.js';
import { todayDateString } from '../../utils/dateFormat.js';
import { toCsv, downloadCsv } from '../../utils/csv.js';
import { downloadPdfTable } from '../../utils/pdf.js';
import { showToast } from '../../utils/toast.js';

export default function Customers() {
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get('q') || '';
  const page = parseInt(searchParams.get('page'), 10) || 1;
  const [searchInput, setSearchInput] = useState(q);
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ totalPages: 1, total: 0 });
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    adminCustomersApi.list({ q, page }).then((data) => {
      setItems(data.items);
      setPagination(data.pagination);
    });
  }, [q, page]);

  async function fetchAllCustomers() {
    let allItems = [];
    let exportPage = 1;
    let totalPages = 1;
    do {
      const data = await adminCustomersApi.list({ q, page: exportPage });
      allItems = allItems.concat(data.items);
      totalPages = data.pagination.totalPages;
      exportPage += 1;
    } while (exportPage <= totalPages);
    return allItems;
  }

  const CUSTOMER_HEADERS = ['Customer Name', 'Email', 'Location', 'Total Orders', 'Total Spent'];

  async function handleExportCsv() {
    setExporting(true);
    try {
      // Raw numeric totalSpent (not peso-formatted) so spreadsheets can sum it directly.
      const rows = (await fetchAllCustomers()).map((c) => [`${c.firstName} ${c.lastName}`, c.email, c.lastAddress || '', c.totalOrders, c.totalSpent]);
      downloadCsv(`customers-${todayDateString()}.csv`, toCsv(CUSTOMER_HEADERS, rows));
    } catch (err) {
      showToast('error', 'Could not export customers.');
    } finally {
      setExporting(false);
    }
  }

  async function handleExportPdf() {
    setExporting(true);
    try {
      const rows = (await fetchAllCustomers()).map((c) => [`${c.firstName} ${c.lastName}`, c.email, c.lastAddress || '—', c.totalOrders, peso(c.totalSpent)]);
      await downloadPdfTable({ title: 'Customers', headers: CUSTOMER_HEADERS, rows, filename: `customers-${todayDateString()}.pdf` });
    } catch (err) {
      showToast('error', 'Could not export customers.');
    } finally {
      setExporting(false);
    }
  }

  async function handleCopyEmail(email) {
    try {
      await navigator.clipboard.writeText(email);
      showToast('success', `Copied ${email} to clipboard.`);
    } catch (err) {
      showToast('error', 'Could not copy email.');
    }
  }

  return (
    <>
      <PageHeader
        title="Customers"
        subtitle="View and manage your customer database and purchase history."
        actions={
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-outline" onClick={handleExportCsv} disabled={exporting}>
              <i className="fas fa-file-csv" /> {exporting ? 'Exporting...' : 'Export CSV'}
            </button>
            <button className="btn btn-outline" onClick={handleExportPdf} disabled={exporting}>
              <i className="fas fa-file-pdf" /> {exporting ? 'Exporting...' : 'Export PDF'}
            </button>
          </div>
        }
      />

      <div className="card">
        <div className="card-header">
          <form
            className="header-search"
            style={{ width: 350 }}
            onSubmit={(e) => {
              e.preventDefault();
              setSearchParams({ q: searchInput.trim() });
            }}
          >
            <i className="fas fa-search" />
            <input
              type="text"
              placeholder="Search customers by name or email..."
              className="form-control"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </form>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Customer Name</th>
                <th>Email Address</th>
                <th>Location</th>
                <th>Total Orders</th>
                <th>Total Spent</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((customer) => {
                const fullName = `${customer.firstName} ${customer.lastName}`;
                return (
                  <tr key={customer.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div
                          style={{ width: 35, height: 35, background: '#7B1E2B', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14 }}
                        >
                          {customer.firstName[0]?.toUpperCase()}
                        </div>
                        <span style={{ fontWeight: 600 }}>{fullName}</span>
                      </div>
                    </td>
                    <td>{customer.email}</td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)', maxWidth: 180 }}>
                      {customer.lastAddress ? (customer.lastAddress.length > 40 ? `${customer.lastAddress.slice(0, 40)}...` : customer.lastAddress) : '—'}
                    </td>
                    <td style={{ fontWeight: 600 }}>{customer.totalOrders}</td>
                    <td style={{ fontWeight: 700, color: 'var(--primary-green)' }}>{peso(customer.totalSpent)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 5 }}>
                        <button type="button" className="btn btn-icon btn-outline" title="Copy email address" onClick={() => handleCopyEmail(customer.email)}>
                          <i className="far fa-envelope" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {items.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 30 }}>
                    No customers yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="card-footer" style={{ marginTop: 30, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>
            Showing {items.length} of {pagination.total} customers
          </span>
          <div className="pagination" style={{ display: 'flex', gap: 5 }}>
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((i) => (
              <button key={i} className={`btn btn-icon ${i === page ? 'btn-primary' : 'btn-outline'}`} onClick={() => setSearchParams({ q, page: i })}>
                {i}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
