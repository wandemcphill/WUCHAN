export interface CatalogOptionRow {
  id: string;
  option_type: string;
  name: string;
  price_delta_cents: number | string;
  lead_time_delta_days: number | string;
  requires_quote: boolean;
  swatch_hex?: string | null;
}

export interface FrozenSelection {
  id: string;
  optionType: string;
  name: string;
  priceDeltaCents: number;
  leadTimeDeltaDays: number;
  requiresQuote: boolean;
  swatchHex: string | null;
}

export interface PricedBuild {
  selections: FrozenSelection[];
  unitPriceCents: number;
  totalPriceCents: number;
  leadTimeDays: number;
  isSpecial: boolean;
}

function asInt(value: number | string, label: string): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isSafeInteger(parsed)) {
    throw new Error(label + ' must be an integer minor-unit or day count');
  }
  return parsed;
}

/**
 * Price one customer build from the published catalog.
 * One choice is required from each option group the factory published.
 * A custom note or a quote-required choice makes the build special.
 * The API stores this result. The browser may preview it and must not be trusted.
 */
export function priceBuild(input: {
  basePriceCents: number | string;
  baseLeadTimeDays: number | string;
  quantity: number;
  options: CatalogOptionRow[];
  selectedOptionIds: string[];
  customNote?: string | null;
}): PricedBuild {
  const basePriceCents = asInt(input.basePriceCents, 'Base price');
  const baseLeadTimeDays = asInt(input.baseLeadTimeDays, 'Base lead time');
  if (basePriceCents < 0) throw new Error('Base price cannot be negative');
  if (baseLeadTimeDays < 1) throw new Error('Base lead time must be at least 1 day');
  if (!Number.isSafeInteger(input.quantity) || input.quantity < 1 || input.quantity > 100) {
    throw new Error('Quantity must be a whole number from 1 to 100');
  }

  const selectedIds = input.selectedOptionIds;
  if (new Set(selectedIds).size !== selectedIds.length) {
    throw new Error('Each option can be selected only once');
  }

  const byId = new Map(input.options.map((option) => [option.id, option]));
  const groups = new Map<string, CatalogOptionRow[]>();
  for (const option of input.options) {
    const group = groups.get(option.option_type) || [];
    group.push(option);
    groups.set(option.option_type, group);
  }
  if (groups.size === 0) {
    throw new Error('This product has no published choices yet');
  }

  const selections: FrozenSelection[] = [];
  const chosenGroups = new Set<string>();
  for (const optionId of selectedIds) {
    const option = byId.get(optionId);
    if (!option) throw new Error('Selected option is not published on this product');
    if (chosenGroups.has(option.option_type)) {
      throw new Error('Choose one ' + option.option_type.toLowerCase() + ' option');
    }
    chosenGroups.add(option.option_type);
    selections.push({
      id: option.id,
      optionType: option.option_type,
      name: option.name,
      priceDeltaCents: asInt(option.price_delta_cents, 'Option price'),
      leadTimeDeltaDays: asInt(option.lead_time_delta_days, 'Option lead time'),
      requiresQuote: Boolean(option.requires_quote),
      swatchHex: option.swatch_hex || null,
    });
  }

  for (const group of groups.keys()) {
    if (!chosenGroups.has(group)) {
      throw new Error('Choose one ' + group.toLowerCase() + ' option');
    }
  }

  let unitPrice = BigInt(basePriceCents);
  let leadTime = baseLeadTimeDays;
  for (const selection of selections) {
    unitPrice += BigInt(selection.priceDeltaCents);
    leadTime += selection.leadTimeDeltaDays;
  }
  if (unitPrice < 0n) throw new Error('Configuration price cannot be negative');
  if (leadTime < 1) throw new Error('Configuration lead time must be at least 1 day');

  const totalPrice = unitPrice * BigInt(input.quantity);
  if (totalPrice > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new Error('Configuration price is too large');
  }

  const customNote = (input.customNote || '').trim();
  return {
    selections,
    unitPriceCents: Number(unitPrice),
    totalPriceCents: Number(totalPrice),
    leadTimeDays: leadTime,
    isSpecial: customNote.length > 0 || selections.some((selection) => selection.requiresQuote),
  };
}
