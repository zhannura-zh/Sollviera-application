import React from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ReceptionBookingDetailsScreen } from '@/screens/reception/booking-details-screen';

export default function BookingDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  return (
    <ReceptionBookingDetailsScreen
      bookingId={String(id ?? '')}
      onBack={() => (router.canGoBack() ? router.back() : router.replace('/'))}
    />
  );
}
