import type { AccessPoint, ConnectedDevice, FleetData } from "@/models";
import { hasExactLocation } from "@/models";

/**
 * A command target resolved from an IP/name query. A target is either an access
 * point (fixed infrastructure) or a connected device (phone/laptop that roams
 * and connects through a servicing access point).
 */
export interface ResolvedTarget {
  kind: "ap" | "device";
  id: string;
  name: string;
  ip: string;
  /** Servicing access point (the AP itself when kind === "ap"). */
  servingAp: AccessPoint;
  /**
   * Exact target coordinates if known (a command returned them). When null, the
   * location is only approximate — an area around the servicing access point.
   */
  exactLocation: [number, number] | null;
  device: ConnectedDevice | null;
}

export interface TargetOption {
  kind: "ap" | "device";
  id: string;
  name: string;
  ip: string;
}

/** Flat list of everything targetable, for autocomplete. */
export function buildTargetOptions(fleet: FleetData): TargetOption[] {
  const options: TargetOption[] = fleet.accessPoints.map((ap) => ({
    kind: "ap",
    id: ap.id,
    name: ap.name,
    ip: ap.ip,
  }));
  for (const devices of Object.values(fleet.devicesByParent)) {
    for (const d of devices) {
      if (d.ip) options.push({ kind: "device", id: d.id, name: d.name, ip: d.ip });
    }
  }
  return options;
}

export function accessPointTarget(ap: AccessPoint): ResolvedTarget {
  return apTarget(ap);
}

function apTarget(ap: AccessPoint): ResolvedTarget {
  return {
    kind: "ap",
    id: ap.id,
    name: ap.name,
    ip: ap.ip,
    servingAp: ap,
    exactLocation: [ap.lat, ap.lng],
    device: null,
  };
}

function deviceTarget(
  device: ConnectedDevice,
  apById: Map<string, AccessPoint>,
): ResolvedTarget | null {
  const ap = apById.get(device.parentId);
  if (!ap) return null;
  return {
    kind: "device",
    id: device.id,
    name: device.name,
    ip: device.ip ?? "",
    servingAp: ap,
    exactLocation: hasExactLocation(device) ? [device.lat!, device.lng!] : null,
    device,
  };
}

/** Resolve a query (exact IP first, then id, then name-contains) to a target. */
export function resolveTarget(query: string, fleet: FleetData): ResolvedTarget | null {
  const q = query.trim().toLowerCase();
  if (!q) return null;

  const apById = new Map(fleet.accessPoints.map((a) => [a.id, a]));
  const devices = Object.values(fleet.devicesByParent).flat();

  // 1. exact IP
  const apIp = fleet.accessPoints.find((a) => a.ip.toLowerCase() === q);
  if (apIp) return apTarget(apIp);
  const devIp = devices.find((d) => d.ip?.toLowerCase() === q);
  if (devIp) return deviceTarget(devIp, apById);

  // 2. exact id
  const apId = fleet.accessPoints.find((a) => a.id.toLowerCase() === q);
  if (apId) return apTarget(apId);
  const devId = devices.find((d) => d.id.toLowerCase() === q);
  if (devId) return deviceTarget(devId, apById);

  // 3. name contains
  const apName = fleet.accessPoints.find((a) => a.name.toLowerCase().includes(q));
  if (apName) return apTarget(apName);
  const devName = devices.find((d) => d.name.toLowerCase().includes(q));
  if (devName) return deviceTarget(devName, apById);

  return null;
}

/** Where the map should center for a target. */
export function targetFocus(target: ResolvedTarget): [number, number] {
  return target.exactLocation ?? [target.servingAp.lat, target.servingAp.lng];
}
