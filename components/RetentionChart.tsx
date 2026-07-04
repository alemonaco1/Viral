"use client";

import { useEffect, useRef } from "react";
import {
  Chart, LineController, LineElement, PointElement,
  LinearScale, CategoryScale, Filler, Tooltip,
} from "chart.js";

Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Filler, Tooltip);

interface Props {
  bestCurve: number[] | null;
  avgCurve: number[] | null;
}

/**
 * Curva de retenção segundo a segundo.
 * `bestCurve`/`avgCurve` vêm de `post_metrics.retention_curve` (jsonb) —
 * hoje só populado quando a conta tem acesso ao TikTok Research API ou
 * dados exportados via TikTok Ads Manager. Sem isso, mostramos um estado
 * vazio em vez de inventar números (ver `EmptyRetentionState` no dashboard).
 */
export default function RetentionChart({ bestCurve, avgCurve }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current || !bestCurve) return;

    chartRef.current?.destroy();

    chartRef.current = new Chart(canvasRef.current, {
      type: "line",
      data: {
        labels: bestCurve.map((_, i) => i),
        datasets: [
          {
            data: bestCurve,
            borderColor: "#00B893",
            backgroundColor: "rgba(0,184,147,0.08)",
            fill: true,
            tension: 0.35,
            pointRadius: 0,
            borderWidth: 2.5,
          },
          ...(avgCurve
            ? [{
                data: avgCurve,
                borderColor: "#4B4FE0",
                backgroundColor: "transparent",
                fill: false,
                tension: 0.35,
                pointRadius: 0,
                borderWidth: 2,
                borderDash: [4, 3],
              }]
            : []),
        ],
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false }, title: { display: true, text: "segundos" } },
          y: { grid: { color: "#EFF1ED" }, ticks: { callback: (v) => `${v}%` } },
        },
      },
    });

    return () => chartRef.current?.destroy();
  }, [bestCurve, avgCurve]);

  if (!bestCurve) {
    return (
      <div className="h-[180px] flex items-center justify-center border border-dashed border-line rounded-xl text-sm text-ink-soft text-center px-6">
        Sem curva de retenção ainda. Esse dado depende de acesso ao TikTok Research API
        ou exportação via TikTok Ads Manager — veja o README para solicitar.
      </div>
    );
  }

  return <canvas ref={canvasRef} height={150} />;
}
