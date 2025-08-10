"use client";

import * as React from "react";

export function PolylinePreview({ encoded }: { encoded: string }) {
  const pts = React.useMemo(() => decodePolyline(encoded), [encoded]);
  if (!pts.length)
    return (
      <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
        No route
      </div>
    );

  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  for (const [lat, lng] of pts) {
    if (lng < minX) minX = lng;
    if (lng > maxX) maxX = lng;
    if (lat < minY) minY = lat;
    if (lat > maxY) maxY = lat;
  }
  const w = maxX - minX || 1;
  const h = maxY - minY || 1;
  const pad = 0.05;
  const width = 800,
    height = 300;

  const d = pts
    .map(([lat, lng], i) => {
      const x = ((lng - minX) / w) * (1 - 2 * pad) * width + pad * width;
      const y = (1 - (lat - minY) / h) * (1 - 2 * pad) * height + pad * height;
      return `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-full w-full">
      <rect
        x="0"
        y="0"
        width={width}
        height={height}
        className="fill-background/40"
      />
      {/* halo */}
      <path
        d={d}
        stroke="white"
        strokeOpacity={0.35}
        strokeWidth={5}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* main route */}
      <path
        d={d}
        className="text-[#FC4C02]"
        stroke="currentColor"
        strokeWidth={3}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function decodePolyline(str: string, precision = 5): [number, number][] {
  let index = 0,
    lat = 0,
    lng = 0;
  const coordinates: [number, number][] = [];
  const factor = Math.pow(10, precision);

  while (index < str.length) {
    let b,
      shift = 0,
      result = 0;
    do {
      b = str.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = str.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    coordinates.push([lat / factor, lng / factor]);
  }
  return coordinates;
}
