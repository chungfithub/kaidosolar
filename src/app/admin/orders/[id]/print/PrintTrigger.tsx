"use client";

import { useEffect } from "react";

export default function PrintTrigger({ label = "🖨️ In Báo Giá" }: { label?: string }) {
  useEffect(() => {
    // Small delay to ensure styles and images are fully loaded
    const timeout = setTimeout(() => {
      window.print();
    }, 500);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <button className="btn-print no-print" onClick={() => window.print()}>
      {label}
    </button>
  );
}
