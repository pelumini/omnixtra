import { describe, expect, it } from "vitest";

import {
  courseWithFirstLessonFormSchema,
  firstLessonFormSchema,
} from "@/features/courses";
import { quizAttemptFormSchema, tutorQuestionFormSchema } from "@/features/learning";
import { createUserFormSchema } from "@/features/members";
import { resolveMessage } from "@/lib/forms/messages";
import { partitionServerError } from "@/lib/forms/server-errors";
import {
  acceptInvitationSchema,
  createAcademySchema,
  signInSchema,
} from "@/lib/schemas/auth";

describe("form standard helpers", () => {
  it("resolves field-specific validation messages before generic fallbacks", () => {
    expect(resolveMessage("password", "min_length")).toBe("Use at least 12 characters.");
    expect(resolveMessage("email", "required")).toBe("Enter your email address.");
    expect(resolveMessage("email", "email")).toBe("Enter a valid email address.");
    expect(resolveMessage("password", "required")).toBe("Enter your password.");
    expect(resolveMessage("token", "required")).toBe("Enter your invitation code.");
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

  it("keeps login required messages field-specific rather than generic", () => {
    const result = signInSchema.safeParse({ email: "", password: "" });

    expect(result.success).toBe(false);
    if (result.success) {
      return;
    }

    const messages = result.error.issues.map((issue) =>
      resolveMessage(String(issue.path[0]), String(issue.message)),
    );
    expect(messages).toEqual(["Enter your email address.", "Enter your password."]);
    expect(messages).not.toContain("This field is required.");
  });

  it("uses the shared constraint vocabulary across web forms", () => {
    const forms = [
      {
        field: "academyName",
        input: { academyName: "", email: "", firstName: "", lastName: "", password: "", phone: "", subdomain: "" },
        schema: createAcademySchema,
      },
      {
        field: "password",
        input: { confirmPassword: "", password: "" },
        schema: acceptInvitationSchema,
      },
      {
        field: "courseTitle",
        input: { courseDescription: "", courseTitle: "", lessonBody: "", lessonTitle: "" },
        schema: courseWithFirstLessonFormSchema,
      },
      {
        field: "title",
        input: { body: "", title: "" },
        schema: firstLessonFormSchema,
      },
      {
        field: "email",
        input: { email: "", firstName: "", lastName: "", phone: "", orgRole: "member" },
        schema: createUserFormSchema,
      },
      {
        field: "blockId",
        input: { blockId: "", selectedOptionId: "" },
        schema: quizAttemptFormSchema,
      },
      {
        field: "question",
        input: { question: "" },
        schema: tutorQuestionFormSchema,
      },
    ];

    for (const form of forms) {
      const result = form.schema.safeParse(form.input);
      expect(result.success).toBe(false);
      if (result.success) {
        continue;
      }
      const issue = result.error.issues.find((item) => item.path[0] === form.field);
      expect(issue).toBeDefined();
      expect(resolveMessage(form.field, String(issue?.message))).not.toBe("Please check this field.");
    }
  });
});
