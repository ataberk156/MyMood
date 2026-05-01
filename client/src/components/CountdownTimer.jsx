import { useEffect, useRef, useState } from 'react';

export default function CountdownTimer({ seconds, onExpire, colorWarning = 15 }) {
  const [remaining, setRemaining] = useState(seconds);
  const endRef = useRef(Date.now() + seconds * 1000);
  const rafRef = useRef(null);

  useEffect(() => {
    endRef.current = Date.now() + seconds * 1000;
    setRemaining(seconds);

    function tick() {
      const left = Math.max(0, Math.ceil((endRef.current - Date.now()) / 1000));
      setRemaining(left);
      if (left > 0) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        onExpire?.();
      }
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [seconds]);

  const pct = Math.round((remaining / seconds) * 100);
  const isWarning = remaining <= colorWarning;
  const isCritical = remaining <= 5;

  return (
    <div className={`countdown ${isWarning ? 'countdown--warning' : ''} ${isCritical ? 'countdown--critical' : ''}`}>
      <svg className="countdown-ring" viewBox="0 0 44 44">
        <circle className="countdown-track" cx="22" cy="22" r="18" />
        <circle
          className="countdown-progress"
          cx="22" cy="22" r="18"
          strokeDasharray={`${2 * Math.PI * 18}`}
          strokeDashoffset={`${2 * Math.PI * 18 * (1 - pct / 100)}`}
        />
      </svg>
      <span className="countdown-number">{remaining}</span>
    </div>
  );
}
