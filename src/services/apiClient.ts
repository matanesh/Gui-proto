/**
 * Mock API client. Simulates network latency and occasional failures so the
 * UI's loading/error paths are real. Swapping in the real FastAPI BFF means
 * replacing `simulateRequest` calls with `fetch` against the endpoints in
 * docs/API_CONTRACT.md — no component changes required.
 */

export class ApiError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
  }
}

interface SimulateOptions {
  /** Probability [0..1] of a simulated 5xx failure. */
  failRate?: number;
  minDelayMs?: number;
  maxDelayMs?: number;
}

const DEFAULTS: Required<SimulateOptions> = {
  failRate: 0.05,
  minDelayMs: 150,
  maxDelayMs: 600,
};

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Wraps a synchronous mock resolver in latency + failure simulation.
 * The resolver runs after the delay so mutations feel transactional.
 */
export async function simulateRequest<T>(
  resolve: () => T,
  options: SimulateOptions = {},
): Promise<T> {
  const { failRate, minDelayMs, maxDelayMs } = { ...DEFAULTS, ...options };
  await delay(minDelayMs + Math.random() * (maxDelayMs - minDelayMs));

  if (Math.random() < failRate) {
    throw new ApiError(
      "INTERNAL_ERROR",
      503,
      "Simulated transient service error. Retry is safe.",
    );
  }
  return resolve();
}
