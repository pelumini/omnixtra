import { describe, expect, it } from "vitest";

import { resolveMessage } from "@/lib/forms/messages";
import { partitionServerError } from "@/lib/forms/server-errors";

describe("form standard helpers", () => {
  it("resolves field-specific validation messages before generic fallbacks", () => {
    expect(resolveMessage("password", "min_length")).toBe("Use at least 12 characters.");
    expect(resolveMessage("email", "email")).toBe("Enter a valid email address.");
    expect(resolveMessage("unknown", "unknown")).toBe("Please check this field.");
  });

  it("splits field errors from form-level errors", () => {
    expect(
      partitionServerError({
        details: [{ constraint: "subdomain_taken", field: "subdomain" }],
        message: "That value is taken.",
        type: "ConflictError",
      }),
    ).toEqual({
      fieldErrors: [{ constraint: "subdomain_taken", field: "subdomain" }],
      formMessage: null,
    });

    expect(
      partitionServerError({
        details: [],
        message: "That email and password do not match.",
        type: "AuthenticationError",
      }),
    ).toEqual({
      fieldErrors: [],
      formMessage: "That email and password do not match.",
    });
  });
});
