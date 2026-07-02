import { z } from 'zod';
import { REGEX } from '../utils/constants.js';

/* Contact */
export const contactSchema = z.object({
  firstName: z.string().trim().min(2),
  lastName: z.string().trim().min(2),
  email: z.string().trim().toLowerCase().email(),
  phone: z.string().regex(REGEX.PHONE_US, 'Invalid US phone').optional().or(z.literal('')),
  company: z.string().optional(),
  website: z.string().optional(),
  subject: z.string().min(3).max(200),
  message: z.string().min(10).max(3000),
  budget: z.enum(['<5k', '5k-10k', '10k-25k', '25k-50k', '50k-100k', '100k+', 'undecided']).optional(),
  servicesInterested: z.array(z.string()).optional(),
  timeline: z.string().optional(),
  howHeardAboutUs: z.string().optional(),
  utm: z
    .object({
      source: z.string().optional(),
      medium: z.string().optional(),
      campaign: z.string().optional(),
      term: z.string().optional(),
      content: z.string().optional(),
    })
    .optional(),
});

/* Consultation */
export const consultationSchema = z.object({
  firstName: z.string().trim().min(2),
  lastName: z.string().trim().min(2),
  email: z.string().trim().toLowerCase().email(),
  phone: z.string().min(7),
  company: z.string().optional(),
  website: z.string().optional(),
  role: z.string().optional(),
  preferredDate: z.coerce.date().refine((d) => d.getTime() > Date.now(), 'Date must be in the future'),
  preferredTimeSlot: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be HH:MM'),
  timezone: z.string().default('America/New_York'),
  durationMinutes: z.number().int().positive().default(30),
  meetingType: z.enum(['google_meet', 'zoom', 'phone', 'in_person']).default('google_meet'),
  servicesInterested: z.array(z.string()).optional(),
  projectGoals: z.string().optional(),
  budget: z.enum(['<5k', '5k-10k', '10k-25k', '25k-50k', '50k-100k', '100k+', 'undecided']).optional(),
  urgency: z.enum(['immediate', '1-3_months', '3-6_months', 'exploring']).optional(),
  additionalNotes: z.string().optional(),
});

/* Newsletter */
export const newsletterSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  name: z.string().optional(),
  interests: z.array(z.string()).optional(),
  source: z.string().optional(),
});

/* Career */
export const careerSchema = z.object({
  title: z.string().min(3).max(160),
  department: z.enum(['engineering', 'marketing', 'design', 'sales', 'operations', 'content', 'seo', 'ppc', 'social', 'leadership', 'other']).optional(),
  location: z.string().min(1),
  workMode: z.enum(['remote', 'hybrid', 'onsite']).optional(),
  employmentType: z.enum(['full_time', 'part_time', 'contract', 'internship', 'temporary']).optional(),
  experienceLevel: z.enum(['entry', 'junior', 'mid', 'senior', 'lead', 'principal']).optional(),
  shortDescription: z.string().min(10).max(400),
  description: z.string().min(20),
  responsibilities: z.array(z.string()).optional(),
  requirements: z.array(z.string()).optional(),
  niceToHave: z.array(z.string()).optional(),
  benefits: z.array(z.string()).optional(),
  skills: z.array(z.string()).optional(),
  salary: z.object({
    min: z.number().optional(),
    max: z.number().optional(),
    period: z.enum(['hourly', 'monthly', 'yearly']).optional(),
    visible: z.boolean().optional(),
  }).optional(),
  openings: z.number().int().positive().optional(),
  status: z.enum(['open', 'paused', 'closed']).optional(),
  closesAt: z.coerce.date().optional(),
});

export const applicationSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  location: z.string().optional(),
  coverLetter: z.string().max(5000).optional(),
  portfolioUrl: z.string().optional(),
  linkedinUrl: z.string().optional(),
  githubUrl: z.string().optional(),
  yearsOfExperience: z.coerce.number().optional(),
  currentCompany: z.string().optional(),
  currentRole: z.string().optional(),
  expectedSalary: z.coerce.number().optional(),
  noticePeriod: z.string().optional(),
  workAuthorization: z.enum(['us_citizen', 'green_card', 'h1b', 'opt', 'other']).optional(),
  willingToRelocate: z.coerce.boolean().optional(),
});
