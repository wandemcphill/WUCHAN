import { z } from 'zod';
import { Currency, OrgType, RoleName, OrderStatus } from '@wuchan/contracts';

/** Money Validation Schema - Strict Integer Cents Rule */
export const moneySchema = z.object({
  amountCents: z
    .number({ required_error: 'Amount in cents is required' })
    .int('Money amount must be an integer (cents/minor units)')
    .nonnegative('Money amount cannot be negative'),
  currency: z.nativeEnum(Currency, {
    errorMap: () => ({ message: 'Invalid currency code' })
  })
});

/** Organization Validation Schemas */
export const createOrganizationSchema = z.object({
  name: z.string().min(2, 'Organization name must be at least 2 characters').max(100),
  slug: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  type: z.nativeEnum(OrgType),
  logoUrl: z.string().url().optional(),
  countryCode: z.string().length(2, 'ISO-2 country code required')
});

export const addOrgMemberSchema = z.object({
  email: z.string().email('Valid email required'),
  role: z.nativeEnum(RoleName)
});

/** Product Catalog Schemas */
export const createProductSchema = z.object({
  organizationId: z.string().uuid(),
  name: z.string().min(2).max(150),
  sku: z.string().min(2).max(50),
  description: z.string().max(2000).optional(),
  basePrice: moneySchema,
  leadTimeDays: z.number().int().positive()
});

/** RFQ & Quote Validation Schemas */
export const createRfqSchema = z.object({
  organizationId: z.string().uuid(),
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(5000),
  budget: moneySchema.optional(),
  targetDeliveryDate: z.string().datetime().optional()
});

export const createQuoteVersionSchema = z.object({
  rfqId: z.string().uuid(),
  validUntil: z.string().datetime(),
  subtotal: moneySchema,
  tax: moneySchema,
  shipping: moneySchema,
  total: moneySchema,
  notes: z.string().max(2000).optional()
});

/** Order Validation Schema */
export const updateOrderStatusSchema = z.object({
  orderId: z.string().uuid(),
  status: z.nativeEnum(OrderStatus),
  reason: z.string().max(500).optional()
});

/** Audit Event Schema */
export const auditEventSchema = z.object({
  domain: z.string(),
  action: z.string(),
  actorId: z.string().uuid(),
  organizationId: z.string().uuid().optional(),
  resourceId: z.string().optional(),
  beforeState: z.record(z.any()).optional(),
  afterState: z.record(z.any()).optional()
});
