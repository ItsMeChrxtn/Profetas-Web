// Order invoice as a PDF, with the VAT breakdown. jsPDF is loaded only when a
// customer actually downloads one, like the admin PDF exports.
import { orderNumberLabel, formatDateTime, formatDate, formatTime } from './dateFormat.js';

const VAT_RATE = 0.12;
// jsPDF's built-in font has no peso sign.
const money = (n) => `PHP ${Number(n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** Prices are VAT-inclusive, so VATable sales = total / 1.12 and VAT = total - VATable sales. */
export function vatBreakdown(total) {
  const vatableSales = Math.round((total / (1 + VAT_RATE)) * 100) / 100;
  return { vatableSales, vat: Math.round((total - vatableSales) * 100) / 100 };
}

export async function downloadInvoice(order, customer) {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')]);
  const doc = new jsPDF();
  const maroon = [123, 30, 43];
  const left = 14;

  doc.setFontSize(18);
  doc.setTextColor(...maroon);
  doc.text('Profeta Integrated Farm', left, 20);
  doc.setFontSize(9);
  doc.setTextColor(90);
  doc.text('Tres Cruces, Tanza, Cavite, Philippines', left, 26);

  doc.setFontSize(14);
  doc.setTextColor(...maroon);
  doc.text('SALES INVOICE', 196, 20, { align: 'right' });
  doc.setFontSize(9);
  doc.setTextColor(60);
  doc.text(`Invoice No.: INV-${String(order.orderNumber).padStart(6, '0')}`, 196, 26, { align: 'right' });
  doc.text(`Order: ${orderNumberLabel(order.orderNumber)}`, 196, 31, { align: 'right' });
  doc.text(`Date: ${formatDateTime(order.orderDate)}`, 196, 36, { align: 'right' });

  doc.setTextColor(30);
  doc.setFontSize(10);
  doc.text('Billed to:', left, 40);
  doc.setFontSize(9);
  const name = customer ? `${customer.firstName} ${customer.lastName}` : '';
  const delivery =
    order.deliveryMethod === 'Self-Pickup'
      ? `Self-Pickup on ${formatDate(order.pickupDate)} at ${formatTime(order.pickupTime)}`
      : `Lalamove delivery to ${order.deliveryAddress || '-'}`;
  doc.text([name, customer?.email || '', customer?.contactNumber || ''].filter(Boolean), left, 46);
  doc.text(doc.splitTextToSize(delivery, 120), left, 62);

  autoTable(doc, {
    startY: 72,
    head: [['Item', 'Qty', 'Unit Price', 'Amount']],
    body: order.items.map((item) => [`${item.productName}${item.wholesale ? ' (wholesale)' : ''}`, item.quantity, money(item.unitPrice), money(item.subtotal)]),
    headStyles: { fillColor: maroon },
    styles: { fontSize: 9 },
    columnStyles: { 1: { halign: 'center' }, 2: { halign: 'right' }, 3: { halign: 'right' } },
  });

  const { vatableSales, vat } = vatBreakdown(order.totalAmount);
  const rows = [
    ['Subtotal', money(order.subtotal)],
    [`Delivery Fee${order.deliveryFeePayment === 'Rider' ? ' (paid to rider)' : ''}`, money(order.deliveryFee)],
    ['TOTAL (VAT inclusive)', money(order.totalAmount)],
    ['VATable Sales', money(vatableSales)],
    ['VAT (12%)', money(vat)],
    ['Paid via GCash', money(order.payment?.amount)],
    ['GCash Reference No.', order.payment?.referenceNumber || '-'],
    ['Payment Status', order.payment?.status === 'Verified' ? 'Paid' : order.payment?.status || '-'],
  ];
  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 6,
    body: rows,
    theme: 'plain',
    styles: { fontSize: 9, cellPadding: 1.5 },
    margin: { left: 110 },
    columnStyles: { 0: { fontStyle: 'bold' }, 1: { halign: 'right' } },
    didParseCell: (data) => {
      if (data.row.index === 2) data.cell.styles.textColor = maroon;
    },
  });

  doc.setFontSize(8);
  doc.setTextColor(120);
  doc.text('All prices are VAT-inclusive. No refunds - damaged items are replaced. Thank you for your order!', left, doc.lastAutoTable.finalY + 12);
  doc.save(`invoice-${String(order.orderNumber).padStart(6, '0')}.pdf`);
}
