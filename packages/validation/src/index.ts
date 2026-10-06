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
  isPublic: z.boolean().optional().default(true),
  basePrice: moneySchema,
  leadTimeDays: z.number().int().positive()
});

/** RFQ & Quote Validation Schemas */
const rfqItemSchema = z.object({
  productId: z.string().uuid().optional(),
  productSku: z.string().min(2).max(100).optional(),
  quantity: z.number().int().positive().max(10000),
  configuration: z.record(z.any()).optional(),
  notes: z.string().max(2000).optional(),
  targetUnitPrice: moneySchema.optional()
}).refine((item) => Boolean(item.productId || item.productSku), {
  message: 'Each RFQ item requires productId or productSku'
});

export const createRfqSchema = z.object({
  organizationId: z.string().uuid(),
  projectId: z.string().uuid().optional(),
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(5000),
  budget: moneySchema.optional(),
  targetDeliveryDate: z.string().datetime().optional(),
  destinationPort: z.string().min(2).max(200),
  incotermsRequested: z.enum(['FOB', 'CIF', 'DDP']),
  items: z.array(rfqItemSchema).min(1).max(100)
});

export const createQuoteVersionSchema = z.object({
  quoteId: z.string().uuid('Valid quote ID required'),
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
