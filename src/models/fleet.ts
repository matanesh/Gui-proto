/**
 * Fleet models — the access points (PCs) shown on the map and their connected
 * devices. Loaded from CSV (see services/fleetApi.ts). Unknown CSV columns are
 * preserved in `extra` so the schema can grow without code changes.
 */

export interface AccessPoint {
  id: string;
  name: string;
  ip: string;
  lat: number;
  lng: number;
  /** Free-form grouping (region/site/unit) — used for filtering. */
  group: string | null;
  /** Device status from the CSV (distinct from command outcome). */
  deviceStatus: string | null;
  /** Optional coverage: heading in degrees from north (clockwise). */
  heading: number | null;
  /** Optional coverage: field-of-view width in degrees. */
  fov: number | null;
  /** Optional coverage: range in meters. */
  rangeM: number | null;
  /** Any additional CSV columns, preserved verbatim. */
  extra: Record<string, string>;
}

export interface ConnectedDevice {
  id: string;
  /** id of the servicing AccessPoint (the router/PC it connects through). */
  parentId: string;
  name: string;
  ip: string | null;
  type: string | null;
  /**
   * Exact last-known location, if a command returned it. When null, the device
   * location is only approximate (derived from its servicing access point).
   */
  lat: number | null;
  lng: number | null;
  extra: Record<string, string>;
}

/** True when the device reported an exact position (vs. approximate-via-AP). */
export function hasExactLocation(device: ConnectedDevice): boolean {
  return device.lat !== null && device.lng !== null;
}

/** An access point joined with its connected devices, for the details panel. */
export interface AccessPointWithDevices extends AccessPoint {
  devices: ConnectedDevice[];
}

export interface FleetData {
  accessPoints: AccessPoint[];
  devicesByParent: Record<string, ConnectedDevice[]>;
}

/** Whether a coverage sector can be drawn for this access point. */
export function hasCoverage(ap: AccessPoint): boolean {
  return ap.heading !== null && ap.fov !== null && ap.rangeM !== null && ap.rangeM > 0;
}
