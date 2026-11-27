import '../styles/skeleton.css';

/** Grey shimmering placeholders shown while a page loads, on the site and in the admin panel. */
export function SkeletonLine({ width = '100%', height = 14, style }) {
  return <span className="skeleton" style={{ width, height, ...style }} />;
}

export function SkeletonCards({ count = 4, className = 'col-6 col-md-4 col-lg-3' }) {
  return (
    <div className="row g-4">
      {Array.from({ length: count }, (_, i) => (
        <div className={className} key={i}>
          <div className="skeleton-card">
            <span className="skeleton" style={{ height: 160, borderRadius: 0 }} />
            <div style={{ padding: 16, display: 'grid', gap: 8 }}>
              <SkeletonLine width="40%" height={10} />
              <SkeletonLine width="80%" />
              <SkeletonLine width="50%" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 6, cols = 5 }) {
  return (
    <div className="skeleton-table">
      {Array.from({ length: rows }, (_, r) => (
        <div className="skeleton-row" key={r} style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
          {Array.from({ length: cols }, (_, c) => (
            <SkeletonLine key={c} width={c === 0 ? '70%' : '55%'} />
          ))}
        </div>
      ))}
    </div>
  );
}

/** A whole page placeholder: title, a few lines, and a block. */
export function SkeletonPage({ cards = 0 }) {
  return (
    <div className="container" style={{ paddingTop: 30, paddingBottom: 60 }}>
      <SkeletonLine width={220} height={28} style={{ marginBottom: 10 }} />
      <SkeletonLine width={320} style={{ marginBottom: 24 }} />
      {cards ? <SkeletonCards count={cards} /> : <span className="skeleton" style={{ height: 260, borderRadius: 12 }} />}
    </div>
  );
}
