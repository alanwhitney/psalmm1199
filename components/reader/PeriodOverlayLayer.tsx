"use client";

import { Fragment } from "react";
import { LayerGroup, Polygon, Polyline, CircleMarker, Marker, Tooltip } from "react-leaflet";
import L from "leaflet";
import { PeriodMap, LatLon } from "@/lib/data/period-maps";

function bearing([lat1, lon1]: LatLon, [lat2, lon2]: LatLon): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const y = Math.sin(toRad(lon2 - lon1)) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(toRad(lon2 - lon1));
  return (Math.atan2(y, x) * 180) / Math.PI;
}

function midpoint([lat1, lon1]: LatLon, [lat2, lon2]: LatLon): LatLon {
  return [(lat1 + lat2) / 2, (lon1 + lon2) / 2];
}

function arrowIcon(angle: number, color: string) {
  return L.divIcon({
    html: `<svg width="14" height="14" viewBox="0 0 14 14" style="transform: rotate(${angle}deg)">
      <path d="M7 0 L13 12 L7 9 L1 12 Z" fill="${color}" stroke="white" stroke-width="0.5"/>
    </svg>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
    className: "",
  });
}

export default function PeriodOverlayLayer({ data }: { data: PeriodMap }) {
  return (
    <LayerGroup>
      {data.regions?.map((region) => (
        <Polygon
          key={region.name}
          positions={region.coordinates}
          pathOptions={{
            color: region.color,
            weight: 1.5,
            fillColor: region.color,
            fillOpacity: 0.18,
          }}
        >
          <Tooltip permanent direction="center" className="period-region-label">
            {region.name}
          </Tooltip>
        </Polygon>
      ))}

      {data.routes?.map((route) => {
        const arrows = route.coordinates.slice(1).map((coord, i) => {
          const from = route.coordinates[i];
          const to = coord;
          return {
            pos: midpoint(from, to),
            angle: bearing(from, to),
          };
        });
        return (
          <Fragment key={route.name}>
            <Polyline
              positions={route.coordinates}
              pathOptions={{
                color: route.color,
                weight: 3,
                dashArray: route.dashed ? "6 6" : undefined,
              }}
            >
              <Tooltip sticky>{route.name}</Tooltip>
            </Polyline>
            {arrows.map((a, i) => (
              <Marker
                key={`${route.name}-arrow-${i}`}
                position={a.pos}
                icon={arrowIcon(a.angle, route.color)}
                interactive={false}
              />
            ))}
          </Fragment>
        );
      })}

      {data.points?.map((point) => (
        <CircleMarker
          key={point.name}
          center={[point.lat, point.lon]}
          radius={4}
          pathOptions={{ color: "#333", weight: 1, fillColor: "#f5f0e6", fillOpacity: 1 }}
        >
          <Tooltip direction="top" offset={[0, -4]}>
            {point.name}
          </Tooltip>
        </CircleMarker>
      ))}
    </LayerGroup>
  );
}
