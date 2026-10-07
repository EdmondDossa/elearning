export function ProgressBar({
  value,
  label,
}: {
  value: number;
  label?: string;
}) {
  return (
    <div>
      {label && (
        <div className="mb-1 flex justify-between text-xs text-slate-600">
          <span>{label}</span>
          <span className="font-medium">{value} %</span>
        </div>
      )}
      <div
        role="progressbar"
        aria-label={label ?? "Progression"}
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
        className="h-2 overflow-hidden rounded-full bg-slate-200"
      >
        <div
          className="h-full rounded-full bg-indigo-600 transition-all"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
