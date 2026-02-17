interface CounterDisplayProps {
  count: number;
}

export function CounterDisplay({ count }: CounterDisplayProps) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="font-mono text-annotation text-xs uppercase tracking-[0.3em]">
        REPS
      </span>
      <span className="font-mono text-[120px] leading-none font-bold text-white tabular-nums">
        {String(count).padStart(2, "0")}
      </span>
    </div>
  );
}
