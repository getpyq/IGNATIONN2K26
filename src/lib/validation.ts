import { z } from 'zod';
import { TALENT_OPTIONS } from '../types/database.types.ts';

const VALID_TALENTS = TALENT_OPTIONS.map((t) => t.id) as [string, ...string[]];

export const studentNameSchema = z
  .string()
  .transform((val) => val.trim().replace(/\s+/g, ' '))
  .pipe(
    z
      .string()
      .min(2, 'Please enter your full name (at least 2 characters).')
      .max(80, 'Name must be 80 characters or fewer.')
      .regex(
        /^[a-zA-Z\s.'-]+$/,
        'Please use letters, spaces, dots, hyphens, or apostrophes only.'
      )
  );

export const registrationSubmissionSchema = z
  .object({
    student_name: studentNameSchema,
    selected_talents: z
      .array(z.enum(VALID_TALENTS))
      .min(1, 'Please select at least one talent to showcase.'),
    other_talent_description: z
      .string()
      .max(120, 'Custom talent description must be 120 characters or fewer.')
      .optional()
      .nullable()
      .transform((val) => {
        const trimmed = val?.trim();
        return trimmed ? trimmed : null;
      }),
    food_preference: z.enum(['vegetarian', 'non_vegetarian'], {
      message: 'Please select your food preference.',
    }),
  })
  .refine(
    (data) => {
      if (data.selected_talents.includes('Other')) {
        return Boolean(
          data.other_talent_description &&
            data.other_talent_description.trim().length >= 2
        );
      }
      return true;
    },
    {
      message: 'Please describe your custom talent when "Other" is selected.',
      path: ['other_talent_description'],
    }
  );

export const phoneSchema = z
  .string()
  .transform((val) => val.trim().replace(/[\s-]/g, ''))
  .pipe(
    z
      .string()
      .regex(/^\+?[0-9]{10,15}$/, 'Enter a valid 10 to 15 digit phone number.')
  );

export const passcodeSchema = z
  .string()
  .trim()
  .regex(/^[0-9]{6}$/, 'Passcode must be exactly 6 digits.');

export const adminLoginSchema = z.object({
  phone_number: phoneSchema,
  passcode: passcodeSchema,
});

export const adminBootstrapSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(2, 'Full name is required.')
    .max(80, 'Name must be 80 characters or fewer.'),
  phone_number: phoneSchema,
  passcode: passcodeSchema,
});
