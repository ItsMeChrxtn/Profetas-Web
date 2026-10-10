import { adminCustomersApi } from '../api/admin/customers.js';
import { adminInventoryApi } from '../api/admin/inventory.js';
import { adminProductsApi } from '../api/admin/products.js';
import { toCsv, downloadCsv } from './csv.js';
import { downloadPdfTable } from './pdf.js';
import { todayDateString } from './dateFormat.js';

/** Walks every page of a paginated admin list endpoint. */
async function fetchAllPages(listFn) {
  let all = [];
  let page = 1;
  let totalPages = 1;
  do {
    const data = await listFn({ page });
    all = all.concat(data.items);
    totalPages = data.pagination.totalPages;
    page += 1;
  } while (page <= totalPages);
  return all;
}

function stockStatus(p) {
  if (p.stockQty <= 0) return 'Out of Stock';
  if (p.stockQty <= p.lowStockThreshold) return 'Low Stock';
  return 'In Stock';
}

// jsPDF's built-in font has no peso sign, so PDFs spell the currency out.
const money = (n) => `PHP ${Number(n || 0).toFixed(2)}`;

const REPORTS = {
  customers: {
    title: 'Customers',
    headers: ['Customer Name', 'Account Type', 'Location', 'Total Orders', 'Total Spent'],
    fetch: () => fetchAllPages(adminCustomersApi.list),
    row: (c, fmt) => [`${c.firstName} ${c.lastName}`, c.isWholesaler ? 'Wholesaler' : 'Regular', c.lastAddress || '', c.totalOrders, fmt(c.totalSpent)],
  },
  inventory: {
    title: 'Inventory',
    headers: ['Product', 'Category', 'Stock Qty', 'Low-Stock Threshold', 'Stock Status', 'Product Status'],
    fetch: () => fetchAllPages(adminInventoryApi.list),
    row: (p) => [p.name, p.category, p.stockQty, p.lowStockThreshold, stockStatus(p), p.status],
  },
  products: {
    title: 'Products',
    headers: ['Product', 'Category', 'Price', 'Unit', 'Weight (kg)', 'Wholesale Price', 'Stock', 'Status'],
    fetch: () => fetchAllPages(adminProductsApi.list),
    row: (p, fmt) => [p.name, p.category, fmt(p.price), p.unit, p.weightKg ?? '', p.availableForWholesale ? fmt(p.wholesalePrice) : '—', p.stockQty, p.status],
  },
};

/** kind: 'customers' | 'inventory' | 'products'; format: 'csv' | 'pdf'. */
export async function exportReport(kind, format) {
  const report = REPORTS[kind];
  const records = await report.fetch();
  const filename = `${kind}-${todayDateString()}`;

  if (format === 'csv') {
    // Raw numbers in CSV so spreadsheets can sum them.
    const rows = records.map((r) => report.row(r, (n) => n ?? ''));
    downloadCsv(`${filename}.csv`, toCsv(report.headers, rows));
  } else {
    const rows = records.map((r) => report.row(r, money));
    await downloadPdfTable({ title: report.title, headers: report.headers, rows, filename: `${filename}.pdf` });
  }
}
