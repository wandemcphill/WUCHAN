'use client';

import { useMerchant } from '@/features/merchant/context/MerchantContext';
import { RFQQuoteView } from '@/features/merchant/views/RFQQuoteView';

export default function QuotesPage() {
  const { adapter } = useMerchant();
  return <RFQQuoteView adapter={adapter} />;
}
