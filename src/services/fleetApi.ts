import type { AccessPoint, ConnectedDevice, FleetData } from "@/models";
import { numOrNull, parseCsv } from "@/lib/csv";

/**
 * Fleet data service. Loads the two bundled CSVs (parents + children) from
 * /public/data, or an uploaded CSV that replaces them for the session.
 * Unknown columns are preserved in `extra` so the schema can grow freely.
 *
 * To edit the fleet: change public/data/access-points.csv and
 * public/data/connected-devices.csv, or use "Upload CSV" in the UI.
 */

const AP_URL = "/data/access-points.csv";
const DEV_URL = "/data/connected-devices.csv";

const AP_KNOWN = new Set(["id", "name", "ip", "lat", "lng", "group", "deviceStatus", "heading", "fov", "range"]);
const DEV_KNOWN = new Set(["id", "parentId", "name", "ip", "type", "lat", "lng"]);

// Session overrides set by CSV upload (null = use the bundled file).
let overrideApsCsv: string | null = null;
let overrideDevCsv: string | null = null;

export function setAccessPointsCsv(text: string): void {
  overrideApsCsv = text;
}
export function setConnectedDevicesCsv(text: string): void {
  overrideDevCsv = text;
}
export function resetFleetOverrides(): void {
  overrideApsCsv = null;
  overrideDevCsv = null;
}
export function hasFleetOverride(): boolean {
  return overrideApsCsv !== null || overrideDevCsv !== null;
}

function extraOf(record: Record<string, string>, known: Set<string>): Record<string, string> {
  const extra: Record<string, string> = {};
  for (const [key, value] of Object.entries(record)) {
    if (!known.has(key) && value !== "") extra[key] = value;
  }
  return extra;
}

function toAccessPoint(record: Record<string, string>, index: number): AccessPoint | null {
  const lat = numOrNull(record.lat);
  const lng = numOrNull(record.lng);
  if (lat === null || lng === null) return null; // rows without coordinates can't be mapped
  return {
    id: record.id?.trim() || `ap-${String(index + 1).padStart(3, "0")}`,
    name: record.name?.trim() || "Unnamed access point",
    ip: record.ip?.trim() || "",
    lat,
    lng,
    group: record.group?.trim() || null,
    deviceStatus: record.deviceStatus?.trim() || null,
    heading: numOrNull(record.heading),
    fov: numOrNull(record.fov),
    rangeM: numOrNull(record.range),
    extra: extraOf(record, AP_KNOWN),
  };
}

function toDevice(record: Record<string, string>, index: number): ConnectedDevice | null {
  const parentId = record.parentId?.trim();
  if (!parentId) return null;
  return {
    id: record.id?.trim() || `dev-${String(index + 1).padStart(3, "0")}`,
    parentId,
    name: record.name?.trim() || "Unnamed device",
    ip: record.ip?.trim() || null,
    type: record.type?.trim() || null,
    lat: numOrNull(record.lat),
    lng: numOrNull(record.lng),
    extra: extraOf(record, DEV_KNOWN),
  };
}

async function loadText(url: string, override: string | null): Promise<string> {
  if (override !== null) return override;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load ${url} (${res.status})`);
  return res.text();
}

export async function fetchFleet(): Promise<FleetData> {
  const [apsText, devText] = await Promise.all([
    loadText(AP_URL, overrideApsCsv),
    loadText(DEV_URL, overrideDevCsv),
  ]);

  const accessPoints = parseCsv(apsText)
    .map(toAccessPoint)
    .filter((ap): ap is AccessPoint => ap !== null);

  const devicesByParent: Record<string, ConnectedDevice[]> = {};
  parseCsv(devText)
    .map(toDevice)
    .filter((d): d is ConnectedDevice => d !== null)
    .forEach((device) => {
      (devicesByParent[device.parentId] ??= []).push(device);
    });

  return { accessPoints, devicesByParent };
}
