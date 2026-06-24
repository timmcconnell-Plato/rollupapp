'use client';

export default function Seg({ label, options, value, onChange }) {
  return (
    <div className="field">
      {label && <label>{label}</label>}
      <div className="seg" role="group" aria-label={label}>
        {options.map((o) => (
          <button key={o.value} aria-pressed={value === o.value} onClick={() => onChange(o.value)}>
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
