const CLASS_BY_STATUS = {
  'In Stock': 'stock-in',
  'Low Stock': 'stock-low',
  'Out of Stock': 'stock-out',
};

export function stockStatus(stockQty, lowStockThreshold) {
  if (stockQty <= 0) return 'Out of Stock';
  if (stockQty <= lowStockThreshold) return 'Low Stock';
  return 'In Stock';
}

export function StockBadge({ stockQty, lowStockThreshold }) {
  const status = stockStatus(stockQty, lowStockThreshold);
  return <span className={`stock-badge ${CLASS_BY_STATUS[status]}`}>{status}</span>;
}
