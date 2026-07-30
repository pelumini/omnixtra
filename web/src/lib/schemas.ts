import { z } from "zod";

export const metaSchema = z.object({
  request_id: z.string(),
  timestamp: z.string().datetime().nullable(),
});

export const healthEnvelopeSchema = z.object({
  data: z.object({
    status: z.literal("ok"),
  }),
  error: z.null(),
  meta: metaSchema,
});
