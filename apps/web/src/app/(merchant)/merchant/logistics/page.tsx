'use client';

import { useMerchant } from '@/features/merchant/context/MerchantContext';
import { LogisticsDocumentsView } from '@/features/merchant/views/LogisticsDocumentsView';

export default function LogisticsPage() {
  const { adapter } = useMerchant();
  return <LogisticsDocumentsView adapter={adapter} />;
}
