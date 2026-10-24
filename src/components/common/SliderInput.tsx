import React from 'react';

interface SliderInputProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (val: number) => void;
  onReset?: () => void;
  defaultValue?: number;
}

export const SliderInput: React.FC<SliderInputProps> = ({
  label,
  value,
  min,
  max,
  step = 1,
  unit = '',
  onChange,
  onReset,
  defaultValue = 0,
}) => {
  return (
    <div className="flex flex-col gap-1.5 py-1 text-xs">
      <div className="flex items-center justify-between text-neutral-400">
        <span
          className="font-mono text-[11px] tracking-wide uppercase hover:text-white cursor-pointer select-none"
          title="Click to reset to default"
          onClick={() => onReset ? onReset() : onChange(defaultValue)}
        >
          {label}
        </span>
        <div className="flex items-center gap-1">
          <input
            type="number"
            min={min}
            max={max}
            step={step}
            value={Number(value.toFixed(step < 1 ? 2 : 0))}
            onChange={(e) => {
              const num = parseFloat(e.target.value);
              if (!isNaN(num)) {
                onChange(Math.max(min, Math.min(max, num)));
              }
            }}
            className="w-16 bg-[#121212] border border-[#2b2b2b] rounded px-1.5 py-0.5 text-right font-mono text-[11px] text-white focus:outline-none focus:border-white"
          />
          {unit && <span className="text-[10px] text-neutral-500 w-3">{unit}</span>}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="w-full h-1 bg-[#262626] rounded appearance-none cursor-pointer accent-white"
        />
      </div>
    </div>
  );
};
