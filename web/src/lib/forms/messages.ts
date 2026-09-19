type ConstraintKey =
  | "required"
  | "email"
  | "min_length"
  | "max_length"
  | "min_value"
  | "number"
  | "slug_format"
  | "subdomain_format"
  | "subdomain_taken"
  | "email_taken"
  | "invalid_credentials"
  | "invitation_invalid";

const genericMessages: Record<ConstraintKey, string> = {
  required: "This field is required.",
  email: "Enter a valid email address.",
  min_length: "This is too short.",
  max_length: "This is too long.",
  min_value: "Enter a value above zero.",
  number: "Enter a valid number.",
  slug_format: "Use lowercase letters, numbers, and hyphens only.",
  subdomain_format: "Use lowercase letters, numbers, and hyphens only.",
  subdomain_taken: "That subdomain is taken. Try another.",
  email_taken: "An account with this email already exists.",
  invalid_credentials: "That email and password do not match.",
  invitation_invalid: "This invitation is not valid. Ask for a new one.",
};

const fieldOverrides: Record<string, string> = {
  "academyName.min_length": "Give your academy a name.",
  "courseTitle.min_length": "Enter a course title.",
  "email.required": "Enter your email address.",
  "fullName.min_length": "Enter your full name.",
  "lessonBody.min_length": "Enter the first lesson text.",
  "lessonTitle.min_length": "Enter the first lesson title.",
  "password.required": "Enter your password.",
  "password.min_length": "Use at least 12 characters.",
  "subdomain.min_length": "Pick a subdomain of at least 2 characters.",
  "token.required": "Enter your invitation code.",
  "title.min_length": "Enter a title.",
  "slug.min_length": "Pick a slug of at least 2 characters.",
  "description.max_length": "Keep the description under 2,000 characters.",
  "fileName.min_length": "Enter a file name.",
  "byteSize.min_value": "Enter a file size above zero.",
  "sectionId.required": "Select a section.",
  "lessonId.required": "Select a lesson.",
  "blockType.required": "Choose a block type.",
  "body.min_length": "Enter content before adding the block.",
  "blockId.required": "Enter the quiz block ID.",
  "selectedOptionId.required": "Enter the selected option ID.",
  "question.min_length": "Ask a question of at least 3 characters.",
};

export function resolveMessage(field: string, constraint: string): string {
  return (
    fieldOverrides[`${field}.${constraint}`] ??
    genericMessages[constraint as ConstraintKey] ??
    "Please check this field."
  );
}
