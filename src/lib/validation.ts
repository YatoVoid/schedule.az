import { z } from "zod";

export const phoneSchema = z
  .string()
  .min(9, "Enter a valid phone number")
  .max(20, "Enter a valid phone number");

export const emailSchema = z.string().trim().email("Enter a valid email address");

export const otpCodeSchema = z
  .string()
  .length(6, "Enter the 6-digit code");

export const storeOnboardingSchema = z.object({
  name: z.string().trim().min(2, "Store name is too short").max(80),
  category: z.string().trim().min(2, "Pick a category"),
  address: z.string().trim().max(200).optional().or(z.literal("")),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
});

export const serviceSchema = z.object({
  name: z.string().trim().min(2, "Service name is too short").max(80),
  durationMin: z.coerce.number().int().min(5).max(480),
  // Blank means "price discussed in store" (null), not free.
  priceAzn: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? null : v),
    z.coerce.number().min(0).max(100000).nullable(),
  ),
});

export const staffInviteSchema = z.object({
  phone: phoneSchema,
});

// Blank is allowed (business chooses not to log the charge), same "null
// means unspecified" convention as serviceSchema's priceAzn.
export const chargedPriceSchema = z.preprocess(
  (v) => (typeof v === "string" && v.trim() === "" ? null : v),
  z.coerce.number().min(0).max(100000).nullable(),
);

export const availabilitySchema = z.object({
  dayOfWeek: z.coerce.number().int().min(0).max(6),
  startMinute: z.coerce.number().int().min(0).max(1440),
  endMinute: z.coerce.number().int().min(0).max(1440),
});

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date");

export const availabilityExceptionSchema = z
  .object({
    startDate: isoDate,
    endDate: isoDate,
    type: z.enum(["BUSY", "FREE"]),
    recurringAnnually: z.boolean(),
    label: z.string().trim().max(80).optional().or(z.literal("")),
  })
  .refine((v) => v.startDate <= v.endDate, {
    message: "End date must be on or after the start date",
    path: ["endDate"],
  });
