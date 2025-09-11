// Minimal telemetry utilities for offline simulations.
export type TelemetryEvent = { type: string; payload?: Record<string, unknown> };

const events: TelemetryEvent[] = [];

export function record(e: TelemetryEvent) {
	events.push(e);
}

export function drain(): TelemetryEvent[] {
	const copy = events.slice();
	events.length = 0;
	return copy;
}

export default { record, drain };
