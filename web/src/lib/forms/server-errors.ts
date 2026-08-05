export type ApiFieldError = {
  field: string;
  constraint: string;
  message?: string | null;
};

export type ApiError = {
  type: string;
  message: string;
  details?: ApiFieldError[];
};

export type ApiErrorEnvelope = {
  data: null;
  error: ApiError;
};

export function isApiErrorEnvelope(value: unknown): value is ApiErrorEnvelope {
  return (
    typeof value === "object" &&
    value !== null &&
    "data" in value &&
    (value as { data: unknown }).data === null &&
    "error" in value &&
    typeof (value as { error: unknown }).error === "object" &&
    (value as { error: unknown }).error !== null
  );
}

export function partitionServerError(error: ApiError): {
  fieldErrors: ApiFieldError[];
  formMessage: string | null;
} {
  const details = error.details ?? [];
  const fieldErrors = details.filter((detail) => detail.field.length > 0);
  return {
    fieldErrors,
    formMessage: fieldErrors.length > 0 ? null : error.message,
  };
}
