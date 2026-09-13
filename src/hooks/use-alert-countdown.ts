import { useEffect, useRef, useState } from 'react';

type CountdownOptions = {
  active: boolean;
  duration: number;
  resetKey: string;
  onExpire: () => void;
};

export function useAlertCountdown({
  active,
  duration,
  resetKey,
  onExpire,
}: CountdownOptions): number | null {
  const onExpireRef = useRef(onExpire);

  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  const timed = active && Number.isFinite(duration) && duration > 0;
  const [snapshot, setSnapshot] = useState({ resetKey, duration, remaining: 1 });

  useEffect(() => {
    if (!timed) return;

    const deadline = Date.now() + duration;
    let finished = false;
    let frame = 0;
    let lastPaint = 0;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    setSnapshot({ resetKey, duration, remaining: 1 });

    const refresh = () => {
      if (finished) return;

      const now = Date.now();
      const remaining = Math.max(0, Math.min(1, (deadline - now) / duration));

      if (remaining === 0 || !reduced || now - lastPaint >= 250) {
        lastPaint = now;
        setSnapshot({ resetKey, duration, remaining });
      }

      if (remaining === 0) {
        finished = true;
        onExpireRef.current();
      }
    };

    const paint = () => {
      refresh();
      if (!finished) frame = requestAnimationFrame(paint);
    };

    const timeout = window.setTimeout(refresh, duration);
    frame = requestAnimationFrame(paint);
    document.addEventListener('visibilitychange', refresh);
    window.addEventListener('focus', refresh);

    return () => {
      finished = true;
      clearTimeout(timeout);
      cancelAnimationFrame(frame);
      document.removeEventListener('visibilitychange', refresh);
      window.removeEventListener('focus', refresh);
    };
  }, [timed, duration, resetKey]);

  if (!timed) return null;

  return snapshot.resetKey === resetKey && snapshot.duration === duration
    ? snapshot.remaining
    : 1;
}
