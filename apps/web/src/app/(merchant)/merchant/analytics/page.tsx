'use client';

import { useMerchant } from '@/features/merchant/context/MerchantContext';
import { AnalyticsView } from '@/features/merchant/views/AnalyticsView';

export default function AnalyticsPage() {
  const { adapter } = useMerchant();
  return <AnalyticsView adapter={adapter} />;
}
