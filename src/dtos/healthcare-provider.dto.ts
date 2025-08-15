// src/dtos/healthcare-provider.dto.ts
import { z } from 'zod';

export const CreateHealthcareProviderSchema = z.object({
  // required
  healthcareProviderName: z.string().min(1).max(256),
  accountId: z.string().uuid(),

  // optional / nullable text
  providerType: z.string().max(128).optional().nullable(),
  providerSubtype: z.string().max(128).optional().nullable(),
  providerClass: z.string().max(128).optional().nullable(),
  status: z.string().max(64).optional().nullable(),
  mdvitaHealthCareId: z.string().max(64).optional().nullable(),
  npi: z.string().max(64).optional().nullable(),
  practitioner: z.string().max(256).optional().nullable(),
  daysOff: z.string().max(256).optional().nullable(),
  providerId: z.string().max(128).optional().nullable(),

  // flags
  autonomousAprn: z.boolean().optional(),
  inHouse: z.boolean().optional(),
  pcp: z.boolean().optional(),
  attendingPhysician: z.boolean().optional(),
  useCmsMaContractAmendment: z.boolean().optional(),

  // dates
  effectiveFrom: z.coerce.date().optional().nullable(),
  effectiveTo: z.coerce.date().optional().nullable(),
  terminationDate: z.coerce.date().optional().nullable(),

  // numbers
  totalLicensedBeds: z.number().int().min(0).optional().nullable(),

  // relations
  facilityId: z.string().uuid().optional().nullable(),
  facilityIIId: z.string().uuid().optional().nullable(),
  facilityIIIId: z.string().uuid().optional().nullable(),
});

export const UpdateHealthcareProviderSchema = CreateHealthcareProviderSchema.partial();

export type CreateHealthcareProviderDto = z.infer<typeof CreateHealthcareProviderSchema>;
export type UpdateHealthcareProviderDto = z.infer<typeof UpdateHealthcareProviderSchema>;

export const ListHealthcareProvidersSchema = z.object({
  q: z.string().optional(), // free text over name, npi, type, class, practitioner, providerId, status

  accountId: z.string().uuid().optional(),
  status: z.string().optional(),
  providerType: z.string().optional(),
  providerSubtype: z.string().optional(),
  providerClass: z.string().optional(),
  npi: z.string().optional(),
  practitioner: z.string().optional(),

  autonomousAprn: z.coerce.boolean().optional(),
  inHouse: z.coerce.boolean().optional(),
  pcp: z.coerce.boolean().optional(),
  attendingPhysician: z.coerce.boolean().optional(),
  useCmsMaContractAmendment: z.coerce.boolean().optional(),

  facilityId: z.string().uuid().optional(),
  facilityIIId: z.string().uuid().optional(),
  facilityIIIId: z.string().uuid().optional(),

  effectiveFromFrom: z.coerce.date().optional(),
  effectiveFromTo: z.coerce.date().optional(),
  effectiveToFrom: z.coerce.date().optional(),
  effectiveToTo: z.coerce.date().optional(),
  terminationDateFrom: z.coerce.date().optional(),
  terminationDateTo: z.coerce.date().optional(),

  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sort: z
    .enum([
      'createdAt',
      'updatedAt',
      'healthcareProviderName',
      'npi',
      'effectiveFrom',
      'effectiveTo',
    ])
    .default('createdAt'),
  order: z.enum(['ASC', 'DESC']).default('DESC'),
});

export type ListHealthcareProvidersQuery = z.infer<typeof ListHealthcareProvidersSchema>;
