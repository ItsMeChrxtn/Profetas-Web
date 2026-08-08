// jspdf + jspdf-autotable pull in html2canvas/dompurify and are only ever
// needed on the couple of admin pages with a "Export PDF" button - loaded
// lazily here so the rest of the app (including the whole customer site)
// never pays for that weight upfront.
export async function downloadPdfTable({ title, headers, rows, filename }) {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')]);

  const doc = new jsPDF({ orientation: rows.length && headers.length > 5 ? 'landscape' : 'portrait' });

  doc.setFontSize(16);
  doc.text(title, 14, 18);
  doc.setFontSize(10);
  doc.setTextColor(107, 114, 128);
  doc.text(`Generated ${new Date().toLocaleString('en-PH')}`, 14, 25);

  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: 32,
    headStyles: { fillColor: [27, 60, 38] },
    styles: { fontSize: 9 },
  });

  doc.save(filename);
}
