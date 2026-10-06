import { moneySchema, createOrganizationSchema } from '../src';
import { Currency, OrgType } from '@wuchan/contracts';

describe('Validation Schemas', () => {
  describe('Money Schema', () => {
    it('accepts valid integer amount in cents', () => {
      const validMoney = { amountCents: 15000, currency: Currency.USD };
      const parsed = moneySchema.safeParse(validMoney);
      expect(parsed.success).toBe(true);
    });

    it('rejects floating point amounts for money', () => {
      const invalidMoney = { amountCents: 150.75, currency: Currency.USD };
      const parsed = moneySchema.safeParse(invalidMoney);
      expect(parsed.success).toBe(false);
      if (!parsed.success) {
        expect(parsed.error.issues[0].message).toContain('integer');
      }
    });

    it('rejects negative money amounts', () => {
      const negativeMoney = { amountCents: -500, currency: Currency.USD };
      const parsed = moneySchema.safeParse(negativeMoney);
      expect(parsed.success).toBe(false);
    });
  });

  describe('Organization Schema', () => {
    it('validates a correct organization creation payload', () => {
      const validOrg = {
        name: 'Zenith Modular',
        slug: 'zenith-modular',
        type: OrgType.FACTORY,
        countryCode: 'US'
      };
      const parsed = createOrganizationSchema.safeParse(validOrg);
      expect(parsed.success).toBe(true);
    });

    it('rejects invalid slug format', () => {
      const invalidOrg = {
        name: 'Zenith Modular',
        slug: 'Zenith Modular!',
        type: OrgType.FACTORY,
        countryCode: 'US'
      };
      const parsed = createOrganizationSchema.safeParse(invalidOrg);
      expect(parsed.success).toBe(false);
    });
  });
});
