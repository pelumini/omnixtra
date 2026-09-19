import { z } from "zod";

import { requiredText, textSchema } from "@/lib/validation/primitives";

export const quizAttemptFormSchema = z.object({
  blockId: requiredText,
  selectedOptionId: requiredText,
});

export type QuizAttemptFormInput = z.infer<typeof quizAttemptFormSchema>;

export const tutorQuestionFormSchema = z.object({
  question: textSchema(3, 2000),
});

export type TutorQuestionFormInput = z.infer<typeof tutorQuestionFormSchema>;
