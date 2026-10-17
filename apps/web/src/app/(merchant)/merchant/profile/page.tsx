'use client';

import { useMerchant } from '@/features/merchant/context/MerchantContext';
import { ProfileView } from '@/features/merchant/views/ProfileView';

export default function ProfilePage() {
  const { adapter } = useMerchant();
  return <ProfileView adapter={adapter} />;
}
