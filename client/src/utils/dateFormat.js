export function formatDate(value, options = { year: 'numeric', month: 'short', day: 'numeric' }) {
  if (!value) return '';
  return new Date(value).toLocaleDateString('en-PH', options);
}

export function formatDateTime(value) {
  if (!value) return '';
  return new Date(value).toLocaleString('en-PH', { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export function formatTime(timeString) {
  if (!timeString) return '';
  const [hours, minutes] = timeString.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 || 12;
  return `${hour12}:${String(minutes).padStart(2, '0')} ${period}`;
}

export function orderNumberLabel(orderNumber) {
  return `#${String(orderNumber).padStart(6, '0')}`;
}

export function todayDateString() {
  return new Date().toISOString().slice(0, 10);
}
