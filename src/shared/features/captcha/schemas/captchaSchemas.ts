// LIBRARIES
import { z } from 'zod';

export const turnstileResponseSchema = z.object({
	success: z.boolean(),
	action: z.string().optional()
});
