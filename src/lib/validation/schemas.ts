import { z } from "zod";

/**
 * Shared validation schemas reused by client forms and server Route Handlers
 * so client and server rules stay consistent.
 * Requirements: 2.4, 3.4, 7.2
 */

export const ATTENDEE_MIN = 0;
export const ATTENDEE_MAX = 10;

export const eventLanguageSchema = z.enum(["he", "en"]);

// Event create: all display + localization fields required (Req 2.1, 2.2, 2.4)
export const eventCreateSchema = z.object({
  language: eventLanguageSchema,
  imageUrl: z.string().min(1, "Image is required"),
  address: z.string().min(1, "Address is required"),
  greeting: z.string().min(1, "Greeting is required"),
});
export type EventCreateInput = z.infer<typeof eventCreateSchema>;

// Event update: settings may change; active state toggled (Req 2.5, 8.2, 8.3)
export const eventUpdateSchema = z
  .object({
    language: eventLanguageSchema.optional(),
    imageUrl: z.string().min(1).optional(),
    address: z.string().min(1).optional(),
    greeting: z.string().min(1).optional(),
    isActive: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
  });
export type EventUpdateInput = z.infer<typeof eventUpdateSchema>;

// Guest create/update (Req 3.1, 3.4)
export const guestCreateSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  mobile: z.string().min(1, "Mobile number is required"),
  predictedGuests: z
    .number()
    .int("Predicted guests must be a whole number")
    .min(0, "Predicted guests cannot be negative"),
  familyRelation: z.string().optional(),
});
export type GuestCreateInput = z.infer<typeof guestCreateSchema>;

export const guestUpdateSchema = guestCreateSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: "At least one field is required" },
);
export type GuestUpdateInput = z.infer<typeof guestUpdateSchema>;

// RSVP submission (Req 7.2, 7.3)
export const rsvpSchema = z.object({
  attendeeCount: z
    .number()
    .int("Attendee count must be a whole number")
    .min(ATTENDEE_MIN, `Minimum is ${ATTENDEE_MIN}`)
    .max(ATTENDEE_MAX, `Maximum is ${ATTENDEE_MAX}`),
});
export type RsvpInput = z.infer<typeof rsvpSchema>;
