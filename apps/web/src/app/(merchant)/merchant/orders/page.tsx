'use client';

import { useMerchant } from '@/features/merchant/context/MerchantContext';
import { OrdersFinancialsView } from '@/features/merchant/views/OrdersFinancialsView';

export default function OrdersPage() {
  const { adapter } = useMerchant();
  return <OrdersFinancialsView adapter={adapter} />;
}
