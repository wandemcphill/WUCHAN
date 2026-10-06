'use client';

import { useMerchant } from '@/features/merchant/context/MerchantContext';
import { LeadsCustomersView } from '@/features/merchant/views/LeadsCustomersView';

export default function LeadsPage() {
  const { adapter } = useMerchant();
  return <LeadsCustomersView adapter={adapter} />;
}
