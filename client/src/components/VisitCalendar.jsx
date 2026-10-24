import { useState } from 'react';
import '../styles/calendar.css';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function toDateString(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/**
 * Month calendar shared by the admin Farm Visits page and the customer booking
 * form. `dayInfo(dateStr)` returns { className, badge, disabled, title } to
 * mark a day (occupied, has visits, past...). Today is always circled.
 */
export function VisitCalendar({ selected, onSelect, dayInfo = () => ({}), initialDate }) {
  const start = initialDate ? new Date(`${initialDate}T00:00:00`) : new Date();
  const [view, setView] = useState({ year: start.getFullYear(), month: start.getMonth() });

  const firstWeekday = new Date(view.year, view.month, 1).getDay();
  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
  const cells = [...Array(firstWeekday).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  const now = new Date();
  const today = toDateString(now.getFullYear(), now.getMonth(), now.getDate());
  const title = new Date(view.year, view.month, 1).toLocaleDateString('en-PH', { month: 'long', year: 'numeric' });

  function shift(delta) {
    setView(({ year, month }) => {
      const d = new Date(year, month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  }

  return (
    <div className="visit-calendar">
      <div className="visit-calendar-head">
        <button type="button" onClick={() => shift(-1)} aria-label="Previous month">
          <i className="fas fa-chevron-left" />
        </button>
        <strong>{title}</strong>
        <button type="button" onClick={() => shift(1)} aria-label="Next month">
          <i className="fas fa-chevron-right" />
        </button>
      </div>
      <div className="visit-calendar-grid">
        {WEEKDAYS.map((d) => (
          <div key={d} className="visit-calendar-weekday">
            {d}
          </div>
        ))}
        {cells.map((day, i) => {
          if (!day) return <div key={`blank-${i}`} />;
          const date = toDateString(view.year, view.month, day);
          const info = dayInfo(date) || {};
          return (
            <button
              key={date}
              type="button"
              title={info.title}
              disabled={info.disabled}
              className={`visit-calendar-day ${info.className || ''} ${date === today ? 'today' : ''} ${selected === date ? 'selected' : ''}`}
              onClick={() => onSelect?.(date)}
            >
              <span>{day}</span>
              {info.badge != null && <small>{info.badge}</small>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
