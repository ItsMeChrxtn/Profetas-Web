export function QuantityStepper({ value, max, onChange }) {
  const clamp = (n) => Math.min(max, Math.max(1, n));

  return (
    <div className="input-group" style={{ width: 140 }}>
      <button className="btn btn-outline-secondary" type="button" onClick={() => onChange(clamp(value - 1))}>
        -
      </button>
      <input
        type="number"
        className="form-control text-center"
        value={value}
        min={1}
        max={max}
        onChange={(e) => onChange(clamp(parseInt(e.target.value, 10) || 1))}
      />
      <button className="btn btn-outline-secondary" type="button" onClick={() => onChange(clamp(value + 1))}>
        +
      </button>
    </div>
  );
}
