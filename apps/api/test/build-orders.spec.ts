import { priceBuild } from '@wuchan/validation';

const cabin = [
  { id: 'white', option_type: 'COLOR', name: 'Standard White', price_delta_cents: 0, lead_time_delta_days: 0, requires_quote: false },
  { id: 'ral', option_type: 'COLOR', name: 'Custom RAL color', price_delta_cents: 0, lead_time_delta_days: 14, requires_quote: true },
  { id: 'studio', option_type: 'SIZE', name: 'Studio 18 sqm', price_delta_cents: 0, lead_time_delta_days: 0, requires_quote: false },
  { id: 'two', option_type: 'SIZE', name: 'Two bedroom 36 sqm', price_delta_cents: 850000, lead_time_delta_days: 7, requires_quote: false },
  { id: 'len6', option_type: 'LENGTH', name: '6 m length', price_delta_cents: 0, lead_time_delta_days: 0, requires_quote: false },
  { id: 'len9', option_type: 'LENGTH', name: '9 m length', price_delta_cents: 400000, lead_time_delta_days: 5, requires_quote: false },
  { id: 'standard', option_type: 'SPECIFICATION', name: 'Standard insulation', price_delta_cents: 0, lead_time_delta_days: 0, requires_quote: false },
  { id: 'cold', option_type: 'SPECIFICATION', name: 'Extreme cold package', price_delta_cents: 320000, lead_time_delta_days: 8, requires_quote: false },
];

describe('customer prefab build pricing', () => {
  it('freezes a standard build in integer cents and adds lead time', () => {
    const priced = priceBuild({
      basePriceCents: 4_500_000,
      baseLeadTimeDays: 45,
      quantity: 2,
      options: cabin,
      selectedOptionIds: ['white', 'two', 'len9', 'cold'],
    });

    expect(priced.isSpecial).toBe(false);
    expect(priced.unitPriceCents).toBe(4_500_000 + 850_000 + 400_000 + 320_000);
    expect(priced.totalPriceCents).toBe(priced.unitPriceCents * 2);
    expect(priced.leadTimeDays).toBe(45 + 7 + 5 + 8);
    expect(priced.selections.map((selection) => selection.name)).toEqual([
      'Standard White',
      'Two bedroom 36 sqm',
      '9 m length',
      'Extreme cold package',
    ]);
  });

  it('marks a custom note or a quote-required choice as a special order', () => {
    const noted = priceBuild({
      basePriceCents: '4500000',
      baseLeadTimeDays: '45',
      quantity: 1,
      options: cabin,
      selectedOptionIds: ['white', 'studio', 'len6', 'standard'],
      customNote: '  Site gate is 2.4 m  ',
    });
    const customColor = priceBuild({
      basePriceCents: 4_500_000,
      baseLeadTimeDays: 45,
      quantity: 1,
      options: cabin,
      selectedOptionIds: ['ral', 'studio', 'len6', 'standard'],
    });

    expect(noted.isSpecial).toBe(true);
    expect(customColor.isSpecial).toBe(true);
    expect(customColor.leadTimeDays).toBe(59);
  });

  it('rejects an incomplete selection and a negative configuration', () => {
    expect(() => priceBuild({
      basePriceCents: 4_500_000,
      baseLeadTimeDays: 45,
      quantity: 1,
      options: cabin,
      selectedOptionIds: ['white', 'studio', 'len6'],
    })).toThrow('specification');

    expect(() => priceBuild({
      basePriceCents: 100,
      baseLeadTimeDays: 30,
      quantity: 1,
      options: [
        { id: 'a', option_type: 'COLOR', name: 'Credit', price_delta_cents: -500, lead_time_delta_days: 0, requires_quote: false },
      ],
      selectedOptionIds: ['a'],
    })).toThrow('cannot be negative');
  });
});
