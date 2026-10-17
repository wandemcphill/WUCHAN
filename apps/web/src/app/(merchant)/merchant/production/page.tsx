'use client';

import { useMerchant } from '@/features/merchant/context/MerchantContext';
import { ProductionQCView } from '@/features/merchant/views/ProductionQCView';

export default function ProductionPage() {
  const { adapter } = useMerchant();
  return <ProductionQCView adapter={adapter} />;
}
