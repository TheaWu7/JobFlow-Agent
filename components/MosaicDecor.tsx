"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import styles from "./MosaicDecor.module.css";

// 客户端用 useLayoutEffect（首帧前完成，避免闪烁），服务端退化为 useEffect
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

const TILE = 18; // 目标格子边长（px）
const BULGE = 0.12; // 椭圆切角的凹进程度：0=直线，越大越凹

type Tile = {
  key: string;
  x: number;
  y: number;
  s: number;
  dark: boolean;
  opacity: number;
};

function buildTiles(w: number, h: number, flip: boolean): Tile[] {
  if (w <= 0 || h <= 0) return [];
  const cols = Math.max(1, Math.round(w / TILE));
  const tile = w / cols;
  const rows = Math.round(h / tile);
  const tiles: Tile[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cx = (c + 0.5) * tile;
      const cy = (r + 0.5) * tile;
      const u = cx / w; // x 归一化到 0..1
      // 椭圆切角弧线（凹向角落）；flip 时上下镜像，形成中心对称
      const edge = h * (u + (flip ? 1 : -1) * BULGE * 2 * Math.sqrt(u * (1 - u)));
      const inside = flip ? cy >= edge : cy <= edge;
      if (!inside) continue;
      const dist = flip ? cy - edge : edge - cy;
      const t = Math.min(1, Math.max(0, dist / h));
      const opacity = t * t * (3 - 2 * t); // smoothstep：暗角式柔和过渡
      if (opacity <= 0.01) continue;
      tiles.push({
        key: `${c}-${r}`,
        x: c * tile,
        y: r * tile,
        s: tile,
        dark: (c + r) % 2 === 0,
        opacity,
      });
    }
  }
  return tiles;
}

export function MosaicDecor({ corner = "tr" }: { corner?: "tr" | "bl" }) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });

  useIsomorphicLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const tiles = useMemo(() => buildTiles(size.w, size.h, corner === "bl"), [size, corner]);

  return (
    <div
      ref={ref}
      className={corner === "bl" ? styles.decorBl : styles.decor}
      aria-hidden="true"
    >
      {size.w > 0 && size.h > 0 && (
        <svg
          className={styles.svg}
          width="100%"
          height="100%"
          viewBox={`0 0 ${size.w} ${size.h}`}
          preserveAspectRatio="none"
        >
          {tiles.map((t) => (
            <rect
              key={t.key}
              x={t.x}
              y={t.y}
              width={t.s}
              height={t.s}
              className={t.dark ? styles.tileDark : styles.tileLight}
              fillOpacity={t.opacity}
            />
          ))}
        </svg>
      )}
    </div>
  );
}
