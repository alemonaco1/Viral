"use client";

import { useEffect, useRef } from "react";
import { Chart, DoughnutController, ArcElement } from "chart.js";

Chart.register(DoughnutController, ArcElement);

export default function ScoreRing({ score }: { score: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    chartRef.current?.destroy();
    chartRef.current = new Chart(canvasRef.current, {
      type: "doughnut",
      data: { datasets: [{ data: [score, 100 - score], backgroundColor: ["#00B893", "#EEF0EC"], borderWidth: 0 }] },
      options: { cutout: "78%", plugins: { legend: { display: false }, tooltip: { enabled: false } } },
    });
    return () => chartRef.current?.destroy();
  }, [score]);

  return (
    <div className="relative w-24 h-24 shrink-0">
      <canvas ref={canvasRef} />
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-xl font-bold">{score}</span>
        <span className="text-[9px] uppercase tracking-wide text-ink-soft">de 100</span>
      </div>
    </div>
  );
}
