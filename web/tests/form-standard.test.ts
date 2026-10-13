import { describe, expect, it } from "vitest";

import {
  blockFormSchema,
  courseFormSchema,
  firstLessonFormSchema,
  lessonFormSchema,
  mediaFormSchema,
  sectionFormSchema,
} from "@/features/courses";
import {
  quizAttemptFormSchema,
  tutorQuestionFormSchema,
} from "@/features/learning";
import { createUserFormSchema } from "@/features/members";
import { resolveMessage } from "@/lib/forms/messages";
import { partitionServerError } from "@/lib/forms/server-errors";
import {
  acceptInvitationSchema,
  createAcademySchema,
  signInSchema,
} from "@/lib/schemas/auth";
import { passwordSchema } from "@/lib/validation/primitives";

describe("form standard helpers", () => {
  it("resolves field-specific validation messages before generic fallbacks", () => {
    expect(resolveMessage("password", "min_length")).toBe(
      "Use at least 12 characters.",
    );
    expect(resolveMessage("firstName", "required")).toBe(
      "Enter your first name.",
    );
    expect(resolveMessage("lastName", "required")).toBe(
      "Enter your last name.",
    );
    expect(resolveMessage("phone", "required")).toBe("Enter a phone number.");
    expect(resolveMessage("email", "required")).toBe(
      "Enter your email address.",
    );
    expect(resolveMessage("email", "email")).toBe(
      "Enter a valid email address.",
    );
    expect(resolveMessage("password", "required")).toBe("Create a password.");
    expect(resolveMessage("academyName", "required")).toBe(
      "Give your academy a name.",
    );
    expect(resolveMessage("subdomain", "required")).toBe("Choose a subdomain.");
    expect(resolveMessage("subdomain", "min_length")).toBe(
      "Use at least 2 characters.",
    );
    expect(resolveMessage("orgRole", "required")).toBe("Choose a role.");
    expect(resolveMessage("confirmPassword", "password_mismatch")).toBe(
      "Passwords must match.",
    );
    expect(resolveMessage("unknown", "required")).toBe(
      "This field can't be blank.",
    );
    expect(resolveMessage("token", "required")).toBe(
      "Enter your invitation code.",
    );
    expect(resolveMessage("unknown", "unknown")).toBe(
      "Please check this field.",
    );
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
    expect(messages).toEqual([
      "Enter your email address.",
      "Create a password.",
    ]);
    expect(messages).not.toContain("This field can't be blank.");
  });

  it("distinguishes blank academy fields from values that are too short", () => {
    const blank = createAcademySchema.safeParse({
      academyName: "   ",
      email: "",
      firstName: "   ",
      lastName: "",
      password: "",
      phone: "   ",
      subdomain: "   ",
    });
    expect(blank.success).toBe(false);
    if (blank.success) {
      return;
    }

    const blankConstraints = Object.fromEntries(
      blank.error.issues.map((issue) => [
        String(issue.path[0]),
        String(issue.message),
      ]),
    );
    expect(blankConstraints).toMatchObject({
      academyName: "required",
      email: "required",
      firstName: "required",
      lastName: "required",
      password: "required",
      phone: "required",
      subdomain: "required",
    });

    const short = createAcademySchema.safeParse({
      academyName: "A",
      email: "admin@example.com",
      firstName: "A",
      lastName: "B",
      password: "short",
      phone: "1",
      subdomain: "a",
    });
    expect(short.success).toBe(false);
    if (short.success) {
      return;
    }

    const shortConstraints = Object.fromEntries(
      short.error.issues.map((issue) => [
        String(issue.path[0]),
        String(issue.message),
      ]),
    );
    expect(shortConstraints).toMatchObject({
      academyName: "min_length",
      password: "min_length",
      subdomain: "min_length",
    });
    expect(shortConstraints).not.toHaveProperty("firstName");
    expect(shortConstraints).not.toHaveProperty("lastName");
    expect(shortConstraints).not.toHaveProperty("phone");
  });

  it("does not trim passwords before validating their length", () => {
    expect(passwordSchema.safeParse(" ".repeat(12)).success).toBe(true);
  });

  it("uses the shared constraint vocabulary across web forms", () => {
    const forms = [
      {
        field: "academyName",
        input: {
          academyName: "",
          email: "",
          firstName: "",
          lastName: "",
          password: "",
          phone: "",
          subdomain: "",
        },
        schema: createAcademySchema,
      },
      {
        field: "password",
        input: { confirmPassword: "", password: "" },
        schema: acceptInvitationSchema,
      },
      {
        field: "title",
        input: { description: "", title: "" },
        schema: courseFormSchema,
      },
      {
        field: "title",
        input: { body: "", title: "" },
        schema: firstLessonFormSchema,
      },
      {
        field: "title",
        input: { title: "" },
        schema: sectionFormSchema,
      },
      {
        field: "title",
        input: { sectionId: "", title: "" },
        schema: lessonFormSchema,
      },
      {
        field: "body",
        input: { blockType: "content", body: "", lessonId: "" },
        schema: blockFormSchema,
      },
      {
        field: "fileName",
        input: { byteSize: 1, contentType: "image/png", fileName: "" },
        schema: mediaFormSchema,
      },
      {
        field: "email",
        input: {
          email: "",
          firstName: "",
          lastName: "",
          phone: "",
          orgRole: "member",
        },
        schema: createUserFormSchema,
      },
      {
        field: "orgRole",
        input: {
          email: "person@example.com",
          firstName: "A",
          lastName: "B",
          phone: "1",
        },
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
      const issue = result.error.issues.find(
        (item) => item.path[0] === form.field,
      );
      expect(issue).toBeDefined();
      expect(issue?.message).toBe("required");
      expect(resolveMessage(form.field, String(issue?.message))).not.toBe(
        "Please check this field.",
      );
    }
  });
});
