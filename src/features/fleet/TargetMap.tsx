import { useEffect } from "react";
import "leaflet/dist/leaflet.css";
import {
  Circle,
  MapContainer,
  Marker,
  Polygon,
  Polyline,
  TileLayer,
  Tooltip,
  useMap,
} from "react-leaflet";
import { hasCoverage } from "@/models";
import { ACTIVE_TILE_SOURCE_ID, TILE_SOURCES } from "@/config/map";
import { coveragePolygon } from "./geo";
import { makeMarkerIcon } from "./markers";
import { targetFocus, type ResolvedTarget } from "./targets";

const AP_COLOR = "#22d3ee";
const DEVICE_COLOR = "#f472b6";

/** Keeps Leaflet sized correctly when the container (e.g. the Rnd window) resizes. */
function AutoResize() {
  const map = useMap();
  useEffect(() => {
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(map.getContainer());
    return () => observer.disconnect();
  }, [map]);
  return null;
}

function Focus({ target }: { target: ResolvedTarget }) {
  const map = useMap();
  useEffect(() => {
    const ap = target.servingAp;
    if (target.exactLocation) {
      map.fitBounds([[ap.lat, ap.lng], target.exactLocation], { padding: [40, 40], maxZoom: 15 });
    } else {
      map.setView(targetFocus(target), 13);
    }
  }, [map, target]);
  return null;
}

/**
 * Map focused on a single command target. Shows the servicing access point and,
 * for a device target, either its exact position (marker + link line) or an
 * approximate area (circle) around the servicing AP.
 */
export function TargetMap({ target, showCoverage = true }: { target: ResolvedTarget; showCoverage?: boolean }) {
  const tile = TILE_SOURCES[ACTIVE_TILE_SOURCE_ID];
  const ap = target.servingAp;
  const approxRadius = ap.rangeM ?? 500;

  return (
    <MapContainer center={targetFocus(target)} zoom={13} className="h-full w-full" scrollWheelZoom>
      <TileLayer
        url={tile.url}
        attribution={tile.attribution}
        maxZoom={tile.maxZoom}
        {...(tile.subdomains ? { subdomains: tile.subdomains } : {})}
      />
      <AutoResize />
      <Focus target={target} />

      {/* Servicing access point */}
      <Marker position={[ap.lat, ap.lng]} icon={makeMarkerIcon(AP_COLOR)}>
        <Tooltip>
          {ap.name}
          <br />
          <span className="text-xs">serving AP · {ap.ip}</span>
        </Tooltip>
      </Marker>
      {showCoverage && hasCoverage(ap) && (
        <Polygon
          positions={coveragePolygon(ap)}
          pathOptions={{ color: AP_COLOR, weight: 1, fillColor: AP_COLOR, fillOpacity: 0.12 }}
        />
      )}

      {/* Device target */}
      {target.kind === "device" &&
        (target.exactLocation ? (
          <>
            <Polyline
              positions={[[ap.lat, ap.lng], target.exactLocation]}
              pathOptions={{ color: DEVICE_COLOR, weight: 1, dashArray: "4 4" }}
            />
            <Marker position={target.exactLocation} icon={makeMarkerIcon(DEVICE_COLOR, { selected: true })}>
              <Tooltip>
                {target.name}
                <br />
                <span className="text-xs">exact location · {target.ip}</span>
              </Tooltip>
            </Marker>
          </>
        ) : (
          <Circle
            center={[ap.lat, ap.lng]}
            radius={approxRadius}
            pathOptions={{ color: DEVICE_COLOR, weight: 1, fillColor: DEVICE_COLOR, fillOpacity: 0.12 }}
          />
        ))}
    </MapContainer>
  );
}
