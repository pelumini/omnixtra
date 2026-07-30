import { describe, expect, it } from "vitest";

import { healthEnvelopeSchema } from "@/lib/schemas";

describe("healthEnvelopeSchema", () => {
  it("accepts the API health envelope", () => {
    expect(
      healthEnvelopeSchema.parse({
        data: { status: "ok" },
        error: null,
        meta: { request_id: "req_test", timestamp: null },
      }),
    ).toEqual({
      data: { status: "ok" },
      error: null,
      meta: { request_id: "req_test", timestamp: null },
    });
  });
});
