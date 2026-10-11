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
  | "invitation_invalid"
  | "password_mismatch";

const genericMessages: Record<ConstraintKey, string> = {
  required: "This field can't be blank.",
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
  password_mismatch: "Passwords must match.",
};

// New form fields should use shared validation keys and add field-specific
// overrides here when the generic copy would not sound natural.
const fieldOverrides: Record<string, string> = {
  "academyName.required": "Give your academy a name.",
  "academyName.min_length": "Give your academy a name.",
  "body.required": "Enter content before adding the block.",
  "confirmPassword.required": "Confirm your password.",
  "confirmPassword.min_length": "Use at least 12 characters.",
  "confirmPassword.password_mismatch": "Passwords must match.",
  "contentType.required": "Choose a file type.",
  "courseTitle.required": "Enter a course title.",
  "courseTitle.min_length": "Enter a course title.",
  "email.email": "Enter a valid email address.",
  "email.required": "Enter your email address.",
  "firstName.required": "Enter your first name.",
  "fullName.required": "Enter your full name.",
  "fullName.min_length": "Enter your full name.",
  "lessonBody.required": "Enter the first lesson text.",
  "lessonBody.min_length": "Enter the first lesson text.",
  "lessonTitle.required": "Enter the first lesson title.",
  "lessonTitle.min_length": "Enter the first lesson title.",
  "lastName.required": "Enter your last name.",
  "password.required": "Create a password.",
  "password.min_length": "Use at least 12 characters.",
  "phone.required": "Enter a phone number.",
  "orgRole.required": "Choose a role.",
  "question.required": "Ask a question.",
  "slug.required": "Pick a slug of at least 2 characters.",
  "subdomain.required": "Choose a subdomain.",
  "subdomain.min_length": "Use at least 2 characters.",
  "token.required": "Enter your invitation code.",
  "title.required": "Enter a title.",
  "title.min_length": "Enter a title.",
  "slug.min_length": "Pick a slug of at least 2 characters.",
  "description.max_length": "Keep the description under 2,000 characters.",
  "fileName.min_length": "Enter a file name.",
  "fileName.required": "Enter a file name.",
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
