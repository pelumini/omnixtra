import { z } from "zod";

export const quizAttemptFormSchema = z.object({
  blockId: z.string().trim().min(1, "required"),
  selectedOptionId: z.string().trim().min(1, "required"),
});

export type QuizAttemptFormInput = z.infer<typeof quizAttemptFormSchema>;

export const tutorQuestionFormSchema = z.object({
  question: z.string().trim().min(3, "min_length").max(2000, "max_length"),
});

export type TutorQuestionFormInput = z.infer<typeof tutorQuestionFormSchema>;
