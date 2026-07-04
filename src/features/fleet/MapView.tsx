import { Fragment, useEffect } from "react";
import "leaflet/dist/leaflet.css";
import { MapContainer, Marker, Polygon, TileLayer, Tooltip, useMap } from "react-leaflet";
import type { AccessPoint, Run } from "@/models";
import { hasCoverage } from "@/models";
import {
  ACTIVE_TILE_SOURCE_ID,
  MAP_DEFAULT_CENTER,
  MAP_DEFAULT_ZOOM,
  TILE_SOURCES,
} from "@/config/map";
import { boundsOf, coveragePolygon } from "./geo";
import { isActiveRun, makeMarkerIcon, markerColor } from "./markers";

interface MapViewProps {
  /** Markers to render (already filtered). */
  points: AccessPoint[];
  /** Full dataset — used once to frame the initial view. */
  allPoints: AccessPoint[];
  latestByPc: Record<string, Run>;
  selectedId: string | null;
  showCoverage: boolean;
  onSelect: (id: string) => void;
}

function FitBounds({ points }: { points: AccessPoint[] }) {
  const map = useMap();
  useEffect(() => {
    const bounds = boundsOf(points);
    if (bounds) map.fitBounds(bounds, { padding: [48, 48], maxZoom: 12 });
    // Fit only when the underlying dataset changes, not on every filter tick.
  }, [map, points]);
  return null;
}

export function MapView({
  points,
  allPoints,
  latestByPc,
  selectedId,
  showCoverage,
  onSelect,
}: MapViewProps) {
  const tile = TILE_SOURCES[ACTIVE_TILE_SOURCE_ID];

  return (
    <MapContainer
      center={MAP_DEFAULT_CENTER}
      zoom={MAP_DEFAULT_ZOOM}
      className="h-full w-full"
      scrollWheelZoom
    >
      <TileLayer
        url={tile.url}
        attribution={tile.attribution}
        maxZoom={tile.maxZoom}
        {...(tile.subdomains ? { subdomains: tile.subdomains } : {})}
      />
      <FitBounds points={allPoints} />

      {points.map((ap) => {
        const latest = latestByPc[ap.id];
        const color = markerColor(ap, latest);
        const selected = ap.id === selectedId;

        return (
          <Fragment key={ap.id}>
            {showCoverage && hasCoverage(ap) && (
              <Polygon
                positions={coveragePolygon(ap)}
                pathOptions={{
                  color,
                  weight: 1,
                  fillColor: color,
                  fillOpacity: selected ? 0.28 : 0.14,
                }}
              />
            )}
            <Marker
              position={[ap.lat, ap.lng]}
              icon={makeMarkerIcon(color, { selected, active: isActiveRun(latest) })}
              eventHandlers={{ click: () => onSelect(ap.id) }}
            >
              <Tooltip direction="top" offset={[0, -8]}>
                <span className="font-medium">{ap.name}</span>
                <br />
                <span className="font-mono text-xs">{ap.ip}</span>
              </Tooltip>
            </Marker>
          </Fragment>
        );
      })}
    </MapContainer>
  );
}
