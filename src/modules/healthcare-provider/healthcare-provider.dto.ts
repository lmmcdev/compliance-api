import { z } from 'zod';

export const CreateHealthcareProviderSchema = z.object({
  accountId: z.uuid(),
  healthcareProviderName: z.string().min(1),

  providerType: z.string().nullable().optional(),
  providerSubtype: z.string().nullable().optional(),
  providerClass: z.string().nullable().optional(),
  status: z.string().nullable().optional(),

  mdvitaHealthCareId: z.string().nullable().optional(),
  npi: z.string().nullable().optional(),
  practitioner: z.string().nullable().optional(),

  autonomousAprn: z.boolean().optional().default(false),
  daysOff: z.string().nullable().optional(),

  inHouse: z.boolean().optional().default(false),
  providerId: z.string().nullable().optional(),

  pcp: z.boolean().optional().default(false),
  attendingPhysician: z.boolean().optional().default(false),

  effectiveFrom: z.iso.datetime().nullable().optional(),
  effectiveTo: z.iso.datetime().nullable().optional(),
  terminationDate: z.iso.datetime().nullable().optional(),

  totalLicensedBeds: z.number().int().nullable().optional(),
  useCmsMaContractAmendment: z.boolean().optional().default(false),

  facilityId: z.uuid().nullable().optional(),
  facilityIIId: z.uuid().nullable().optional(),
  facilityIIIId: z.uuid().nullable().optional(),
});

export const UpdateHealthcareProviderSchema = CreateHealthcareProviderSchema.partial();

export const ListHealthcareProvidersSchema = z.object({
  accountId: z.uuid(),
  q: z.string().optional(),
  status: z.string().optional(),
  npi: z.string().optional(),
  facilityId: z.uuid().nullable().optional(),
  pcp: z.coerce.boolean().optional(),
  attendingPhysician: z.coerce.boolean().optional(),
  inHouse: z.coerce.boolean().optional(),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
  token: z.string().optional(),
  sort: z.enum(['createdAt', 'updatedAt', 'healthcareProviderName']).default('createdAt'),
  order: z.enum(['ASC', 'DESC']).default('DESC'),
});

export type CreateHealthcareProviderDto = z.infer<typeof CreateHealthcareProviderSchema>;
export type UpdateHealthcareProviderDto = z.infer<typeof UpdateHealthcareProviderSchema>;
export type ListHealthcareProvidersQuery = z.infer<typeof ListHealthcareProvidersSchema>;
