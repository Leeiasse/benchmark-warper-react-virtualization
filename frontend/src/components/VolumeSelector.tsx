import { VOLUMES, type Volume } from "../config";

interface VolumeSelectorProps {
  value: Volume;
  onChange: (v: Volume) => void;
  disabled?: boolean;
}

export function VolumeSelector({ value, onChange, disabled }: VolumeSelectorProps) {
  return (
    <div className="volume-selector">
      <label>Data volume:</label>
      <div className="volume-buttons">
        {VOLUMES.map((v) => (
          <button
            key={v}
            className={`btn volume-btn ${v === value ? "active" : ""}`}
            onClick={() => onChange(v)}
            disabled={disabled}
          >
            {v >= 1_000_000
              ? `${v / 1_000_000}M`
              : `${v / 1_000}k`}
          </button>
        ))}
      </div>
    </div>
  );
}
