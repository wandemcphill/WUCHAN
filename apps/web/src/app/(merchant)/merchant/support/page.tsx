'use client';

import { useMerchant } from '@/features/merchant/context/MerchantContext';
import { SupportWarrantyView } from '@/features/merchant/views/SupportWarrantyView';

export default function SupportPage() {
  const { adapter } = useMerchant();
  return <SupportWarrantyView adapter={adapter} />;
}
