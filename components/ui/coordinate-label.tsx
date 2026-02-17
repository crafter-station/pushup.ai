interface CoordinateLabelProps {
  text: string;
  className?: string;
}

export function CoordinateLabel({ text, className = "" }: CoordinateLabelProps) {
  return (
    <span
      className={`font-mono text-[10px] text-annotation tracking-wide select-none ${className}`}
    >
      {text}
    </span>
  );
}
