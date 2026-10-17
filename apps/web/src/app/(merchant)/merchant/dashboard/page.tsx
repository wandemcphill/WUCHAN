'use client';

import { useMerchant } from '@/features/merchant/context/MerchantContext';
import { DashboardView } from '@/features/merchant/views/DashboardView';

export default function DashboardPage() {
  const { adapter } = useMerchant();
  return <DashboardView adapter={adapter} />;
}
