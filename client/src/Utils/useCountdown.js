import { useEffect, useState } from "react";

export default function useCountdown(until) {
  const [left, setLeft] = useState(() => until - Date.now());

  useEffect(() => {
    if (!until) return;
    const id = setInterval(() => setLeft(until - Date.now()), 1_000);
    return () => clearInterval(id);
  }, [until]);

  
  return Math.max(0, left);
}
