"use client";
import { useEffect, useRef, useState } from "react";
import { useGMPRuntime } from "../GMPRuntimeProvider";
import type { GMPSnapshot } from "../contracts";
export function useGMPValue<T>(
  select: (snapshot: GMPSnapshot) => T,
  equal: (a: T, b: T) => boolean = Object.is,
): T {
  const runtime = useGMPRuntime();
  const selector = useRef(select);
  selector.current = select;
  const equality = useRef(equal);
  equality.current = equal;
  const [value, setValue] = useState(() => select(runtime.getSnapshot()));
  const current = useRef(value);
  useEffect(() => {
    const update = (snapshot: GMPSnapshot) => {
      const next = selector.current(snapshot);
      if (!equality.current(current.current, next)) {
        current.current = next;
        setValue(next);
      }
    };
    update(runtime.getSnapshot());
    return runtime.subscribe(update);
  }, [runtime]);
  return value;
}
