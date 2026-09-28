import { Stack } from 'expo-router';

export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, headerBackButtonDisplayMode: 'minimal', contentStyle: { backgroundColor: '#FAF7F3' } }} />
  );
}
