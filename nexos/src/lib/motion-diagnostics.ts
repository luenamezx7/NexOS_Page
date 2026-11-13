/** Local, opt-in observations. Never sends data or changes motion policy. */
export function motionDebugEnabled() {
  return typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('motionDebug') === '1';
}

type Observation = { status: string; atMs: number; detail?: string };
const observations: Record<string, Observation> = {};
const history: { resource: string; observation: Observation }[] = [];

export function recordMotion(resource: string, status: string, detail?: string) {
  if (!motionDebugEnabled()) return;
  if (observations[resource]?.status === status && observations[resource]?.detail === detail) return;
  const observation = { status, atMs: Math.round(performance.now()), ...(detail ? { detail } : {}) };
  observations[resource] = observation;
  history.push({ resource, observation });
  if (history.length > 80) history.shift();
}

export function readMotionObservations() {
  return { resources: { ...observations }, history: [...history] };
}

export function motionError(error: unknown) {
  // Error codes/names suffice; avoid copying URLs or arbitrary exception messages.
  return error instanceof Error ? error.name : 'UnknownError';
}
