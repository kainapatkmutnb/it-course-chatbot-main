import { cn } from '@/lib/utils';

export function AlertTimeoutProgress({
  remaining,
  className,
}: {
  remaining: number | null;
  className?: string;
}) {
  if (remaining === null) return null;

  return (
    <span
      aria-hidden="true"
      data-alert-timeout-progress=""
      className={cn(
        'pointer-events-none absolute inset-x-0 bottom-0 block h-[3px] overflow-hidden',
        className
      )}
    >
      <span className="absolute inset-0 bg-current opacity-15" />
      <span
        className="absolute inset-0 origin-left bg-current"
        style={{ transform: `scaleX(${Math.max(0, Math.min(1, remaining))})` }}
      />
    </span>
  );
}
