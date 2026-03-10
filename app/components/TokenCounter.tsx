"use client";

import { useEffect, useRef, useState } from "react";

import { fmtTokens } from "@/lib/format";

const DURATION = 3200;

export default function TokenCounter({ target }: { target: number }) {
  const start = Math.floor(target * 0.85);
  const [displayed, setDisplayed] = useState(start);
  const t0 = useRef<number | null>(null);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    if (!target) return;

    function frame(now: number) {
      if (t0.current === null) t0.current = now;
      const progress = Math.min((now - t0.current) / DURATION, 1);
      // ease-out quart: decelerates heavily near the end
      const ease = 1 - Math.pow(1 - progress, 4);
      setDisplayed(Math.round(start + (target - start) * ease));
      if (progress < 1) {
        raf.current = requestAnimationFrame(frame);
      }
    }

    raf.current = requestAnimationFrame(frame);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [target, start]);

  return <>{fmtTokens(displayed)}</>;
}
