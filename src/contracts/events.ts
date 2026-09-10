export const EVENT_CONTRACT_VERSION = "v1" as const;

export type SourceService = "billing-service" | "identity-service" | "webhook-service";

export interface ServiceEvent<TPayload extends Record<string, unknown> = Record<string, unknown>> {
  eventType: string;
  sourceService: SourceService;
  occurredAt: string;
  requestId: string;
  payload: TPayload;
}

export const EVENT_TYPE_PATTERN = /^[a-zA-Z0-9._-]{1,64}$/;

export function isValidEventType(eventType: string): boolean {
  return EVENT_TYPE_PATTERN.test(eventType);
}

export function buildServiceEvent<T extends Record<string, unknown>>(params: {
  eventType: string;
  sourceService: SourceService;
  requestId: string;
  payload: T;
  occurredAt?: string;
}): ServiceEvent<T> {
  if (!isValidEventType(params.eventType)) {
    throw new Error("invalid_event_type_format");
  }
  const requestId = params.requestId.trim();
  if (!requestId || requestId.length > 128) {
    throw new Error("invalid_request_id");
  }
  return {
    eventType: params.eventType,
    sourceService: params.sourceService,
    occurredAt: params.occurredAt ?? new Date().toISOString(),
    requestId,
    payload: params.payload,
  };
}
