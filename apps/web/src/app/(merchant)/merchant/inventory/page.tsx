'use client';

import { useMerchant } from '@/features/merchant/context/MerchantContext';
import { InventoryView } from '@/features/merchant/views/InventoryView';

export default function InventoryPage() {
  const { adapter } = useMerchant();
  return <InventoryView adapter={adapter} />;
}
